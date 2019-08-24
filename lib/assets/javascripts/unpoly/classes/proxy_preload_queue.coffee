#= require ./task_queue

u = up.util

class up.ProxyPreloadQueue extends up.TaskQueue

  constructor: (options) ->
    super(options)
    @size = options.size

  hasQueueSpaceLeft: ->
    size = u.evalOption(@size)
    return size == -1 || @queuedTasks.length < size

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
