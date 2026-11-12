import * as u from './util.js'
import * as e from './element.js'
import { OptionsParser } from './element/options_parser.js'
import { newConfig } from './util/config.js'
import { fail, muteUncriticalRejection } from './error.js'
import { build, haltEvent, on, type UnbindFn } from './event.js'
import {
  closest, getAllFragments, getSmart, getSubtree, render, sourceOf, toTarget, trackSelector,
  tryToTarget, type RenderJob, type RenderOptions, type RenderResult,
} from './fragment.js'
import { closestLayerElement, layerStack } from './layer.js'
import { followOptions } from './link.js'
import { mockable } from './mockable.js'
import {
  callbackAttr, registerAttrCompiler, registerCompiler, registerDestructor,
} from './script.js'
import { statusOptions, type PreviewFn } from './status.js'
import { doFocus, focusedElementWithin } from './viewport.js'
import type * as t from './form/types.js'
export type * from './form/types.js'
import { FieldWatcher } from './form/field_watcher.js'
import { FormValidator } from './form/form_validator.js'
import { Params } from './form/params.js'
export { Params }
import { Switcher } from './form/switcher.js'
export { Switcher }


export const formConfig = newConfig('up.form.config', (): t.FormConfig => ({
  groupSelectors: ['[up-form-group]', 'fieldset', 'label', 'form'],
  fieldSelectors: [
    'select',
    'input:not([type=submit], [type=image], [type=button], [type=reset])',
    'textarea',
    // Form-associated custom elements. No selector can name them directly, but they are the only
    // elements outside this list that :enabled and :disabled match — both states, so that an
    // element does not stop being a field while it is disabled. CSS defines :enabled by
    // capability ("can be activated or accept focus"), and older HTML counted `a, area, link`
    // with an [href] among the elements that :enabled matches. They are excluded in case an
    // engine still reads it that way. Chrome, Firefox and Safari do not.
    ':is(:enabled, :disabled):not(input, select, textarea, button, fieldset, optgroup, option, a, area, link)',
  ],
  noFieldSelectors: [],
  submitSelectors: ['form:is([up-submit], [up-target], [up-layer], [up-transition])'],
  noSubmitSelectors: ['[up-submit=false]', '[target]', e.crossOriginSelector('action')],
  submitButtonSelectors: ['input[type=submit]', 'input[type=image]', 'button[type=submit]', 'button:not([type])'],
  anyButtonSelectors: ['button', 'input:is([type=submit], [type=image], [type=button], [type=reset])'],
  // Although we only need to bind to `input`, we always also bind to `change`
  // in case another script manually triggers it.
  validateBatch: true,
  watchInputEvents: ['input', 'change'],
  watchInputDelay: 0,
  watchChangeEvents: ['change'],
  watchableEvents: ['input', 'change'],
  arrayParam: (name) => name.endsWith('[]'),
}))

function findFormElements(root: e.ElementOrSelector, selectorFn: u.SelectorFn): t.Field[] {
  // Unwrap jQuery. Callers pass an element, or a selector that they know matches.
  root = e.getOne(root)!
  let elements = getSubtree(root, selectorFn())

  // Like the browser, a [form] attribute takes precedence over the surrounding form.
  if (root.matches('form')) {
    elements = elements.filter((element: Element) => !element.hasAttribute('form') || getForm(element) === root)
  }

  // If findFormElements() is called with an entire form, gather fields outside the form
  // element that are associated with the form (through <input form="id-of-form">, which
  // is an HTML feature.)
  if (root.matches('form[id]')) {
    const formReference = e.attrSelector('form', root.getAttribute('id')!)
    const externalElementsSelector = selectorFn(formReference)
    const externalElements = getAllFragments(externalElementsSelector, { layer: root })
    elements = u.uniq([...elements, ...externalElements])
  }

  return elements
}

export const [formFieldSelector, isField] = formConfig.selectorFns('fieldSelectors')

export function findFields(root: e.ElementOrSelector): t.Field[] {
  return findFormElements(root, formFieldSelector)
}

// ALWAYS read and write a field's state through the accessors below. Direct property or
// attribute access is wrong for at least one kind of field.

// Falls back on absence, not falseness: a native field reports '' and means it.
export function readFieldName(field: t.Field): string | null | undefined {
  return field.name ?? field.getAttribute('name')
}

// The property is the only source. A form-associated element reports its value to the browser
// through setFormValue(), which a script cannot read back.
export function readFieldValue(field: t.Field): any {
  return field.value
}

// The field's own state only: an ancestor <fieldset disabled> also disables it for the browser,
// which we deliberately don't track here. Only up.Params.fromForm() honors it, for request params.
// Asks the same question as writeFieldDisabled(), so the two cannot disagree about which
// spelling is authoritative.
export function readFieldDisabled(field: t.Field): boolean {
  return 'disabled' in field ? field.disabled! : field.hasAttribute('disabled')
}

// Write only the spelling the control implements. Assigning a { disabled } property that a
// form-associated element never declared would *create* it, shadowing the attribute in
// readFieldDisabled() from then on.
//
// The undo closure reuses this spelling on purpose, so do not simplify it to
// `() => writeFieldDisabled(field, false)`: a custom element that upgrades in between would be
// disabled through its attribute and re-enabled through a property that only just appeared,
// leaving our attribute on the element for good.
export function writeFieldDisabled(field: t.Field, disabled: boolean): () => void {
  if ('disabled' in field) {
    field.disabled = disabled
    return () => { field.disabled = !disabled }
  } else {
    field.toggleAttribute('disabled', disabled)
    return () => field.toggleAttribute('disabled', !disabled)
  }
}

// A browser only submits the button that was pressed. With no submitter we assume the form's
// first submit button, which is what the browser itself does for an implicit submission — press
// Enter in a text field and event.submitter *is* the first submit button.
export function defaultSubmitButton(form: Element): t.Field | undefined {
  return findSubmitButtons(form)[0]
}

function findFieldsAndButtons(container: e.ElementOrSelector): t.Field[] {
  return [
    ...findFields(container),
    ...findAnyButtons(container),
  ]
}

const [submitButtonSelector, isSubmitButton] = formConfig.selectorFns('submitButtonSelectors')

export function findSubmitButtons(root: e.ElementOrSelector): t.Field[] {
  return findFormElements(root, submitButtonSelector)
}

export const [anyButtonSelector, isAnyButton] = formConfig.selectorFns('anyButtonSelectors')

function findAnyButtons(root: e.ElementOrSelector): t.Field[] {
  return findFormElements(root, anyButtonSelector)
}

export const submit = mockable((form: e.ElementOrSelector, options?: RenderOptions): RenderJob => {
  return render(submitOptions(form, options))
})

export function submitOptions(form: e.ElementOrSelector, options?: RenderOptions, parserOptions?: e.OptionsParserOptions): RenderOptions
// The form is resolved in place. The implementation can't take the resolved type: with
// strictFunctionTypes, a function's overload must be assignable to it (TS2394).
export function submitOptions(form: any, options?: RenderOptions, parserOptions?: e.OptionsParserOptions): RenderOptions {
  form = getSmart(form)
  form = getForm(form)

  options = u.newOptions(options)

  let parser = new OptionsParser(form, options, parserOptions)

  parser.include(destinationOptions)

  // We should usually be able to derive a target selector since form[action] is a default
  // deriver. In cases when we cannot, we should usually update a main target since
  // submitting is navigation, and { fallback: true } is a navigation default.
  parser.string('failTarget', { default: tryToTarget(form) })

  // The guardEvent will also be assigned an { renderOptions } property in up.render()
  options.guardEvent ||= build('up:form:submit', {
    submitButton: options.submitButton,
    log: 'Submitting form',
    params: options.params,
    form,
  })

  options.origin ||= focusedElementWithin(form) || options.submitButton || form
  options.activeElements = u.uniq([options.origin, options.submitButton, form].filter(u.isElement))

  // Now that we have extracted everything form-specific into options, we can call
  // up.link.followOptions(). This will also parse the myriads of other options
  // that are possible on both <form> and <a> elements.
  parser.include(followOptions)

  Object.assign(options, submitButtonOverrides(options.submitButton))

  return options
}

export function watchOptions(field: e.ElementOrSelector, options?: t.WatchOptions, parserOptions: e.OptionsParserOptions = {}): t.WatchOptions {
  field = getSmart(field)!
  options = u.newOptions(options)

  // Computing the effective options for a given field is pretty involved,
  // as there are multiple layers of defaults. In increasing priority these are:
  //
  // Users can configure app-wide defaults for some options:
  //
  // 		up.form.config.watchInputDelay = 100
  //
  // Forms can configure [up-watch-...] prefixed defaults for all watchers:
  //
  // 		<form up-watch-disable="false">
  // 			<input up-autosubmit>
  // 		</form>
  //
  // Form-wide options can be overridden at the input level:
  //
  // 		<form up-watch-disable="true">
  // 			<input up-autosubmit up-watch-disable="false">
  // 		</form>
  //
  // You may also set [up-watch-...] attribute on any element containing fields.
  // The closest attribute around the changed field is honored.
  //
  // This is particularly useful for a group of radio buttons:
  //
  // 		<form up-watch-disable="true">
  // 			<fieldset up-autosubmit up-watch-disable="false">
  // 				<input type="radio" name="kind" value="0">
  // 				<input type="radio" name="kind" value="1">
  // 				<input type="radio" name="kind" value="2">
  // 			</fieldset>
  // 		</form>
  //
  // Programmatic callers may also override all HTML attributes by passing an options hash:
  //
  //    up.validate(field, { disable: true })

  parserOptions.closest ??= true
  parserOptions.attrPrefix ??= 'up-watch-'
  // Like up.watch(), watch the input event unless an attribute or option names another.
  // up.validate() includes us with a default of 'change'.
  parserOptions.defaults ??= { event: 'input' }

  let parser = new OptionsParser(field, options, parserOptions)

  parser.include(statusOptions, parserOptions)
  parser.string('event')
  parser.number('delay')

  if (options.event === 'input') {
    // Expand the event name via the map in `up.form.config.watchInputEvents`.
    // This way we can fix components
    options.event = u.evalOption(formConfig.watchInputEvents, field)
    options.delay ??= formConfig.watchInputDelay
  } else if (options.event === 'change') {
    options.event = u.evalOption(formConfig.watchChangeEvents, field)
  }

  options.origin ||= field

  // The callback to [up-watch] is not parsed here.
  // It is parsed in watch(), which calls watchCallbackFromElement().

  return options
}

export function validateOptions(field: e.ElementOrSelector, options?: t.ValidateOptions, parserOptions: e.OptionsParserOptions = {}): t.ValidateOptions {
  field = getSmart(field)!
  options = u.newOptions(options)
  let parser = new OptionsParser(field, options, { ...parserOptions, closest: true, attrPrefix: 'up-validate-' })
  parser.string('url')
  parser.string('method', { normalize: u.normalizeMethod })
  parser.boolean('batch', { default: formConfig.validateBatch })
  parser.json('params')
  parser.json('headers')
  // parser.include(destinationOptions)
  parser.include(watchOptions, { defaults: { event: 'change' } })
  return options
}

export function disableContainerTemp(container: Element, { preview }: { preview?: boolean } = {}): () => void {
  let controls = findFieldsAndButtons(container)
  return u.sequence(u.map(controls, (control) => disableControlTemp(control, preview)))
}

function disableControlTemp(control: t.Field, preview?: boolean): (() => void) | undefined {
  // Ignore controls that were already disabled before us.
  // This way we don't accidentally re-enable a control that we didn't change.
  if (readFieldDisabled(control)) return

  // Look the fallback up before disabling, while the control is still focusable.
  let focusFallback
  if (document.activeElement === control) focusFallback = findGroup(control, { targetable: false })

  let undoDisable = writeFieldDisabled(control, true)
  // A group in an HTML form is an HTML element.
  if (focusFallback) doFocus(focusFallback as HTMLElement, { force: true, preventScroll: true })

  if (preview) {
    // Disabled by a preview to block input while a request is loading.
    // Still counts as enabled when we read params or watch values.
    control.upPreviewDisabled = true
    undoDisable = u.sequence(undoDisable, () => delete control.upPreviewDisabled)
  }

  // (1) This function is only returned if we didn't early-return above
  //     for a control that is already disabled.
  // (2) In case our disabling caused focus loss: We don't care about restoring focus,
  //     selection or scroll position here. The up.form.disableTemp() function is *only*
  //     used via up.Preview#disable(), and previews already use a FocusCapsule
  //     to preserve and restore focus-related state.
  return undoDisable
}

// Disable is true (the origin's form), an element, a selector or an array of these.
function getDisableContainers(disable: any, origin?: Element): Element[] {
  let originScope = (): Element => getRegion(origin)

  if (disable === true) {
    return [originScope()]
  } else if (u.isElement(disable)) {
    return [disable]
  } else if (u.isString(disable)) {
    return getSubtree(originScope(), disable, { origin })
  } else if (u.isArray(disable)) {
    return u.flatMap(disable, (d) => getDisableContainers(d, origin))
  } else {
    return []
  }
}

export function getDisablePreviewFn(disable: any, origin?: Element): PreviewFn {
  return function(preview) {
    let containers = getDisableContainers(disable, origin)
    for (let container of containers) {
      preview.disable(container)
    }
  }
}

// Changes the DOM so the browser's form-data algorithm sees the same controls as Unpoly.
// Returns a function that restores the DOM.
//
// The browser decides the form owner of a control across the whole page: A [form="X"] control
// belongs to the first form#X in document order, and a control within a <form> belongs to it
// even when it is in another layer (a popup attached within the form). Unpoly isolates layers.
export function prepareParamsReadTemp(form: HTMLFormElement): () => void {
  let undo = u.cleaner()
  let ownControls = new Set(findFieldsAndButtons(form))

  // Fields and buttons that a preview disabled still count, e.g. for a second submission
  // while the first one is loading.
  for (let control of ownControls) {
    if (control.upPreviewDisabled && readFieldDisabled(control)) undo(writeFieldDisabled(control, false))
  }

  // Our [form="X"] controls must belong to our form, not to an earlier form#X in another layer,
  // e.g. when the same page is open in an overlay and in the layer below.
  // We don't use form.id, which an <input name="id"> shadows.
  let id = form.getAttribute('id')
  if (id) {
    for (let otherForm of document.querySelectorAll('form' + e.idSelector(id))) {
      if (otherForm !== form) undo(e.setAttrsTemp(otherForm, { id: 'up-isolated-' + u.uid() }))
    }
  }

  // Controls of other layers must not belong to our form.
  // We collect them before we change any, since form.elements is a live collection.
  let foreignControls = u.filterList(form.elements, (control) => (isField(control) || isAnyButton(control)) && !ownControls.has(control))
  for (let control of foreignControls) {
    undo(e.setAttrsTemp(control, { form: 'up-isolated-' + u.uid() }))
  }

  return undo.clean
}

export function setContainerDisabled(container: Element, disabled: boolean): void {
  // This function is much simpler than disableContainerTemp(), as we only require
  // it for [up-enable-for] / [up-disable-for].
  for (let control of findFieldsAndButtons(container)) {
    writeFieldDisabled(control, disabled)
  }
}

// This was extracted from submitOptions().
// Validation needs to submit a form without options intended for the final submission,
// like [up-scroll], [up-confirm], etc.
export function destinationOptions(form: Element, options?: u.PlainObject, parserOptions?: e.OptionsParserOptions): u.PlainObject {
  options = u.newOptions(options)
  form = getForm(form)!
  const parser = new OptionsParser(form, options, parserOptions)

  parser.string('contentType', { attr: 'enctype' })
  parser.json('headers')

  // A `submit` event may already have handed us { submitButton: event.submitter }. Resolve this
  // before parsing params, because the button's [name] and [value] are contributed by the
  // browser's form-data algorithm inside up.Params.fromForm().
  const submitButton = (options.submitButton ??= defaultSubmitButton(form))

  // Parse params from form fields.
  const paramParts: [Params, ...t.ParamsLike[]] = [
    Params.fromForm(form, options),
    e.jsonAttr(form, 'up-params'),
  ]

  const headerParts = [
    e.jsonAttr(form, 'up-headers'),
  ]

  if (submitButton) {
    paramParts.push(
      e.jsonAttr(submitButton, 'up-params')
    )

    headerParts.push(
      e.jsonAttr(submitButton, 'up-headers')
    )

    // Submit buttons may have [formmethod] and [formaction] attribute
    // that override [method] and [action] attribute from the <form> element.
    options.method ||= submitButton.getAttribute('formmethod')
    options.url ||= submitButton.getAttribute('formaction')
  }

  // We merge any { params } option into the params that we got from the form elements.
  options.params = Params.merge(
    ...paramParts,
    options.params,
  )

  // We merge any { headers } option to the headers that we got from the form elements.
  options.headers = u.merge(
    ...headerParts,
    options.headers,
  )

  // Parse the form element's { url, method } *after* parsing the submit button.
  // The submit button's [formmethod] and [formaction] attributes have precedence.
  parser.string('url', { attr: 'action', default: sourceOf(form) })
  parser.string('method', {
    attr: ['up-method', 'data-method', 'method'],
    default: 'GET',
    normalize: u.normalizeMethod
  })
  if (options.method === 'GET') {
    // Only for GET forms, browsers discard all query params from the form's [action] URL.
    // The URLs search part will be replaced with the serialized form data.
    // See design/query-params-in-form-actions/cases.html for
    // a demo of vanilla browser behavior.
    options.url = Params.stripURL(options.url)
  }

  return options
}

export function submitButtonOverrides(submitButton?: Element | false): RenderOptions {
  if (!submitButton) return {}
  let buttonOptions = followOptions(submitButton, {}, { defaults: false })
  // The parsing of [formmethod] and [formaction] (into { method, url })
  // already happens in destinationOptions()
  return u.omit(buttonOptions, ['method', 'url', 'guardEvent', 'origin', 'params', 'headers'])
}

export function watch(...args: any[]): UnbindFn {
  let [root, options, callback] = u.parseArgs(args, 'val', 'options', 'callback')

  root = e.getOne(root) // unwrap jQuery
  callback ||= watchCallbackFromElement(root) || fail('No callback given for up.watch()')

  const watcher = new FieldWatcher(root, options, callback)

  return watcher.start()
}

function watchCallbackFromElement(element: Element): t.WatchCallback | undefined {
  return callbackAttr(element, 'up-watch', { argNames: ['value', 'name', 'options'] })
}

export function autosubmit(target: e.ElementOrSelector, options: t.WatchOptions = {}): UnbindFn {
  const onChange = (_diff: u.PlainObject, renderOptions: RenderOptions): RenderJob => submit(target, renderOptions)
  return watch(target, { logPrefix: 'up.autosubmit()', ...options, batch: true }, onChange)
}

export function getGroupSelectors(): string[] {
  return up.migrate.migratedFormGroupSelectors?.() || formConfig.groupSelectors
}

export function findGroup(field: Element, { targetable = false }: { targetable?: boolean } = {}): Element | undefined {
  return findGroupSolution(field, { targetable })?.element
}

// Returns the closest group around the given field, with a target selector whenever we can derive one.
// With { targetable: true } we skip groups for which we cannot derive a target.
export function findGroupSolution(field: Element, { targetable }: { targetable?: boolean }): t.FormGroupSolution | undefined {
  return u.findResult(getGroupSelectors(), function(groupSelector) {
    let group = field.closest(groupSelector)
    if (group) {
      let strongDerivedGroupTarget = tryToTarget(group, { strong: true })
      let goodDerivedFieldTarget = tryToTarget(field)
      // Most forms have multiple groups with no identifying attributes, e.g. <div up-form-group>.
      // Hence we use a :has() selector to identify the form group by the selector
      // of the contained field, which usually has an identifying [name] or [id] attribute.
      let groupHasFieldTarget = goodDerivedFieldTarget && (group !== field) && `${groupSelector}:has(${goodDerivedFieldTarget})`
      let target = strongDerivedGroupTarget || groupHasFieldTarget
      if (target || !targetable) {
        return {
          target,
          element: group,
          origin: field
        }
      }
    }
  })
}


export function validate(...args: [originOrTarget: e.ElementOrSelector, options?: t.ValidateOptions]): Promise<RenderResult> {
  let options = parseValidateArgs(...args)
  let form = getForm(options.origin)!
  let validator = getFormValidator(form)
  // Validating always finds a solution, at least the origin itself.
  return validator.validate(options)!
}

function parseValidateArgs(originOrTarget: any, ...args: any[]): u.PlainObject {
  const options = u.extractOptions(args)

  if (options.origin) {
    options.target ||= toTarget(originOrTarget)
  } else {
    options.origin ||= getSmart(originOrTarget)
  }

  return options
}

export function getForm(element: Element): HTMLFormElement | null | undefined {
  return getLiteralForm(element) || getAssociatedForm(element) || getClosestForm(element)
}

function getLiteralForm(element: Element): HTMLFormElement | undefined {
  // We're making a lot of calls to getForm() and getRegion().
  // For performance reasons we want to return a literal <form> without further DOM look-ups.
  if (element instanceof HTMLFormElement) return element
}

function getClosestForm(element: Element): HTMLFormElement | null | undefined {
  // Return the closest form for vanilla fields, or any non-field element within a form (like a form group).
  // Like the browser, a [form] attribute decides alone, even when it matches no form in our layer.
  if (!element.hasAttribute('form')) return element.closest('form')
}

function getAssociatedForm(element: Element): HTMLFormElement | undefined {
  // We support fields without a <form> ancestor, which are associated via an [form] attribute.
  // We could use element's { form } property, but that is not layer-aware. It will always return
  // the first form with a matching [id].
  let formID = element.getAttribute('form')
  if (formID) {
    let selector = 'form' + e.idSelector(formID)
    // The selector only matches a <form>.
    return getSmart(selector, { layer: element }) as HTMLFormElement
  }
}

// A form remembers its validator.
interface ValidatingForm extends HTMLFormElement { upFormValidator?: FormValidator }

function getFormValidator(form: ValidatingForm): FormValidator {
  return form.upFormValidator ||= setupFormValidator(form)
}

function setupFormValidator(form: HTMLFormElement): FormValidator {
  const validator = new FormValidator(form)
  const stop = validator.start()
  registerDestructor(form, stop)
  return validator
}

// Alternative to getForm() which always returns a likely scope:
//
// (1) Called with an origin within a form => Returns the closest form
// (2) Called with an origin outside a form => Returns the origin's layer element
// (3) Called without an origin element => Returns the current layer element
//
// Does not support a selector string as a first argument. Only works with Element arguments.
export function getRegion(origin?: Element): Element {
  return getOriginRegion(origin) || layerStack.current.element
}

function getOriginRegion(origin?: Element): Element | null | undefined {
  if (origin) {
    return getForm(origin) || closestLayerElement(origin)
  }
}

// The callback may return a function that is called when the field no longer matches.
type TrackFieldsCallback = (field: Element) => unknown
// The guard is a condition for a field to match, tested for truthiness.
interface TrackFieldsOptions { guard?: (field: Element) => unknown }
export const trackFields = mockable(function(...args: [root: Element, callback: TrackFieldsCallback] | [root: Element, options: TrackFieldsOptions, callback: TrackFieldsCallback]): UnbindFn {
  let [root, { guard }, callback] = u.parseArgs(args, 'val', 'options', 'callback')

  let selectFn = function(): Element[] {
    // A detached root has no fields left to track.
    if (!root.isConnected) return []

    let region = getRegion(root)

    // Only look at fields that can belong to the root, instead of every field on the page.
    // With many trackers (e.g. many small forms with [up-autosubmit]) the latter would cost
    // trackers × fields after every render pass.
    return u.filterList(findFields(root), function(field) {
      return (getRegion(field) === region) // will also match external fields with [form]
        && (!guard || guard(field)) // user-provided condition
    })
  }

  return trackSelector(selectFn, callback)
})

export function focusedField(): Element | undefined {
  return u.presence(document.activeElement, isField)
}

export function isSubmittable(form: e.ElementOrSelector): boolean {
  form = getSmart(form)!
  return formConfig.matches(form, 'submitSelectors')
}



export function install(): void {
  on('submit', formConfig.selectorFn('submitSelectors'), function(event, form) {
    // We pass on the event.submitter prop as a { submitButton } prop.
    // Otherwise submitOptions() would default to the first submit button.
    const submitButton = u.presence(event.submitter, isSubmitButton)

    // Allow individual submit buttons from opting out of Unpoly handling.
    if (submitButton?.getAttribute('up-submit') === 'false') return

    // Don't handle a form that's already been handled by foreign code.
    if (event.defaultPrevented) return

    haltEvent(event, { log: true })

    // The browser resolves a [form] attribute across the whole page. A button or a field (pressing Enter)
    // can then submit a form in another layer: when two layers have a form with the same ID, or when
    // [form] refers to a form that only exists in another layer. Layers don't share forms.
    // Either may be a control that isn't a field (or null), whose { form } is then undefined.
    for (let control of [event.submitter, document.activeElement] as t.Field[]) {
      if (control && control.form === form && getForm(control) !== form) {
        fail('Prevented %o from submitting a form in another layer ([form="%s"])', control, control.getAttribute('form'))
      }
    }

    muteUncriticalRejection(submit(form, { submitButton }))
  })

  registerCompiler('[up-switch]', (switcher) => {
    return new Switcher(switcher).start()
  })

  registerAttrCompiler('up-watch', (formOrField) => watch(formOrField))

  registerCompiler('[up-validate]', { rerun: true }, function(element) {
    // There are non-intuitive ways that an [up-validate] field can find its way into a <form>,
    // e.g. when the field is also [up-keep] and is transplanted into a new <form> later.
    let form = getForm(element)
    if (form) getFormValidator(form)
  })

  registerAttrCompiler('up-autosubmit', function(formOrField) {
    // An outer [up-autosubmit] already submits when our fields change, honoring our [up-watch-*] attributes.
    // A second watcher would submit the form twice for the same change.
    // We don't warn, since a partial with [up-autosubmit] may be rendered with or without an outer one.
    // An outer [up-autosubmit] of another form doesn't see our fields, e.g. for <input form="other-form">.
    // Compilers only run on attached elements, which have a parent.
    let outer = closest(formOrField.parentElement!, '[up-autosubmit]:not([up-autosubmit=false])')
    if (outer && getForm(outer) === getForm(formOrField)) return

    return autosubmit(formOrField, { logPrefix: '[up-autosubmit]' })
  })
}

export const api = {
  form: {
    config: formConfig,
    get: getForm,
    submit,
    submitOptions,
    isSubmittable,
    watch,
    watchOptions,
    validate,
    validateOptions,
    autosubmit,
    fields: findFields,
    isField,
    submitButtons: findSubmitButtons,
    // disableWhile,
    // handleDisableOption,
    group: findGroup,
  },
  submit,
  watch,
  autosubmit,
  validate,
}
