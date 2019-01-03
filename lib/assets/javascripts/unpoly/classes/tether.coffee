u = up.util
e = up.element

class up.Tether

  constructor: (options) ->
    @anchor = options.anchor
    @position = options.position
    @viewport = up.viewport.closest(@anchor)
    @parent = if @viewport == e.root() then document.body else @viewport

    # If the offsetParent is within the viewport (or is the viewport)
    # we can simply absolutely position it and it will move as the viewport scrolls.
    # If not however, we have no choice but to move it on every scroll event.
    @alignAtScroll = !@viewport.contains(@anchor.offsetParent)

    @root = e.affix(@parent, '.up-bounds')
    @setBoundsOffset(0, 0)

    @changeEventSubscription('on')

  destroy: ->
    e.remove(@root)
    @changeEventSubscription('off')

  changeEventSubscription: (fn) ->
    up[fn](window, 'resize', @scheduleAlign)
    up[fn](@viewport, 'scroll up:tether:align', @scheduleAlign) if @alignAtScroll

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
    @setBoundsOffset(
      targetLeft - rootBox.left + @offsetLeft,
      targetTop - rootBox.top + @offsetTop
    )

  setBoundsOffset: (left, top) ->
    @offsetLeft = left
    @offsetTop = top
    e.setStyle(@root, { left, top })
