u = up.util

class up.TaskQueue

  constructor: ->
    @reset()

  reset: ->
    @cursor = Promise.resolve()

  asap: (task) ->
    trackedTask = u.asyncWrap(task, @taskStarted, @taskFinished)

    # Use don't use @cursor.then() since @cursor might be a failed promise
    # from the previous task.
    @cursor = u.always(@cursor, trackedTask)

    return @cursor

  ensureWithinAsap: (error) ->
    # This is not always correct in an scenario where multiple microtasks
    # might compete for the next layer change lock. It will however make
    # a developer notice who completely forgets to queue their changes
    # using @asap().
    @taskRunning or up.fail(error)

  taskStarted: =>
    @taskRunning = true

  taskFinished: =>
    @taskRunning = false
