import { extractOptions, last, omit, parseArgs, pick, some } from './util.js'
import { getRoot, jsonAttr, stringAttr } from './element.js'
import { fail } from './error.js'
import { mockable } from './mockable.js'
import { EventEmitter } from './event/event_emitter.js'
import { EventListenerGroup } from './event/event_listener_group.js'
import { UpEventListener } from './event/event_listener.js'
import { layerStack } from './layer.js'
import { printUserEvent } from './log.js'
import { registerDestructor } from './script.js'
import type { List, PlainObject } from './util.js'
import type { AssetsChangedEvent } from './script.js'
import type { ClickEvent, DeferredLoadEvent, LinkFollowEvent, LinkPreloadEvent } from './link.js'
import type { ElementDefinedEvent } from './element.js'
import type { EmitLogOption } from './event/event_emitter.js'
import type { EventListenerAttributes, ListenerCallback } from './event/event_listener.js'
import type { FormSubmitEvent, FormSwitchEvent, FormValidateEvent } from './form.js'
import type {
  FragmentAbortedEvent, FragmentDestroyedEvent, FragmentInsertedEvent, FragmentKeepEvent, FragmentKeptEvent,
  FragmentLoadedEvent, FragmentOfflineEvent, TemplateCloneEvent,
} from './fragment.js'
import type { FragmentHungryEvent, FragmentPollEvent } from './radio.js'
import type { FrameworkBootedEvent } from './framework.js'
import type { LocationChangedEvent, LocationRestoreEvent } from './history.js'
import type { Layer } from './layer/base.js'
import type { LayerCloseEvent, LayerLocationChangedEvent, LayerOpenEvent, LayerOpenedEvent } from './layer.js'
import type { LayerReference } from './fragment/render/render_options.js'
import type { MotionFinishEvent } from './motion.js'
import type { RequestEvent, RequestLoadedEvent } from './network.js'

/**
A function that removes the event listeners registered by `up.on()`.
*/
export type UnbindFn = () => void

/**
An event built by `up.event.fork()`, with the event it was forked from.
*/
export type ForkedEvent = Event & { originalEvent: Event }

/**
The device that the user last interacted with. See `up.event.inputDevice`.
*/
export type InputDevice = 'unknown' | 'key' | 'pointer'

/**
Maps the type of each Unpoly event to its event object, like `HTMLElementEventMap` does for DOM events.
`up.on()` and `up.emit()` look up the event type here.

An event without documented properties maps to `Event`.
*/
export interface UpEventMap {
  'up:assets:changed': AssetsChangedEvent
  'up:click': ClickEvent
  'up:deferred:load': DeferredLoadEvent
  'up:element:defined': ElementDefinedEvent
  'up:form:submit': FormSubmitEvent
  'up:form:switch': FormSwitchEvent
  'up:form:validate': FormValidateEvent
  'up:fragment:aborted': FragmentAbortedEvent
  'up:fragment:destroyed': FragmentDestroyedEvent
  'up:fragment:hungry': FragmentHungryEvent
  'up:fragment:inserted': FragmentInsertedEvent
  'up:fragment:keep': FragmentKeepEvent
  'up:fragment:kept': FragmentKeptEvent
  'up:fragment:loaded': FragmentLoadedEvent
  'up:fragment:offline': FragmentOfflineEvent
  'up:fragment:poll': FragmentPollEvent
  'up:framework:booted': FrameworkBootedEvent
  'up:framework:reset': Event
  'up:layer:accept': LayerCloseEvent
  'up:layer:accepted': LayerCloseEvent
  'up:layer:dismiss': LayerCloseEvent
  'up:layer:dismissed': LayerCloseEvent
  'up:layer:location:changed': LayerLocationChangedEvent
  'up:layer:open': LayerOpenEvent
  'up:layer:opened': LayerOpenedEvent
  'up:link:follow': LinkFollowEvent
  'up:link:preload': LinkPreloadEvent
  'up:location:changed': LocationChangedEvent
  'up:location:restore': LocationRestoreEvent
  'up:motion:finish': MotionFinishEvent
  'up:network:late': Event
  'up:network:recover': Event
  'up:request:aborted': RequestEvent
  'up:request:load': RequestEvent
  'up:request:loaded': RequestLoadedEvent
  'up:request:offline': RequestEvent
  'up:template:clone': TemplateCloneEvent
}

/**
An event whose type `UpEventMap` doesn't know, like a custom event emitted with `up.emit()`.
It may have any property.
*/
export type AnyEvent = Event & { [prop: string]: any }

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
export type ListenerTargets = EventTarget | List<EventTarget>

/**
A selector for `up.on()` to delegate events, or a function that returns it.
*/
export type ListenerSelector = string | (() => string)

/**
Options for `up.on()`. The `{ guard }` option is only used internally.
*/
export type ListenerOptions = Pick<EventListenerAttributes, 'passive' | 'once' | 'capture' | 'guard'>

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
export type EmitTarget = EventTarget | List<EventTarget> | Layer

/**
Properties for an event emitted with `up.emit()`, and options for its emission.
*/
export interface EmitProps {
  layer?: LayerReference | number
  target?: Element | List<Element> | string
  log?: EmitLogOption
  [prop: string]: any
}

/**
An event to emit, described by its `{ type }` and properties, like the ones a server sends in `X-Up-Events`.
*/
export type EventPlan = EmitProps & { type: string }

/*-
Features to emit and observe DOM events.

`up.on()` listens on `document` or a given element, and can delegate to a selector so it also catches events from elements inserted later. It returns a function that unbinds the listener, and unbinds automatically when the element is destroyed. `up.emit()` emits a custom event with the given properties and returns it, so you can check whether a listener prevented it. An `[up-emit]` attribute emits a custom event when the element is clicked.

@namespace up.event
*/

function reset(): void {
  // Resets the list of registered event listeners to the
  // moment when the framework was booted.
  for (let globalElement of [window, document, getRoot(), document.body]) {
    for (let listener of UpEventListener.allNonDefault(globalElement)) {
      listener.unbind()
    }
  }
}

/*-
Listens to a [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events)
on `document` or a given element.

`up.on()` has some quality of life improvements over
[`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener):

- You may pass a selector for [event delegation](https://davidwalsh.name/event-delegate).
- The [event target](https://developer.mozilla.org/en-US/docs/Web/API/Event/target) is automatically passed as a second argument.
- Your event listener will not be called when Unpoly has not [booted](/api/up.boot) in an unsupported browser
- You may register a listener to multiple events by passing a space-separated list of event names (e.g. `"click mousedown"`)
- You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/api/List) of elements.
- Any [data attached to the observed element](/learn/data) will be passed as a third argument to your handler function.

You can prevent the event from being processed further with [up.event.halt(event)](/api/up.event.halt).

### Basic example

The code below will call the listener when a `<a>` is clicked
anywhere in the `document`:

```js
up.on('click', 'a', function(event, element) {
  console.log("Click on a link %o", element)
})
```

You may also bind the listener to a given element instead of `document`:

```js
let form = document.querySelector('form')
up.on(form, 'click', function(event, form) {
  console.log("Click within %o", form)
})
```

### Event delegation

You may pass both an element and a selector
for [event delegation](https://davidwalsh.name/event-delegate).

The example below registers a single event listener to the given `form`,
but only calls the listener when the clicked element is a `select` element:

```
let form = document.querySelector('form')
up.on(form, 'click', 'select', function(event, select) {
  console.log("Click on select %o within %o", select, form)
})
```

### Attaching data

Any [data attached to the observed element](/learn/data) will be passed to your event handler.

For instance, this element has attached data in its `[up-data]` attribute:

```html
<span class="user" up-data="{ age: 18, name: 'Bob' }">Bob</span>
```

The parsed data will be passed to your event handler as a third argument:

```js
up.on('click', '.user', function(event, element, data) {
  console.log("This is %o who is %o years old", data.name, data.age)
})
```

### Unbinding an event listener

`up.on()` returns a function that unbinds the event listeners when called:

```js
// Define the listener
let listener =  function(event) { ... }

// Binding the listener returns an unbind function
let unbind = up.on('click', listener)

// Unbind the listener
unbind()
```

There is also a function [`up.off()`](/api/up.off) which you can use for the same purpose:

```js
// Define the listener
let listener =  function(event) { ... }

// Bind the listener
up.on('click', listener)

// Unbind the listener
up.off('click', listener)
```

### Binding to multiple elements

You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/api/List) of elements:

```js
let allForms = document.querySelectorAll('form')
up.on(allForms, 'submit', function(event, form) {
  console.log('Submitting form %o', form)
})
```

### Binding to multiple event types

You may register a listener to multiple event types by separating types with a space or comma:

```js
let element = document.querySelector(...)
up.on(element, 'mouseenter mouseleave', function(event) {
  console.log('Mouse entered or left')
})
```

@function up.on

@section Observed events
  @param {Element|jQuery} [element=document]
    The element on which to register the event listener.

    If no element is given, the listener is registered on the `document`.

@include up.on/after-element

@stable
@signature
*/
export function on<T extends EventTypes>(types: T, ...args: ListenerArgs<ObservedEvent<T>>): UnbindFn
export function on<T extends EventTypes>(targets: ListenerTargets, types: T, ...args: ListenerArgs<ObservedEvent<T>>): UnbindFn
export function on(...args: any[]): UnbindFn {
  return buildListenerGroup(args).bind()
}

/*-
Runs a callback when the given event is observed on the given element *or its ancestors*.

## Example

```js
up.event.onClosest(element, 'click', function() {
  // chip: Someone clicked on element or its ancestors
})
```

@function up.event.onClosest
@param {Element} element
  The element to observe with its ancestors.
@param {string} eventType
  The event type to observe.
@param {string|up.Layer} [options.layer]
  Only observe ancestors in the given [layer](/api/up.layer).

  The layer is looked up with the observed element as `{ origin }`.
  Pass `'origin'` to observe ancestors in the element's own layer.

  By default the callback runs for any ancestor in the DOM, including the element of a parent layer.
@param {Function(event)} callback
  The callback to run.

  It will be called with the observed event.
@return {Function}
  A function that unsubscribes the callback.

  When the element is destroyed, the callback will be unsubscribed automatically.
@experimental
*/
export function onClosest<T extends EventTypes>(element: Element, types: T, callback: ListenerCallback<ObservedEvent<T>>): UnbindFn
export function onClosest<T extends EventTypes>(element: Element, types: T, options: { layer?: LayerReference }, callback: ListenerCallback<ObservedEvent<T>>): UnbindFn
export function onClosest(...args: any[]): UnbindFn {
  let [fragment, eventType, { layer }, callback] = parseArgs(args, 'val', 'val', 'options', 'callback')
  layer &&= layerStack.get(layer, { origin: fragment })
  let guard = (event: Event) => (event.target as Element).contains(fragment) && (!layer || layer.contains(event.target as Element))
  let unsubscribe = on(eventType, { guard }, callback)

  // Since we're binding to an element that is an ancestor of the fragment,
  // we should unregister the event listener when the fragment is removed.
  registerDestructor(fragment, unsubscribe)
  return unsubscribe
}

/*-
Unbinds an event listener previously bound with `up.on()`.

### Example

Let's say you are listening to clicks on `.button` elements:

```js
let listener = function() { ... }
up.on('click', '.button', listener)
```

You can stop listening to these events like this:

```js
up.off('click', '.button', listener)
```

@function up.off

@section Observed events
  @param {Element|jQuery} [element=document]
    The element from which to unbind the listener.
@include up.off/after-element
@stable
*/
export function off<T extends EventTypes>(types: T, ...args: ListenerArgs<ObservedEvent<T>>): void
export function off<T extends EventTypes>(targets: ListenerTargets, types: T, ...args: ListenerArgs<ObservedEvent<T>>): void
export function off(...args: any[]): void {
  return buildListenerGroup(args).unbind()
}

function buildListenerGroup(args: any[], options?: PlainObject): EventListenerGroup {
  return EventListenerGroup.fromBindArgs(args, options)
}

function buildEmitter(args: any[]): EventEmitter {
  return EventEmitter.fromEmitArgs(args)
}

/*-
Emits a custom event with the given name and properties.

The event will be dispatched on the `document` or on the given element.

You can listen to events of that type using
[`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
or [`up.on()`](/api/up.on).

### Example

```js
up.on('my:event', function(event) {
  console.log(event.foo)
})

up.emit('my:event', { foo: 'bar' })
// Prints "bar" to the console
```

@function up.emit

@section Event
  @param {Element|jQuery} [target=document]
    The element on which the event is triggered.

    If omitted, the event will be emitted on the `document`.

  @param {string} eventType
    The event type, e.g. `my:event`.

  @param {Object} [props={}]
    A list of properties to become part of the event object that will be passed to listeners.

@section Options
  @param {up.Layer|string|number} [props.layer]
    The [layer](/api/up.layer) on which to emit this event.

    If this property is set, the event will be emitted on the [layer's outmost element](/api/up.Layer.prototype.element).
    Also [up.layer.current](/api/up.layer.current) will be set to the given layer while event listeners
    are running.

  @param {Element|jQuery} [props.target=document]
    The element on which the event is triggered.

    Alternatively the target element may be passed as the first argument.

  @param {string|Array} [props.log]
    A message to print to the [log](/api/up.log) when the event is emitted.

    Pass `false` to not log this event emission.

    @experimental

@return {Event}
  The emitted event object.
@stable
@signature
*/
export function emit<T extends string>(type: T, props?: EmitProps): EmittedEvent<T>
export function emit<T extends string>(target: EmitTarget, type: T, props?: EmitProps): EmittedEvent<T>
export function emit<T extends string>(plan: EmitProps & { type: T }): EmittedEvent<T>
export function emit<T extends string>(target: EmitTarget, plan: EmitProps & { type: T }): EmittedEvent<T>
export function emit<E extends Event>(event: E, options?: EmitProps): E
export function emit<E extends Event>(target: EmitTarget, event: E, options?: EmitProps): E
export function emit(...args: any[]): Event {
  return buildEmitter(args).emit()
}

/*-
Builds an event with the given type and properties.

The returned event is not [emitted](/api/up.emit).

## Example

```js
let event = up.event.build('my:event', { foo: 'bar' })
console.log(event.type)              // logs "my:event"
console.log(event.foo)               // logs "bar"
console.log(event.defaultPrevented)  // logs "false"
up.emit(event)                       // emits the event
```

@function up.event.build
@param {string} [type]
  The event type.

  May also be passed as a property `{ type }`.
@param {Object} [props={}]
  An object with event properties.
@param {string} [props.type]
  The event type.

  May also be passed as a first string argument.
@return {Event}
  The unemitted event object.
@stable
*/
export function build<T extends string>(type: T, props?: PlainObject): EmittedEvent<T>
export function build<T extends string>(props: PlainObject & { type?: T }): EmittedEvent<T>
export function build(...args: any[]): Event {
  const props = extractOptions(args)
  const type = args[0] || props.type || fail('Missing event type')

  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, omit(props, ['type', 'target']))

  return event
}

/*-
[Emits](/api/up.emit) the given event and throws an `up.Aborted` error if it was prevented.

@function up.event.assertEmitted
@param {string} eventType
@param {Object} eventProps
@param {string|Array} [eventProps.message]
@return {Event}
@internal
*/
export function assertEmitted(...args: any[]): void {
  return buildEmitter(args).assertEmitted()
}

/*-
Registers an event listener to be called when the user
presses the `Escape` key.

### Example

```js
up.event.onEscape(function(event) {
  console.log('Escape pressed!')
})
```
@function up.event.onEscape
@param {Function(Event)} listener
  The listener function that will be called when `Escape` is pressed.
@experimental
*/
export function onEscape(listener: (event: KeyboardEvent) => any): UnbindFn {
  return on('keydown', function(event) {
    if (event.key === 'Escape') {
      return listener(event)
    }
  })
}

/*-
Prevents the event from being processed further.

In detail:

- It prevents the event from bubbling up the DOM tree.
- It prevents other event handlers bound on the same element.
- It prevents the event's default action.

### Example

```js
up.on('click', 'a.disabled', function(event) {
  up.event.halt(event)
})
```

@function up.event.halt
@param {Event} event
  The event to stop processing for.
@stable
*/
export function haltEvent(event: Event, options: { log?: boolean } = {}): void {
  if (options.log) printUserEvent(event)
  event.stopImmediatePropagation()
  event.preventDefault()
}

/**
A property of a mouse or keyboard event that says whether a modifier key was held.
@internal
*/
export type ModifierKey = 'metaKey' | 'shiftKey' | 'ctrlKey' | 'altKey'

export const keyModifiers: ModifierKey[] = ['metaKey', 'shiftKey', 'ctrlKey', 'altKey']

/*-
Returns whether the given mouse event was made with a modifier key or a mouse button other than the primary button.

An event is modified when the user held `Shift`, `Ctrl`, `Alt` or `Meta` (`Cmd` on macOS),
or used a button other than the primary mouse button (`event.button > 0`), like the middle button.
Browsers often give such clicks a special meaning, like opening a link in a new tab.

## Example

A click handler can return early for a modified click, so the browser's default behavior is not replaced:

```js
up.on('click', '.product-card', function(event, card) {
  if (up.event.isModified(event)) return // mark: up.event.isModified(event)

  event.preventDefault()
  up.navigate({ url: card.dataset.url })
})
```

`up:click` is [only emitted for unmodified clicks](/api/up:click#only-unmodified-clicks-are-considered),
so listeners of `up:click` don't need this check.

@function up.event.isModified
@param {MouseEvent} event
  The event to test, like a `click` or `mousedown` event.
@return {boolean}
  Whether the event was modified.
@experimental
*/
export function isModified(event: Pick<MouseEvent, 'button' | ModifierKey>): boolean {
  return (event.button > 0) || some(keyModifiers, (modifier) => event[modifier])
}

/*-
Returns whether the given click was made by JavaScript, e.g. with `element.click()` or `dispatchEvent()`.

Clicks from a real mouse, touch or keyboard are trusted by the browser.
A click made by code has no meaningful coordinates and no preceding `mousedown`,
so `up.link.convertClicks()` skips its checks against mouse effects for such clicks.

@function up.event.isSyntheticClick
@param {Event} event
@return {boolean}
@internal
*/
export const isSyntheticClick = mockable(function isSyntheticClick(event: Event): boolean {
  return !event.isTrusted
})

export function fork(originalEvent: Event, newType: string, copyKeys: string[] = []): ForkedEvent {
  // The keys may belong to a subclass, like MouseEvent#clientX.
  const newEvent = build(newType, pick(originalEvent as PlainObject, copyKeys)) as ForkedEvent
  newEvent.originalEvent = originalEvent; // allow users to access other props through event.originalEvent.prop

  (['stopPropagation', 'stopImmediatePropagation', 'preventDefault'] as const).forEach(function(key) {
    const originalMethod = newEvent[key]

    return newEvent[key] = function() {
      originalEvent[key]()
      return originalMethod.call(newEvent)
    }
  })

  // If the source event was already prevented, the forked event should also be.
  if (originalEvent.defaultPrevented) {
    newEvent.preventDefault()
  }

  return newEvent
}

/*-
Emits a custom event when this element is clicked.

The event is emitted on this element and bubbles up to the `document`.
To listen to the event, use [`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) or `up.on()`
on the element, or on its ancestors.

While the `[up-emit]` attribute is often used with an `<a>` or `<button>` element,
you can also apply it to non-interactive elements, like a `<span>`.

@learn-ref faux-interactive-elements

### Example

This button will emit a `user:select` event when pressed:

```html
<button type="button" up-emit='user:select'>Alice</button>
```

The event can be handled by a listener:

```js
document.addEventListener('user:select', function(event) {
  up.reload('#user-details')
})
```

### Event properties

By default `[up-emit]` will emit an event with only basic properties like [`{ target }`](https://developer.mozilla.org/en-US/docs/Web/API/Event/target).

To set custom properties on the event object, encode them as [relaxed JSON](/api/relaxed-json) in an `[up-emit-props]` attribute:

```html
<button type="button"
  up-emit="user:select"
  up-emit-props="{ id: 5, firstName: 'Alice' }">
  Alice
</button>

<script>
  up.on('user:select', function(event) {
    console.log(event.id)        // logs 5
    console.log(event.firstName) // logs "Alice"
  })
</script>
```

### Fallback URLs {#fallback}

Use `[up-emit]` on a link to define a fallback URL that is rendered in case no listener handles the event:

```html
<a href="/menu" up-emit='menu:open'>Menu</a>
```

When a listener has handled the `menu:open` event, it should call `event.preventDefault()`.
This also prevents the original `click` event, causing the link to no longer be followed:

```js
document.addEventListener('menu:open', function(event) {
  event.preventDefault() // prevent the link from being followed
})
```

If no listener prevents the `menu:open` event, the browser will [navigate](/api/up-follow)
to the `/menu` path.

> [tip]
> When an [event closes an overlay](/learn/subinteractions#event-condition) via `[up-accept-event]` or `[up-dismiss-event]`, its default is prevented.
> You can use fallback URLs to make a link that emits a closing event in an overlay, but navigates to a different page on the [root layer](/api/up.layer.root).


@selector [up-emit]
@param up-emit
  The [type](https://developer.mozilla.org/en-US/docs/Web/API/Event/type) of the event to be emitted, e.g. `my:event`.
@param [up-emit-props='{}']
  The event properties, serialized as [relaxed JSON](/api/relaxed-json).
@stable
*/
function executeEmitAttr(event: ClickEvent, element: Element): void {
  if (isModified(event)) { return }
  // The listener only matches [up-emit].
  const eventType = stringAttr(element, 'up-emit')!
  const eventProps = jsonAttr(element, 'up-emit-props')
  const forkedEvent = fork(event, eventType)
  Object.assign(forkedEvent, eventProps)
  emit(element, forkedEvent)
}


let inputDevices: InputDevice[] = ['unknown']

/*-
The class of input device used to cause the current event.

It can assume one of the following values:

| Value        | Meaning                                                                 |
|--------------|-------------------------------------------------------------------------|
| `'key'`      | The event was caused by a keyboard interaction.                         |
| `'pointer'`  | The event was caused by an interaction via mouse, touch or stylus.      |
| `'unknown'`  | The input device is unknown or this event was not caused by user input. |

## Example

In event listeners, `up.event.inputDevice` returns the type of input device that caused the event:

```js
document.addEventListener('mousedown', function() {
  console.log(up.event.inputDevice) // will print "pointer"
})

document.addEventListener('keydown', function() {
  console.log(up.event.inputDevice) // will print "key"
})

document.addEventListener('click', function() {
  // will print either "pointer" or "key", depending on
  // whether the link was activated with mouse or keyboard
  console.log(up.event.inputDevice)
})
```

## Limitations

Unpoly can only detect the input device when the user interacts with the document area.
Interactions with browser-drawn UI elements (like the back button or scroll bar) cannot be detected:

```js
window.addEventListener('scroll', function() {
  console.log(up.event.inputDevice) // will print "unknown"
})
```


@property up.event.inputDevice
@param {string} inputDevice
  A string describing the current input device class.
@experimental
*/
export function getInputDevice(): InputDevice {
  return last(inputDevices)
}

function observeInputDevice(newModality: InputDevice): void {
  inputDevices.push(newModality)
  setTimeout(() => inputDevices.pop())
}

export function install(): void {
  on('up:click', '[up-emit]', executeEmitAttr)

  on('keydown keyup', { capture: true }, () => observeInputDevice('key'))

  on('pointerdown pointerup', { capture: true }, () => observeInputDevice('pointer'))

  on('up:framework:reset', reset)
}

export const api = {
  event: {
    on,
    onClosest,
    off,
    build,
    emit,
    onEscape,
    halt: haltEvent,
    isModified,
    get inputDevice() { return getInputDevice() },
  },
  on,
  off,
  emit,
}
