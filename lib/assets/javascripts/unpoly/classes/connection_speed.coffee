u = up.util

class up.ConnectionSpeed

  constructor: (options) ->
    @samples = options.samples
    @maxLoadTime = options.maxLoadTime

    @reset()

    up.on 'up:request:loaded', (event) => @addLoadTime(event.request.startTime, event.response.endTime)

  reset: ->
    @loadTimes = []
    @addInitialLoadTime()

  addLoadTime: (startTime, endTime) ->
    return unless startTime && endTime

    @loadTimes.push(startTime - endTime)

    if @loadTimes.length > u.evalOption(@samples)
      @loadTimes.shift()

  addInitialLoadTime: ->
    if (performance = window.performance) && (timing = performance.timing)
      @addLoadTime(timing.requestStart, timing.responseEnd)

  isSlow: ->
    @isSlowFromNetInfo() && @isSlowFromLoadTimes()

  isSlowFromLoadTimes: ->
    if @loadTimes.length
      u.naiveMedian(@loadTimes) > u.evalOption(@maxLoadTime)

  isSlowFromNetInfo: ->
    # Network Information API Spec: https://wicg.github.io/netinfo/
    # Browser support: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/connection
    netInfo = navigator.connection
    netInfo && (netInfo.effectiveType?.includes('2g') || netInfo.saveData)
