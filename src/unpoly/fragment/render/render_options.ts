import * as u from '../../util.js'
import { fail } from '../../error.js'
import { getInputDevice } from '../../event.js'
import { fragmentConfig, toSuccessKey } from '../../fragment.js'
import { layerStack, normalizeLayerOptions } from '../../layer.js'
import { callbackAttr as scriptCallbackAttr, parseCallback as scriptParseCallback } from '../../script.js'
import type { EventPlan, InputDevice } from '../../event.js'
import type { ParseCallbackOptions } from '../../script.js'
import type { Layer } from '../../layer/base.js'
import type { LayerCloseEvent, LayerOpenedEvent } from '../../layer.js'
import type { FragmentLoadedEvent, FragmentOfflineEvent } from '../../fragment.js'
import type { ParamsLike } from '../../form/params.js'
import type { AnimationValue, TransitionValue } from '../../motion.js'
import type { PreviewFn } from '../../status.js'
import type { UpRequest } from '../../network/request.js'
import type { UpResponse } from '../../network/response.js'
import type { RenderResult } from './render_result.js'
import type { CSPInfo } from '../../script/csp/csp_info.js'
import type { PreflightProps } from './change/addition.js'

/**
What to render: a target selector, an element to derive a selector from, or several alternatives.
*/
export type RenderTarget = string | Element | u.List<Element> | string[]

/**
A layer reference: a layer object, an element in a layer, or a name like `'current'`, `'parent'` or `'new'`.
*/
export type LayerReference = string | Layer | Element

/**
A `{ focus }` or `{ scroll }` option: a keyword like `'auto'` or `'keep'`, a selector, an element, a function,
an array of alternatives or a selector map. See `up.FragmentProcessor`.
*/
export type FragmentProcessorValue = any

/**
A `{ preview }` option: the name of a preview, a preview function, or a list of them.
*/
export type PreviewValue = string | PreviewFn | (string | PreviewFn)[] | false

/**
The options that `up.render()`, `up.navigate()` and the functions built on them (`up.follow()`,
`up.submit()`, `up.layer.open()`, ...) pass through a render pass.

The public options are documented in `up.render()` and `up.layer.open()`.
Every option can also be given with a `fail` prefix (`{ failTarget }`, `{ failScroll }`, ...),
which is used instead for an [error response](/learn/error-responses#fail-options).
The render pass adds internal options while it runs, listed at the end.
*/
export interface RenderOptions {
  // Targeting
  target?: RenderTarget
  fallback?: string | boolean
  match?: 'region' | 'first'
  origin?: Element
  hungry?: boolean

  // Navigation
  navigate?: boolean

  // Request
  url?: string
  // The button that submitted a form (up.submit()), or false for none.
  submitButton?: Element | false
  method?: string
  params?: ParamsLike
  headers?: Record<string, string>
  abort?: boolean | string | Element | u.List<Element> | ((options: u.PlainObject) => any)
  abortable?: boolean
  background?: boolean
  lateDelay?: number | false
  timeout?: number
  fail?: u.ValueOrFunction<boolean>

  // Caching
  cache?: boolean | 'auto'
  revalidate?: boolean | 'auto' | ((response: UpResponse) => boolean)
  // With true, the { preview } is used.
  revalidatePreview?: PreviewValue | true
  expireCache?: any
  evictCache?: any

  // Local content
  content?: string | Element | u.List<Node>
  fragment?: string | Element
  document?: string | Element | Document
  response?: UpResponse

  // Layer
  layer?: LayerReference
  peel?: boolean | 'accept' | 'dismiss'
  mode?: string
  size?: string
  class?: string
  position?: string
  align?: string
  dismissible?: boolean | string | string[]
  dismissLabel?: string
  dismissARIALabel?: string
  trapFocus?: boolean
  acceptEvent?: string | string[]
  dismissEvent?: string | string[]
  acceptLocation?: string | string[]
  dismissLocation?: string | string[]
  acceptFragment?: string
  dismissFragment?: string

  // History
  history?: boolean | 'auto'
  title?: boolean | string
  location?: boolean | string
  metaTags?: boolean | Element[]
  lang?: boolean | string

  // Animation
  transition?: TransitionValue
  animation?: AnimationValue
  openAnimation?: AnimationValue
  closeAnimation?: AnimationValue
  duration?: number
  easing?: string
  closeDuration?: number
  closeEasing?: string

  // Scrolling
  scroll?: FragmentProcessorValue
  scrollMap?: u.PlainObject
  scrollBehavior?: ScrollBehavior
  revealSnap?: number
  revealTop?: boolean
  revealPadding?: number
  revealMax?: number | ((viewportHeight: number) => number)
  saveScroll?: boolean

  // Focus
  focus?: FragmentProcessorValue
  focusVisible?: boolean | 'auto'
  saveFocus?: boolean

  // Loading state
  disable?: boolean | string | Element | any[]
  placeholder?: string | Element | u.List<Node> | false
  preview?: PreviewValue
  feedback?: boolean

  // Client state
  data?: any
  dataMap?: u.PlainObject
  keep?: boolean
  keepData?: boolean
  context?: u.PlainObject

  // Lifecycle hooks
  confirm?: string | false
  onLoaded?: (event: FragmentLoadedEvent) => any
  onOffline?: (event: FragmentOfflineEvent) => any
  onRendered?: (result: RenderResult) => any
  onFinished?: (result: RenderResult) => any
  onError?: (error: any) => any
  onOpened?: (event: LayerOpenedEvent) => any
  onAccept?: (event: LayerCloseEvent) => any
  onAccepted?: (event: LayerCloseEvent) => any
  onDismiss?: (event: LayerCloseEvent) => any
  onDismissed?: (event: LayerCloseEvent) => any
  // A selector to reload after the overlay was accepted or dismissed.
  onAcceptedReload?: string
  onDismissedReload?: string

  // Internal options, set by Unpoly's own callers or by the render pass.
  baseLayer?: Layer
  originLayer?: Layer
  source?: string | false
  // Use the fail-prefixed options for an error response, instead of the success options.
  failOptions?: boolean
  didFail?: boolean
  didForceFailOptions?: boolean
  // The defaults from up.fragment.config, merged in by RenderOptions.finalize().
  defaults?: RenderOptions
  inputDevice?: InputDevice
  // Opens an empty overlay when no content option is given (up.layer.open()).
  defaultToEmptyContent?: boolean
  // An event to emit before rendering, e.g. up:link:follow. Rendering is aborted when it is prevented.
  guardEvent?: Event & { renderOptions?: RenderOptions }
  // Set by RenderJob, called with the change's preflight props once a plan applies.
  handleAbort?: (props: PreflightProps & { request?: UpRequest }) => void
  // An identifier for a render pass. See up.fragment.abort().
  jid?: any
  // Only use the response if it was cached (up.link.preload()).
  preload?: boolean
  expiredResponse?: UpResponse
  verifyFinished?: (result: RenderResult) => any
  onRequestKnown?: (request: UpRequest) => void
  // Only compute the preflight props, there is no content yet (ChangeFromURL).
  preflight?: boolean
  // How a step updates its target when the target has no ::before/::after/::content suffix.
  defaultPlacement?: string
  // Prefer these elements when matching the target, e.g. when revalidating.
  preferOldElements?: Element[]
  // The elements that show the loading state (up.status), like a form and its submit button.
  activeElements?: Element[]

  // Internal options that ChangeFromResponse takes from the response.
  hash?: string
  eventPlans?: EventPlan[]
  acceptLayer?: any
  dismissLayer?: any
  cspInfo?: CSPInfo
  time?: Date | false
  etag?: string | false
  // Passed to compilers as their third argument.
  meta?: u.PlainObject

  // A renamed option that unpoly-migrate still accepts.
  html?: string

  [key: `fail${string}`]: any
}


/**
Render options once the render pass has found the layer to render in (in UpdateLayer and OpenLayer).
@internal
*/
export interface ResolvedRenderOptions extends RenderOptions {
  layer?: Layer
  // A selector string, see up.fragment.toTarget().
  target?: string
}

// Sometimes we need to use given render options, but disable preview effects.
const NO_PREVIEWS: RenderOptions = {
  preview: false,
  disable: false,
  placeholder: false,
  feedback: false,
}

// Sometimes we need to use given render options, but disable meddling with user control.
const NO_INPUT_INTERFERENCE: RenderOptions = {
  scroll: 'keep',
  focus: 'keep',
  confirm: false,
}

// Sometimes we need to use given render options, but disable animation.
const NO_MOTION: RenderOptions = {
  transition: false,
  animation: false,
  openAnimation: false,
  closeAnimation: false,
}

// These properties are used before the request is sent.
// Hence there cannot be a failVariant.
const PREFLIGHT_KEYS: (keyof RenderOptions)[] = [
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
const CONTENT_KEYS: (keyof RenderOptions)[] = [
  'url',
  'response',
  'content',
  'fragment',
  'document',
]

// preprocess() will leave out properties for which there may be a better default
// later, in particular from the layer config in OpenLayerPlan.
const LATE_KEYS: string[] = [
  'history',
  'focus',
  'scroll',
]

const EVENT_CALLBACK: ParseCallbackOptions = {} // default in up.element.parseCallback() is { mainKey: 'event' }
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

function parseCallback(key: string, code: string): (...args: any[]) => any {
  return scriptParseCallback(code, parseCallbackOptions(key))
}

function parseCallbackOptions(key: string): ParseCallbackOptions {
  return CALLBACKS[key] ?? fail(`Unknown callback { ${key} }`)
}

function callbackAttr(element: Element, attrName: string, key: string): ((...args: any[]) => any) | undefined {
  // return e.parseAttr(element, attrName, (value) => parseCallback(key, value))
  return scriptCallbackAttr(element, attrName, parseCallbackOptions(key))
}

function navigateDefaults(options: RenderOptions): RenderOptions | undefined {
  if (options.navigate) {
    return fragmentConfig.navigateOptions
  }
}

function normalizeURL({ url }: RenderOptions): RenderOptions | undefined {
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
function removeUsePrefix(options: RenderOptions): void {
  u.renameKey(options, 'useData', 'data')
  u.renameKey(options, 'useHungry', 'hungry')
  u.renameKey(options, 'useKeep', 'keep')
}

function preprocess(options: RenderOptions): RenderOptions {
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
function rememberOriginLayer({ origin, originLayer }: RenderOptions): RenderOptions | undefined {
  if (origin && !originLayer) {
    return {
      originLayer: layerStack.get(origin),
    }
  }
}

function finalize<T extends RenderOptions>(preprocessedOptions: T, lateDefaults?: RenderOptions): T
function finalize(preprocessedOptions: RenderOptions, lateDefaults?: RenderOptions) {
  return u.merge(
    preprocessedOptions.defaults,
    lateDefaults,
    preprocessedOptions
  )
}

function assertContentGiven(options: RenderOptions): void {
  if (!u.some(CONTENT_KEYS, (contentKey) => u.isGiven(options[contentKey]))) {
    // up.layer.open() should open an empty layer without a content key.
    if (options.defaultToEmptyContent) {
      options.content = ''
    } else {
      fail('up.render() needs either { ' + CONTENT_KEYS.join(', ') + ' } option')
    }
  }
}

function failOverrides(options: RenderOptions): RenderOptions {
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

function deriveFailOptions(preprocessedOptions: RenderOptions): RenderOptions {
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

export const RenderOptions = {
  preprocess,
  finalize,
  assertContentGiven,
  deriveFailOptions,
  parseCallback,
  callbackAttr,
  chainCallbacks,
  NO_PREVIEWS,
  NO_MOTION,
  NO_INPUT_INTERFERENCE,
}
