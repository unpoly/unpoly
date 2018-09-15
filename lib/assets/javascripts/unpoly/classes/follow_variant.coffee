u = up.util

class up.FollowVariant

  constructor: (selector, options) ->
    @followNow = options.follow
    @preloadNow = options.preload
    @selectors = selector.split(/\s*,\s*/)

  onClick: (event, $link) =>
    if up.link.shouldProcessEvent(event, $link)
      if $link.is('[up-instant]')
        # If the link was already processed on mousedown, we still need
        # to prevent this later click event's chain.
        up.bus.haltEvent(event)
      else
        up.bus.consumeAction(event)
        @followLink($link)
    else
      # For tests
      up.link.allowDefault(event)

  onMousedown: (event, $link) =>
    if up.link.shouldProcessEvent(event, $link)
      up.bus.consumeAction(event)
      @followLink($link)

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

  followLink: ($link, options) =>
    options = u.options(options)
    followEventAttrs = { message: 'Following link', $link: $link, $element: $link, followOptions: options }
    up.bus.whenEmitted('up:link:follow', followEventAttrs).then =>
      up.feedback.start $link, options, =>
        @followNow($link, options)

  preloadLink: ($link, options) =>
    options = u.options(options)
    @preloadNow($link, options)

  matchesLink: ($link) =>
    $link.is(@fullSelector())
