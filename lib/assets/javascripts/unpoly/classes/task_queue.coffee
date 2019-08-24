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

    if @hasConcurrencyLeft()
      @runTaskNow(task)
    else
      @queueTask(task)

    return task

  hasConcurrencyLeft: ->
    concurrency = u.evalOption(@concurrency) ? 1
    return concurrency == -1 || @currentTasks.length < concurrency

  isBusy: ->
    @currentTasks.length > 0

  poke: =>
    if task = @queuedTasks.shift()
      @runTaskNow(task)

  queueTask: (task) ->
    @queuedTasks.push(task)

  pluckNextTask: ->
    @queuedTasks.shift()

  runTaskNow: (task) ->
    @currentTasks.push(task)
    task.start()
    task.finally => @onTaskDone(task)

#    returnValue = task.start()
#
#    console.debug("return value of task %o is %o (isPromise == %o)", task.uid, returnValue, u.isPromise(returnValue))
#
#    if u.isPromise(returnValue)
#      u.finally(returnValue, => @onTaskDone(task))
#    else
#      @onTaskDone(task)

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
