import type * as u from '../util.js'
import type { Layer, LayerReference } from '../layer.js'
import type { UpEventListener } from './listeners.js'

/**
An event emitted by Unpoly.

Most Unpoly events are emitted on an element. Global events like `up:framework:booted` or
`up:network:late` are emitted on the `document`, as is the second dispatch of an event that must
bubble from a detached element.
*/
export interface UpEvent extends Event {
  target: Element | Document
}

/**
A function that removes the event listeners registered by `up.on()`.
*/
export type UnbindFunction = () => void

/**
An event built by `forkEvent()`, with the event it was forked from.
*/
export interface ForkedEvent extends Event {
  originalEvent: Event
}

/**
The device that the user last interacted with. See `up.event.inputDevice`.
*/
export type InputDevice = 'unknown' | 'key' | 'pointer'

// Each module declares its up:* events by extending the DOM's `GlobalEventHandlersEventMap` in a
// `declare global` block, next to their types. `addEventListener()` on an element, the document or
// the window then knows them, and so do `up.on()` and `up.emit()`. Apps declare their own events
// the same way.

/**
An event whose type the global event maps don't know, like a custom event emitted with `up.emit()`.
It may have any property.
*/
export interface AnyEvent extends Event {
  // oxlint-disable-next-line typescript/no-explicit-any -- custom event properties of any type
  [prop: string]: any
}

/**
The event that `up.on()` passes to its listener for the given event types: an event from the global
event maps (DOM events, and Unpoly's or an app's events), or `AnyEvent` for other types. Several types
(`'click keydown'` or an array) get a union.
*/
export type ObservedEvent<T> = SingleObservedEvent<SplitEventTypes<T>>

// Distributes over a union of event types. HTMLElementEventMap includes GlobalEventHandlersEventMap.
// The document and the window have a few events of their own, like 'DOMContentLoaded' or 'popstate'.
type SingleObservedEvent<T> =
  T extends keyof HTMLElementEventMap ? HTMLElementEventMap[T] :
  T extends keyof DocumentEventMap ? DocumentEventMap[T] :
  T extends keyof WindowEventMap ? WindowEventMap[T] :
  AnyEvent

// The single types in an EventTypes value, like `'click' | 'keydown'` for `'click keydown'`.
type SplitEventTypes<T> =
  T extends readonly (infer Type)[] ? SplitEventTypes<Type> :
  T extends `${infer First} ${infer Rest}` ? SplitEventTypes<First> | SplitEventTypes<Rest> :
  T extends `${infer First},${infer Rest}` ? SplitEventTypes<First> | SplitEventTypes<Rest> :
  T extends '' ? never :
  T

/**
The event that `up.emit()` emits for the given event type. Unlike `ObservedEvent`, it knows no DOM events,
since `up.emit('click')` emits a plain `Event`. It only looks up a type with a colon, like `up:link:follow`
or an app's `app:foo`, which no DOM event has.
*/
export type EmittedEvent<T> = T extends `${string}:${string}` & keyof GlobalEventHandlersEventMap
  ? GlobalEventHandlersEventMap[T]
  : AnyEvent

/**
One or more event types for `up.on()`, separated by spaces or commas, or as an array.
*/
export type EventTypes = EventType | readonly EventType[]

// Editors suggest the event types that up.on() knows. `string & {}` keeps every other string allowed.
type EventType = keyof HTMLElementEventMap | keyof DocumentEventMap | keyof WindowEventMap | (string & {})

/**
What `up.on()` listens on: an element, the document, the window, or a list of elements.
*/
export type ListenerTargets = EventTarget | u.List<EventTarget>

/**
A selector for `up.on()` to delegate events, or a function that returns it.
*/
export type ListenerSelector = string | (() => string)

/**
Options for `up.on()`.
*/
export interface ListenerOptions<E = Event> {
  passive?: boolean
  once?: boolean
  capture?: boolean
  /**
  Only call the listener for events that pass this check.
  @internal
  */
  guard?: (event: E) => boolean
  /**
  Also call the listener before Unpoly has booted. Defaults to `true` for `up:framework:*` events.
  @internal
  */
  beforeBoot?: boolean
}

/**
The arguments for `up.on()` after its event types: an optional selector, optional options and the listener.
*/
export type ListenerArgs<E> =
  | [listener: ListenerCallback<E>]
  | [selector: ListenerSelector, listener: ListenerCallback<E>]
  | [options: ListenerOptions<E>, listener: ListenerCallback<E>]
  | [selector: ListenerSelector, options: ListenerOptions<E>, listener: ListenerCallback<E>]

/**
Where `up.emit()` emits an event: an element, the document, the window, a list with one element, or a layer.
*/
export type EmitTarget = EventTarget | u.List<EventTarget> | Layer

/**
Properties for an event emitted with `up.emit()`, and options for its emission.
*/
export interface EmitProps {
  layer?: LayerReference
  target?: Element | u.List<Element> | string
  log?: EmitLogOption
  // oxlint-disable-next-line typescript/no-explicit-any -- custom event properties of any type
  [prop: string]: any
}

/**
An event to emit, described by its `{ type }` and properties, like the ones a server sends in `X-Up-Events`.
*/
export interface EventPlan<T extends string = string> extends EmitProps {
  type: T
}

/**
An element, document or window that Unpoly listens on. It remembers its listeners,
so `up.off()` can find them.
@internal
*/
export interface ObservedTarget extends EventTarget {
  upEventListeners?: Record<string, UpEventListener>
}

/**
A function registered with `up.on()`. It is called with the event, the element matching
the selector (or the element it listens on) and, if it takes three arguments, the element's data.
`this` is the element, too. TypeScript only infers that when a selector is given. Without one, a
function in that position could also be a selector function, which has no `this`.

The signature is taken from a method, since TypeScript checks method parameters bivariantly, even
under `strictFunctionTypes`. That lets a listener annotate a narrower type than we can infer,
like `(event, link: HTMLAnchorElement)` for a selector that only matches links.
*/
export type ListenerCallback<E = Event> =
  // oxlint-disable-next-line typescript/no-explicit-any -- the element's data, a user value of any type
  { listener(this: HTMLElement, event: E, element: HTMLElement, data?: any): unknown }['listener'] & { upUid?: number }

/**
What an `UpEventListener` and a `ListenerGroup` both need to know: everything but the
elements and event types to listen to.
@internal
*/
export interface ListenerSpec extends ListenerOptions {
  selector?: ListenerSelector
  callback: ListenerCallback
  baseLayer?: Layer
}

/**
Everything an `UpEventListener` needs to know.
@internal
*/
export interface BoundListenerSpec extends ListenerSpec {
  element: ObservedTarget
  eventType: string
}

/**
The listeners that `up.on()` binds and `up.off()` unbinds: the elements and event types to
listen to, and the attributes for each `UpEventListener`. `parseBindArgs()` builds this from the
many ways `up.on()` can be called.
@internal
*/
export interface ListenerGroup extends ListenerSpec {
  elements: u.List<ObservedTarget>
  eventTypes: string[]
}

/**
What to log when an event is emitted: a message, an array of a message and its substitution values,
or `false` to log nothing. When missing, the event type is logged.
@internal
*/
export type EmitLogOption = string | unknown[] | false

/**
Everything `emitEvent()` needs to know. `parseEmitArgs()` builds this
from the many ways `up.emit()` can be called.
@internal
*/
export interface Emission {
  target: EventTarget
  event: Event
  baseLayer?: Layer
  callback?: (event: Event) => void
  log?: EmitLogOption
  ensureBubbles?: boolean
}
