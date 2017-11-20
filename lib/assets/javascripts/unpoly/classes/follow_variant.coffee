u = up.util

class up.FollowVariant

  constructor: (@selector, @followNow) ->

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
    "a#{@selector}#{additionalClause}, [up-href]#{@selector}#{additionalClause}"

  registerEvents: ->
    up.on 'click', @fullSelector(), (args...) =>
      @onClick(args...)
    up.on 'mousedown', @fullSelector('[up-instant]'), (args...) =>
      @onMousedown(args...)

  shouldProcessLinkEvent: (event, $link) =>
    u.isUnmodifiedMouseEvent(event) && !up.link.childClicked(event, $link)

  followLink: ($link, options = {}) =>
    up.feedback.start $link, =>
      @followNow($link, options)

  matchesLink: ($link) =>
    $link.is(@fullSelector())
