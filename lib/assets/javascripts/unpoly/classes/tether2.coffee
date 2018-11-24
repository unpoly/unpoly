u = up.util
e = up.element

class up.Tether2

  constructor: (options) ->
    @anchor = options.anchor
    @position = options.position
    @viewport = up.layout.viewportOf(@anchor)
    @parent = if @viewport == document.documentElement then document.body else @viewport
    @offsetParent = up.util.offsetParent(@anchor)

    # If the offsetParent is within the viewport (or is the viewport)
    # we can simply absolutely position it and it will move as the viewport scrolls.
    # If not however, we have no choice but to move it on every scroll event.
    @alignAtScroll = !@viewport.contains(@offsetParent)

    console.debug("will alignAtScroll: %o (viewport = %o, offsetParent = %o)", @alignAtScroll, @viewport, @offsetParent)

    @offsetLeft = 0
    @offsetTop = 0

    @root = e.affix(@parent, 'div', 'up-position': @position, class: ['up-bounds', options.class])

    @changeEventSubscription('on')

  destroy: ->
    e.remove(@root)
    @changeEventSubscription('off')

  changeEventSubscription: (fn) ->
    e[fn](window, 'resize', @scheduleAlign)
    e[fn](@viewport, ['scroll', 'up:tether:align'], @scheduleAlign) if @alignAtScroll

  scheduleAlign: =>
    clearTimeout(@alignTimer)
    @alignTimer = u.nextFrame(@align)

  align: =>
    rootBox = @root.getBoundingClientRect()
    anchorBox = @anchor.getBoundingClientRect()

    switch @position
      when 'top'
        @moveTo(
          anchorBox.left + 0.5 * (anchorBox.width - rootBox.width),
          anchorBox.top - rootBox.height
        )
      when 'left'
        @moveTo(
          anchorBox.left - rootBox.width,
          anchorBox.top + 0.5 * (anchorBox.height - rootBox.height)
        )
      when 'right'
        @moveTo(
          anchorBox.left + anchorBox.width,
          anchorBox.top + 0.5 * (anchorBox.height - rootBox.height)
        )
      when 'bottom'
        @moveTo(
          anchorBox.left + 0.5 * (anchorBox.width - rootBox.width),
          anchorBox.top + anchorBox.height
        )
      when 'bottom-right' # anchored to bottom-right of link, opens towards bottom-left
        @moveTo(
          anchorBox.left + anchorBox.width - rootBox.width,
          anchorBox.top + anchorBox.height
        )
      when 'bottom-left' # anchored to bottom-left of link, opens towards bottom-right
        @moveTo(
          anchorBox.left,
          anchorBox.top + anchorBox.height
        )
      when 'top-right' # anchored to top-right of link, opens to top-left
        @moveTo(
          anchorBox.left + anchorBox.width - rootBox.width,
          anchorBox.top - rootBox.height
        )
      when 'top-left' # anchored to top-left of link, opens to top-right
        @moveTo(
          anchorBox.left,
          anchorBox.top - rootBox.height
        )
      else
        up.fail("Unknown position: %o", @position)

  moveTo: (targetLeft, targetTop) ->
    rootBox = @root.getBoundingClientRect()

    @offsetLeft = targetLeft - rootBox.left + @offsetLeft
    @offsetTop = targetTop - rootBox.top + @offsetTop

    u.writeInlineStyle(@root, marginLeft: @offsetLeft, marginTop: @offsetTop)
