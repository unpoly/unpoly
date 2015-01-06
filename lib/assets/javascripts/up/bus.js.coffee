###*
Event bus for up-related events:
  
- `app:ready`
- `fragment:ready` with arguments `($fragment)`
- `fragment:destroy` with arguments `($fragment)`
  
TODO: This might eventually be rolled into regular document events.
  
@class up.bus  
###
up.bus = (->

  callbacksByEvent = {}

  callbacksFor = (event) ->
    callbacksByEvent[event] ||= []

  ###*
  Registers an event handler to be called when the given
  event is triggered.
  
  @method up.bus.listen
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
  @param {Anything...} args
    The arguments that describe the event. 
  ###
  emit = (eventName, args...) ->
    console.log("bus emitting", eventName, args)
    callbacks = callbacksFor(eventName)
    up.util.each(callbacks, (callback) ->
      callback(args...)
    )

  return (
    on: listen
    emit: emit
  )
)()
