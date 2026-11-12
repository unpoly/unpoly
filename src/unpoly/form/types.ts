import type * as u from '../util.js'
import { type UpEvent } from '../event.js'
import { type RenderOptions, type RenderResult } from '../fragment.js'
import { type Params } from './params.js'

/**
A form field or button: an `<input>`, `<select>`, `<textarea>`, `<button>` or a form-associated
custom element. Unpoly reads its `{ name }`, `{ value }` and `{ disabled }` properties when it has them.
*/
export interface Field extends Element {
  name?: string
  value?: any
  disabled?: boolean
  form?: HTMLFormElement | null
  // Set while a preview disables the field, see disableControlTemp().
  upPreviewDisabled?: boolean
}

/**
The `up:form:submit` event.
*/
export interface FormSubmitEvent extends UpEvent {
  target: Element
  form: Element
  params: Params
  submitButton?: Element
  renderOptions: RenderOptions
}

/**
The `up:form:validate` event.
*/
export interface FormValidateEvent extends UpEvent {
  target: Element
  form: Element
  params: Params
  fields: u.List<Element>
  renderOptions: RenderOptions
}

/**
The `up:form:switch` event.
*/
export interface FormSwitchEvent extends UpEvent {
  target: Element
  field: Element
  fieldTokens: string[]
}

/**
The settings in `up.form.config`, described in its doc comment.
*/
export interface FormConfig {
  submitSelectors: string[]
  noSubmitSelectors: string[]
  groupSelectors: string[]
  fieldSelectors: string[]
  noFieldSelectors: string[]
  submitButtonSelectors: string[]
  anyButtonSelectors: string[]
  arrayParam: boolean | ((name: string) => boolean)
  watchInputDelay: number
  watchInputEvents: string[] | ((field: Element) => string[])
  watchChangeEvents: string[] | ((field: Element) => string[])
  validateBatch: boolean
  /**
  Nothing reads this setting.
  @internal
  */
  watchableEvents: string[]
}

/**
The callback for `up.watch()`. It is called with the new value, the field name and the
options for the change. With `{ batch: true }` it is called once with an object of all
changed values and the options.
*/
export type WatchCallback = u.AnyFunction

/**
Options for `up.watch()` and `up.autosubmit()`, and the options that `up.form.watchOptions()` parses
for a field. The callback receives them without `{ event, delay }`.
*/
export interface WatchOptions extends RenderOptions {
  event?: string | string[]
  delay?: number
  batch?: boolean
  /** @internal */
  logPrefix?: string
  /** @internal */
  includeDisabled?: boolean
}

/**
Options for `up.validate()`, and the options that `up.form.validateOptions()` parses for a field.
*/
export interface ValidateOptions extends WatchOptions {
  formGroup?: boolean
}

/**
The closest form group around a field. Its target is falsy when none can be derived.
@internal
*/
export interface FormGroupSolution {
  element: Element
  target?: string | false
  origin: Element
}

/**
What to re-render to validate a field: an element, its target selector and the field that
triggered the validation.
@internal
*/
export interface FoundValidationSolution extends FormGroupSolution {
  target: string
}

/**
A solution that is scheduled for rendering. `_getSolutions()` adds the render options and a
deferred that settles when the validation has rendered.
@internal
*/
export interface ValidationSolution extends FoundValidationSolution {
  renderOptions: ValidateOptions
  batch?: boolean
  // The method and URL. Solutions with the same destination can be validated in one request.
  destination: string
  deferred: u.Deferred<RenderResult>
}

/**
A single param. Its value is usually a string or a `File`. Other values are stringified
when the params are encoded.
*/
export interface ParamEntry {
  name: string
  value: any
}

/**
Anything that `new up.Params()` accepts: another `up.Params`, an array of entries, a query string,
a `FormData` object or a plain object like `{ name: 'value' }`.
*/
export type ParamsLike = Params | ParamEntry[] | string | FormData | u.PlainObject | null | undefined
