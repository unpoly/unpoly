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
        throw "Standard error for cancelation"
        return Promise.reject('canceled')
      else
        return task()

    @cursor = u.always @cursor, nextTask
    return @cursor
