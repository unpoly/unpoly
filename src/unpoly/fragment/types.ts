import type * as u from '../util.js'
import { type Layer } from '../layer.js'
import { type UpRequest, type UpResponse } from '../network.js'
import { type FocusCapsule } from '../viewport.js'
import {
  type FragmentProcessorValue, type RenderOptions, type RenderTarget, type ResolvedRenderOptions,
} from './render/render_options.js'
import { type RenderResult } from './render/render_result.js'

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
  // An event to emit when a new element was matched, e.g. up:fragment:hungry.
  selectEvent?: Event & { newFragment?: Element, renderOptions?: RenderOptions }
  selectCallback?: (event: Event) => any
  // Set while rendering, see UpdateSteps.
  parentElement?: ParentNode
  afterRemove?: () => void
  descendantKeepPlans?: KeepPlan[]
  // Set by UpdateLayer, for { focus: 'keep' } and { scroll: 'keep' }.
  focusCapsule?: FocusCapsule
  oldScrollTops?: Record<string, number>
  descendantsOnly?: boolean
}

/**
The arguments of `up.render()` and the functions built on it: a target and render options, or only render options.
*/
export type RenderArgs = [target: RenderTarget, options?: RenderOptions] | [options: RenderOptions]

/**
An element with [up-keep] that is kept in an update, and the element it would have been replaced with.
@internal
*/
export interface KeepPlan {
  oldElement: Element
  newElement: Element
  newData?: any
  renderOptions?: u.PlainObject
  // Set when rendering, see UpdateSteps.
  revivers?: any[]
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
The `up:fragment:loaded` event.
*/
export type FragmentLoadedEvent = Event & {
  request: UpRequest
  response: UpResponse
  revalidating: boolean
  expiredResponse: UpResponse | undefined
  origin: Element | undefined
  renderOptions: RenderOptions
  skip: () => void
}

/**
The `up:fragment:offline` event.
*/
export type FragmentOfflineEvent = Event & {
  request: UpRequest
  renderOptions: RenderOptions
  retry: (retryOptions?: RenderOptions) => Promise<RenderResult>
  origin: Element | undefined
}

/**
The `up:fragment:keep` event.
*/
export type FragmentKeepEvent = Event & {
  target: Element
  newFragment: Element
  newData: u.PlainObject
  renderOptions: RenderOptions
}

/**
The `up:fragment:kept` event.
*/
export type FragmentKeptEvent = Event & {
  target: Element
  newFragment: Element
  newData: u.PlainObject
}

/**
The `up:fragment:inserted` event.
*/
export type FragmentInsertedEvent = Event & {
  target: Element
  layer: Layer
  ok: boolean
  revalidating: boolean
}

/**
The `up:fragment:destroyed` event.
*/
export type FragmentDestroyedEvent = Event & {
  fragment: Element
  parent: Element
  target: Element
}

/**
The `up:fragment:aborted` event.
*/
export type FragmentAbortedEvent = Event & {
  target: Element
  reason: string
  newLayer: boolean
}

/**
The `up:template:clone` event.
*/
export type TemplateCloneEvent = Event & {
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
  skipResponse: (loadedEventProps: u.PlainObject) => boolean
  renderableResponse: (response: UpResponse) => boolean
}

/**
Options for an `up.FragmentFinder`. Other options (like `{ layer }`) are passed on to
`up.fragment.closest()` and `up.fragment.get()`.
@internal
*/
export interface FragmentFinderOptions {
  selector: string
  origin?: Element
  document?: Document | Element
  match?: 'region' | 'first'
  preferOldElements?: Element[]
  [key: string]: any
}

/**
Called when an element starts matching. May return a function that is called when it stops matching.
@internal
*/
export type SelectorTrackerAddCallback = (element: Element) => ((element: Element) => void) | void
