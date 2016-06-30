###*
Tooltips
========

Unpoly comes with a basic tooltip implementation.

You can an [`up-tooltip`](/up-tooltip) attribute to any HTML tag to show a tooltip whenever
  the user hovers over the element:

      <a href="/decks" up-tooltip="Show all decks">Decks</a>


\#\#\#\# Styling

The [default styles](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/up/tooltip.css.sass)
show a simple tooltip with white text on a gray background.
A gray triangle points to the element.

To change the styling, simply override CSS rules for the `.up-tooltip` selector and its `:after`
selector that is used the triangle.

The HTML of a tooltip element is simply this:

    <div class="up-tooltip">
      Show all decks
    </div>

The tooltip element is appended to the end of `<body>`.

@class up.tooltip
###
up.tooltip = (($) ->
  
  u = up.util

  ###*
  Sets default options for future tooltips.

  @property up.tooltip.config
  @param {String} [config.position]
    The default position of tooltips relative to the element.
    Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
  @param {String} [config.openAnimation='fade-in']
    The animation used to open a tooltip.
  @param {String} [config.closeAnimation='fade-out']
    The animation used to close a tooltip.
  @param {Number} [config.openDuration]
    The duration of the open animation (in milliseconds).
  @param {Number} [config.closeDuration]
    The duration of the close animation (in milliseconds).
  @param {String} [config.openEasing]
    The timing function controlling the acceleration of the opening animation.
  @param {String} [config.closeEasing]
    The timing function controlling the acceleration of the closing animation.
  @stable
  ###
  config = u.config
    position: 'top'
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    openDuration: 100
    closeDuration: 50
    openEasing: null
    closeEasing: null

  state = u.config
    phase: 'closed'      # can be 'opening', 'opened', 'closing' and 'closed'
    $anchor: null        # the element to which the tooltip is anchored
    $tooltip: null       # the tooltiop element
    position: null       # the position of the tooltip element relative to its anchor
    whenActionDone: null # a promise for the current opening/closing animation's end
    nextAction: null     # a function that will be called when the current action completes

  reset = ->
    # Destroy the tooltip container regardless whether it's currently in a closing animation
    close(animation: false).then ->
      state.reset()
      config.reset()

  align = ->
    css = {}
    tooltipBox = u.measure(state.$tooltip)

    if u.isFixed(state.$anchor)
      linkBox = state.$anchor.get(0).getBoundingClientRect()
      css['position'] = 'fixed'
    else
      linkBox = u.measure(state.$anchor)

    switch state.position
      when "top"
        css['top'] = linkBox.top - tooltipBox.height
        css['left'] = linkBox.left + 0.5 * (linkBox.width - tooltipBox.width)
      when "left"
        css['top'] = linkBox.top + 0.5 * (linkBox.height - tooltipBox.height)
        css['left'] = linkBox.left - tooltipBox.width
      when "right"
        css['top'] = linkBox.top + 0.5 * (linkBox.height - tooltipBox.height)
        css['left'] = linkBox.left + linkBox.width
      when "bottom"
        css['top'] = linkBox.top + linkBox.height
        css['left'] = linkBox.left + 0.5 * (linkBox.width - tooltipBox.width)
      else
        u.error("Unknown position option '%s'", state.position)

    state.$tooltip.attr('up-position', state.position)
    state.$tooltip.css(css)

  createElement = (options) ->
    $element = u.$createElementFromSelector('.up-tooltip')
    if u.isGiven(options.text)
      $element.text(options.text)
    else
      $element.html(options.html)
    $element.appendTo(document.body)
    $element

  ###*
  Opens a tooltip over the given element.

      up.tooltip.attach('.help', {
        html: 'Enter multiple words or phrases'
      });
  
  @function up.tooltip.attach
  @param {Element|jQuery|String} elementOrSelector
  @param {String} [options.html]
    The HTML to display in the tooltip.
  @param {String} [options.position='top']
    The position of the tooltip.
    Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
  @param {String} [options.animation]
    The animation to use when opening the tooltip.
  @return {Promise}
    A promise that will be resolved when the tooltip's opening animation has finished.
  @stable
  ###
  attach = (elementOrSelector, options = {}) ->
    $anchor = $(elementOrSelector)
    html = u.option(options.html, $anchor.attr('up-tooltip-html'))
    text = u.option(options.text, $anchor.attr('up-tooltip'))
    position = u.option(options.position, $anchor.attr('up-position'), config.position)
    animation = u.option(options.animation, u.castedAttr($anchor, 'up-animation'), config.openAnimation)
    animateOptions = up.motion.animateOptions(options, $anchor, duration: config.openDuration, easing: config.openEasing)

    whenOpened = $.Deferred()

    openNow = ->
      state.phase = 'opening'
      state.$anchor = $anchor
      state.$tooltip = createElement(text: text, html: html)
      state.position = position
      align()
      state.whenActionDone = up.animate(state.$tooltip, animation, animateOptions)
      state.whenActionDone.then ->
        state.phase = 'opened'
        whenOpened.resolve()
        doNextAction()
        return

    switch state.phase
      when 'closed'
        # We don't need to wait for anyone.
        # We can start the opening animation immediately.
        openNow()
      when 'closing'
        # Someone else has started a closing animation before us.
        # We schedule ourselves after the closing animation has finished.
        state.nextAction = openNow
      when 'opening'
        # Someone else has started an opening animation before us.
        # We schedule a closing and then re-opening after the current opening animation has finished.
        state.nextAction = ->
          state.nextAction = openNow
          close()
      when 'opened'
        # We are currently showing another tooltip.
        # We start to close it and schedule re-opening after the closing animation has finished.
        state.nextAction = openNow
        close()

    whenOpened.promise()

  ###*
  Perform an action that is scheduled after the current opening or closing has finished.
  Does nothing if nothing is scheduled.

  @function doNextAction
  @internal
  ###
  doNextAction = ->
    if state.nextAction
      action = state.nextAction # give it another name before we set it to undefined
      state.nextAction = null
      action()

  ###*
  Closes a currently shown tooltip.
  Does nothing if no tooltip is currently shown.
  
  @function up.tooltip.close
  @param {Object} options
    See options for [`up.animate`](/up.animate).
  @return {Promise}
    A promise for the end of the closing animation.
  @stable
  ###
  close = (options) ->
    options = u.options(options, animation: config.closeAnimation)
    animateOptions = up.motion.animateOptions(options, duration: config.closeDuration, easing: config.closeEasing)
    options = u.merge(options, animateOptions)

    whenClosed = undefined

    whenDestroyed = $.Deferred()
    destroyElement = ->
      state.phase = 'closing'
      state.whenActionDone = up.destroy(state.$tooltip, options)
      state.whenActionDone.then ->
        state.phase = 'closed'
        state.$tooltip = null
        state.$anchor = null
        whenDestroyed.resolve()
        doNextAction()
        return

    switch state.phase
      when 'closed'
        # No tooltip is visible.
        # We do nothing.
        whenClosed = u.resolvedPromise()
      when 'closing'
        # Someone else has started a closing animation before us.
        # We do nothing.
        whenClosed = state.whenActionDone
      when 'opening'
        # Someone else has started an opening animation before us.
        # We schedule the closing after the opening animation has finished.
        state.nextAction = destroyElement
        whenClosed = whenDestroyed.promise()
      when 'opened'
        # A tooltip is currently shown.
        # We start closing the tooltip.
        destroyElement()
        whenClosed = whenDestroyed.promise()

    whenClosed

  ###*
  Displays a tooltip with text content when hovering the mouse over this element:

      <a href="/decks" up-tooltip="Show all decks">Decks</a>

  To make the tooltip appear below the element instead of above the element,
  add an `up-position` attribute:

      <a href="/decks" up-tooltip="Show all decks" up-position="bottom">Decks</a>

  @selector [up-tooltip]
  @param {String} [up-animation]
    The animation used to open the tooltip.
    Defaults to [`up.tooltip.config.openAnimation`](/up.tooltip.config).
  @param {String} [up-position]
    The default position of tooltips relative to the element.
    Can be either `"top"` or `"bottom"`.
    Defaults to [`up.tooltip.config.position`](/up.tooltip.config).
  @stable
  ###

  ###*
  Displays a tooltip with HTML content when hovering the mouse over this element:

      <a href="/decks" up-tooltip-html="Show &lt;b&gt;all&lt;/b&gt; decks">Decks</a>

  @selector [up-tooltip-html]
  @stable
  ###
  up.compiler('[up-tooltip], [up-tooltip-html]', ($opener) ->
    # Don't register these events on document since *every*
    # mouse move interaction  bubbles up to the document. 
    $opener.on('mouseenter', -> attach($opener))
    $opener.on('mouseleave', -> close())
  )

  # Close the tooltip when someone clicks anywhere.
  up.on('click', 'body', (event, $body) ->
    close()
  )

  # The framework is reset between tests, so also close
  # a currently open tooltip.
  up.on 'up:framework:reset', reset

  # Close the tooltip when the user presses ESC.
  up.bus.onEscape(-> close())


  config: config
  attach: attach
  close: close
  open: -> u.error('up.tooltip.open no longer exists. Use up.tooltip.attach instead.')

)(jQuery)
