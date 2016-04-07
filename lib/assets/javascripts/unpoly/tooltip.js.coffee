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
  @stable
  ###
  config = u.config
    position: 'top'
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'

  reset = ->
    # Destroy the tooltip container regardless whether it's currently in a closing animation
    close(animation: false)
    config.reset()

  setPosition = ($link, $tooltip, position) ->
    linkBox = u.measure($link)
    tooltipBox = u.measure($tooltip)
    css = switch position
      when "top"
        left: linkBox.left + 0.5 * (linkBox.width - tooltipBox.width)
        top: linkBox.top - tooltipBox.height
      when "left"
        left: linkBox.left - tooltipBox.width
        top: linkBox.top + 0.5 * (linkBox.height - tooltipBox.height)
      when "right"
        left: linkBox.left + linkBox.width
        top: linkBox.top + 0.5 * (linkBox.height - tooltipBox.height)
      when "bottom"
        left: linkBox.left + 0.5 * (linkBox.width - tooltipBox.width)
        top: linkBox.top + linkBox.height
      else
        u.error("Unknown position option '%s'", position)
    $tooltip.attr('up-position', position)
    $tooltip.css(css)

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
  attach = (linkOrSelector, options = {}) ->
    $link = $(linkOrSelector)
    html = u.option(options.html, $link.attr('up-tooltip-html'))
    text = u.option(options.text, $link.attr('up-tooltip'))
    position = u.option(options.position, $link.attr('up-position'), config.position)
    animation = u.option(options.animation, u.castedAttr($link, 'up-animation'), config.openAnimation)
    animateOptions = up.motion.animateOptions(options, $link)
    close()
    $tooltip = createElement(text: text, html: html)
    setPosition($link, $tooltip, position)
    up.animate($tooltip, animation, animateOptions)

  ###*
  Closes a currently shown tooltip.
  Does nothing if no tooltip is currently shown.
  
  @function up.tooltip.close
  @param {Object} options
    See options for [`up.animate`](/up.animate).
  @stable
  ###
  close = (options) ->
    $tooltip = $('.up-tooltip')
    if $tooltip.length
      options = u.options(options, animation: config.closeAnimation)
      options = u.merge(options, up.motion.animateOptions(options))
      up.destroy($tooltip, options)

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
  up.compiler('[up-tooltip], [up-tooltip-html]', ($link) ->
    # Don't register these events on document since *every*
    # mouse move interaction  bubbles up to the document. 
    $link.on('mouseover', -> attach($link))
    $link.on('mouseout', -> close())
  )

  # Close the tooltip when someone clicks anywhere.
  up.on('click', 'body', (event, $body) ->
    close()
  )

  # The framework is reset between tests, so also close
  # a currently open tooltip.
  up.on 'up:framework:reset', close

  # Close the tooltip when the user presses ESC.
  up.bus.onEscape(-> close())

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  attach: attach
  close: close
  open: -> u.error('up.tooltip.open no longer exists. Use up.tooltip.attach instead.')

)(jQuery)
