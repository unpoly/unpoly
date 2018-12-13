e = up.util

###**
A linear task queue whose (2..n)th tasks can be changed at any time.

@function up.DivertibleChain
@internal
###
class up.DivertibleChain

  constructor: ->
    @reset()

  reset: =>
    @queue = []
    @currentTask = undefined

  promise: =>
    lastTask = u.last(@allTasks())
    lastTask?.promise || Promise.resolve()

  allTasks: =>
    tasks = []
    tasks.push(@currentTask) if @currentTask
    tasks = tasks.concat(@queue)
    tasks

  poke: =>
    unless @currentTask # don't start a new task while we're still running one
      if @currentTask = @queue.shift()
        promise = @currentTask()
        u.always promise, =>
          @currentTask = undefined
          @poke()

  asap: (newTasks...) =>
    @queue = u.map(newTasks, u.previewable)
    @poke()
    @promise()
