u = up.util

class up.FollowVariant

  constructor: (selector, options) ->
    @followNow = options.follow
    @preloadNow = options.preload
    @selectors = selector.split(/\s*,\s*/)

  onClick: (event, $link) =>
    if @shouldProcessLinkEvent(event, $link)
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
    if @shouldProcessLinkEvent(event, $link)
      up.bus.consumeAction(event)
      @followLink($link)

  fullSelector: (additionalClause = '') =>
    parts = []
    @selectors.forEach (variantSelector) ->
      ['a', '[up-href]'].forEach (tagSelector) ->
        parts.push "#{tagSelector}#{variantSelector}#{additionalClause}"
    parts.join(', ')

  registerEvents: ->
    up.on 'click', @fullSelector(), (args...) =>
      @onClick(args...)
    up.on 'mousedown', @fullSelector('[up-instant]'), (args...) =>
      @onMousedown(args...)

  shouldProcessLinkEvent: (event, $link) =>
    u.isUnmodifiedMouseEvent(event) && !up.link.childClicked(event, $link)

  followLink: ($link, options = {}) =>
    up.feedback.start $link, options, =>
      @followNow($link, options)

  preloadLink: ($link, options = {}) =>
    @preloadNow($link, options)

  matchesLink: ($link) =>
    $link.is(@fullSelector())
