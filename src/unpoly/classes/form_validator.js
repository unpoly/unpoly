const u = up.util
const e = up.element

up.FormValidator = class FormValidator {

  constructor(form) {
    console.debug("Validator for %o", form)
    this.form = form
    this.formDefaults = form ? up.form.submitOptions(form, {}, { only: ['feedback', 'disable', 'contentType', 'headers', 'params', 'url', 'method'] }) : {} // TODO: Also parse [up-sequence] when we get it
    this.dirtySolutions = []
    this.nextRenderTimer = null
    this.nextRenderOptions = null
    this.rendering = false
    this.resetNextRenderPromise()
    this.honorAbort()
  }

  honorAbort() {
    up.fragment.onAborted(this.form, ({ target }) => {
      this.dirtySolutions = u.reject(this.dirtySolutions, ({ element }) => target.contains(element))
    })
  }

  resetNextRenderPromise() {
    this.nextRenderPromise = u.newDeferred()
  }

  watchField(field) {
    let fieldOptions = this.elementOptions(field)
    up.on(field, fieldOptions.event, () => this.validate(field, fieldOptions))
  }

  validate(elementOrSelector, renderOptions) {
    let solution = this.getSolution(elementOrSelector)
    this.dirtySolutions.push(solution)
    let nextRenderOptions = { ...this.elementOptions(solution.origin || solution.element), ...renderOptions }
    this.scheduleNextRender(nextRenderOptions)
    return this.nextRenderPromise
  }

  elementOptions(field) {
    let defaults = { event: 'change', ...this.formDefaults }
    return up.form.observeOptions(field, {}, { defaults })
  }

  getSolution(elementOrSelector,) {
    let solution
    if (u.isString(elementOrSelector)) {
      solution = this.getSelectorSolution(elementOrSelector)
    } else {
      solution = this.getValidateAttrSolution(elementOrSelector)
        || up.form.groupSolution(elementOrSelector)
        || this.getGivenElementSolution(elementOrSelector)
    }
    solution.target = up.fragment.resolveOrigin(solution.target, solution)
    return solution
  }

  getSelectorSolution(selector) {
    let element = up.fragment.get(selector, { layer: this.form })
    return {
      target, // Throw we obviously have no test for this error
      element,
      origin: element
    }
  }

  getValidateAttrSolution(origin) {
    let containerWithAttr = e.closest(origin, '[up-validate]')

    if (containerWithAttr) {
      let target = containerWithAttr.getAttribute('up-validate')

      if (target) {
        let element = up.fragment.get(target, { origin })

        return {
          target,
          element,
          origin
        }
      }
    }
  }

  getGivenElementSolution(element) {
    return {
      element,
      target: up.fragment.toTarget(element),
      origin: element,
    }
  }

  scheduleNextRender(options) {
    let delay = options.delay || 0
    console.debug("Scheduling validate render after %o ms", delay)
    this.nextRenderOptions = options
    // Render requests always reset the timer, using their then-current delay.
    this.unscheduleNextRender()
    this.nextRenderTimer = u.timer(delay, () => this.renderDirtySolutions())
  }

  unscheduleNextRender() {
    clearTimeout(this.nextRenderTimer)
  }

  renderDirtySolutions() {
    // Remove solutions for elements that were detached while we were waiting for the timer.
    this.dirtySolutions = u.reject(this.dirtySolutions, (solution) => e.isDetached(solution.element) || e.isDetached(solution.origin))

    if (!this.dirtySolutions.length || this.rendering) {
      return
    }

    let dirtySolutions = u.uniqBy(this.dirtySolutions, 'element')
    let dirtyTargets = u.map(dirtySolutions, 'target')
    // Dirty fields are the fields that triggered the validation, not the fields contained
    // by the solution elements. This is not the same thing in a scenario like this:
    //
    //     <form>
    //       <input type="text" name="email" up-validate=".results">
    //       <div class="results"></div>
    //     </form>
    let dirtyFields = u.uniq(u.flatMap(dirtySolutions, (solution) => up.form.fields(solution.origin)))
    // Remove duplicate names as a radio button group has multiple inputs with the same name.
    let dirtyNames = u.uniq(u.compact(u.map(dirtyFields, 'name')))

    let options = u.merge(this.formDefaults, this.nextRenderOptions)

    // Since we may render multiple dirty elements we cannot have individual origins
    // for each. We already resolved an :origin selector in getSolution(), so we don't
    // need { origin } for target resolution.
    options.origin = this.form

    options.focus = 'keep'

    options.target = dirtyTargets.join(', ')

    // The protocol doesn't define whether the validation results in a status code.
    // Hence we use the same options for both success and failure.
    options.fail = false

    // Make sure the X-Up-Validate header is present, so the server-side
    // knows that it should not persist the form submission
    options.headers ||= {}
    options.headers[up.protocol.headerize('validate')] =  dirtyNames.join(' ') || ':unknown'

    // The guardEvent will be be emitted on the render pass' { origin }, so the form in this case.
    // The guardEvent will also be assigned a { renderOptions } attribute in up.render()
    options.guardEvent = up.event.build('up:form:validate', { fields: dirtyFields, log: 'Validating form' })

    // We don't render concurrently. If additional fields want to validate
    // while our request is in flight, they add to @dirtySolutions.
    this.rendering = true
    this.dirtySolutions = []

    // Just like we're gathering new dirty solutions for our next render pass,
    // we now pass out a new validate() promise for that next pass.
    let promise = this.nextRenderPromise
    this.resetNextRenderPromise()

    u.always(up.render(options), (result) => {
      this.rendering = false
      // Resolve all promises we have handed out for the now-rendered solutions.
      promise.resolve(result)
      // Additional solutions may have become dirty while we were rendering.
      this.renderDirtySolutions()
    })
  }

  static forElement(element) {
    let form = up.form.get(element)
    return form.upFormValidator ||= new this(form)
  }

}
