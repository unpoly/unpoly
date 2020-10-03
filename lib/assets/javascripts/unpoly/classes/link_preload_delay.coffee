u = up.util
e = up.element

class up.LinkPreloadDelay

  constructor: ->

  observeLink: (link) ->
    # If the link has an unsafe method (like POST) and is hence not preloadable,
    # prevent up.link.preload() from blowing up by not observing the link (even if
    # the user uses [up-preload] everywhere).
    if up.link.isSafe(link)
      link.addEventListener('mouseenter', @onMouseEnter)
      link.addEventListener('mouseleave', @onMouseLeave)

  onMouseEnter: ({ target }) =>
    if target != @currentLink
      @reset()

      # Don't preload when the user is holding down CTRL or SHIFT.
      if up.link.shouldFollowEvent(event, target)
        @preloadAfterDelay(target)

  onMouseLeave: ({ target }) =>
    if target == @currentLink
      @reset()

  reset: ->
    return unless @currentLink

    clearTimeout(@timer)
    @abortController?.abort()
    @abortController = undefined
    @currentLink = undefined

  preloadAfterDelay: (link) ->
    @currentLink = link
    delay = e.numberAttr(link, 'up-delay') ? up.link.config.preloadDelay
    @timer = u.timer(delay, => @preloadNow(link))

  preloadNow: (link) ->
    @abortController = new up.AbortController()
    u.muteRejection up.link.preload(link, signal: @abortController.signal)
