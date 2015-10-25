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

The event is triggered *before* Up has compiled the fragment with your [custom behavior](/up.magic).
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

- Decide whether to refactor this into document events
- Decide whether `fragment:enter` and `fragment:leave` would be better names
- Decide if we wouldn't rather document events in the respective module (e.g. proxy).

@class up.bus
###
up.bus = (($) ->
  
  u = up.util

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


  ###*
  Resets Up.js to the state when it was booted.
  All custom event handlers, animations, etc. that have been registered
  will be discarded.

  This is an internal method for to enable unit testing.
  Don't use this in production.

  @protected
  @method up.reset
  ###
  reset = ->
    up.emit('up:framework:reset')

  emit: emit
  nobodyPrevents: nobodyPrevents
  reset: reset

)(jQuery)

up.reset = up.bus.reset
up.emit = up.bus.emit
