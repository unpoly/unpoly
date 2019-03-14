class up.TaskQueue

  constructor: ->
    @reset()

  cancel: ->
    # TODO: DO we really need .cancel()?
    for task in @tasks
      task.canceled = true

  reset: ->
    @cancel()
    @initialize()

  initialize: ->
    @tasks = []
    @cursor = Promise.resolve()

  asap: (task) ->
    nextTask = ->
      if task.canceled
        throw "Reject with standard error for cancelation"
        throw "Do we still need cancelation? Because layers now just queue things"
        return Promise.reject('canceled')
      else
        return task()

    @cursor = u.always @cursor, nextTask
    return @cursor
