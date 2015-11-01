###*
Framework events
================

Up.js uses an internal event bus that you can use to hook into lifecycle events like "an HTML fragment into the DOM".
  
This internal event bus might eventually be rolled into regular events that we trigger on `document`.

\#\#\# `fragment:inserted` event

This event is triggered after Up.js has inserted an HTML fragment into the DOM through mechanisms like [`[up-target]`](/a-up-target) or [`up.replace`](/up.replace):

    up.on('up:fragment:inserted', function($fragment) {
      console.log("Looks like we have a new %o!", $fragment);
    });

The event is triggered *before* Up has compiled the fragment with your [custom elements](/up.syntax).
Upon receiving the event, Up.js will start compilation.


\#\#\# `fragment:destroyed` event

This event is triggered when Up.js is destroying an HTML fragment, e.g. because it's being replaced
with a new version or because someone explicitly called [`up.destroy`](/up.destroy):

    up.on('up:fragment:destroyed', function($fragment) {
      console.log("Looks like we lost %o!", $fragment);
    });

After triggering this event, Up.js will remove the fragment from the DOM.
In case the fragment destruction is animated, Up.js will complete the
animation before removing the fragment from the DOM.


\#\#\# Incomplete documentation!
  
We need to work on this page:

- Decide if we wouldn't rather document events in the respective module (e.g. proxy).

@class up.bus
###
up.bus = (($) ->
  
  u = up.util

  liveDescriptions = []
  defaultLiveDescriptions = null

  ###*
  # Convert an Up.js style listener (second argument is the event target
  # as a jQuery collection) to a vanilla jQuery listener
  ###
  upListenerToJqueryListener = (upListener) ->
    (event) ->
      $me = event.$element || $(this)
      upListener.apply($me.get(0), [event, $me, up.syntax.data($me)])

  ###*
  Listens to an event on `document`.

  The given event listener which will be executed whenever the
  given event is [triggered](/up.emit) on the given selector:

      up.on('click', '.button', function(event, $element) {
        console.log("Someone clicked the button %o", $element);
      });

  This is roughly equivalent to binding an event listener to `document`:

      $(document).on('click', '.button', function(event) {
        console.log("Someone clicked the button %o", $(this));
      });

  Other than jQuery, Up.js will silently discard event listeners
  on [browsers that it doesn't support](/up.browser.isSupported).


  \#\#\#\# Attaching structured data

  In case you want to attach structured data to the event you're observing,
  you can serialize the data to JSON and put it into an `[up-data]` attribute:

      <span class="person" up-data="{ age: 18, name: 'Bob' }">Bob</span>
      <span class="person" up-data="{ age: 22, name: 'Jim' }">Jim</span>

  The JSON will parsed and handed to your event handler as a third argument:

      up.on('click', '.person', function(event, $element, data) {
        console.log("This is %o who is %o years old", data.name, data.age);
      });


  \#\#\#\# Migrating jQuery event handlers to `up.on`

  Within the event handler, Up.js will bind `this` to the
  native DOM element to help you migrate your existing jQuery code to
  this new syntax.

  So if you had this before:

      $(document).on('click', '.button', function() {
        $(this).something();
      });

  ... you can simply copy the event handler to `up.on`:

      up.on('click', '.button', function() {
        $(this).something();
      });

  @method up.on
  @param {String} events
    A space-separated list of event names to bind.
  @param {String} [selector]
    The selector of an element on which the event must be triggered.
    Omit the selector to listen to all events with that name, regardless
    of the event target.
  @param {Function(event, $element, data)} behavior
    The handler that should be called.
    The function takes the affected element as the first argument (as a jQuery object).
    If the element has an `up-data` attribute, its value is parsed as JSON
    and passed as a second argument.
  @return {Function}
    A function that unbinds the event listeners when called.
  ###
  live = (args...) ->
    # Silently discard any event handlers that are registered on unsupported
    # browsers and return a no-op destructor
    return (->) unless up.browser.isSupported()

    description = u.copy(args)
    lastIndex = description.length - 1
    behavior = description[lastIndex]
    description[lastIndex] = upListenerToJqueryListener(behavior)

    # Remember the descriptions we registered, so we can
    # clean up after ourselves during a reset
    liveDescriptions.push(description)

    $document = $(document)
    $document.on(description...)

    # Return destructor
    -> $document.off(description...)


  ###*
  Emits an event with the given name and properties.

  \#\#\#\# Example

      up.on('my:event', function(event) {
        console.log(event.foo);
      });

      up.emit('my:event', { foo: 'bar' });
      # Prints "bar" to the console

  @method up.emit
  @param {String} eventName
    The name of the event.
  @param {Object} [eventProps={}]
    A list of properties to become part of the event object
    that will be passed to listeners. Note that the event object
    will by default include properties like `preventDefault()`
    or `stopPropagation()`.
  @param {jQuery} [eventProps.$element=$(document)]
    The element on which the event is trigered.
  @protected
  ###
  emit = (eventName, eventProps = {}) ->
    event = $.Event(eventName, eventProps)
    $target = eventProps.$element || $(document)
    u.debug("Emitting %o on %o with props %o", eventName, $target, eventProps)
    $target.trigger(event)
    event


  ###*
  [Emits an event](/up.emit) and returns whether any listener has prevented the default action.

  @method up.bus.nobodyPrevents
  @param {String} eventName
  @param {Object} eventProps
  @protected
  ###
  nobodyPrevents = (args...) ->
    event = emit(args...)
    not event.isDefaultPrevented()

  onEscape = (handler) ->
    live('keydown', 'body', (event) ->
      if u.escapePressed(event)
        handler(event)
    )

  ###*
  Makes a snapshot of the currently registered event listeners,
  to later be restored through [`up.bus.reset`](/up.bus.reset).

  @private
  ###
  snapshot = ->
    defaultLiveDescriptions = u.copy(liveDescriptions)

  ###*
  Resets the list of registered event listeners to the
  moment when the framework was booted.

  @private
  ###
  restoreSnapshot = ->
    for description in liveDescriptions
      unless u.contains(defaultLiveDescriptions, description)
        $(document).off(description...)
    liveDescriptions = u.copy(defaultLiveDescriptions)

  ###*
  Resets Up.js to the state when it was booted.
  All custom event handlers, animations, etc. that have been registered
  will be discarded.

  This is an internal method for to enable unit testing.
  Don't use this in production.

  @protected
  @method up.reset
  ###
  emitReset = ->
    up.emit('up:framework:reset')

  live 'up:framework:boot', snapshot
  live 'up:framework:reset', restoreSnapshot

  on: live # can't name symbols `on` in Coffeescript
  emit: emit
  nobodyPrevents: nobodyPrevents
  onEscape: onEscape
  emitReset: emitReset

)(jQuery)

up.on = up.bus.on
up.emit = up.bus.emit
up.reset = up.bus.emitReset
