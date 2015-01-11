###*
Pop-up overlays.
  
For modal dialogs see {{#crossLink "up.modal"}}{{/crossLink}}.
  
@class up.popup 
###
up.popup = (->
  
  position = ($link, $popup, origin) ->
    linkBox = up.util.measure($link, full: true)
    css = switch origin
      when "bottom-right"
        right: linkBox.right
        top: linkBox.top + linkBox.height
      when "bottom-left"
        left: linkBox.left
        top: linkBox.bottom + linkBox.height
      when "top-right"
        right: linkBox.right
        bottom: linkBox.top
      when "top-left"
        left: linkBox.left
        bottom: linkBox.top
      else
        up.util.error("Unknown origin", origin)
    $popup.attr('up-origin', origin)
    $popup.css(css)
    ensureInViewport($popup)

  ensureInViewport = ($popup) ->
    box = up.util.measure($popup, full: true)
    errorX = null
    errorY = null
    if box.right < 0
      errorX = -box.right  # errorX is positive
    if box.bottom < 0
      errorY = -box.bottom # errorY is positive
    if box.left < 0
      errorX = box.left # errorX is negative
    if box.top < 0
      errorY = box.top # errorY is negative
    if errorX
      # We use parseInt to:
      # 1) convert "50px" to 50
      # 2) convert "auto" to NaN
      if left = parseInt($popup.css('left'))
        $popup.css('left', left - errorX)
      else if right = parseInt($popup.css('right'))
        $popup.css('right', right + errorX)
    if errorY
      if top = parseInt($popup.css('top'))
        $popup.css('top', top - errorY)
      else if bottom = parseInt($popup.css('bottom'))
        $popup.css('bottom', bottom + errorY)
    
    
  createHiddenPopup = ($link, selector, sticky) ->
    $popup = up.util.$createElementFromSelector('.up-popup')
    $popup.attr('up-sticky', '') if sticky
    $content = up.util.$createElementFromSelector(selector)
    $content.appendTo($popup)
    $popup.appendTo(document.body)
    $popup.hide()
    $popup
    
  updated = ($link, $popup, origin, animation) ->
    $popup.show()
    position($link, $popup, origin)
    up.animate($popup, animation)
    
  ###*
  Opens a popup overlay.
  
  @method up.popup.open
  @param {Element|jQuery|String} elementOrSelector
  @param {String} [options.origin='bottom-right']
  @param {String} [options.animation]
  @param {Boolean} [options.sticky=false]
    If set to `true`, the popup remains
    open even if the page changes in the background.
  @param {Object} [options.history=false]
  @example
      <a href="/decks" up-popup=".deck_list">Switch deck</a>
  @example
      <a href="/settings" up-popup=".options" up-popup-sticky>Settings</a>  
  ###
  open = (linkOrSelector, options = {}) ->
    $link = $(linkOrSelector)

    url = up.util.presentAttr($link, 'href')
    selector = options.target || $link.attr('up-popup') || 'body'
    origin = options.origin || $link.attr('up-origin') || 'bottom-right'
    animation = options.animation || $link.attr('up-animation') || 'roll-down'
    sticky = options.sticky || $link.is('[up-sticky]')
    history = options.history || false

    close()
    $popup = createHiddenPopup($link, selector, sticky)
    
#    console.log("before replace", $link, $popup)
    
    up.replace(selector, url,
      history: history
      source: true
      insert: -> updated($link, $popup, origin, animation) 
    )
    
  ###*
  Returns the source URL for the fragment displayed
  in the current popup overlay, or `undefined` if no
  popup is open.
  
  @method up.popup.source
  @return {String}
    the source URL
  ###
  source = ->
    $popup = $('.up-popup')
    unless $popup.is('.up-destroying')
      $popup.find('[up-source]').attr('up-source')

  ###*
  Closes a currently opened popup overlay.
  Does nothing if no popup is currently open.
  
  @method up.popup.close
  @param {Object} options
    See options for {{#crossLink "up.motion/up.animate"}}{{/crossLink}}.
  ###
  close = (options) ->
    $popup = $('.up-popup')
    if $popup.length
      options = up.util.options(options, animation: 'fade-out')
      up.destroy($popup, options)
    
  autoclose = ->
    unless $('.up-popup').is('[up-sticky]')
      close()
    

  up.on('click', '[up-popup]', (event, $link) ->
    event.preventDefault()
    if $link.is('.up-current')
      close()
    else
      open($link)
  )

  # Close the popup when someone clicks outside the popup
  up.on('click', 'body', (event, $body) ->
    $target = $(event.target)
    unless $target.closest('.up-popup').length || $target.closest('[up-popup]').length
      close()
  )
  
  up.bus.on('fragment:ready', ($fragment) ->
    unless $fragment.closest('.up-popup').length
      autoclose()
  )
  
  # Close the pop-up overlay when the user presses ESC.
  up.magic.onEscape(-> close())
  
  up.on('click', '[up-close]', (event, $element) ->
    if $element.closest('.up-popup')
      close()
  )
  
  open: open
  close: close
  source: source
  
)()
