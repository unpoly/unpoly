import type * as u from '../util.js'
import { type EventPlan, type InputDevice, type UpEvent } from '../event.js'
import { type ParamsLike } from '../form.js'
import { type Layer, type LayerCloseEvent, type LayerMode, type LayerOpenedEvent } from '../layer.js'
import { type AnimationValue, type TransitionValue } from '../motion.js'
import { type RequestCondition, type UpRequest, type UpResponse } from '../network.js'
import { type FragmentHungryEvent } from '../radio.js'
import { type CSPInfo } from '../script.js'
import { type PreviewFn } from '../status.js'
import { type FocusCapsule } from '../viewport.js'
import { type RenderResult } from './render/render_result.js'

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
  expireCache?: RequestCondition
  evictCache?: RequestCondition

  // Local content
  content?: string | Element | u.List<Node>
  fragment?: string | Element
  document?: string | Element | Document
  response?: UpResponse

  // Layer
  layer?: LayerReference
  peel?: boolean | 'accept' | 'dismiss'
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
  // A { preview } and { placeholder } per target selector, when up.validate() renders several targets at once.
  previewMap?: u.PlainObject
  placeholderMap?: u.PlainObject

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
  // A revalidating render pass sets null, so it doesn't run the callback of the pass it revalidates.
  onFinished?: ((result: RenderResult) => any) | null
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
  guardEvent?: RenderGuardEvent
  // Set by RenderJob, called with the change's preflight props once a plan applies.
  handleAbort?: (props: AbortOptionProps) => void
  // An identifier for a render pass. See up.fragment.abort().
  jid?: number
  // Only use the response if it was cached (up.link.preload()).
  preload?: boolean
  expiredResponse?: UpResponse
  verifyFinished?: VerifyFinishedFn
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
  acceptLayer?: any
  dismissLayer?: any
  cspInfo?: CSPInfo
  time?: Date | false
  // null when the response has no ETag header.
  etag?: string | false | null
  // Passed to compilers as their third argument.
  meta?: u.PlainObject

  // A renamed option that unpoly-migrate still accepts.
  html?: string

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
export type VerifyFinishedFn = (result: RenderResult) => RenderResult | void | Promise<RenderResult | void>

/**
What a step of a render pass contributes to its `up.RenderResult`.
@internal
*/
export interface PartialRenderResult {
  fragments?: Element[]
  finished?: Promise<any>
  verifyFinished?: VerifyFinishedFn
}

/**
Options for an `up.ResponseDoc`. One of `{ document }`, `{ fragment }` or `{ content }` holds the new HTML.
@internal
*/
export interface ResponseDocOptions {
  document?: string | Element | Document
  fragment?: string | Element
  content?: string | Element | u.List<Node>
  target?: string
  origin?: Element
  data?: any
  cspInfo?: CSPInfo
  match?: 'region' | 'first'
}

/**
Options for an `up.FragmentProcessor`. Subclasses take more.
@internal
*/
export interface FragmentProcessorOptions {
  // UpdateSteps passes null when it has no steps.
  fragment?: HTMLElement | null
  // What { focus: 'auto' } or { scroll: 'auto' } means, as another processable value.
  autoMeans?: FragmentProcessorValue
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

/**
An event that a render pass emits before it renders, like `up:link:follow`. Rendering is aborted
when the event is prevented. Listeners find the render options in `event.renderOptions`.
@internal
*/
export interface RenderGuardEvent extends UpEvent { renderOptions?: RenderOptions }

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
  selectCallback?: (event: Event) => any
  // Set while rendering, see UpdateSteps.
  parentElement?: ParentNode | null
  afterRemove?: () => void
  descendantKeepPlans?: KeepPlan[]
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
  layer?: LayerReference
  // The mode of a new layer, for expanding `:main` with `{ layer: 'new' }`.
  mode?: string
  origin?: Element
  originLayer?: Layer
  match?: 'region' | 'first'
  // Also match elements that are being destroyed.
  destroying?: boolean
  // For deriving targets: only use config.strongTargetDerivers, or check that the target matches.
  strong?: boolean
  verify?: boolean
}

/**
An element with [up-keep] that is kept in an update, and the element it would have been replaced with.
@internal
*/
export interface KeepPlan {
  oldElement: Element
  newElement: Element
  newData: u.PlainObject
  renderOptions: RenderOptions
  // Set when rendering, see UpdateSteps.
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
Options for turning a value (HTML, a template or nodes) into nodes.
@internal
*/
export interface ProvideNodesOptions {
  origin?: Element
  originLayer?: Layer
  data?: any
  htmlParser?: HTMLParser
}

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
export interface FragmentKeepEvent extends FragmentKeptEvent { renderOptions: RenderOptions }

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
  match: 'region' | 'first'
  navigateOptions: RenderOptions
  renderOptions: RenderOptions
  reloadOptions: RenderOptions
  autoHistoryTargets: string[]
  autoScroll: FragmentProcessorValue[]
  autoFocus: FragmentProcessorValue[]
  normalizeKeepHTML: (html: string) => string
  autoRevalidate: boolean | ((response: UpResponse) => boolean)
  skipResponse: (loadedEventProps: FragmentLoadedProps) => boolean
  renderableResponse: (response: UpResponse) => boolean
}

/**
Options for an `up.FragmentFinder`. Other options (like `{ layer }`) are passed on to
`up.fragment.closest()` and `up.fragment.get()`.
@internal
*/
export interface FragmentFinderOptions extends LookupOptions {
  selector: string
  // For matching in detached content, as needed by up.ResponseDoc.
  document?: Document | Element
  preferOldElements?: Element[]
}

/**
Called when an element starts matching. May return a function that is called when it stops matching.
@internal
*/
export type SelectorTrackerAddCallback = (element: Element) => ((element: Element) => void) | void

declare module '../event.js' {
  interface UpEventMap {
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
