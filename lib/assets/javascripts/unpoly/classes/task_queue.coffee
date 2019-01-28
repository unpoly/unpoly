class up.TaskQueue

  constructor: ->
    @tasks = []
    @cursor = Promise.resolve()

  asap: (task) ->
    preview = u.previewable(task)
    @cursor = u.always(@cursor, preview)
    preview.promise
