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

class up.TaskQueue2

  constructor: (options = {}) ->
    @maxConcurrency = options.concurrency ? 1
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
    @maxConcurrency == -1 || @currentTasks.length < @maxConcurrency

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

  pluckTask: ->
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
    if @hasConcurrencyLeft() && (task = @pluckTask())
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
    @maxQueueSize = options.queueSize ? -1

  hasQueueSpaceLeft: ->
    @maxQueueSize == -1 || @queuedTasks.length < @maxQueueSize

  queueTask: (task) ->
    # If the queue is already at capacity, we drop the oldest task.
    unless @hasQueueSpaceLeft()
      oldestTask = u.last(@queuedTasks)
      @abort(oldestTask)

    # Preloading mostly happens as the user hovers over a link, so we should
    # start preloading ASAP. Since we already reached maximum concurrency in this
    # method, we at put queue the new task to the top of the queue.
    @queuedTasks.unshift(task)
