###*
Tooltips
========
  
TODO: Write some documentation.

@class up.tooltip
###
up.tooltip = (->
  
  u = up.util

  position = ($link, $tooltip, origin) ->
    linkBox = u.measure($link)
    tooltipBox = u.measure($tooltip)
    css = switch origin
      when "top"
        left: linkBox.left + 0.5 * (linkBox.width - tooltipBox.width)
        top: linkBox.top - tooltipBox.height
      when "bottom"
        left: linkBox.left + 0.5 * (linkBox.width - tooltipBox.width)
        top: linkBox.top + linkBox.height
      else
        u.error("Unknown origin", origin)
    $tooltip.attr('up-origin', origin)
    $tooltip.css(css)

  createElement = (html) ->
    u.$createElementFromSelector('.up-tooltip')
      .html(html)
      .appendTo(document.body)

  ###*
  Opens a tooltip.
  
  @method up.tooltip.open
  @param {Element|jQuery|String} elementOrSelector
  @param {String} html
  @param {String} [options.origin='top']
  @param {String} [options.animation]
  ###
  open = (linkOrSelector, options = {}) ->
    $link = $(linkOrSelector)
    html = u.option(options.html, $link.attr('up-tooltip'))
    origin = u.option(options.origin, $link.attr('up-origin'), 'top')
    animation = u.option(options.animation, $link.attr('up-animation'), 'fade-in')
    close()
    $tooltip = createElement(html)
    position($link, $tooltip, origin)
    up.animate($tooltip, animation, options)

  ###*
  Closes a currently shown tooltip.
  Does nothing if no tooltip is currently shown.
  
  @method up.tooltip.close
  @param {Object} options
    See options for {{#crossLink "up.motion/up.animate"}}{{/crossLink}}.
  ###
  close = (options) ->
    $tooltip = $('.up-tooltip')
    if $tooltip.length
      options = u.options(options, animation: 'fade-out')
      up.destroy($tooltip, options)


  ###*
  @method [up-tooltip]
  @example
      <a href="/decks" up-tooltip="Show all decks">Decks</a>
  ###
  up.awaken('[up-tooltip]', ($link) ->
    # Don't register these events on document since *every*
    # mouse move interaction  bubbles up to the document. 
    $link.on('mouseover', -> open($link))
    $link.on('mouseout', -> close())
  )

  # Close the tooltip when someone clicks anywhere.
  up.on('click', 'body', (event, $body) ->
    close()
  )

  # Close the tooltip when the user presses ESC.
  up.magic.onEscape(-> close())

  open: open
  close: close

)()
