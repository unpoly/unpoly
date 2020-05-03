u = up.util
e = up.element

class up.LinkPreloadDelay

  constructor: ->

  reset: ->
    @cancelTimer()
    @waitingLink = undefined

  observeLink: (link) ->
    if up.link.isSafe(link)
      link.addEventListener('mouseenter', @onMouseEnter)
      link.addEventListener('mouseleave', @onMouseLeave)

  onMouseEnter: (event) =>
    link = event.target
    if up.link.shouldFollowEvent(event, link)
      @preloadAfterDelay(link)

  onMouseLeave: (event) =>
    link = event.target
    @stopPreload(link)

  preloadAfterDelay: (link) ->
    delay = e.numberAttr(link, 'up-delay') ? up.link.config.preloadDelay

    unless link == @waitingLink
      @waitingLink = link
      @startTimer delay, =>
        u.muteRejection up.link.preload(link)
        @waitingLink = null

  startTimer: (delay, block) ->
    @cancelTimer()
    @timer = setTimeout(block, delay)

  cancelTimer: ->
    clearTimeout(@timer)
    @timer = undefined

  stopPreload: (link) ->
    if link == @waitingLink
      @waitingLink = undefined
      @cancelTimer()
