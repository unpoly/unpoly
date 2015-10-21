###*
Modal dialogs
=============

Instead of linking to another page fragment, you can also choose
to open any target CSS selector in a modal dialog.
  
For small popup overlays ("dropdowns") see [up.popup](/up.popup) instead.

@class up.modal 
###
up.modal = (->

  u = up.util

  ###*
  Sets default options for future modals.

  @method up.modal.defaults
  @param {Number} [options.width]
    The width of the dialog as a CSS value like `'400px'` or `50%`.

    Defaults to `undefined`, meaning that the dialog will grow to fit its contents
    until it reaches `options.maxWidth`. Leaving this as `undefined` will
    also allow you to control the width using CSS on `.up-modal-dialog´.
  @param {Number} [options.maxWidth]
    The width of the dialog as a CSS value like `'400px'` or `50%`.
    You can set this to `undefined` to make the dialog fit its contents.
    Be aware however, that e.g. Bootstrap stretches input elements
    to `width: 100%`, meaning the dialog will also stretch to the full
    width of the screen.
  @param {Number} [options.height='auto']
    The height of the dialog in pixels.
    Defaults to `undefined`, meaning that the dialog will grow to fit its contents.
  @param {String|Function(config)} [options.template]
    A string containing the HTML structure of the modal.
    You can supply an alternative template string, but make sure that it
    defines tag with the classes `up-modal`, `up-modal-dialog` and  `up-modal-content`.

    You can also supply a function that returns a HTML string.
    The function will be called with the modal options (merged from these defaults
    and any per-open overrides) whenever a modal opens.
  @param {String} [options.closeLabel='X']
    The label of the button that closes the dialog.
  @param {String} [options.openAnimation='fade-in']
    The animation used to open the modal. The animation will be applied
    to both the dialog box and the overlay dimming the page.
  @param {String} [options.closeAnimation='fade-out']
    The animation used to close the modal. The animation will be applied
    to both the dialog box and the overlay dimming the page.
  ###
  config = u.config
    maxWidth: undefined
    minWidth: undefined
    width: undefined
    height: undefined
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    closeLabel: '×'
    template: (config) ->
      """
      <div class="up-modal">
        <div class="up-modal-dialog">
          <div class="up-modal-close" up-close>#{config.closeLabel}</div>
          <div class="up-modal-content"></div>
        </div>
      </div>
      """

  currentSource = undefined

  reset = ->
    close()
    currentSource = undefined
    config.reset()

  templateHtml = ->
    template = config.template
    if u.isFunction(template)
      template(config)
    else
      template

  rememberHistory = ->
    $popup = $('.up-modal')
    $popup.attr('up-previous-url', up.browser.url())
    $popup.attr('up-previous-title', document.title)

  discardHistory = ->
    $popup = $('.up-modal')
    $popup.removeAttr('up-previous-url')
    $popup.removeAttr('up-previous-title')

  createHiddenModal = (options) ->
    $modal = $(templateHtml())
    $modal.attr('up-sticky', '') if options.sticky
    $modal.attr('up-previous-url', up.browser.url())
    $modal.attr('up-previous-title', document.title)
    $dialog = $modal.find('.up-modal-dialog')
    $dialog.css('width', options.width) if u.isPresent(options.width)
    $dialog.css('max-width', options.maxWidth) if u.isPresent(options.maxWidth)
    $dialog.css('height', options.height) if u.isPresent(options.height)
    $content = $modal.find('.up-modal-content')
    $placeholder = u.$createElementFromSelector(options.selector)
    $placeholder.appendTo($content)
    $modal.appendTo(document.body)
    rememberHistory()
    $modal.hide()
    $modal

  unshiftElements = []

  # Gives `<body>` a right padding in the width of a scrollbar.
  # Also gives elements anchored to the right side of the screen
  # an increased `right`.
  #
  # This is to prevent the body and elements from jumping when we add the
  # modal overlay, which has its own scroll bar.
  # This is screwed up, but Bootstrap does the same.
  shiftElements = ->
    scrollbarWidth = u.scrollbarWidth()
    bodyRightPadding = parseInt($('body').css('padding-right'))
    bodyRightShift = scrollbarWidth + bodyRightPadding
    unshiftBody = u.temporaryCss($('body'),
      'padding-right': "#{bodyRightShift}px",
      'overflow-y': 'hidden'
    )
    unshiftElements.push(unshiftBody)
    up.layout.anchoredRight().each ->
      $element = $(this)
      elementRight = parseInt($element.css('right'))
      elementRightShift = scrollbarWidth + elementRight
      unshiftElement = u.temporaryCss($element, 'right': elementRightShift)
      unshiftElements.push(unshiftElement)

  updated = ($modal, animation, animateOptions) ->
    up.bus.emit('modal:open')
    shiftElements()
    $modal.show()
    promise = up.animate($modal, animation, animateOptions)
    promise.then -> up.bus.emit('modal:opened')
    promise

  ###*
  Opens the given link's destination in a modal overlay:

      var $link = $('...');
      up.modal.open($link);

  Any option attributes for [`a[up-modal]`](#a.up-modal) will be honored.

  \#\#\#\# Events

  - Emits an [event](/up.bus) `modal:open` when the modal
    is starting to open.
  - Emits an [event](/up.bus) `modal:opened` when the opening
    animation has finished and the modal contents are fully visible.

  @method up.modal.open
  @param {Element|jQuery|String} elementOrSelector
    The link to follow.
  @param {String} [options.target]
    The selector to extract from the response and open in a modal dialog.
  @param {Number} [options.width]
    The width of the dialog in pixels.
    By [default](#up.modal.defaults) the dialog will grow to fit its contents.
  @param {Number} [options.height]
    The width of the dialog in pixels.
    By [default](#up.modal.defaults) the dialog will grow to fit its contents.
  @param {Boolean} [options.sticky=false]
    If set to `true`, the modal remains
    open even if the page changes in the background.
  @param {Object} [options.history=true]
    Whether to add a browser history entry for the modal's source URL.
  @param {String} [options.animation]
    The animation to use when opening the modal.
  @param {Number} [options.duration]
    The duration of the animation. See [`up.animate`](/up.motion#up.animate).
  @param {Number} [options.delay]
    The delay before the animation starts. See [`up.animate`](/up.motion#up.animate).
  @param {String} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate`](/up.motion#up.animate).
  @return {Promise}
    A promise that will be resolved when the modal has finished loading.
  ###

  ###*
  Opens a modal for the given URL.

  Example:

      up.modal.open({ url: '/foo', target: '.list' })

  This will request `/foo`, extract the `.list` selector from the response
  and open the selected container in a modal dialog.

  @method up.modal.open
  @param {String} options.url
    The URL to load.
  @param {String} options.target
    The CSS selector to extract from the response.
    The extracted content will be placed into the dialog window.
  @param {Object} options
    See options for [previous `up.modal.open` variant](#up.modal.open).
  ###
  open = (args...) ->
    if u.isObject(args[0]) && !u.isElement(args[0]) && !u.isJQuery(args[0])
      $link = u.nullJquery()
      options = args[0]
    else
      $link = $(args[0])
      options = args[1]

    options = u.options(options)
    url = u.option(options.url, $link.attr('up-href'), $link.attr('href'))
    selector = u.option(options.target, $link.attr('up-modal'), 'body')
    width = u.option(options.width, $link.attr('up-width'), config.width)
    maxWidth = u.option(options.maxWidth, $link.attr('up-max-width'), config.maxWidth)
    height = u.option(options.height, $link.attr('up-height'), config.height)
    animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation)
    sticky = u.option(options.sticky, u.castedAttr($link, 'up-sticky'))
    # Although we usually fall back to full page loads if a browser doesn't support pushState,
    # in the case of modals we assume that the developer would rather see a dialog
    # without an URL update.
    history = if up.browser.canPushState() then u.option(options.history, u.castedAttr($link, 'up-history'), true) else false
    animateOptions = up.motion.animateOptions(options, $link)

    close()
    $modal = createHiddenModal
      selector: selector
      width: width
      maxWidth: maxWidth
      height: height
      sticky: sticky

    up.replace(selector, url,
      history: history
      insert: -> updated($modal, animation, animateOptions)
    )

  ###*
  Returns the source URL for the fragment displayed in the current modal overlay,
  or `undefined` if no modal is currently open.
  
  @method up.modal.source
  @return {String}
    the source URL
  ###
  source = ->
    currentSource

  ###*
  Closes a currently opened modal overlay.
  Does nothing if no modal is currently open.

  \#\#\#\# Events

  - Emits an [event](/up.bus) `modal:close` when the modal
    is starting to close.
  - Emits an [event](/up.bus) `modal:closed` when the closing
    animation has finished and the modal has been removed from the DOM.
  
  @method up.modal.close
  @param {Object} options
    See options for [`up.animate`](/up.motion#up.animate)
  ###
  close = (options) ->
    $modal = $('.up-modal')
    if $modal.length
      options = u.options(options, 
        animation: config.closeAnimation,
        url: $modal.attr('up-previous-url')
        title: $modal.attr('up-previous-title')
      )
      currentSource = undefined
      up.bus.emit('modal:close')
      deferred = up.destroy($modal, options)
      deferred.then ->
        unshifter() while unshifter = unshiftElements.pop()
        up.bus.emit('modal:closed')
      deferred
    else
      u.resolvedDeferred()

  autoclose = ->
    unless $('.up-modal').is('[up-sticky]')
      discardHistory()
      close()

  ###*
  Returns whether the given element or selector is contained
  within the current modal.

  @methods up.modal.contains
  @param {String} elementOrSelector
  @protected
  ###
  contains = (elementOrSelector) ->
    $element = $(elementOrSelector)
    $element.closest('.up-modal').length > 0

  ###*
  Clicking this link will load the destination via AJAX and open
  the given selector in a modal dialog.

  Example:

      <a href="/blogs" up-modal=".blog-list">Switch blog</a>

  Clicking would request the path `/blog` and select `.blog-list` from
  the HTML response. Up.js will dim the page with an overlay
  and place the matching `.blog-list` tag will be placed in
  a modal dialog.


  \#\#\#\# Customizing the dialog design

  Loading the Up.js stylesheet will give you a minimal dialog design:

  - Dialog contents are displayed in a white box that is centered vertically and horizontally.
  - There is a a subtle box shadow around the dialog
  - The box will grow to fit the dialog contents, but never grow larger than the screen
  - The box is placed over a semi-transparent background to dim the rest of the page
  - There is a button to close the dialog in the top-right corner

  The easiest way to change how the dialog looks is by overriding the [default CSS styles](https://github.com/makandra/upjs/blob/master/lib/assets/stylesheets/up/modal.css.sass).

  By default the dialog uses the following DOM structure (continuing the blog-switcher example from above):

      <div class="up-modal">
        <div class="up-modal-dialog">
          <div class="up-modal-close" up-close>X</div>
          <div class="up-modal-content">
            <ul class="blog-list">
              ...
            </ul>
          </div>
        </div>
      </div>

  If you want to change the design beyond CSS, you can
  configure Up.js to [use a different HTML structure](#up.modal.defaults).


  \#\#\#\# Closing behavior

  By default the dialog automatically closes
  *whenever a page fragment below the dialog is updated*.
  This is useful to have the dialog interact with the page that
  opened it, e.g. by updating parts of a larger form or by signing in a user
  and revealing additional information.

  To disable this behavior, give the opening link an `up-sticky` attribute:

      <a href="/settings" up-modal=".options" up-sticky>Settings</a>


  @method a[up-modal]
  @ujs
  @param [up-sticky]
  @param [up-animation]
  @param [up-height]
  @param [up-width]
  @param [up-history]
  ###
  up.on('click', 'a[up-modal]', (event, $link) ->
    event.preventDefault()
    if $link.is('.up-current')
      close()
    else
      open($link)
  )

  # Close the modal when someone clicks outside the dialog
  # (but not on a modal opener).
  up.on('click', 'body', (event, $body) ->
    $target = $(event.target)
    unless $target.closest('.up-modal-dialog').length || $target.closest('[up-modal]').length
      close()
  )

  up.bus.on('fragment:ready', ($fragment) ->
    if contains($fragment)
      if newSource = $fragment.attr('up-source')
        currentSource = newSource
    else if !up.popup.contains($fragment)
      autoclose()
  )

  # Close the pop-up overlay when the user presses ESC.
  up.magic.onEscape(-> close())

  ###*
  When this element is clicked, closes a currently open dialog.
  Does nothing if no modal is currently open.

  @method [up-close]
  @ujs
  ###
  up.on('click', '[up-close]', (event, $element) ->
    if $element.closest('.up-modal').length
      close()
      # Only prevent the default when we actually closed a modal.
      # This way we can have buttons that close a modal when within a modal,
      # but link to a destination if not.
      event.preventDefault()
  )

  # The framework is reset between tests
  up.bus.on 'framework:reset', reset

  open: open
  close: close
  source: source
  defaults: config.update
  contains: contains

)()
