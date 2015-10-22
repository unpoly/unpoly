###*
Framework events
================

Up.js uses an internal event bus that you can use to hook into lifecycle events like "an HTML fragment into the DOM".
  
This internal event bus might eventually be rolled into regular events that we trigger on `document`.

\#\#\# `fragment:ready` event

This event is triggered after Up.js has inserted an HTML fragment into the DOM through mechanisms like [`[up-target]`](/up.flow#up-target) or [`up.replace`](/up.flow#up.replace):

    up.bus.on('fragment:ready', function($fragment) {
      console.log("Looks like we have a new %o!", $fragment);
    });

The event is triggered *before* Up has compiled the fragment with your [custom behavior](/up.magic).
Upon receiving the event, Up.js will start compilation.


\#\#\# `fragment:destroy` event

This event is triggered when Up.js is destroying an HTML fragment, e.g. because it's being replaced
with a new version or because someone explicitly called [`up.destroy`](/up.flow#up.destroy):

    up.bus.on('fragment:destroy', function($fragment) {
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
up.bus = (->
  
  u = up.util

  ###*
  @method up.bus.emit
  @param {String} eventName
    The name of the event.
  @param args...
    The arguments that describe the event.
  @protected
  ###
  emit = (eventName, eventProps = {}) ->
    event = $.Event(eventName, eventProps)
    $target = eventProps.$element || $(document)
    u.debug("Emitting %o on %o with props %o", eventName, $target, eventProps)
    $target.trigger(event)
    event

  ###*
  Emits an event with the given name and property.
  Returns whether any event listener has prevented the default action.

  @method nobodyPrevents
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
    up.bus.emit('up:framework:reset')


  emit: emit
  nobodyPrevents: nobodyPrevents
  reset: reset

)()

up.reset = up.bus.reset
