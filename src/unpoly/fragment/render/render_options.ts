import * as u from '../../util.js'
import { fail } from '../../error.js'
import { getInputDevice } from '../../event.js'
import { fragmentConfig, toSuccessKey } from '../../fragment.js'
import { layerStack, normalizeLayerOptions } from '../../layer.js'
import { callbackAttr, parseCallback, type ParseCallbackOptions } from '../../script.js'
import type * as t from '../types.js'

// Sometimes we need to use given render options, but disable preview effects.
const NO_PREVIEWS: t.RenderOptions = {
  preview: false,
  disable: false,
  placeholder: false,
  feedback: false,
}

// Sometimes we need to use given render options, but disable meddling with user control.
const NO_INPUT_INTERFERENCE: t.RenderOptions = {
  scroll: 'keep',
  focus: 'keep',
  confirm: false,
}

// Sometimes we need to use given render options, but disable animation.
const NO_MOTION: t.RenderOptions = {
  transition: false,
  animation: false,
  openAnimation: false,
  closeAnimation: false,
}

// These properties are used before the request is sent.
// Hence there cannot be a failVariant.
const PREFLIGHT_KEYS: (keyof t.RenderOptions)[] = [
  'url',
  'method',
  'origin',
  'headers',
  'params',
  'cache',
  'fallback',  // this may produce a different X-Up-Target request header if { target } is missing on page
  'abort',
  'abortable',
  'handleAbort',
  'confirm',
  'feedback',
  'disable',
  'placeholder',
  'preview',
  'origin',
  'originLayer',
  'baseLayer',
  'navigate',     // Also set navigate defaults for fail options
  'fail',
  'onError',
]

// These properties are used between success options and fail options.
// There's a lot of room to think differently about what should be shared and what
// should explicitly be set separately for both cases. An argument can always be
// that it's either convenient to share, or better to be explicit.
//
// Generally we have decided to share:
//
// - Options that are relevant before the request is sent (e.g. { url } or { abort }).
// - Options that change how we think about the entire rendering operation.
//   E.g. if we always want to see a server response, we set { fallback: true }.
//
// Generally we have decided to not share:
//
// - Layer-related options (e.g. target layer or options for a new layer)
// - Options that change focus. The user might focus a specific element from a success element,
//   like { focus: '.result', failFocus: '.errors' }.
//   We do however set { focus: 'auto', failFocus: 'auto' } in up.fragment.config.navigateOptions,
//   as 'auto' is generic enough for a shared default.
// - Options that change scrolling. The user might scroll to a specific element from a success element,
//   like { scroll: '.result', failScroll: '.errors' }.
//   We do however set { scroll: 'auto', failScroll: 'auto' } in up.fragment.config.navigateOptions.
//   as 'auto' is generic enough for a shared default.
const SHARED_KEYS = PREFLIGHT_KEYS.concat([
  'keep',         // If I want to discard [up-keep] elements, I also want to discard them for the fail case.
  'hungry',       // If I want to opportunistically update [up-hungry] elements, I also want it for the fail case.
  'history',      // Note that regardless of setting, we only set history for reloadable responses (GET).
  'source',       // No strong opinions about that one. Wouldn't one always have a source? Might as well not be an option.
  'saveScroll',   // No strong opinions about that one. Wouldn't one always want to saveScroll? Might as well not be an option.
])

// At least one of these properties must be given for Unpoly to render content.
const CONTENT_KEYS: (keyof t.RenderOptions)[] = [
  'url',
  'response',
  'content',
  'fragment',
  'document',
]

// preprocess() will leave out properties for which there may be a better default
// later, in particular from the layer config in OpenLayerPlan.
const LATE_KEYS: (keyof t.RenderOptions)[] = [
  'history',
  'focus',
  'scroll',
]

const EVENT_CALLBACK: ParseCallbackOptions = {} // default in parseCallback() is { argNames: ['event'] }
const RESULT_CALLBACK: ParseCallbackOptions = { argNames: ['result'] }
const ERROR_CALLBACK: ParseCallbackOptions = { argNames: ['error'] }
const OPEN_LAYER_CALLBACK: ParseCallbackOptions = { expandObject: ['layer'] }
const CLOSE_LAYER_CALLBACK: ParseCallbackOptions = { expandObject: ['layer', 'value', 'response'] }

const CALLBACKS: Record<string, ParseCallbackOptions> = {
  onLoaded: EVENT_CALLBACK,
  onRendered: RESULT_CALLBACK,
  onFinished: RESULT_CALLBACK,
  onOffline: EVENT_CALLBACK,
  onError: ERROR_CALLBACK,
  onOpened: OPEN_LAYER_CALLBACK,
  onAccept: CLOSE_LAYER_CALLBACK,
  onAccepted: CLOSE_LAYER_CALLBACK,
  onDismiss: CLOSE_LAYER_CALLBACK,
  onDismissed: CLOSE_LAYER_CALLBACK,
}

// Parses the code for a callback option like { onLoaded }, with the arguments of that callback.
function parseRenderCallback(key: string, code: string): u.AnyFunction {
  return parseCallback(code, parseCallbackOptions(key))
}

function parseCallbackOptions(key: string): ParseCallbackOptions {
  return CALLBACKS[key] ?? fail(`Unknown callback { ${key} }`)
}

// Reads an attribute like [up-on-loaded] as the callback option it sets, with the arguments of that callback.
function renderCallbackAttr(element: Element, attrName: string, key: string): u.AnyFunction | undefined {
  // return e.parseAttr(element, attrName, (value) => parseRenderCallback(key, value))
  return callbackAttr(element, attrName, parseCallbackOptions(key))
}

function navigateDefaults(options: t.RenderOptions): t.RenderOptions | undefined {
  if (options.navigate) {
    return fragmentConfig.navigateOptions
  }
}

function normalizeURL({ url }: t.RenderOptions): t.RenderOptions | undefined {
  // Absolutize a relative URL in case render options are re-used later,
  // after the location base changed. For example:
  //
  // (1) We're navigating to a relative URL (which changes history) and the fragment
  //     is revalidated. Then revalidation should not use its own changed location as a new base.
  //
  // (2) There is a network issue, which emits up:fragment:offline.
  //     Then the location changes for some reason. Then a listener calls event.retry(),
  //     which renders with the original render options.
  if (url) {
    return { url: u.normalizeURL(url) }
  }
}

// Rename keys like { useData } to just { data }.
//
// When we parse render options from attributes, we need to infix some attributes
// with "-use-" to distinguish them from a similar attribute affecting the element itself.
// E.g. a[up-data] is a link's own structured data, but a[up-use-data] overrides data
// for the first fragment updated by the link once clicked.
//
// For reasons of aesthetics and conciseness, we still prefer the render option to just
// be { data, dataMap }, not { useData, useDataMap }. Because we otherwise have full symmetry
// between attributes and options, *except* for this one distinction, we also accept
// { useData } for { data }.
function removeUsePrefix(options: t.RenderOptions): void {
  u.renameKey(options, 'useData', 'data')
  u.renameKey(options, 'useHungry', 'hungry')
  u.renameKey(options, 'useKeep', 'keep')
}

function preprocess(options: t.RenderOptions): t.RenderOptions {
  up.migrate.preprocessRenderOptions?.(options)
  normalizeLayerOptions(options)
  removeUsePrefix(options)

  const defaults = u.merge(
    fragmentConfig.renderOptions,
    navigateDefaults(options)
  )

  return u.merge(
    // Leave out properties for which there may be a better default later, in particular
    // from the layer config in OpenLayerPlan. If we merged it now we could
    // not distinguish a user option (which always has highest priority) with a
    // default that may be overridden by the layer config. If there is no better default
    // later, the original defaults will be applied in finalize().
    u.omit(defaults, LATE_KEYS),
    // Remember the defaults in a { default } prop so we can re-use it
    // later in deriveFailOptions() and finalize().
    { defaults },
    { inputDevice: getInputDevice() },
    options,
    normalizeURL(options),
    rememberOriginLayer(options),
  )
}

// Look up the origin layers*before* we make the request.
// In case of { layer: 'origin' } the { origin } element may get removed while the request was in flight,
// making ChangeFromContent#execute() fail with a message like "layer { origin } does not exist" or
// "Could not find a layer to render in. You may have passed an unmatchable layer reference, or a detached element.".
function rememberOriginLayer({ origin, originLayer }: t.RenderOptions): t.RenderOptions | undefined {
  if (origin && !originLayer) {
    return {
      originLayer: layerStack.get(origin),
    }
  }
}

function finalize<T extends t.RenderOptions>(preprocessedOptions: T, lateDefaults?: t.RenderOptions): T
function finalize(preprocessedOptions: t.RenderOptions, lateDefaults?: t.RenderOptions): t.RenderOptions {
  return u.merge(
    preprocessedOptions.defaults,
    lateDefaults,
    preprocessedOptions
  )
}

function assertContentGiven(options: t.RenderOptions): void {
  if (!u.some(CONTENT_KEYS, (contentKey) => u.isGiven(options[contentKey]))) {
    // up.layer.open() should open an empty layer without a content key.
    if (options.defaultToEmptyContent) {
      options.content = ''
    } else {
      fail('up.render() needs either { ' + CONTENT_KEYS.join(', ') + ' } option')
    }
  }
}

function failOverrides(options: t.RenderOptions): t.RenderOptions {
  const overrides: u.PlainObject = {}
  for (let key in options) {
    // Note that up.fragment.toSuccessKey(key) only returns a value
    // if the given key is prefixed with "fail".
    const value = (options as u.PlainObject)[key]
    let unprefixed = toSuccessKey(key)
    if (unprefixed) {
      overrides[unprefixed] = value
    }
  }
  return overrides
}

function deriveFailOptions(preprocessedOptions: t.RenderOptions): t.RenderOptions {
  // Remember that this pass was a failure (for up.RenderResult#ok)
  let markFailure = { didFail: true }

  // Collect all fail-prefixed options
  let overrides = failOverrides(preprocessedOptions)

  if (preprocessedOptions.failOptions) {
    return {
      // Only use global defaults and a few keys shared between success and failure.
      ...preprocessedOptions.defaults,
      ...u.pick(preprocessedOptions, SHARED_KEYS),
      ...overrides,
      // We sometimes want to log that fail-prefixed options were used, to alert the
      // user of the fact that there are different option sets for success and failure.
      didForceFailOptions: true,
      ...markFailure,
    }
  } else {
    return {
      // Use all the success options.
      ...preprocessedOptions,
      // We still allow to override individual options.
      // This is relevant for up.validate() which does not use fail options,
      // but lets users still override individual options for the failure case.
      ...overrides,
      ...markFailure,
    }
  }
}

// Returns a copy of the given options where each callback in ownCallbacks runs before
// the caller's callback of the same name.
function chainCallbacks<T extends u.PlainObject>(options: T, ownCallbacks: u.PlainObject): T {
  let chained: u.PlainObject = { ...options }
  for (let key in ownCallbacks) {
    chained[key] = u.sequence(ownCallbacks[key], options[key])
  }
  return chained as T
}

// The type of render options lives in fragment/types.ts. fragment.ts re-exports this object, and an
// explicit re-export hides the type of the same name from `export type *`. This alias gives the object
// the type's name too, like a class has, so other modules import both as `RenderOptions`.
export type RenderOptions = t.RenderOptions

export const RenderOptions = {
  preprocess,
  finalize,
  assertContentGiven,
  deriveFailOptions,
  parseRenderCallback,
  renderCallbackAttr,
  chainCallbacks,
  NO_PREVIEWS,
  NO_MOTION,
  NO_INPUT_INTERFERENCE,
}
