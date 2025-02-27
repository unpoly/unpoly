@partial options/on-without-element

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
