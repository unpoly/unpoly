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
    innerPromise = @onStart(@lock)
    @deferred.resolve(innerPromise)
    return @promise

  matches: (conditions) ->
    conditions == this || (@data && u.contains(data, conditions))

  @fromAsapArgs: (args) ->
    if args[0] instanceof this
      task = args[0]
    else
      onStart = u.extractCallback(args)
      lock = args[0]
      new up.Task({ onStart, lock })
    return task

#  @wrap: (value) ->
#    u.wrapValue(value, @)

class up.TaskQueue2

  constructor: ->
    @reset()

  reset: ->
    @queuedTasks = []
    @currentTask = null

  asap: (args...) ->
    task = up.Task.fromAsapArgs(args)

    if task.lock
      @reuseLock(task)
    else if @isBusy()
      @queueTask(task)
    else
      @runThisTask(task)

    return task.promise


  isBusy: ->
    !!@currentTask

  poke: =>
    unless @currentTask
      @runNextTask()

  runNextTask: ->
    if task = @queuedTasks.shift()
      @runThisTask(task)

  reuseLock: (task) ->
    unless lock == @currentTask?.lock
      throw new Error('Lock expired')

    # Don't set @currentTask, it's already occupied by the task that
    # originally retrieved the lock.

    return task.start()

  queueTask: (task) ->
    task = u.previewable(task)
    @queuedTasks.push(task)

  runThisTask: (task) ->
    @currentTask = task

    task.start()

    if u.isPromise(returnValue)
      u.always(returnValue, => @taskDone(task))
    else
      @taskDone(task)

  taskDone: (task) ->
    if @currentTask == task
      @currentTask = null
    u.microtask(@poke)

  poke:
    throw "Implement me"

  abortAll: (conditions = {}) ->
    whenAborted = []

    @queuedTasks = u.select @queuedTasks, (task) ->
      if task.matches(conditions)
        whenAborted.push task.abort()
        false
      else
        true

    if @currentTask && @currentTask.matches?(conditions)
      # Although aborting @currentTask will eventually set @currentTask to null,
      # the abort function should be sync.
      whenAborted.push @currentTask.abort()
      @currentTask = null

    Promise.all(whenAborted)
