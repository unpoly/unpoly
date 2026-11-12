import * as u from '../util.js'
import * as e from '../element.js'
import { Aborted, fail, muteUncriticalRejection } from '../error.js'
import { build, on } from '../event.js'
import {
  destinationOptions, findFields, findGroupSolution, isField, readFieldName, trackFields,
  validateOptions,
} from '../form.js'
import {
  getSmart, onAborted, render, resolveOrigin, splitTarget, toTarget, type FragmentAbortedEvent,
  type RenderOptions, type RenderResult,
} from '../fragment.js'
import { printToStandard, printUserEvent } from '../log.js'
import { headerize, protocolConfig } from '../protocol.js'
import { readData } from '../script.js'
import type * as t from './types.js'
import { Params } from './params.js'

export class FormValidator {
  declare _form: HTMLFormElement
  declare _dirtySolutions: t.ValidationSolution[]
  declare _nextRenderTimer: number | null
  declare _rendering: boolean

  constructor(form: HTMLFormElement) {
    this._form = form
    this._dirtySolutions = []
    this._nextRenderTimer = null
    this._rendering = false
    this._honorAbort()
  }

  start(): () => void {
    let guard = (field: Element): Element | null => this._isValidatingField(field)
    let callback = (field: Element): () => void => this._onFieldAdded(field)
    return trackFields(this._form, { guard }, callback)
  }

  _isValidatingField(field: Element): Element | null {
    return field.closest('[up-validate]:not([up-validate=false])')
  }

  _onFieldAdded(field: Element): () => void {
    // validateOptions() always sets an { event }.
    let eventType = validateOptions(field).event!
    return on(field, eventType, (event) => {
      if (!field.closest('.up-keeping')) {
        printUserEvent(event)
        // Validating a field always finds a solution, at least the field itself.
        // A blank [up-validate] value falls back like a missing one.
        muteUncriticalRejection(this.validate({ origin: field })!)
      }
    })
  }

  _honorAbort(): void {
    onAborted(this._form, (event) => this._onAborted(event))
  }

  _onAborted(event: FragmentAbortedEvent): void {
    let abortedError = new Aborted(event.reason)
    let solution
    while (solution = this._dirtySolutions.shift()) {
      solution.deferred.reject(abortedError)
    }
  }

  validate(options: t.ValidateOptions = {}): u.Deferred<RenderResult> | undefined {
    let newSolutions = this._getSolutions(options)
    this._dirtySolutions.push(...newSolutions)
    this._scheduleNextRender()
    return newSolutions[0]?.deferred
  }

  _getSolutions(options: t.ValidateOptions): t.ValidationSolution[] {
    // The loop below adds the props of a scheduled solution.
    let solutions = (this._getTargetSelectorSolutions(options)
      || this._getFieldSolutions(options)
      // up.validate() and _onFieldAdded() always pass an { origin }.
      || this._getElementSolutions(options.origin!)) as t.ValidationSolution[]

    // Although a single validate() call may update multiple fragments,
    // they will all share the same render pass.
    let deferred = u.newDeferred()

    for (let solution of solutions) {
      // Remember solution-specific render options from
      // (1) the given options object
      // (2) any [up-watch-] prefixed attributes parsed from the origin
      // (3) any [up-validate-] prefixed attributes parsed from the origin
      let renderOptions = validateOptions(solution.origin, options)
      solution.batch = u.pluckKey(renderOptions, 'batch')
      solution.renderOptions = renderOptions

      solution.destination = `${renderOptions.method} ${renderOptions.url}`
      // Resolve :origin pseudo here, as a batched validation will only
      // have a single { origin } (set to the form).
      solution.target = resolveOrigin(solution.target, solution)
      solution.deferred = deferred
    }

    return solutions
  }

  _getFieldSolutions({ origin, ...options }: u.PlainObject): t.FoundValidationSolution[] | undefined {
    if (isField(origin)) {
      return this._getValidateAttrSolutions(origin) || this._getFormGroupSolutions(origin, options)
    }
  }

  _getFormGroupSolutions(field: Element, { formGroup = true }: t.ValidateOptions): t.FoundValidationSolution[] | undefined {
    if (!formGroup) return

    let solution = findGroupSolution(field, { targetable: true })
    if (solution) {
      printToStandard('up.validate()', 'Validating form group of field %o', field)
      // A { targetable } solution has a target.
      return [solution as t.FoundValidationSolution]
    }
  }

  // The target may also be a boolean from an [up-validate] attribute.
  _getTargetSelectorSolutions({ target, origin }: u.PlainObject): t.FoundValidationSolution[] | undefined {
    if (u.isString(target)) {
      printToStandard('up.validate()', 'Validating target "%s"', target)
      let simpleSelectors = splitTarget(target)
      // A blank target (like " " or ",") has no selectors. We return undefined
      // so the caller falls back to the validation target it would use without a target.
      return u.presence(u.compact(simpleSelectors.map(function(simpleSelector) {
        let element = getSmart(simpleSelector, { origin })
        if (element) {
          return {
            element,
            target: simpleSelector,
            origin
          }
        } else {
          fail('Validation target "%s" does not match an element', simpleSelector)
        }
      })))
    }
  }

  _getElementSolutions(element: Element): t.FoundValidationSolution[] {
    printToStandard('up.validate()', 'Validating element %o', element)
    return [{
      element,
      target: toTarget(element),
      origin: element
    }]
  }

  _getValidateAttrSolutions(field: Element): t.FoundValidationSolution[] | undefined {
    // In case of radio buttons the [up-validate] attribute will
    // be set on a container containing the entire radio button group.
    let containerWithAttr = field.closest('[up-validate]')

    if (containerWithAttr) {
      let target = e.booleanOrStringAttr(containerWithAttr, 'up-validate')
      return this._getTargetSelectorSolutions({ target, origin: field })
    }
  }

  _scheduleNextRender(): void {
    let solutionDelays = this._dirtySolutions.map((solution) => solution.renderOptions.delay)
    // A missing delay makes Math.min() return NaN, which falls back to 0.
    let shortestDelay = Math.min(...solutionDelays as number[]) || 0
    // Render requests always reset the timer, using their then-current delay.
    clearTimeout(this._nextRenderTimer)
    this._nextRenderTimer = u.scheduleTimer(shortestDelay, () => {
      this._nextRenderTimer = null
      this._renderDirtySolutions()
    })
  }

  _renderDirtySolutions(): void {
    muteUncriticalRejection(this._doRenderDirtySolutions())
  }

  async _doRenderDirtySolutions(): Promise<void> {
    // We do *not* remove solutions for which the origin no longer exists,
    // as a delayed solution's { target } may still require an update.

    // When aborted we clear out _dirtySolutions to cancel a scheduled callback.
    if (!this._dirtySolutions.length) return

    // We don't run callbacks when a prior async callback is still running.
    // We will call _requestCallback() again once the prior callback terminates.
    if (this._rendering) return

    // When we re-called _requestCallback() after waiting for a prior callback, another
    // debounce delay may have started while waiting for the prior callback.
    // We must not shorted that debounce delay.
    if (this._nextRenderTimer) return

    let solutionsBatch = this._selectDirtySolutionsBatch()

    let renderOptions = this._mergeRenderOptions(solutionsBatch)

    // We don't render concurrently. If additional fields want to validate
    // while our request is in flight, they add to a new @dirtySolutions array.
    this._rendering = true

    try {
      // Resolve all promises we have handed out for the now-rendered solutions.
      let renderPromise = render(renderOptions)
      for (let solution of solutionsBatch) {
        solution.deferred.resolve(renderPromise)
      }
      await renderPromise
    } finally {
      this._rendering = false
      // Additional solutions may have become dirty while we were _rendering so we check again.
      // If no pending solutions are found, the method will return immediately.
      this._renderDirtySolutions()
    }
  }

  _selectDirtySolutionsBatch(): t.ValidationSolution[] {
    let batch = []
    let i = 0
    while (i < this._dirtySolutions.length) {
      let solution = this._dirtySolutions[i]
      if (batch.length === 0 || this._canBatchSolutions(batch[0], solution)) {
        batch.push(solution)
        this._dirtySolutions.splice(i, 1)
      } else {
        i++
      }
    }
    return batch
  }

  _canBatchSolutions(s1: t.ValidationSolution, s2: t.ValidationSolution): boolean | undefined {
    return s1.destination === s2.destination && s1.batch && s2.batch
  }

  _mergeRenderOptions(dirtySolutions: t.ValidationSolution[]): RenderOptions {
    // Dirty fields are the fields that triggered the validation, not the fields contained
    // by the solution elements. This is not the same thing in a scenario like this:
    //
    //     <form>
    //       <input type="text" name="email" up-validate=".results">
    //       <div class="results"></div>
    //     </form>

    // Remove duplicate names as a radio button group has multiple inputs with the same name.
    let dirtyOrigins = u.map(dirtySolutions, 'origin')
    let dirtyFields = u.flatMap(dirtyOrigins, findFields)
    // Without this filter an unnamed field pads the header with an empty token ("email "). Two of
    // them can even join into a truthy " " — u.uniq() keeps both when one reports '' and the other
    // null — which would skip the ':unknown' fallback in _addValidateHeader() below.
    let dirtyNames = u.uniq(u.filterList(u.map(dirtyFields, readFieldName), u.isPresent))
    let dirtyRenderOptionsList = u.map(dirtySolutions, 'renderOptions')

    // A validation is not a real submission: no button was pressed, so only the <form> element
    // decides where the request goes and what it sends.
    let formDestinationOptions = destinationOptions(this._form, { submitButton: false })

    // (1) Merge together all render options for all origins.
    // (2) Adopt some formDestinationOptions that cannot be overridden by solutions,
    //     like { contentType }.
    // (3) u.mergeDefined() does not skip undefined objects, it skips entries in objects
    //     that have an undefined value.
    let options = u.mergeDefined(formDestinationOptions, ...dirtyRenderOptionsList)

    // Update the collected targets of all solutions.
    options.target = u.map(dirtySolutions, 'target').join(', ')

    // Since we may render multiple dirty elements we cannot have individual origins
    // for each. We already resolved an :origin selector in getSolution(), so we don't
    // need { origin } for target resolution.
    options.origin = this._form

    // In case we're replacing an input that the user is typing in,
    // preserve focus, selection and scroll positions.
    options.focus ??= 'keep'

    // The protocol doesn't define whether the validation results in a status code.
    // Some backends might want to communicate a failed validation, others might not.
    // In any case we render the same targets for both success and failure.
    //
    // In cases when the server does respond with an error status, we still want to
    // reject the up.validate() promise. Hence we use { failOptions: false } instead of
    // { fail: false }.
    options.failOptions = false

    // Re-rendering forms may cause dependent elements to disappear.
    // Let's not blow up the render pass in that case.
    options.defaultMaybe = true

    // We can receive params from
    // (1) A <form up-params="..."> JSON attribute, obtained by up.form.destinationOptions() above
    // (2) one or more up.validate({ params }) calls
    options.params = Params.merge(
      formDestinationOptions.params,
      ...u.map(dirtyRenderOptionsList, 'params')
    )

    // We can receive headers from
    // (1) A <form up-headers="..."> JSON attribute, obtained by up.form.destinationOptions() above
    // (2) one or more up.validate({ headers }) calls
    options.headers = u.merge(
      formDestinationOptions.headers,
      ...u.map(dirtyRenderOptionsList, 'headers')
    )

    // Make sure the X-Up-Validate header is present, so the server-side
    // knows that it should not persist the form submission
    this._addValidateHeader(options.headers, dirtyNames)

    // If any solution wants feedback, they all get it.
    // When no solution has an opinion we leave { feedback } unset, so the render default applies.
    let feedbacks = u.compact(u.map(dirtyRenderOptionsList, 'feedback'))
    if (feedbacks.length) options.feedback = feedbacks.includes(true)

    // Each up.validate({ data }) call should only apply to the targeted element,
    options.data = undefined
    options.dataMap = u.mapObject(dirtySolutions, ({ target, element, renderOptions: { data, keepData } }) => [
      target,
      keepData ? readData(element) : data
    ])

    // Each up.validate({ preview }) call should only apply to the targeted element,
    options.preview = undefined
    options.previewMap = u.mapObject(dirtySolutions, ({ target, renderOptions: { preview } }) => [target, preview])

    // Each up.validate({ placeholder }) call should only apply to the targeted element,
    options.placeholder = undefined
    options.placeholderMap = u.mapObject(dirtySolutions, ({ target, renderOptions: { placeholder } }) => [target, placeholder])

    // We may render multiple solutions with { disable } options, and most disable options
    // are specific to an { origin }, e.g. `{ disable: '.form-group:has(:origin)'}
    // Since up.render() can only take a single { origin },
    // we resolve it here.
    //
    // Disabling the same elements multiple time is not an issue since up.form.disableTemp()
    // only sees enabled elements.
    options.disable = dirtySolutions.map((solution) => resolveOrigin(solution.renderOptions.disable, solution))

    // The guardEvent will be emitted on the render pass' { origin }, so the form in this case.
    // The guardEvent will also be assigned a { renderOptions } attribute in up.render()
    options.guardEvent = build('up:form:validate', {
      fields: dirtyFields,
      log: 'Validating form',
      params: options.params,
      form: this._form,
    })

    return options
  }

  _addValidateHeader(headers: Record<string, string>, names: string[]): void {
    let key = headerize('validate')
    let value = names.join(' ')
    if (!value || value.length > protocolConfig.maxHeaderSize) value = ':unknown'
    headers[key] = value
  }

}
