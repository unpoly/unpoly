/*-
@module up.event
*/

up.migrate.renamedPackage('bus', 'event')

/*-
[Emits an event](/up.emit) and returns whether no listener
has prevented the default action.

### Example

```javascript
if (up.event.nobodyPrevents('disk:erase')) {
  Disk.erase()
})
```

@function up.event.nobodyPrevents
@param {string} eventType
@param {Object} eventProps
@return {boolean}
  whether no listener has prevented the default action
@deprecated
  Use `!up.emit(type).defaultPrevented` instead.
*/
up.event.nobodyPrevents = function(...args) {
  up.migrate.deprecated('up.event.nobodyPrevents(type)', '!up.emit(type).defaultPrevented')
  const event = up.emit(...args)
  return !event.defaultPrevented
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
@deprecated
  Use `up.on()` with a callback that wraps the given native element in a jQuery collection.
*/
up.$on = function(...definitionArgs) {
  up.migrate.warn('up.$on() has been deprecated. Instead use up.on() with a callback that wraps the given native element in a jQuery collection.')
  let callback = definitionArgs.pop()

  callback.upNativeCallback = function(event, element, data) {
    let $element = jQuery(element)
    callback.call($element, event, $element, data)
  }
  return up.on(...definitionArgs, callback.upNativeCallback)
}

up.$off = function(...definitionArgs) {
  up.migrate.deprecated('up.$off()', 'up.off()')
  let $callback = definitionArgs.pop()
  let nativeCallback = $callback.upNativeCallback

  if (!nativeCallback) {
    up.fail('The callback passed to up.$off() was never registered with up.$on()')
  }

  return up.off(...definitionArgs, nativeCallback)
}
