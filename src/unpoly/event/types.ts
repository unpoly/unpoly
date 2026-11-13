import * as u from '../util.js'
import { type LayerReference } from '../fragment.js'
import { type Layer } from '../layer.js'
import { type UpEventListener } from './event_listener.js'

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
export type UnbindFn = () => void

/**
An event built by `up.event.fork()`, with the event it was forked from.
*/
export interface ForkedEvent extends Event {
  originalEvent: Event
}

/**
The device that the user last interacted with. See `up.event.inputDevice`.
*/
export type InputDevice = 'unknown' | 'key' | 'pointer'

/**
Maps the type of each Unpoly event to its event object, like `HTMLElementEventMap` does for DOM events.
`up.on()` and `up.emit()` look up the event type here.

Each module adds its own events, next to their types, with a `declare module '../event.js'` block
that extends this interface. An event without documented properties maps to `UpEvent`.
*/
export interface UpEventMap {} // oxlint-disable-line typescript/no-empty-object-type

/**
An event whose type `UpEventMap` doesn't know, like a custom event emitted with `up.emit()`.
It may have any property.
*/
export interface AnyEvent extends Event {
  [prop: string]: any
}

/**
The event that `up.on()` passes to its listener for the given event type: an Unpoly event from `UpEventMap`,
a DOM event, or `AnyEvent` for other types. Several types in one string (`'foo bar'`) also get `AnyEvent`.
*/
export type ObservedEvent<T> =
  T extends keyof UpEventMap ? UpEventMap[T] :
  T extends keyof HTMLElementEventMap ? HTMLElementEventMap[T] :
  T extends keyof DocumentEventMap ? DocumentEventMap[T] :
  T extends keyof WindowEventMap ? WindowEventMap[T] :
  AnyEvent

/**
The event that `up.emit()` emits for the given event type. Unlike `ObservedEvent`, it knows no DOM events,
since `up.emit('click')` emits a plain `Event`.
*/
export type EmittedEvent<T> = T extends keyof UpEventMap ? UpEventMap[T] : AnyEvent

/**
One or more event types for `up.on()`, separated by spaces or commas, or as an array.
*/
export type EventTypes = string | readonly string[]

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
export interface ListenerOptions {
  passive?: boolean
  once?: boolean
  capture?: boolean
  /**
  Only call the listener for events that pass this check.
  @internal
  */
  guard?: (event: Event) => boolean
  /**
  Also call the listener before Unpoly has booted. Defaults to `true` for `up:framework:*` events.
  @internal
  */
  beforeBoot?: boolean
}

/**
The arguments for `up.on()` after its event types: an optional selector, optional options and the listener.
*/
export type ListenerArgs<E, O = ListenerOptions> =
  | [listener: ListenerCallback<E>]
  | [selector: ListenerSelector, listener: ListenerCallback<E>]
  | [options: O, listener: ListenerCallback<E>]
  | [selector: ListenerSelector, options: O, listener: ListenerCallback<E>]

/**
Where `up.emit()` emits an event: an element, the document, the window, a list with one element, or a layer.
*/
export type EmitTarget = EventTarget | u.List<EventTarget> | Layer

/**
Properties for an event emitted with `up.emit()`, and options for its emission.
*/
export interface EmitProps {
  layer?: LayerReference | number
  target?: Element | u.List<Element> | string
  log?: EmitLogOption
  [prop: string]: any
}

/**
An event to emit, described by its `{ type }` and properties, like the ones a server sends in `X-Up-Events`.
*/
export interface EventPlan<T extends string = string> extends EmitProps {
  type: T
}

/**
A property of a mouse or keyboard event that says whether a modifier key was held.
@internal
*/
export type ModifierKey = 'metaKey' | 'shiftKey' | 'ctrlKey' | 'altKey'

/**
An element, document or window that Unpoly listens on. It remembers its listeners,
so `up.off()` can find them.
@internal
*/
export interface ListenerTarget extends EventTarget {
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
  { listener(this: HTMLElement, event: E, element: HTMLElement, data?: any): any }['listener'] & { upUid?: number }

/**
What an `UpEventListener` and a `ListenerGroup` both need to know: everything but the
elements and event types to listen to.
@internal
*/
export interface SharedListenerAttributes extends ListenerOptions {
  selector?: ListenerSelector
  callback: ListenerCallback
  baseLayer?: Layer
}

/**
Everything an `UpEventListener` needs to know.
@internal
*/
export interface EventListenerAttributes extends SharedListenerAttributes {
  element: ListenerTarget
  eventType: string
}

/**
The listeners that `up.on()` binds and `up.off()` unbinds: the elements and event types to
listen to, and the attributes for each `UpEventListener`. `parseBindArgs()` builds this from the
many ways `up.on()` can be called.
@internal
*/
export interface ListenerGroup extends SharedListenerAttributes {
  elements: u.List<ListenerTarget>
  eventTypes: string[]
}

/**
What to log when an event is emitted: a message, an array of a message and its substitution values,
or `false` to log nothing. When missing, the event type is logged.
@internal
*/
export type EmitLogOption = string | any[] | false

/**
Everything `emitParsed()` needs to know. `parseEmitArgs()` builds this
from the many ways `up.emit()` can be called.
@internal
*/
export interface EventEmitterOptions {
  target: EventTarget
  event: Event
  baseLayer?: Layer
  callback?: (event: Event) => void
  log?: EmitLogOption
  ensureBubbles?: boolean
}
