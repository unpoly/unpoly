###**
Events
======

This module contains functions to [build](/up.event.build), [dispatch](/up.emit) and [listen to](/up.on) DOM events.

While the browser also ships with functions like [`Element#dispatchEvent()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent)
and [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) to
work with DOM events, you will find the functions in this module to be more convenient and feature-rich.

## Events emitted by Unpoly

Most Unpoly interactions emit DOM events that are prefixed with `up:`.

```javascript
document.addEventListener('up:modal:opened', (event) => {
  console.log('A new modal has just opened!')
})
```

Events often have both present and past forms. For example, `up:layer:open` is emitted before an overlay starts to open.
`up:layer:opened` is emitted when the overlay has appeared in the DOM tree.

\#\#\# Preventing events

You can prevent most present form events by calling `preventDefault()`:

```javascript
document.addEventListener('up:modal:open', (event) => {
  if (event.url == '/evil') {
    // Prevent the modal from opening
    event.preventDefault()
  }
})
```

@module up.event
###
up.event = do ->
  
  u = up.util
  e = up.element

  reset = ->
    # Resets the list of registered event listeners to the
    # moment when the framework was booted.
    for element in [window, document, e.root, document.body]
      up.EventListener.unbindNonDefault(element)

  ###**
  Listens to a [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events)
  on `document` or a given element.

  `up.on()` has some quality of life improvements over
  [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener):

  - You may pass a selector for [event delegation](https://davidwalsh.name/event-delegate).
  - The event target is automatically passed as a second argument.
  - You may register a listener to multiple events by passing a space-separated list of event name (e.g. `"click mousedown"`)
  - You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/up.util.isList) of elements.
  - You use an [`[up-data]`](/up-data) attribute to [attach structured data](/up.on#attaching-structured-data)
    to observed elements. If an `[up-data]` attribute is set, its value will automatically be
    parsed as JSON and passed as a third argument.
  - Event listeners on [unsupported browsers](/up.browser.isSupported) are silently discarded,
    leaving you with an application without JavaScript. This is typically preferable to
    a soup of randomly broken JavaScript in ancient browsers.

  \#\#\# Basic example

  The code below will call the listener when a `<a>` is clicked
  anywhere in the `document`:

      up.on('click', 'a', function(event, element) {
        console.log("Click on a link %o", element)
      })

  You may also bind the listener to a given element instead of `document`:

      var form = document.querySelector('form')
      up.on(form, 'click', function(event, form) {
        console.log("Click within %o", form)
      })

  \#\#\# Event delegation

  You may pass both an element and a selector
  for [event delegation](https://davidwalsh.name/event-delegate).

  The example below registers a single event listener to the given `form`,
  but only calls the listener when the clicked element is a `select` element:

      var form = document.querySelector('form')
      up.on(form, 'click', 'select', function(event, select) {
        console.log("Click on select %o within %o", select, form)
      })

  \#\#\# Attaching structured data

  In case you want to attach structured data to the event you're observing,
  you can serialize the data to JSON and put it into an `[up-data]` attribute:

      <span class='person' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
      <span class='person' up-data='{ "age": 22, "name": "Jim" }'>Jim</span>

  The JSON will be parsed and handed to your event handler as a third argument:

      up.on('click', '.person', function(event, element, data) {
        console.log("This is %o who is %o years old", data.name, data.age)
      })

  \#\#\# Unbinding an event listener

  `up.on()` returns a function that unbinds the event listeners when called:

      // Define the listener
      var listener =  function(event) { ... }

      // Binding the listener returns an unbind function
      var unbind = up.on('click', listener)

      // Unbind the listener
      unbind()

  There is also a function [`up.off()`](/up.off) which you can use for the same purpose:

      // Define the listener
      var listener =  function(event) { ... }

      // Bind the listener
      up.on('click', listener)

      // Unbind the listener
      up.off('click', listener)

  \#\#\# Binding to multiple elements

  You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/up.util.isList) of elements:

  ```javascript
  let allForms = document.querySelectorAll('form')
  up.on(allForms, 'submit', function(event, form) {
    console.log('Submitting form %o', form)
  })
  ```

  \#\#\# Binding to multiple event types

  You may register a listener to multiple event types by passing a space-separated list of event types:

  ```javascript
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
  @param {string} [selector]
    The selector of an element on which the event must be triggered.

    Omit the selector to listen to all events of the given type, regardless
    of the event target.
  @param {boolean} [options.passive=false]
    Whether to register a [passive event listener](https://developers.google.com/web/updates/2016/06/passive-event-listeners).

    A passive event listener may not call `event.preventDefault()`.
    This in particular may improve the frame rate when registering
    `touchstart` and `touchmove` events.
  @param {boolean} [options.once=true]
    Whether the listener should run at most once.

    If `true` the listener will automatically be removed from the element
    after the first invocation.
  @param {Function(event, [element], [data])} listener
    The listener function that should be called.

    The function takes the affected element as a second argument.
    If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
    and passed as a third argument.
  @return {Function()}
    A function that unbinds the event listeners when called.
  @stable
  ###
  bind = (args...) ->
    bindNow(args)

  ###**
  Listens to an event on `document` or a given element.
  The event handler is called with the event target as a
  [jQuery collection](https://learn.jquery.com/using-jquery-core/jquery-object/).

  If you're not using jQuery, use `up.on()` instead, which calls
  event handlers with a native element.

  \#\#\# Example

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

    The function takes the affected element as the first argument).
    If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
    and passed as a second argument.
  @return {Function()}
    A function that unbinds the event listeners when called.
  @stable
  ###
  $bind = (args...) ->
    bindNow(args, jQuery: true)

  bindNow = (args, options) ->
    up.EventListenerGroup.fromBindArgs(args, options).bind()

  ###**
  Unbinds an event listener previously bound with `up.on()`.

  \#\#\# Example

  Let's say you are listing to clicks on `.button` elements:

      var listener = function() { ... }
      up.on('click', '.button', listener)

  You can stop listening to these events like this:

      up.off('click', '.button', listener)

  @function up.off
  @param {Element|jQuery} [element=document]
  @param {string} events
  @param {string} [selector]
  @param {Function(event, [element], [data])} listener
    The listener function to unbind.

    Note that you must pass a reference to the exact same listener function
    that was passed to `up.on()` earlier.
  @stable
  ###
  unbind = (args...) ->
    up.EventListenerGroup.fromBindArgs(args).unbind()

  buildEmitter = (args) ->
    return up.EventEmitter.fromEmitArgs(args)

  ###**
  Emits a event with the given name and properties.

  The event will be triggered as an event on `document` or on the given element.

  Other code can subscribe to events with that name using
  [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
  or [`up.on()`](/up.on).

  \#\#\# Example

      up.on('my:event', function(event) {
        console.log(event.foo)
      })

      up.emit('my:event', { foo: 'bar' })
      // Prints "bar" to the console

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

    If this property is set, the event will be emitted on the [layer's outmost element](/up.Layer#element).
    Also [up.layer.current](/up.layer.current) will be set to the given layer while event listeners
    are running.
  @param {string|Array} [props.log]
    A message to print to the [log](/up.log) when the event is emitted.

    Pass `false` to not log this event emission.
  @param {Element|jQuery} [props.target=document]
    The element on which the event is triggered.

    Alternatively the target element may be passed as the first argument.
  @stable
  ###
  emit = (args...) ->
    buildEmitter(args).emit()

  ###**
  Builds an event with the given type and properties.

  The returned event is not [emitted](/up.emit).

  \#\#\# Example

      let event = up.event.build('my:event', { foo: 'bar' })
      console.log(event.type)              // logs "my:event"
      console.log(event.foo)               // logs "bar"
      console.log(event.defaultPrevented)  // logs "false"
      up.emit(event)                       // emits the event

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
  ###
  build = (args...) ->
    props = u.extractOptions(args)
    type = args[0] || props.type || up.fail('Expected event type to be passed as string argument or { type } property')

    event = document.createEvent('Event')
    event.initEvent(type, true, true) # name, bubbles, cancelable
    u.assign(event, u.omit(props, ['type', 'target']))

    # IE11 does not set { defaultPrevented: true } after #preventDefault()
    # was called on a custom event.
    # See discussion here: https://stackoverflow.com/questions/23349191
    if up.browser.isIE11()
      originalPreventDefault = event.preventDefault

      event.preventDefault = ->
        # Even though we're swapping out defaultPrevented() with our own implementation,
        # we still need to call the original method to trigger the forwarding of up:click.
        originalPreventDefault.call(event)
        u.getter(event, 'defaultPrevented', -> true)

    return event

  ###**
  [Emits](/up.emit) the given event and throws an AbortError if it was prevented.

  @function up.event.assertEmitted
  @param {string} eventType
  @param {Object} eventProps
  @param {string|Array} [eventProps.message]
  @internal
  ###
  assertEmitted = (args...) ->
    buildEmitter(args).assertEmitted()

  ###**
  Registers an event listener to be called when the user
  presses the `Escape` key.

  \#\#\# Example

  ```javascript
  up.event.onEscape(function(event) {
    console.log('Escape pressed!')
  })
  ```

  @function up.event.onEscape
  @param {Function(Event)} listener
    The listener function that will be called when `Escape` is pressed.
  @experimental
  ###
  onEscape = (listener) ->
    return bind('keydown', (event) ->
      if escapePressed(event)
        listener(event)
    )

  ###**
  Returns whether the given keyboard event involved the ESC key.

  @function up.util.escapePressed
  @param {Event} event
  @internal
  ###
  escapePressed = (event) ->
    key = event.key
    # IE/Edge use 'Esc', other browsers use 'Escape'
    key == 'Escape' || key == 'Esc'

  ###**
  Prevents the event from being processed further.

  In detail:

  - It prevents the event from bubbling up the DOM tree.
  - It prevents other event handlers bound on the same element.
  - It prevents the event's default action.

  \#\#\# Example

      up.on('click', 'link.disabled', function(event) {
        up.event.halt(event)
      })

  @function up.event.halt
  @param {Event} event
  @stable
  ###
  halt = (event) ->
    event.stopImmediatePropagation()
    event.preventDefault()

  ###**
  Runs the given callback when the the initial HTML document has been completely loaded.

  The callback is guaranteed to see the fully parsed DOM tree.
  This function does not wait for stylesheets, images or frames to finish loading.

  If `up.event.onReady()` is called after the initial document was loaded,
  the given callback is run immediately.

  @function up.event.onReady
  @param {Function} callback
    The function to call then the DOM tree is acessible.
  @experimental
  ###
  onReady = (callback) ->
    # Values are "loading", "interactive" and "completed".
    # https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState
    if document.readyState != 'loading'
      callback()
    else
      document.addEventListener('DOMContentLoaded', callback)

  keyModifiers = ['metaKey', 'shiftKey', 'ctrlKey', 'altKey']

  ###**
  @function up.event.isUnmodified
  @internal
  ###
  isUnmodified = (event) ->
    (u.isUndefined(event.button) || event.button == 0) && !u.some(keyModifiers, (modifier) -> event[modifier])

  fork = (originalEvent, newType, copyKeys = []) ->
    newEvent = up.event.build(newType, u.pick(originalEvent, copyKeys))
    newEvent.originalEvent = originalEvent # allow users to access other props through event.originalEvent.prop

    ['stopPropagation', 'stopImmediatePropagation', 'preventDefault'].forEach (key) ->
      originalMethod = newEvent[key]

      newEvent[key] = ->
        originalEvent[key]()
        return originalMethod.call(newEvent)

    return newEvent

  ###**
  Emits the given event when this link is clicked.

  When the emitted event's default' is prevented, the original `click` event's default is also prevented.

  You may use this attribute to emit events when clicking on areas that are no hyperlinks,
  by setting it on an `<a>` element without a `[href]` attribute.

  \#\#\# Example

      <a href='/users/5" up-emit='user:select' up-emit-props='{ "id": 5, "firstName": "Alice" }'>Alice</a>

      <script>
        up.on('a', 'user:select', function(event) {
          console.log(event.firstName) // logs "Alice"
          event.preventDefault()       // will prevent the link from being followed
        })
      </script>

  @selector a[up-emit]
  @param up-emit
    The type of the event to be emitted.
  @param up-emit-props
    The event properties, serialized as JSON.
  ###
  executeEmitAttr = (event, element) ->
    return unless isUnmodified(event)
    eventType = e.attr(element, 'up-emit')
    eventProps = e.jsonAttr(element, 'up-emit-props')
    forkedEvent = fork(event, eventType)
    u.assign(forkedEvent, eventProps)
    up.emit(element, forkedEvent)

#  abortable = ->
#    signal = document.createElement('up-abort-signal')
#    abort = -> up.emit(signal, 'abort')
#    [abort, signal]

  bind 'up:click', 'a[up-emit]', executeEmitAttr
  bind 'up:framework:reset', reset

  on: bind # can't name symbols `on` in Coffeescript
  $on: $bind
  off: unbind # can't name symbols `off` in Coffeescript
  build: build
  emit: emit
  assertEmitted: assertEmitted
  onEscape: onEscape
  halt: halt
  onReady: onReady
  isUnmodified: isUnmodified
  fork: fork
  keyModifiers: keyModifiers

up.on = up.event.on
up.$on = up.event.$on
up.off = up.event.off
up.$off = up.event.off # it's the same as up.off()
up.emit = up.event.emit
