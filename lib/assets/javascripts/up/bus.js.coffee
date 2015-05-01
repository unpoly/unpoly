###*
Framework events
================
  
This class is kind-of internal and in constant flux.
  
The framework event bus might eventually be rolled
into regular document events.

\#\#\# Available events
  
- `app:ready`
- `fragment:ready` with arguments `($fragment)`
- `fragment:destroy` with arguments `($fragment)`

\#\#\# Incomplete documentation!
  
We need to work on this page:

- Decide whether to refactor this into document events
- Document events
  
  
@class up.bus
###
up.bus = (->
  
  u = up.util

  callbacksByEvent = {}
  defaultCallbacksByEvent = {}

  callbacksFor = (event) ->
    callbacksByEvent[event] ||= []

  ###*
  Makes a snapshot of the currently registered bus listeners,
  to later be restored through [`up.bus.reset`](/up.bus#up.bus.reset)
  
  @private
  @method up.bus.snapshot
  ###
  snapshot = ->
    defaultCallbacksByEvent = {}
    for event, callbacks of callbacksByEvent
      defaultCallbacksByEvent[event] = u.copy(callbacks)
  
  ###*
  Resets the list of registered event listeners to the
  moment when the framework was booted.
  
  @private
  @method up.bus.reset
  ###
  reset = ->
    callbacksByEvent = u.copy(defaultCallbacksByEvent)

  ###*
  Registers an event handler to be called when the given
  event is triggered.
  
  @method up.bus.on
  @param {String} eventName
    The event name to match.
  @param {Function} handler
    The event handler to be called with the event arguments.  
  ###
  # We cannot call this function "on" because Coffeescript
  # https://makandracards.com/makandra/29733-english-words-that-you-cannot-use-in-coffeescript
  listen = (eventName, handler) ->
    callbacksFor(eventName).push(handler)

  ###*
  Triggers an event.
  
  @method up.bus.emit
  @param {String} eventName
    The name of the event.
  @param args...
    The arguments that describe the event. 
  ###
  emit = (eventName, args...) ->
    u.debug("Emitting event %o with args %o", eventName, args)
    callbacks = callbacksFor(eventName)
    u.each(callbacks, (callback) ->
      callback(args...)
    )

  listen 'framework:ready', snapshot
  listen 'framework:reset', reset

  on: listen
  emit: emit
)()
