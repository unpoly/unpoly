class up.TaskQueue

  constructor: ->
    @initialize()

  reset: ->
    for task in @tasks
      task.canceled = true
    @initialize()

  initialize: ->
    @tasks = []
    @cursor = Promise.resolve()

  asap: (tasks...) ->
    for task in tasks
      nextTask = ->
        if task.canceled
          throw "Do we still need cancelation? Because layers now just queue things"
          return up.event.abortRejection()
        else
          return task()
    @cursor = u.always @cursor, nextTask
    return @cursor
