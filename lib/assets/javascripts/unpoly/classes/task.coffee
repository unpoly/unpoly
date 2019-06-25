u = up.util

# TODO: Can we get rid of the up.Task wrapper and have up.Request implement the interface

class up.Task extends up.Class

  constructor: ({ @onStart, @onAbort, @data }) ->
    @deferred = u.newDeferred()
    @spawnTime = new Date()
    # @uid = u.uid() # TODO: Remove

  @delegate ['then', 'catch', 'always'], 'deferred'

  abort: (message) ->
    @onAbort?(message)
    @deferred.reject(up.event.abortError(message))
    @promise

  start: ->
    innerPromise = @onStart()
    @deferred.resolve(innerPromise)
    return @promise

  matches: (conditions) ->
    conditions == true ||
      conditions == this ||
      (@data && u.objectContains(data, conditions)) ||
      (@data && conditions == @data)

  @fromAsapArgs: (args) ->
    if args[0] instanceof this
      # TaskQueue.asap(task)
      return args[0]
    else
      # TaskQueue.asap(onStart)
      onStart = u.extractCallback(args)
      return new up.Task({ onStart })
