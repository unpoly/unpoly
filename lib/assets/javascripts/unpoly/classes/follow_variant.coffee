u = up.util
e = up.element

class up.FollowVariant

  constructor: (selector, options) ->
    # @followLink() will wrap @followNow() with event submission and [up-active] feedback
    @followNow = options.follow
    @preloadLink = options.preload
    @selectors = u.splitValues(selector, ',')

  onClick: (event, link) =>
    if up.link.shouldProcessEvent(event, link)
      # Instant links should not have a `click` event.
      # This would trigger the browsers default follow-behavior and possibly activate JS libs.
      # A11Y: We also need to check whether the [up-instant] behavior did trigger on mousedown.
      # Keyboard navigation will not necessarily trigger a mousedown event.
      if e.matches(link, '[up-instant]') && link.upInstantSupported
        up.event.halt(event)
        link.upInstantSupported = false
        return # return undefined since u.muteRejection() will try to call catch() on a given value
      else
        up.event.consumeAction(event)
        @followLink(link)
    else
      # For tests
      up.link.allowDefault(event)

  onMousedown: (event, link) =>
    if up.link.shouldProcessEvent(event, link)
      # A11Y: Keyboard navigation will not necessarily trigger a mousedown event.
      # We also don't want to listen to the enter key, since some screen readers
      # use the enter key for something else.
      link.upInstantSupported = true
      up.event.consumeAction(event)
      @followLink(link)

  fullSelector: (additionalClause = '') =>
    parts = []
    @selectors.forEach (variantSelector) ->
      for tagSelector in ['a', '[up-href]']
        parts.push "#{tagSelector}#{variantSelector}#{additionalClause}"
    parts.join(', ')

  registerEvents: ->
    up.on 'click', @fullSelector(), (args...) =>
      u.muteRejection @onClick(args...)
    up.on 'mousedown', @fullSelector('[up-instant]'), (args...) =>
      u.muteRejection @onMousedown(args...)

  followLink: (link, options = {}) =>
    promise = up.event.whenEmitted('up:link:follow', log: 'Following link', target: link)
    promise = promise.then =>
      up.feedback.start(link) unless options.preload
      @followNow(link, options)
    unless options.preload
      # Make sure we always remove .up-active, even if the follow fails or the user
      # does not confirm an [up-confirm] link. However, don't re-assign promise
      # to the result of up.always() since that would change the state of promise.
      u.always promise, -> up.feedback.stop(link)
    promise

  matchesLink: (link) =>
    e.matches(link, @fullSelector())
