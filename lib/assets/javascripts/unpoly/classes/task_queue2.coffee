u = up.util

class up.TaskQueue2

  constructor: ->
    @reset()

  reset: ->
    @queuedTasks = []
    @currentTask = null
    @currentLock = null

  asap: (args...) ->
    task = u.extractCallback(args)
    lock = args[0]

    return Promise.resolve().then ->
      if lock
        return @reuseLock(lock, task)
      else if @isBusy()
        return @queueTask(task)
      else
        return @runThisTask(task)

  isBusy: ->
    !!@currentTask

  poke: =>
    unless @currentTask
      @runNextTask()

  runNextTask: ->
    if task = @queuedTasks.shift()
      @runThisTask(task)

  reuseLock: (lock, task) ->
    unless lock == @currentLock
      throw new Error('Lock expired')

    # Don't set @currentTask, it's already occupied by the task that
    # originally retrieved the lock.

    return @callTask(task)

  queueTask: (task) ->
    task = u.previewable(task)
    @queuedTasks.push(task)
    return task.promise

  runThisTask: (task) ->
    @currentTask = task
    @currentLock = u.uid()

    returnValue = @callTask(Task)

    if u.isPromise(returnValue)
      u.always(returnValue, @taskDone)
    else
      @taskDone()

    return returnValue

  callTask: (task) ->
    task.call(@currentLock)

  taskDone: =>
    @currentTask = null
    @currentLock = null
    u.microtask(@poke)

  cancelAll: ->
    throw "implement me"
