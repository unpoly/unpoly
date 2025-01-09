/*-
Events
======

This module contains functions to [emit](/up.emit) and [observe](/up.on) DOM events.

While the browser also has built-in functions to work with events,
you will find Unpoly's functions to be very concise and feature-rich.

### Events emitted by Unpoly

Most Unpoly features emit events that are prefixed with `up:`.

Unpoly's own events are documented in their respective modules, for example:

| Event                 | Module             |
|-----------------------|--------------------|
| `up:link:follow`      | `up.link`          |
| `up:form:submit`      | `up.form`          |
| `up:layer:open`       | `up.layer`         |
| `up:network:late`     | `up.network`       |

@see up.on
@see up.emit

@module up.event
*/
up.event = (function() {

  const u = up.util
  const e = up.element

  function reset() {
    // Resets the list of registered event listeners to the
    // moment when the framework was booted.
    for (let globalElement of [window, document, e.root, document.body]) {
      for (let listener of up.EventListener.allNonDefault(globalElement)) {
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
  - Your event listener will not be called when Unpoly has not [booted](/up.boot) in an unsupported browser
  - You may register a listener to multiple events by passing a space-separated list of event name (e.g. `"click mousedown"`)
  - You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/List) of elements.
  - Any [data attached to the observed element](/data) will be passed as a third argument to your handler function.

  You can prevent the event from being processed further with [up.event.halt(event)](/up.event.halt).

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
  var form = document.querySelector('form')
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
  var form = document.querySelector('form')
  up.on(form, 'click', 'select', function(event, select) {
    console.log("Click on select %o within %o", select, form)
  })
  ```

  ### Attaching data

  Any [data attached to the observed element](/data) will be passed to your event handler.

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
  var listener =  function(event) { ... }

  // Binding the listener returns an unbind function
  var unbind = up.on('click', listener)

  // Unbind the listener
  unbind()
  ```

  There is also a function [`up.off()`](/up.off) which you can use for the same purpose:

  ```js
  // Define the listener
  var listener =  function(event) { ... }

  // Bind the listener
  up.on('click', listener)

  // Unbind the listener
  up.off('click', listener)
  ```

  ### Binding to multiple elements

  You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/List) of elements:

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
  up.on(element, 'mouseenter, mouseleave', function(event) {
    console.log('Mouse entered or left')
  })
  ```

  @function up.on

  @param {Element|jQuery} [element=document]
    The element on which to register the event listener.

    If no element is given, the listener is registered on the `document`.

  @param {string|Array<string>} types
    The event types to bind to.

    Multiple event types may be passed as either a space-separated string (`'foo bar'`), a comma-separated string (`'foo, bar'`)
    or as an array of types (`['foo', 'bar']`).

  @param {string|Function():string} [selector]
    The selector of an element on which the event must be triggered.

    Omit the selector to listen to all events of the given type, regardless
    of the event target.

    If the selector is not known in advance you may also pass a function
    that returns the selector. The function is evaluated every time
    an event with the given type is observed.

  @param {boolean} [options.passive=false]
    Whether to register a [passive event listener](https://developers.google.com/web/updates/2016/06/passive-event-listeners).

    A passive event listener may not call `event.preventDefault()`.
    This in particular may improve the frame rate when registering
    `touchstart` and `touchmove` events.

  @param {boolean} [options.once=true]
    Whether the listener should run at most once.

    If `true` the listener will automatically be unbound
    after the first invocation.

  @param {boolean} [options.capture=false]
    Whether the listener should run before the event is emitted on the element.

    See [event capturing](https://javascript.info/bubbling-and-capturing#capturing) for more information
    about DOM event processing phases.

  @param {Function(event, [element], [data])} listener
    The listener function that should be called.

    The function takes the observed element as a second argument.
    The element's [attached data](/data) is passed as a third argument.

  @return {Function()}
    A function that unbinds the event listeners when called.

  @stable
  */
  function on(...args) {
    return buildListenerGroup(args).bind()
  }

  /*-
  Unbinds an event listener previously bound with `up.on()`.

  ### Example

  Let's say you are listing to clicks on `.button` elements:

  ```js
  var listener = function() { ... }
  up.on('click', '.button', listener)
  ```

  You can stop listening to these events like this:

  ```js
  up.off('click', '.button', listener)
  ```

  @function up.off
  @param {Element|jQuery} [element=document]
  @param {string|Function(): string} events
  @param {string} [selector]
  @param {Function(event, [element], [data])} listener
    The listener function to unbind.

    Note that you must pass a reference to the same function reference
    that was passed to `up.on()` earlier.
  @stable
  */
  function off(...args) {
    return buildListenerGroup(args).unbind()
  }

  function buildListenerGroup(args, options) {
    return up.EventListenerGroup.fromBindArgs(args, options)
  }

  function buildEmitter(args) {
    return up.EventEmitter.fromEmitArgs(args)
  }

  /*-
  Emits a custom event with the given name and properties.

  The event will be dispatched on the `document` or on the given element.

  You can listen to events of that type using
  [`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
  or [`up.on()`](/up.on).

  ### Example

  ```js
  up.on('my:event', function(event) {
    console.log(event.foo)
  })

  up.emit('my:event', { foo: 'bar' })
  // Prints "bar" to the console
  ```

  @function up.emit
  @param {Element|jQuery} [target=document]
    The element on which the event is triggered.

    If omitted, the event will be emitted on the `document`.
  @param {string} eventType
    The event type, e.g. `my:event`.
  @param {Object} [props={}]
    A list of properties to become part of the event object that will be passed to listeners.
  @param {up.Layer|string|number} [props.layer]
    The [layer](/up.layer) on which to emit this event.

    If this property is set, the event will be emitted on the [layer's outmost element](/up.Layer.prototype.element).
    Also [up.layer.current](/up.layer.current) will be set to the given layer while event listeners
    are running.
  @param {string|Array} [props.log]
    A message to print to the [log](/up.log) when the event is emitted.

    Pass `false` to not log this event emission.

    @experimental
  @param {Element|jQuery} [props.target=document]
    The element on which the event is triggered.

    Alternatively the target element may be passed as the first argument.
  @return {Event}
    The emitted event object.
  @stable
  */
  function emit(...args) {
    return buildEmitter(args).emit()
  }

  /*-
  Builds an event with the given type and properties.

  The returned event is not [emitted](/up.emit).

  ### Example

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
  @experimental
  */
  function build(...args) {
    const props = u.extractOptions(args)
    const type = args[0] || props.type || up.fail('Missing event type')

    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.assign(event, u.omit(props, ['type', 'target']))

    return event
  }

  /*-
  [Emits](/up.emit) the given event and throws an `up.AbortError` if it was prevented.

  @function up.event.assertEmitted
  @param {string} eventType
  @param {Object} eventProps
  @param {string|Array} [eventProps.message]
  @return {Event}
  @internal
  */
  function assertEmitted(...args) {
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
  @function
  @experimental
  */
  function onEscape(listener) {
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
  up.on('click', 'link.disabled', function(event) {
    up.event.halt(event)
  })
  ```

  @function up.event.halt
  @param {Event} event
  @stable
  */
  function halt(event, options = {}) {
    if (options.log) up.log.putsEvent(event)
    event.stopImmediatePropagation()
    event.preventDefault()
  }

  const keyModifiers = ['metaKey', 'shiftKey', 'ctrlKey', 'altKey']

  /*-
  @function up.event.isUnmodified
  @internal
  */
  function isUnmodified(event) {
    return (u.isUndefined(event.button) || (event.button === 0)) &&
      !u.some(keyModifiers, modifier => event[modifier])
  }

  /*-
  @function up.event.isSyntheticClick
  @internal
  */
  function isSyntheticClick(event) {
    return u.isMissing(event.clientX)
  }

  function fork(originalEvent, newType, copyKeys = []) {
    const newEvent = build(newType, u.pick(originalEvent, copyKeys))
    newEvent.originalEvent = originalEvent; // allow users to access other props through event.originalEvent.prop

    ['stopPropagation', 'stopImmediatePropagation', 'preventDefault'].forEach(function(key) {
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

  The event is emitted on this element and bubbles up the `document`.
  To listen to the event, use [`addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) or `up.on()`
  on the element, or on its ancestors.

  While the `[up-emit]` attribute is often used with an `<a>` or `<button>` element,
  you can also apply to to non-interactive elements, like a `<span>`.
  See [clicking on non-interactive elements](/faux-interactive-elements) for details and
  accessibility considerations.

  ### Example

  This button will emit a `menu:open` event when pressed:

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

  To set custom properties on the event object, encode them as [relaxed JSON](/relaxed-json) in an `[up-emit-props]` attribute:

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

  If no listener prevents the `menu:open` event, the browser will [navigate](/up-follow)
  to the `/menu` path.

  > [tip]
  > When an [event closes an overlay](/closing-overlays#event-condition) via `[up-accept-event]` or `[up-dismiss-event]`, its default is prevented.
  > You can use fallback URLs to make a link that emits a closing event in an overlay, but navigates to a different page on the [root layer](/up.layer.root).


  @selector [up-emit]
  @param up-emit
    The [type](https://developer.mozilla.org/en-US/docs/Web/API/Event/type) of the event to be emitted, e.g. `my:event`.
  @param [up-emit-props='{}']
    The event properties, serialized as [relaxed JSON](/relaxed-json).
  @stable
  */
  function executeEmitAttr(event, element) {
    if (!isUnmodified(event)) { return }
    const eventType = e.attr(element, 'up-emit')
    const eventProps = e.jsonAttr(element, 'up-emit-props')
    const forkedEvent = fork(event, eventType)
    Object.assign(forkedEvent, eventProps)
    up.emit(element, forkedEvent)
  }

  on('up:click', '[up-emit]', executeEmitAttr)

  let inputDevices = ['unknown']

  /*-
  The class of input device used to cause the current event.

  It can assume one of the following values:

  | Value        | Meaning                                                                 |
  |--------------|-------------------------------------------------------------------------|
  | `'key'`      | The event was caused by a keyboard interaction.                         |
  | `'pointer'`  | The event was caused by an interaction via mouse, touch or stylus.      |
  | `'unknown'`  | The input device is unknown or this event was not caused by user input. |

  @property up.event.inputDevice
  @param inputDevice
    A string describing the current input device class.
  @experimental
  */
  function getInputDevice() {
    return u.last(inputDevices)
  }

  function observeInputDevice(newModality) {
    inputDevices.push(newModality)
    setTimeout(() => inputDevices.pop())
  }

  on('keydown keyup', { capture: true }, () => observeInputDevice('key'))
  on('pointerdown pointerup', { capture: true }, () => observeInputDevice('pointer'))

  on('up:framework:reset', reset)

  return {
    on,
    off,
    build,
    emit,
    assertEmitted,
    onEscape,
    halt,
    isUnmodified,
    isSyntheticClick,
    fork,
    keyModifiers,
    get inputDevice() { return getInputDevice() }
    // addCallback,
  }
})()

up.on = up.event.on
up.off = up.event.off
up.emit = up.event.emit
