import type * as u from '../util.js'
import type { ElementOrSelector } from '../element.js'
import type { EmitLogOption, EventPlan, InputDevice, UpEvent } from '../event.js'
import type { ParamsLike } from '../form.js'
import type {
  CloseVerb, Layer, LayerAcceptEvent, LayerAcceptedEvent, LayerDismissEvent, LayerDismissedEvent,
  LayerMode, LayerOpenedEvent, LayerReference, NewLayer,
} from '../layer.js'
import type { LogArgs } from '../log.js'
import type { AnimationValue, TransitionValue } from '../motion.js'
import type { RequestCondition, RequestTesterOptions, UpRequest, UpResponse } from '../network.js'
import type { FragmentHungryEvent } from '../radio.js'
import type { CSPInfo } from '../script.js'
import type { PreviewFunction } from '../status.js'
import type { FocusCapsule, RevealMax } from '../viewport.js'
import type { RenderResult } from './rendering/render_result.js'

/**
What to render: a target selector, an element to derive a selector from, or several alternatives.
*/
export type RenderTarget = string | Element | u.List<Element> | string[]

/**
A `{ scroll }` option: a keyword like `'auto'`, `'top'` or `'keep'`, a selector, a pixel position, an element,
a function, an array of alternatives or a selector map.
*/
export type ScrollOption = ProcessorOption

/**
A `{ focus }` option: a keyword like `'auto'`, `'target'` or `'keep'`, a selector, an element, a function,
an array of alternatives or a selector map.
*/
export type FocusOption = ProcessorOption

// A { scroll } or { focus } option. A function is called with the fragment and the render options,
// and may return another such option.
type ProcessorOption =
  | boolean
  | number
  | string
  | Element
  | ((fragment: HTMLElement | null | undefined, options: u.PlainObject) => unknown)
  | ProcessorOption[]
  | { [selector: string]: ProcessorOption }

/**
A `{ preview }` option: the name of a preview, a preview function, or a list of them.
*/
export type PreviewValue = string | PreviewFunction | (string | PreviewFunction)[] | false

/**
How a selector with several matches is resolved. See `up.fragment.config.match`.
*/
export type MatchMode = 'region' | 'first'

/**
A `{ content }` option: an HTML string, an element, or a list of nodes.
*/
export type ContentValue = string | Element | u.List<Node>

/**
A `{ disable }` option: `true` for the origin's form, a selector, an element, or an array of selectors and elements.
*/
export type DisableOption = boolean | string | Element | (string | Element)[]

/**
What a preview inserts or shows as a placeholder: an HTML string, a template selector (optionally followed by
template data), an element, a text node, or a list of nodes.
*/
export type NodesValue = string | Node | u.List<Node>

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
  match?: MatchMode
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
  abort?: boolean | string | Element | u.List<Element> | ((request: UpRequest) => boolean)
  abortable?: boolean
  background?: boolean
  lateDelay?: number | false
  timeout?: number
  fail?: boolean | ((response: UpResponse) => boolean)

  // Caching
  cache?: boolean | 'auto'
  revalidate?: boolean | 'auto' | ((response: UpResponse) => boolean)
  // With true, the { preview } is used.
  revalidatePreview?: PreviewValue | true
  expireCache?: RequestCondition
  evictCache?: RequestCondition

  // Local content
  content?: ContentValue
  fragment?: string | Element
  document?: string | Element | Document
  response?: UpResponse

  // Layer
  layer?: LayerReference | NewLayer
  peel?: boolean | CloseVerb
  mode?: LayerMode
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
  metaTags?: boolean | u.List<Element>
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
  scroll?: ScrollOption
  scrollMap?: u.PlainObject
  scrollBehavior?: ScrollBehavior
  revealSnap?: number
  revealTop?: boolean
  revealPadding?: number
  revealMax?: RevealMax
  saveScroll?: boolean

  // Focus
  focus?: FocusOption
  focusVisible?: boolean | 'auto'
  saveFocus?: boolean

  // Loading state
  disable?: DisableOption
  placeholder?: ContentValue | false
  preview?: PreviewValue
  feedback?: boolean
  // A { preview } and { placeholder } per target selector, when up.validate() renders several targets at once.
  previewMap?: u.PlainObject
  placeholderMap?: u.PlainObject

  // Client state
  data?: u.PlainObject
  dataMap?: u.PlainObject
  keep?: boolean
  keepData?: boolean
  context?: u.PlainObject

  // Lifecycle hooks
  confirm?: string | false
  onLoaded?: (event: FragmentLoadedEvent) => unknown
  onOffline?: (event: FragmentOfflineEvent) => unknown
  onRendered?: (result: RenderResult) => unknown
  // A revalidating render pass sets null, so it doesn't run the callback of the pass it revalidates.
  onFinished?: ((result: RenderResult) => unknown) | null
  onError?: (error: Error) => unknown
  onOpened?: (event: LayerOpenedEvent) => unknown
  onAccept?: (event: LayerAcceptEvent) => unknown
  onAccepted?: (event: LayerAcceptedEvent) => unknown
  onDismiss?: (event: LayerDismissEvent) => unknown
  onDismissed?: (event: LayerDismissedEvent) => unknown
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
  // The defaults from up.fragment.config, merged in by finalizeRenderOptions().
  defaults?: RenderOptions
  inputDevice?: InputDevice
  // Opens an empty overlay when no content option is given (up.layer.open()).
  defaultToEmptyContent?: boolean
  guardEvent?: GuardEvent
  // Set by RenderJob, called with the change's preflight props once a plan applies.
  handleAbort?: (props: AbortOptionProps) => void
  // An identifier for a render pass. See up.fragment.abort().
  jid?: number
  // Only use the response if it was cached (up.link.preload()).
  preload?: boolean
  expiredResponse?: UpResponse
  verifyFinished?: VerifyFinishedFunction
  onRequestKnown?: (request: UpRequest) => void
  // How a step updates its target when the target has no ::before/::after/::content suffix.
  defaultPlacement?: string
  // Whether a step is optional when the target has no :maybe suffix (up.validate()).
  defaultMaybe?: boolean
  // Prefer these elements when matching the target, e.g. when revalidating.
  preferOldElements?: Element[]
  // The elements that show the loading state (up.status), like a form and its submit button.
  activeElements?: Element[]

  // Internal options that renderFromResponse() takes from the response.
  hash?: string
  eventPlans?: EventPlan[]
  acceptLayer?: unknown
  dismissLayer?: unknown
  cspInfo?: CSPInfo
  time?: Date | false
  // null when the response has no ETag header.
  etag?: string | false | null
  // Passed to compilers as their third argument.
  meta?: u.PlainObject

  // A renamed option that unpoly-migrate still accepts.
  html?: string

  // oxlint-disable-next-line typescript/no-explicit-any -- the fail variant of any option
  [key: `fail${string}`]: any
}


/**
Render options once the render pass has found the layer to render in (in UpdateLayerPlan and OpenLayerPlan).
@internal
*/
export interface ResolvedRenderOptions extends RenderOptions {
  layer?: Layer
  // A selector string, see up.fragment.toTarget().
  target?: string
}

/**
Checks a finished render pass, e.g. that its layer is still open. May return a new `up.RenderResult`
that replaces the finished result.
@internal
*/
export type VerifyFinishedFunction = (result: RenderResult) => RenderResult | void | Promise<RenderResult | void>

/**
What a step of a render pass contributes to its `up.RenderResult`.
@internal
*/
export interface PartialRenderResult {
  fragments?: Element[]
  finished?: Promise<unknown>
  verifyFinished?: VerifyFinishedFunction
}

/**
Options for a `ResponseDoc`. One of `{ document }`, `{ fragment }` or `{ content }` holds the new HTML.
@internal
*/
export interface ResponseDocOptions {
  document?: string | Element | Document
  fragment?: string | Element
  content?: ContentValue
  target?: string
  origin?: Element
  data?: u.PlainObject
  cspInfo?: CSPInfo
  match?: MatchMode
}

/**
Options for a `FragmentProcessor`. Subclasses take more.
@internal
*/
export interface FragmentProcessorOptions {
  // updateSteps() passes null when it has no steps.
  fragment?: HTMLElement | null
  // What { focus: 'auto' } or { scroll: 'auto' } means, as another processable value.
  autoMeans?: ProcessorOption
  origin?: Element
  layer?: Layer
}

/**
What a change will update, known before its request is sent. renderFromURL() makes them request options,
RenderJob passes them to the `{ abort }` option.
@internal
*/
export interface PreflightProps {
  // The layer to update, or 'new' when opening an overlay.
  layer: Layer | 'new'
  // The layer whose fragments the request belongs to, for aborting.
  bindLayer: Layer
  mode: LayerMode
  context: u.PlainObject
  origin?: Element
  target: string
  fragments: Element[]
  bindFragments: Element[]
}

/**
What the `{ abort }` option needs to know about a change: its preflight props, and its request if it has one.
@internal
*/
export interface AbortOptionProps extends PreflightProps { request?: UpRequest }

/** An event that guards a render pass. Listeners can change its render options, or prevent it. */
export interface GuardEvent extends UpEvent { renderOptions: RenderOptions }

/**
A step of a render pass: which old element to update with which new element, and how.
Each step inherits the render options of its pass.
@internal
*/
export interface RenderStep extends ResolvedRenderOptions {
  selector: string
  placement: string
  maybe: boolean
  originalRenderOptions: RenderOptions
  // Set when the step is matched.
  oldElement?: HTMLElement
  newElement?: HTMLElement
  // Emitted when a new element was matched. Only hungry steps have one.
  selectEvent?: FragmentHungryEvent
  selectCallback?: (event: Event) => unknown
  // Set while rendering, see updateSteps().
  parentElement?: ParentNode | null
  afterRemove?: () => void
  descendantKeepMatches?: KeepMatch[]
  // Set by UpdateLayerPlan, for { focus: 'keep' } and { scroll: 'keep' }.
  focusCapsule?: FocusCapsule
  oldScrollTops?: Record<string, number>
  descendantsOnly?: boolean
}

/**
The arguments of `up.render()` and the functions built on it: a target and render options, or only render options.
*/
export type RenderArgs = [target: RenderTarget, options?: RenderOptions] | [options: RenderOptions]

/**
Options for looking up fragments (`up.fragment.get()`) and for deriving targets (`up.fragment.toTarget()`).
A render pass passes its render options.
*/
export interface LookupOptions {
  // Not only a LayerReference: a render pass passes its options, so this may be 'new' (see Selector).
  layer?: LayerReference | 'new'
  // The mode of a new layer, for expanding `:main` with `{ layer: 'new' }`.
  mode?: LayerMode
  origin?: Element
  originLayer?: Layer
  match?: MatchMode
  // Also match elements that are being destroyed.
  destroying?: boolean
  // For deriving targets: only use config.strongTargetDerivers, or check that the target matches.
  strong?: boolean
  verify?: boolean
}

/**
Options for `up.destroy()`.
*/
export interface DestroyOptions extends LookupOptions {
  animation?: AnimationValue
  duration?: number
  easing?: string
  onFinished?: () => void
  /** @internal */
  log?: EmitLogOption
}

/**
Options for `up.fragment.abort()`.
*/
export interface AbortFragmentOptions extends LookupOptions, RequestTesterOptions {
  reason?: string
  /** @internal */
  newLayer?: boolean
  /** @internal */
  jid?: number
  /** @internal */
  logOnce?: LogArgs
}

/**
The arguments of `up.fragment.abort()`: an element or selector and options, or only options.
*/
export type AbortFragmentArgs = [target?: ElementOrSelector, options?: AbortFragmentOptions] | [options: AbortFragmentOptions]

/**
An element with [up-keep] that is kept in an update, and the element it would have been replaced with.
@internal
*/
export interface KeepMatch {
  oldElement: Element
  newElement: Element
  newData: u.PlainObject
  renderOptions: RenderOptions
  // Set when rendering, see updateSteps().
  revivers?: (() => void)[]
}

/**
Derives a target selector for an element: a selector pattern like `'[id]'`, or a function.
See `up.fragment.config.targetDerivers`.
*/
export type TargetDeriver = string | ((element: Element) => string | undefined)

/**
Parses an HTML string into nodes.
@internal
*/
export type HTMLParser = (html: string) => u.List<Node>

/**
What `up.fragment.config.skipResponse()` gets to decide whether to skip a response. The `up:fragment:loaded` event
has the same properties.
*/
export interface FragmentLoadedProps {
  request: UpRequest
  response: UpResponse
  renderOptions: RenderOptions
  revalidating: boolean
  expiredResponse?: UpResponse
}

/** The `up:fragment:loaded` event. */
export interface FragmentLoadedEvent extends UpEvent, FragmentLoadedProps {
  origin?: Element
  skip: () => void
}

/** The `up:fragment:offline` event. */
export interface FragmentOfflineEvent extends UpEvent {
  request: UpRequest
  renderOptions: RenderOptions
  retry: (retryOptions?: RenderOptions) => Promise<RenderResult>
  origin?: Element
}

/** The `up:fragment:kept` event. */
export interface FragmentKeptEvent extends UpEvent {
  target: Element
  newFragment: Element
  newData: u.PlainObject
}

/** The `up:fragment:keep` event. */
export interface FragmentKeepEvent extends UpEvent {
  target: Element
  newFragment: Element
  newData: u.PlainObject
  renderOptions: RenderOptions
}

/** The `up:fragment:inserted` event. */
export interface FragmentInsertedEvent extends UpEvent {
  target: Element
  layer: Layer
  ok: boolean
  revalidating: boolean
}

/** The `up:fragment:destroyed` event. Emitted on the fragment's former parent. */
export interface FragmentDestroyedEvent extends UpEvent {
  fragment: Element
  parent: Element
}

/** The `up:fragment:aborted` event. */
export interface FragmentAbortedEvent extends UpEvent {
  target: Element
  reason: string
  newLayer: boolean
  /** @internal The render job that aborted, so a poller can tell its own reload apart. */
  jid?: number
}

/** The `up:template:clone` event. */
export interface TemplateCloneEvent extends UpEvent {
  target: Element
  data: u.PlainObject
  nodes: u.List<Node> | null
}

/**
The settings in `up.fragment.config`, described in its doc comment.
*/
export interface FragmentConfig {
  /**
  Not stored in `up.fragment.config`, but forwarded to `up.layer.config.any.mainTargets`.
  */
  mainTargets: string[]
  targetDerivers: TargetDeriver[]
  /**
  The patterns for `up.fragment.toTarget(element, { strong: true })`.
  @internal
  */
  strongTargetDerivers: string[]
  badTargetClasses: (string | RegExp)[]
  verifyDerivedTarget: boolean
  match: MatchMode
  navigateOptions: RenderOptions
  renderOptions: RenderOptions
  reloadOptions: RenderOptions
  autoHistoryTargets: string[]
  autoScroll: ScrollOption[]
  autoFocus: FocusOption[]
  normalizeKeepHTML: (html: string) => string
  autoRevalidate: boolean | ((response: UpResponse) => boolean)
  skipResponse: (loadedEventProps: FragmentLoadedProps) => boolean
  renderableResponse: (response: UpResponse) => boolean
}

declare global {
  interface GlobalEventHandlersEventMap {
    'up:fragment:aborted': FragmentAbortedEvent
    'up:fragment:destroyed': FragmentDestroyedEvent
    'up:fragment:inserted': FragmentInsertedEvent
    'up:fragment:keep': FragmentKeepEvent
    'up:fragment:kept': FragmentKeptEvent
    'up:fragment:loaded': FragmentLoadedEvent
    'up:fragment:offline': FragmentOfflineEvent
    'up:template:clone': TemplateCloneEvent
  }
}
