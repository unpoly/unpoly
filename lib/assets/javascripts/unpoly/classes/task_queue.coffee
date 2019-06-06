u = up.util

class up.TaskQueue extends up.Class

  constructor: (options = {}) ->
    @concurrency = options.concurrency ? 1
    @reset()

  reset: ->
    @queuedTasks = []
    @currentTasks = []

  @getter 'allTasks', ->
    @currentTasks.concat(@queuedTasks)

  asap: (args...) ->
    task = up.Task.fromAsapArgs(args)

    console.debug("up.TaskQueue#asap(%o)", task)

    if task.lock
      console.debug("reusing lock for %o", task)
      @reuseLock(task)
    else if @hasConcurrencyLeft()
      console.debug("running now: %o", task)
      @runTaskNow(task)
    else
      console.debug("queuing now: %o", task)
      @queueTask(task)

    return task

  hasConcurrencyLeft: ->
    concurrency = u.evalOption(@concurrency) ? 1
    return concurrency == -1 || @currentTasks.length < concurrency

  isBusy: ->
    @currentTask.length > 0

  poke: =>
    unless @currentTask
      @startNextTask()

  startNextTask: ->
    if task = @queuedTasks.shift()
      @startTask(task)

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

    returnValue = task.start()

    if u.isPromise(returnValue)
      u.always(returnValue, => @onTaskDone(task))
    else
      @onTaskDone(task)

  onTaskDone: (task) ->
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

    return

  abort: (conditions = true) ->
    @abortList(@currentTasks, conditions)
    @abortList(@queuedTasks, conditions)
