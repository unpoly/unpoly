###*
Pop-up overlays
===============

Instead of [linking to a page fragment](/up.link), you can choose
to show a fragment in a popup overlay that rolls down from an anchoring element.

To open a popup, add an [`up-popup` attribute](/a-up-popup) to a link,
or call the Javascript function [`up.popup.attach`](/up.popup.attach).

For modal dialogs see [up.modal](/up.modal) instead.

\#\#\#\# Customizing the popup design

Loading the Up.js stylesheet will give you a minimal popup design:

- Popup contents are displayed in a white box
- There is a a subtle box shadow around the popup
- The box will grow to fit the popup contents

The easiest way to change how the popup looks is by overriding the [default CSS styles](https://github.com/makandra/upjs/blob/master/lib/assets/stylesheets/up/popup.css.sass).

By default the popup uses the following DOM structure:

    <div class="up-popup">
      ...
    </div>

\#\#\#\# Closing behavior

The popup closes when the user clicks anywhere outside the popup area.

By default the popup also closes
*whenever a page fragment below the popup is updated*.
This is useful to have the popup interact with the page that
opened it, e.g. by updating parts of a larger form or by signing in a user
and revealing additional information.

To disable this behavior, give the opening link an `up-sticky` attribute:

    <a href="/settings" up-popup=".options" up-sticky>Settings</a>

@class up.popup
###
up.popup = (($) ->

  u = up.util

  ###*
  Returns the source URL for the fragment displayed
  in the current popup, or `undefined` if no  popup is open.

  @function up.popup.url
  @return {String}
    the source URL
  @stable
  ###
  currentUrl = undefined

  ###*
  Returns the URL of the page or modal below the popup.

  @function up.popup.coveredUrl
  @return {String}
  @experimental
  ###
  coveredUrl = ->
    $popup = $('.up-popup')
    $popup.attr('up-covered-url')

  ###*
  Sets default options for future popups.

  @property up.popup.config
  @param {String} [config.openAnimation='fade-in']
    The animation used to open a popup.
  @param {String} [config.closeAnimation='fade-out']
    The animation used to close a popup.
  @param {String} [config.position='bottom-right']
    Defines where the popup is attached to the opening element.

    Valid values are `bottom-right`, `bottom-left`, `top-right` and `top-left`.
  @stable
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
    $popup.attr('up-covered-url', up.browser.url())
    $popup.attr('up-covered-title', document.title)
          
  discardHistory = ->
    $popup = $('.up-popup')
    $popup.removeAttr('up-covered-url')
    $popup.removeAttr('up-covered-title')
    
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
  Attaches a popup overlay to the given element or selector.
  
  @function up.popup.attach
  @param {Element|jQuery|String} elementOrSelector
  @param {String} [options.url]
  @param {String} [options.position='bottom-right']
  @param {String} [options.animation]
    The animation to use when opening the popup.
  @param {Number} [options.duration]
    The duration of the animation. See [`up.animate`](/up.animate).
  @param {Number} [options.delay]
    The delay before the animation starts. See [`up.animate`](/up.animate).
  @param {String} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate`](/up.animate).
  @param {Boolean} [options.sticky=false]
    If set to `true`, the popup remains
    open even if the page changes in the background.
  @param {Object} [options.history=false]
  @return {Promise}
    A promise that will be resolved when the popup has been loaded and rendered.
  @stable
  ###
  attach = (linkOrSelector, options) ->
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
  Closes a currently opened popup overlay.

  Does nothing if no popup is currently open.

  Emits events [`up:popup:close`](/up:popup:close) and [`up:popup:closed`](/up:popup:closed).

  @function up.popup.close
  @param {Object} options
    See options for [`up.animate`](/up.animate).
  @return {Deferred}
    A promise that will be resolved once the modal's close
    animation has finished.
  @stable
  ###
  close = (options) ->
    $popup = $('.up-popup')
    if $popup.length
      if up.bus.nobodyPrevents('up:popup:close', $element: $popup)
        options = u.options(options,
          animation: config.closeAnimation,
          url: $popup.attr('up-covered-url'),
          title: $popup.attr('up-covered-title')
        )
        currentUrl = undefined
        deferred = up.destroy($popup, options)
        deferred.then -> up.emit('up:popup:closed')
        deferred
      else
        # Although someone prevented the destruction,
        # keep a uniform API for callers by returning
        # a Deferred that will never be resolved.
        u.unresolvableDeferred()
    else
      u.resolvedDeferred()

  ###*
  This event is [emitted](/up.emit) when a popup dialog
  is starting to [close](/up.popup.close).

  @event up:popup:close
  @param event.preventDefault()
    Event listeners may call this method to prevent the popup from closing.
  @stable
  ###

  ###*
  This event is [emitted](/up.emit) when a popup dialog
  is done [closing](/up.popup.close).

  @event up:popup:closed
  @stable
  ###
      
  autoclose = ->
    unless $('.up-popup').is('[up-sticky]')
      discardHistory()
      close()

  ###*
  Returns whether the given element or selector is contained
  within the current popup.

  @methods up.popup.contains
  @param {String} elementOrSelector
  @stable
  ###
  contains = (elementOrSelector) ->
    $element = $(elementOrSelector)
    $element.closest('.up-popup').length > 0

  ###*
  Opens this link's destination of in a popup overlay:

      <a href="/decks" up-popup=".deck_list">Switch deck</a>

  If the `up-sticky` attribute is set, the dialog does not auto-close
  if a page fragment below the popup overlay updates:

      <a href="/decks" up-popup=".deck_list">Switch deck</a>
      <a href="/settings" up-popup=".options" up-sticky>Settings</a>

  @selector a[up-popup]
  @param [up-sticky]
  @param [up-position]
  @stable
  ###
  up.on('click', 'a[up-popup]', (event, $link) ->
    event.preventDefault()
    if $link.is('.up-current')
      close()
    else
      attach($link)
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
        currentUrl = newSource
    else
      autoclose()
  )
  
  # Close the pop-up overlay when the user presses ESC.
  up.bus.onEscape(-> close())

  ###*
  When an element with this attribute is clicked,
  a currently open popup is closed.

  Does nothing if no popup is currently open.

  To make a link that closes the current popup, but follows to
  a fallback destination if no popup is open:

      <a href="/fallback" up-close>Okay</a>

  @selector [up-close]
  @stable
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

  attach: attach
  close: close
  url: -> currentUrl
  coveredUrl: coveredUrl
  config: config
  defaults: -> u.error('up.popup.defaults(...) no longer exists. Set values on he up.popup.config property instead.')
  contains: contains
  open: -> up.error('up.popup.open no longer exists. Please use up.popup.attach instead.')
  source: -> up.error('up.popup.source no longer exists. Please use up.popup.url instead.')

)(jQuery)
