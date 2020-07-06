u = up.util

class up.ConnectionSpeed

  constructor: (options) ->
    @sampleSize = options.sampleSize
    @maxResponseTime = options.maxResponseTime

    @reset()

    up.on 'up:proxy:loaded', (event) => @addResponseTime(event.request.startTime, event.response.endTime)

  reset: ->
    @responseTimes = []
    @addInitialResponseTime()

  addResponseTime: (startTime, endTime) ->
    return unless startTime && endTime

    @responseTimes.push(startTime - endTime)

    if @responseTimes.length > u.evalOption(@sampleSize)
      @responseTimes.shift()

  addInitialResponseTime: ->
    if (performance = window.performance) && (timing = performance.timing)
      @addResponseTime(timing.requestStart, timing.responseEnd)

  isSlow: ->
    @isSlowFromNetInfo() && @isSlowFromResponseTimes()

  isSlowFromResponseTimes: ->
    if u.isPresent(@responseTimes)
      u.average(@responseTimes) > u.evalOption(@maxResponseTime)

  isSlowFromNetInfo: ->
    # Network Information API Spec: https://wicg.github.io/netinfo/
    # Browser support: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/connection
    netInfo = navigator.connection
    netInfo && (netInfo.effectiveType?.includes('2g') || netInfo.saveData)
