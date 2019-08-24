#= require ./task_queue

u = up.util

class up.ProxyForegroundQueue extends up.TaskQueue

  constructor: (options) ->
    super(options)
    console.debug("--- new up.ProxyForegroundQueue()")
    @slowDelay = options.slowDelay

  reset: ->
    super()
    @emittedSlow = false

  asap: (task) ->
    console.debug("--- asap(%o)", task)
    promise = super(task)
    slowDelay = u.evalOption(@slowDelay)
    console.debug("--- Checking slow in %o", slowDelay)
    u.timer(slowDelay, @checkSlow)
    promise

  checkSlow: =>
    currentSlow = @isSlow()

    console.debug("--- checkSlow(); currentSlow is %o", currentSlow)

    if @emittedSlow != currentSlow
      @emittedSlow = currentSlow

      if currentSlow
        up.emit('up:proxy:slow', log: 'Proxy is slow to respond')
      else
        up.emit('up:proxy:recover', log: 'Proxy has recovered from slow response')

  isSlow: ->
    now = new Date()
    delay = u.evalOption(@slowDelay)
    return u.some @allTasks, (task) ->
      (now - task.spawnTime) > delay
