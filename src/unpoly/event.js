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
| `up:request:late`     | `up.network`       |

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
  - The event target is automatically passed as a second argument.
  - Your event listener will not be called when Unpoly has not [booted](/up.boot) in an unsupported browser
  - You may register a listener to multiple events by passing a space-separated list of event name (e.g. `"click mousedown"`)
  - You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/up.util.isList) of elements.
  - Any [data attached to the observed element](/data) will be passed as a third argument to your handler function.

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
  <span class='user' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
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

  You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/up.util.isList) of elements:

  ```js
  let allForms = document.querySelectorAll('form')
  up.on(allForms, 'submit', function(event, form) {
    console.log('Submitting form %o', form)
  })
  ```

  ### Binding to multiple event types

  You may register a listener to multiple event types by passing a space-separated list of event types:

  ```js
  let element = document.querySelector(...)
  up.on(element, 'mouseenter mouseleave', function(event) {
    console.log('Mouse entered or left')
  })
  ```

  @function up.on

  @param {Element|jQuery} [element=document]
    The element on which to register the event listener.

    If no element is given, the listener is registered on the `document`.

  @param {string|Array<string>} types
    The event types to bind to.

    Multiple event types may be passed as either a space-separated string
    or as an array of types.

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
  Listens to an event on `document` or a given element.
  The event handler is called with the event target as a
  [jQuery collection](https://learn.jquery.com/using-jquery-core/jquery-object/).

  If you're not using jQuery, use `up.on()` instead, which calls
  event handlers with a native element.

  ### Example

  ```
  up.$on('click', 'a', function(event, $link) {
    console.log("Click on a link with destination %s", $element.attr('href'))
  })
  ```

  @function up.$on
  @param {Element|jQuery} [element=document]
    The element on which to register the event listener.

    If no element is given, the listener is registered on the `document`.
  @param {string} events
    A space-separated list of event names to bind to.
  @param {string} [selector]
    The selector of an element on which the event must be triggered.
    Omit the selector to listen to all events with that name, regardless
    of the event target.
  @param {boolean} [options.passive=false]
    Whether to register a [passive event listener](https://developers.google.com/web/updates/2016/06/passive-event-listeners).

    A passive event listener may not call `event.preventDefault()`.
    This in particular may improve the frame rate when registering
    `touchstart` and `touchmove` events.
  @param {Function(event, [element], [data])} listener
    The listener function that should be called.

    The function takes the observed element as the first argument.
    The element's [attached data](/data) is passed as a third argument.
  @return {Function()}
    A function that unbinds the event listeners when called.
  @stable
  */
  function $on(...args) {
    return buildListenerGroup(args, { jQuery: true }).bind()
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
  Emits a event with the given name and properties.

  The event will be triggered as an event on `document` or on the given element.

  Other code can subscribe to events with that name using
  [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
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
    const type = args[0] || props.type || up.fail('Expected event type to be passed as string argument or { type } property')

    const event = document.createEvent('Event')
    event.initEvent(type, true, true); // name, bubbles, cancelable
    u.assign(event, u.omit(props, ['type', 'target']))

    // IE11 does not set { defaultPrevented: true } after #preventDefault()
    // was called on a custom event.
    // See discussion here: https://stackoverflow.com/questions/23349191
    if (up.browser.isIE11()) {
      const originalPreventDefault = event.preventDefault

      event.preventDefault = function() {
        // Even though we're swapping out defaultPrevented() with our own implementation,
        // we still need to call the original method to trigger the forwarding of up:click.
        originalPreventDefault.call(event)
        return u.getter(event, 'defaultPrevented', () => true)
      }
    }

    return event
  }

  /*-
  [Emits](/up.emit) the given event and throws an `AbortError` if it was prevented.

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
      if (wasEscapePressed(event)) {
        return listener(event)
      }
    })
  }

  /*-
  Returns whether the given keyboard event involved the ESC key.

  @function up.util.wasEscapePressed
  @param {Event} event
  @internal
  */
  function wasEscapePressed(event) {
    const { key } = event
    // IE/Edge use 'Esc', other browsers use 'Escape'
    return (key === 'Escape') || (key === 'Esc')
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
  function halt(event) {
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

  function fork(originalEvent, newType, copyKeys = []) {
    const newEvent = up.event.build(newType, u.pick(originalEvent, copyKeys))
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
  Emits the given event when this link is clicked.

  When the emitted event's default' is prevented, the original `click` event's default is also prevented.

  You may use this attribute to emit events when clicking on areas that are no hyperlinks,
  by setting it on an `<a>` element without a `[href]` attribute.

  ### Example

  This hyperlink will emit an `user:select` event when clicked:

  ```html
  <a href='/users/5'
    up-emit='user:select'
    up-emit-props='{ "id": 5, "firstName": "Alice" }'>
    Alice
  </a>

  <script>
    up.on('a', 'user:select', function(event) {
      console.log(event.firstName) // logs "Alice"
      event.preventDefault()       // will prevent the link from being followed
    })
  </script>
  ```

  @selector a[up-emit]
  @param up-emit
    The type of the event to be emitted.
  @param [up-emit-props='{}']
    The event properties, serialized as JSON.
  @stable
  */
  function executeEmitAttr(event, element) {
    if (!isUnmodified(event)) { return; }
    const eventType = e.attr(element, 'up-emit')
    const eventProps = e.jsonAttr(element, 'up-emit-props')
    const forkedEvent = fork(event, eventType)
    u.assign(forkedEvent, eventProps)
    up.emit(element, forkedEvent)
  }

//  abortable = ->
//    signal = document.createElement('up-abort-signal')
//    abort = -> up.emit(signal, 'abort')
//    [abort, signal]

  on('up:click', 'a[up-emit]', executeEmitAttr)
  on('up:framework:reset', reset)

  return {
    on,
    $on,
    off,
    build,
    emit,
    assertEmitted,
    onEscape,
    halt,
    isUnmodified,
    fork,
    keyModifiers
  }
})()

up.on = up.event.on
up.$on = up.event.$on
up.off = up.event.off
up.$off = up.event.off; // it's the same as up.off()
up.emit = up.event.emit
