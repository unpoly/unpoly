u = up.util
e = up.element

class up.LinkPreloader

  constructor: ->

  observeLink: (link) ->
    # If the link has an unsafe method (like POST) and is hence not preloadable,
    # prevent up.link.preload() from blowing up by not observing the link (even if
    # the user uses [up-preload] everywhere).
    if up.link.isSafe(link)
      @on link, 'mouseenter',           (event) => @considerPreload(event, true)
      @on link, 'mousedown touchstart', (event) => @considerPreload(event)
      @on link, 'mouseleave',           (event) => @stopPreload(event)

  on: (link, eventTypes, callback) ->
    up.on(link, eventTypes, { passive: true }, callback)

  considerPreload: (event, applyDelay) =>
    link = event.target
    if link != @currentLink
      @reset()

      @currentLink = link

      # Don't preload when the user is holding down CTRL or SHIFT.
      if up.link.shouldFollowEvent(event, link)
        if applyDelay
          @preloadAfterDelay(link)
        else
          @preloadNow(link)

  stopPreload: (event) ->
    if event.target == @currentLink
      @reset()

  reset: ->
    return unless @currentLink

    clearTimeout(@timer)

    # Only abort if the request is still preloading.
    # If the user has clicked on the link while the request was in flight,
    # and then unhovered the link, we do not abort the navigation.
    if @currentRequest?.preload
      @currentRequest.abort()

    @currentLink = undefined
    @currentRequest = undefined

  preloadAfterDelay: (link) ->
    delay = e.numberAttr(link, 'up-delay') ? up.link.config.preloadDelay
    @timer = u.timer(delay, => @preloadNow(link))

  preloadNow: (link) ->
    onQueued = (request) => @currentRequest = request
    up.log.muteUncriticalRejection up.link.preload(link, { onQueued })
    @queued = true
