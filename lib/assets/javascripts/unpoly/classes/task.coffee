u = up.util

# TODO: Can we get rid of the up.Task wrapper and have up.Request implement the interface

class up.Task extends up.Class

  constructor: ({ @onStart, @onAbort, @data, @lock }) ->
    @deferred = u.newDeferred()
    @spawnTime = new Date()

  @delegate ['then', 'catch', 'always'], 'deferred'

  abort: (message) ->
    @onAbort?(message)
    @deferred.reject(up.event.abortError(message))
    @promise

  start: ->
    @lock ||= u.uid()
    # Pass @lock to the start function so it can re-enter the same lock
    # through queue.asap(lock, fn)
    innerPromise = @onStart(@lock)
    @deferred.resolve(innerPromise)
    return @promise

  matches: (conditions) ->
    conditions == true ||
      conditions == this ||
      (@data && u.objectContains(data, conditions)) ||
      (@data && conditions == @data)

  @fromAsapArgs: (args) ->
    if args[0] instanceof this
      task = args[0]
    else
      onStart = u.extractCallback(args)
      lock = args[0]
      if lockFromProp = task.lock
        task = lockFromProp
      new up.Task({ onStart, lock })
    return task
