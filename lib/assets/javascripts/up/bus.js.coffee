up.bus = (->

  callbacksByEvent = {}

  callbacksFor = (event) ->
    callbacksByEvent[event] ||= []

  # We cannot call this function "on" because Coffeescript
  # https://makandracards.com/makandra/29733-english-words-that-you-cannot-use-in-coffeescript
  listen = (event, block) ->
    callbacksFor(event).push(block)

  emit = (event, args...) ->
    console.log("bus emitting", event, args)
    callbacks = callbacksFor(event)
    up.util.each(callbacks, (callback) ->
      callback(args...)
    )

  return (
    on: listen
    emit: emit
  )
)()
