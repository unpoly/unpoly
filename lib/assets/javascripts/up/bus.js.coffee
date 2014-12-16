up.bus = ->

  callbacksByEvent = {}

  callbacksFor = (event) ->
    callbacksByEvent[event] ||= []

  on = (event, block) ->
    callbacksFor(event).push(block)

  emit = (event, args...) ->
    callbacks = callbacksFor(event)
    up.util.each(callbacks, (callback) ->
      callback(args...)
    )

  return (
    on: on
    emit: emit
  )
