###*
Pop-up overlays
===============

Instead of linking to another page fragment, you can also choose
to "roll up" any target CSS selector in a popup overlay. 
Popup overlays close themselves if the user clicks somewhere outside the
popup area. 
  
For modal dialogs see [up.modal](/up.modal) instead.
  
\#\#\# Incomplete documentation!
  
We need to work on this page:

- Show the HTML structure of the popup elements, and how to style them via CSS
- Explain how to position popup using `up-position`
- Explain how dialogs auto-close themselves when a fragment changes behind the popup layer
- Document method parameters
  
  
@class up.popup
###
up.popup = (($) ->

  u = up.util

  currentSource = undefined

  ###*
  @method up.popup.defaults
  @param {String} options.animation
  @param {String} options.position
  ###
  config = u.config
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    position: 'bottom-right'

  reset = ->
    close()
    config.reset()

  setPosition = ($link, $popup, position) ->
    linkBox = u.measure($link, full: true)
    css = switch position
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
        u.error("Unknown position %o", position)
    $popup.attr('up-position', position)
    $popup.css(css)
    ensureInViewport($popup)

  ensureInViewport = ($popup) ->
    box = u.measure($popup, full: true)
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
          
  rememberHistory = ->
    $popup = $('.up-popup')
    $popup.attr('up-previous-url', up.browser.url())
    $popup.attr('up-previous-title', document.title)
          
  discardHistory = ->
    $popup = $('.up-popup')
    $popup.removeAttr('up-previous-url')
    $popup.removeAttr('up-previous-title')
    
  createHiddenPopup = ($link, selector, sticky) ->
    $popup = u.$createElementFromSelector('.up-popup')
    $popup.attr('up-sticky', '') if sticky
    $placeholder = u.$createElementFromSelector(selector)
    $placeholder.appendTo($popup)
    $popup.appendTo(document.body)
    rememberHistory()
    $popup.hide()
    $popup
    
  updated = ($link, $popup, position, animation, animateOptions) ->
    $popup.show()
    setPosition($link, $popup, position)
    up.animate($popup, animation, animateOptions)
    
  ###*
  Opens a popup overlay.
  
  @method up.popup.open
  @param {Element|jQuery|String} elementOrSelector
  @param {String} [options.url]
  @param {String} [options.position='bottom-right']
  @param {String} [options.animation]
    The animation to use when opening the popup.
  @param {Number} [options.duration]
    The duration of the animation. See [`up.animate`](/up.motion#up.animate).
  @param {Number} [options.delay]
    The delay before the animation starts. See [`up.animate`](/up.motion#up.animate).
  @param {String} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate`](/up.motion#up.animate).
  @param {Boolean} [options.sticky=false]
    If set to `true`, the popup remains
    open even if the page changes in the background.
  @param {Object} [options.history=false]
  ###
  open = (linkOrSelector, options) ->
    $link = $(linkOrSelector)
    
    options = u.options(options)
    url = u.option(options.url, $link.attr('href'))
    selector = u.option(options.target, $link.attr('up-popup'), 'body')
    position = u.option(options.position, $link.attr('up-position'), config.position)
    animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation)
    sticky = u.option(options.sticky, u.castedAttr($link, 'up-sticky'))
    history = if up.browser.canPushState() then u.option(options.history, u.castedAttr($link, 'up-history'), false) else false
    animateOptions = up.motion.animateOptions(options, $link)

    close()
    $popup = createHiddenPopup($link, selector, sticky)
    
    up.replace(selector, url,
      history: history
      insert: -> updated($link, $popup, position, animation, animateOptions)
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
    currentSource

  ###*
  Closes a currently opened popup overlay.
  Does nothing if no popup is currently open.
  
  @method up.popup.close
  @param {Object} options
    See options for [`up.animate`](/up.motion#up.animate).
  ###
  close = (options) ->
    $popup = $('.up-popup')
    if $popup.length
      options = u.options(options,
        animation: config.closeAnimation,
        url: $popup.attr('up-previous-url'),
        title: $popup.attr('up-previous-title')
      )
      currentSource = undefined
      up.destroy($popup, options)
    else
      u.resolvedPromise()
    
  autoclose = ->
    unless $('.up-popup').is('[up-sticky]')
      discardHistory()
      close()

  ###*
  Returns whether the given element or selector is contained
  within the current popup.

  @methods up.popup.contains
  @param {String} elementOrSelector
  @protected
  ###
  contains = (elementOrSelector) ->
    $element = $(elementOrSelector)
    $element.closest('.up-popup').length > 0

  ###*
  Opens the target of this link in a popup overlay:

      <a href="/decks" up-modal=".deck_list">Switch deck</a>

  If the `up-sticky` attribute is set, the dialog does not auto-close
  if a page fragment below the popup overlay updates:

      <a href="/decks" up-popup=".deck_list">Switch deck</a>
      <a href="/settings" up-popup=".options" up-sticky>Settings</a>

  @method a[up-popup]
  @ujs
  @param [up-sticky]
  @param [up-position]
  ###
  up.on('click', 'a[up-popup]', (event, $link) ->
    event.preventDefault()
    if $link.is('.up-current')
      close()
    else
      open($link)
  )

  # Close the popup when someone clicks outside the popup
  # (but not on a popup opener).
  up.on('click', 'body', (event, $body) ->
    $target = $(event.target)
    unless $target.closest('.up-popup').length || $target.closest('[up-popup]').length
      close()
  )
  
  up.on('up:fragment:inserted', (event, $fragment) ->
    if contains($fragment)
      if newSource = $fragment.attr('up-source')
        currentSource = newSource
    else
      autoclose()
  )
  
  # Close the pop-up overlay when the user presses ESC.
  up.magic.onEscape(-> close())

  ###*
  When an element with this attribute is clicked,
  a currently open popup is closed. 
  
  @method [up-close]
  @ujs
  ###
  up.on('click', '[up-close]', (event, $element) ->
    if $element.closest('.up-popup').length
      close()
      # Only prevent the default when we actually closed a popup.
      # This way we can have buttons that close a popup when within a popup,
      # but link to a destination if not.
      event.preventDefault()
  )

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  open: open
  close: close
  source: source
  defaults: config.update
  contains: contains
  
)(jQuery)
