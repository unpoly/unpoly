u = up.util
e = up.element

class up.Tether

  constructor: (options) ->
    @element = options.element or u.fail("Missing { element } option")
    @anchor = options.anchor or u.fail("Missing { anchor } option")

    [@position, @align] = options.position.split('-')
    if @align
      up.legacy.warn('The position value %o is deprecated. Use %o instead.', options.position, @describeConstraints())
    else
      @align = options.align

    @alignAxis = if @position == 'top' || @position == 'bottom' then 'horizontal' else 'vertical'

    @viewport = up.viewport.closest(@anchor)
    @element.classList.add('.up-bounds')
    @setBoundsOffset(0, 0)

    @changeEventSubscription('on')

  stop: ->
    @changeEventSubscription('off')

  changeEventSubscription: (fn) ->
    up[fn](window, 'resize', @scheduleSync)
    up[fn](@viewport, 'scroll', @scheduleSync)

  scheduleSync: =>
    clearTimeout(@syncTimer)
    @syncTimer = u.task(@sync)

  sync: =>
    rootBox = @element.getBoundingClientRect()
    anchorBox = @anchor.getBoundingClientRect()

    left = undefined
    top = undefined

    switch @alignAxis
      when 'horizontal'
        top = switch @position
          when 'top'
            anchorBox.top - rootBox.height
          when 'bottom'
            anchorBox.top + anchorBox.height

        left = switch @align
          when 'left'
            # anchored to anchor's left, grows to the right
            anchorBox.left
          when 'center'
            # anchored to anchor's horizontal center, grows equally to left/right
            anchorBox.left + 0.5 * (anchorBox.width - rootBox.width)
          when 'right'
            # anchored to anchor's right, grows to the left
            anchorBox.left + anchorBox.width - rootBox.width

      when 'vertical'
        top = switch @align
          when 'top'
            # anchored to the top, grows to the bottom
            anchorBox.top
          when 'center'
            # anchored to anchor's vertical center, grows equally to left/right
            anchorBox.top + 0.5 * (anchorBox.height - rootBox.height)
          when 'bottom'
            # anchored to the bottom, grows to the top
            anchorBox.top + anchorBox.height - rootBox.height

        left = switch @position
          when 'left'
            anchorBox.left - rootBox.width
          when 'right'
            anchorBox.left + anchorBox.width

    if u.isDefined(left) || u.isDefined(top)
      @moveTo(left, top)
    else
      up.fail('Invalid tether constraints: %o', @describeConstraints())

  describeConstraints: ->
    { @position, @align }

  moveTo: (targetLeft, targetTop) ->
    rootBox = @element.getBoundingClientRect()
    @setBoundsOffset(
      targetLeft - rootBox.left + @offsetLeft,
      targetTop - rootBox.top + @offsetTop
    )

  setBoundsOffset: (left, top) ->
    @offsetLeft = left
    @offsetTop = top
    e.setStyle(@element, { left, top })
