#= require ./task_queue

u = up.util

class up.ProxyForegroundQueue extends up.TaskQueue

  constructor: (options) ->
    super(options)
    @slowDelay = options.slowDelay

  reset: ->
    super()
    @emittedSlow = false

  asap: (args...) ->
    promise = super(args...)
    slowDelay = u.evalOption(@slowDelay)
    u.setTimer(slowDelay, @checkSlow)
    promise

  checkSlow: =>
    currentSlow = @isSlow()

    if @emittedSlow == currentSlow
      return

    @emittedSlow = currentSlow

    if currentSlow
      up.emit('up:proxy:slow', log: 'Proxy is slow to respond')
    else
      up.emit('up:proxy:recover', log: 'Proxy has recovered from slow response')

  isSlow: ->
    now = new Date()
    delay = @delay
    return u.some @allTasks, (task) ->
      (now - task.spawnTime) > delay
