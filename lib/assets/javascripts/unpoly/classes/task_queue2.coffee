u = up.util

class up.Task extends up.Class

  constructor: ({ @onStart, @onAbort, @data, @lock }) ->
    @deferred = u.deferred()

  @get 'promise', ->
    @deferred.promise()

  abort: ->
    @onAbort?()
    @deferred.reject(up.event.abortError())
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
      (@data && u.contains(data, conditions)) ||
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

#  @wrap: (value) ->
#    u.wrapValue(value, @)

class up.TaskQueue2 extends up.Class

  constructor: (options = {}) ->
    @concurrency = options.concurrency ? 1
    @reset()

  reset: ->
    @queuedTasks = []
    @currentTasks = []

  asap: (args...) ->
    task = up.Task.fromAsapArgs(args)

    if task.lock
      @reuseLock(task)
    else if @hasConcurrencyLeft()
      @runTaskNow(task)
    else
      @queueTask(task)

    return task.promise

  hasConcurrencyLeft: ->
    concurrency = u.evalOption(@concurrency) ? 1
    return concurrency == -1 || @currentTasks.length < concurrency

  isBusy: ->
    @currentTask.length > 0

  poke: =>
    unless @currentTask
      @runNextTask()

  runNextTask: ->
    if task = @queuedTasks.shift()
      @runThisTask(task)

  reuseLock: (task) ->
    unless u.detect(@currentTasks, (currentTask) -> currentTask.lock == task.lock)
      throw new Error('Lock expired')

    # Don't adjust @currentTasks, it's already occupied by the task that
    # originally retrieved the lock.

    return task.start()

  queueTask: (task) ->
    @queuedTasks.push(task)

  pluckNextTask: ->
    @queuedTasks.shift()

  runTaskNow: (task) ->
    @currentTasks.push(task)

    task.start()

    if u.isPromise(returnValue)
      u.always(returnValue, => @taskDone(task))
    else
      @taskDone(task)

  taskDone: (task) ->
    u.remove(@currentTasks, task)
    u.microtask(@poke)

  poke: ->
    if @hasConcurrencyLeft() && (task = @pluckNextTask())
      @runTaskNow(task)

  abortList: (list, conditions) ->
    copy = u.copy(list)

    copy.forEach (task) ->
      if task.matches(conditions)
        task.abort()
        # Although the task will eventually remove itself from the queue,
        # we want to keep our sync signature and adjust the list sync.
        u.remove(list, task)

  abort: (conditions = true) ->
    @abortList(@currentTasks, conditions)
    @abortList(@queuedTasks, conditions)

class up.PreloadQueue extends up.TaskQueue

  constructor: (options) ->
    super(options)

  hasQueueSpaceLeft: ->
    queueSize = u.evalOption(@queueSize) ? -1
    return queueSize == -1 || @queuedTasks.length < queueSize

  queueTask: (task) ->
    # If the queue is already at capacity, we drop the oldest task.
    unless @hasQueueSpaceLeft()
      oldestTask = @queuedTasks[0]
      @abort(oldestTask)

    super(task)

  pluckNextTask: (task) ->
    # Preloading mostly happens as the user hovers over a link, so we should
    # start preloading ASAP. Hence we always prefer the youngest task in the queue.
    @queuedTasks.pop(task)
