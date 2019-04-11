class up.TaskQueue

  constructor: ->
    @reset()

  reset: ->
    @cursor = Promise.resolve()

  asap: (task) ->
    previewable = u.previewable(task)
    @cursor = u.always(@cursor, previewable)
    # Return the previewable task's promise instead of @cursor
    # so rejections will be passed through.
    return previewable.promise
