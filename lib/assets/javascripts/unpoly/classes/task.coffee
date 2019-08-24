u = up.util

class up.Task extends up.Class

  constructor: ({ @onStart, @onAbort, @data }) ->
    @deferred = u.newDeferred()
    @spawnTime = new Date()
    @uid = u.uid() # TODO: Remove

  @delegate ['then', 'catch', 'finally'], 'deferred'

  abort: (message) ->
    @onAbort?(message)
    @deferred.reject(up.event.abortError(message))
    @deferred.promise()

  start: ->
    innerPromise = @onStart()
    console.debug("task %o returned innerPromise", @uid, innerPromise.uid)

    promiseState(innerPromise).then (result) =>
      console.debug("state of innerPromise %o (returned by task %o) is %o", innerPromise.uid, @uid, result.state)

    console.debug("will resolve task %o with innerPromise %o", @uid, innerPromise.uid)

    @deferred.resolve(innerPromise)
    # return @deferred.promise()

  matches: (conditions) ->
    conditions == true ||
      conditions == this ||
      (@data && u.objectContains(@data, conditions)) ||
      (@data && conditions == @data)

  @fromAsapArgs: (args) ->
    if args[0] instanceof this
      # TaskQueue.asap(task)
      return args[0]
    else
      # TaskQueue.asap(onStart)
      onStart = u.extractCallback(args)
      return new up.Task({ onStart })
