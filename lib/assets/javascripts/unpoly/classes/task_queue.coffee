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

    console.debug("asap(%o) with concurerncy %o and active count %o", task.uid, u.evalOption(@concurrency), @currentTasks.length)

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
    console.debug("queueTask(%o)", task.uid)
    @queuedTasks.push(task)

  pluckNextTask: ->
    @queuedTasks.shift()

  runTaskNow: (task) ->
    console.debug("runTaskNow(%o)", task.uid)
    @currentTasks.push(task)

    console.debug("active task count is now", @currentTasks.length)

    task.start()
    u.always task, => @onTaskDone(task)

#    returnValue = task.start()
#
#    console.debug("return value of task %o is %o (isPromise == %o)", task.uid, returnValue, u.isPromise(returnValue))
#
#    if u.isPromise(returnValue)
#      u.always(returnValue, => @onTaskDone(task))
#    else
#      @onTaskDone(task)

  onTaskDone: (task) ->
    console.debug("onTaskDone(%o)", task.uid)

    task.then(=> console.log('onTaskDone: task %o fulfilled', task.uid)).catch(=> console.log('onTaskDone: task %o rejected', task.uid))

    promiseState(task).then (result) =>
      console.debug("onTaskDone: state of task %o is %o", task.uid, result.state)

    promiseState(task.deferred.promise()).then (result) =>
      console.debug("onTaskDone: deferred state of task %o is %o", task.uid, result.state)

    promiseState(task.deferred.promise()).then (result) =>
      console.debug("onTaskDone: deferred.promise state of task %o is %o", task.uid, result.state)

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
    console.debug("abort(%o)", conditions)
    @abortList(@currentTasks, conditions)
    @abortList(@queuedTasks, conditions)
