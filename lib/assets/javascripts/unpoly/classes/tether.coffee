u = up.util
e = up.element

class up.Tether

  constructor: (options) ->
    up.migrate.handleTetherOptions?(options)
    @anchor = options.anchor
    @align = options.align
    @position = options.position

    @alignAxis = if @position == 'top' || @position == 'bottom' then 'horizontal' else 'vertical'

    @viewport = up.viewport.get(@anchor)
    # The document viewport is <html> on some browsers, and we cannot attach children to that.
    @parent = if @viewport == e.root then document.body else @viewport

    # If the offsetParent is within the viewport (or is the viewport) we can simply
    # `position: absolute` and it will move as the viewport scrolls, without JavaScript.
    # If not however, we have no choice but to move it on every scroll event.
    @syncOnScroll = !@viewport.contains(@anchor.offsetParent)

  start: (@element) ->
    @element.style.position = 'absolute'
    @setOffset(0, 0)
    @sync()
    @changeEventSubscription('on')

  stop: ->
    @changeEventSubscription('off')

  changeEventSubscription: (fn) ->
    up[fn](window, 'resize', @scheduleSync)
    up[fn](@viewport, 'scroll', @scheduleSync) if @syncOnScroll

  scheduleSync: =>
    clearTimeout(@syncTimer)
    @syncTimer = u.task(@sync)

  isDetached: ->
    e.isDetached(@parent) || e.isDetached(@anchor)

  sync: =>
    elementBox = @element.getBoundingClientRect()
    anchorBox = @anchor.getBoundingClientRect()

    left = undefined
    top = undefined

    switch @alignAxis
      when 'horizontal'
        top = switch @position
          when 'top'
            anchorBox.top - elementBox.height
          when 'bottom'
            anchorBox.top + anchorBox.height

        left = switch @align
          when 'left'
            # anchored to anchor's left, grows to the right
            anchorBox.left
          when 'center'
            # anchored to anchor's horizontal center, grows equally to left/right
            anchorBox.left + 0.5 * (anchorBox.width - elementBox.width)
          when 'right'
            # anchored to anchor's right, grows to the left
            anchorBox.left + anchorBox.width - elementBox.width

      when 'vertical'
        top = switch @align
          when 'top'
            # anchored to the top, grows to the bottom
            anchorBox.top
          when 'center'
            # anchored to anchor's vertical center, grows equally to left/right
            anchorBox.top + 0.5 * (anchorBox.height - elementBox.height)
          when 'bottom'
            # anchored to the bottom, grows to the top
            anchorBox.top + anchorBox.height - elementBox.height

        left = switch @position
          when 'left'
            anchorBox.left - elementBox.width
          when 'right'
            anchorBox.left + anchorBox.width

    if u.isDefined(left) || u.isDefined(top)
      @moveTo(left, top)
    else
      up.fail('Invalid tether constraints: %o', @describeConstraints())

  describeConstraints: ->
    { @position, @align }

  moveTo: (targetLeft, targetTop) ->
    elementBox = @element.getBoundingClientRect()
    @setOffset(
      targetLeft - elementBox.left + @offsetLeft,
      targetTop - elementBox.top + @offsetTop
    )

  setOffset: (left, top) ->
    @offsetLeft = left
    @offsetTop = top
    e.setStyle(@element, { left, top })
