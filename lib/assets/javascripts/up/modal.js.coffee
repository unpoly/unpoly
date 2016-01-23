###*
Modal dialogs
=============

Instead of [linking to a page fragment](/up.link), you can choose
to show a fragment in a modal dialog. The existing page will remain
open in the background and reappear once the modal is closed.

To open a modal, add an [`up-modal` attribute](/a-up-modal) to a link,
or call the Javascript functions [`up.modal.follow`](/up.modal.follow)
and [`up.modal.visit`](/up.modal.visit).
  
For smaller popup overlays ("dropdowns") see [up.popup](/up.popup) instead.


\#\#\#\# Customizing the dialog design

Loading the Up.js stylesheet will give you a minimal dialog design:

- Dialog contents are displayed in a white box that is centered vertically and horizontally.
- There is a a subtle box shadow around the dialog
- The box will grow to fit the dialog contents, but never grow larger than the screen
- The box is placed over a semi-transparent background to dim the rest of the page
- There is a button to close the dialog in the top-right corner

The easiest way to change how the dialog looks is by overriding the [default CSS styles](https://github.com/makandra/upjs/blob/master/lib/assets/stylesheets/up/modal.css.sass).

By default the dialog uses the following DOM structure:

    <div class="up-modal">
      <div class="up-modal-dialog">
        <div class="up-modal-close" up-close>X</div>
        <div class="up-modal-content">
          ...
        </div>
      </div>
    </div>

If you want to change the design beyond CSS, you can
configure Up.js to [use a different HTML structure](/up.modal.config).


\#\#\#\# Closing behavior

By default the dialog automatically closes
*whenever a page fragment behind the dialog is updated*.
This is useful to have the dialog interact with the page that
opened it, e.g. by updating parts of a larger form or by signing in a user
and revealing additional information.

To disable this behavior, give the opening link an `up-sticky` attribute:

    <a href="/settings" up-modal=".options" up-sticky>Settings</a>


@class up.modal 
###
up.modal = (($) ->

  u = up.util

  ###*
  Sets default options for future modals.

  @property up.modal.config
  @param {Number} [config.width]
    The width of the dialog as a CSS value like `'400px'` or `50%`.

    Defaults to `undefined`, meaning that the dialog will grow to fit its contents
    until it reaches `config.maxWidth`. Leaving this as `undefined` will
    also allow you to control the width using CSS on `.up-modal-dialog´.
  @param {Number} [config.maxWidth]
    The width of the dialog as a CSS value like `'400px'` or `50%`.
    You can set this to `undefined` to make the dialog fit its contents.
    Be aware however, that e.g. Bootstrap stretches input elements
    to `width: 100%`, meaning the dialog will also stretch to the full
    width of the screen.
  @param {Number} [config.height='auto']
    The height of the dialog in pixels.
    Defaults to `undefined`, meaning that the dialog will grow to fit its contents.
  @param {String|Function(config)} [config.template]
    A string containing the HTML structure of the modal.
    You can supply an alternative template string, but make sure that it
    defines tag with the classes `up-modal`, `up-modal-dialog` and  `up-modal-content`.

    You can also supply a function that returns a HTML string.
    The function will be called with the modal options (merged from these defaults
    and any per-open overrides) whenever a modal opens.
  @param {String} [config.closeLabel='X']
    The label of the button that closes the dialog.
  @param {String} [config.openAnimation='fade-in']
    The animation used to open the modal. The animation will be applied
    to both the dialog box and the overlay dimming the page.
  @param {String} [config.closeAnimation='fade-out']
    The animation used to close the modal. The animation will be applied
    to both the dialog box and the overlay dimming the page.
  @param {String} [config.history=true]
    Whether opening a modal will add a browser history entry.
  @stable
  ###
  config = u.config
    maxWidth: null
    minWidth: null
    width: null
    height: null
    history: true
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

  ###*
  Returns the source URL for the fragment displayed in the current modal overlay,
  or `undefined` if no modal is currently open.

  @function up.modal.url
  @return {String}
    the source URL
  @stable
  ###
  currentUrl = undefined

  ###*
  Returns the URL of the page behind the modal overlay.

  @function up.modal.coveredUrl
  @return {String}
  @experimental
  ###
  coveredUrl = ->
    $('.up-modal').attr('up-covered-url')

  reset = ->
    close(animation: false)
    currentUrl = undefined
    config.reset()

  templateHtml = ->
    template = config.template
    if u.isFunction(template)
      template(config)
    else
      template

  discardHistory = ->
    $modal = $('.up-modal')
    $modal.removeAttr('up-covered-url')
    $modal.removeAttr('up-covered-title')

  createFrame = (target, options) ->
    shiftElements()
    $modal = $(templateHtml())
    $modal.attr('up-sticky', '') if options.sticky
    $modal.attr('up-covered-url', up.browser.url())
    $modal.attr('up-covered-title', document.title)
    $dialog = $modal.find('.up-modal-dialog')
    $dialog.css('width', options.width) if u.isPresent(options.width)
    $dialog.css('max-width', options.maxWidth) if u.isPresent(options.maxWidth)
    $dialog.css('height', options.height) if u.isPresent(options.height)
    $content = $modal.find('.up-modal-content')
    # Create an empty element that will match the
    # selector that is being replaced.
    $placeholder = u.$createElementFromSelector(target)
    $placeholder.appendTo($content)
    $modal.appendTo(document.body)
    $modal

  unshifters = []

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
    unshifters.push(unshiftBody)
    up.layout.anchoredRight().each ->
      $element = $(this)
      elementRight = parseInt($element.css('right'))
      elementRightShift = scrollbarWidth + elementRight
      unshifter = u.temporaryCss($element, 'right': elementRightShift)
      unshifters.push(unshifter)

  # Reverts the effects of `shiftElements`.
  unshiftElements = ->
    unshifter() while unshifter = unshifters.pop()

  ###*
  Returns whether a modal is currently open.

  @function up.modal.isOpen
  @stable
  ###
  isOpen = ->
    $('.up-modal').length > 0

  ###*
  Opens the given link's destination in a modal overlay:

      var $link = $('...');
      up.modal.follow($link);

  Any option attributes for [`a[up-modal]`](/a.up-modal) will be honored.

  Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).

  @function up.modal.follow
  @param {Element|jQuery|String} linkOrSelector
    The link to follow.
  @param {String} [options.target]
    The selector to extract from the response and open in a modal dialog.
  @param {Number} [options.width]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
  @param {Number} [options.height]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
  @param {Boolean} [options.sticky=false]
    If set to `true`, the modal remains
    open even if the page changes in the background.
  @param {Object} [options.history=true]
    Whether to add a browser history entry for the modal's source URL.
  @param {String} [options.animation]
    The animation to use when opening the modal.
  @param {Number} [options.duration]
    The duration of the animation. See [`up.animate`](/up.animate).
  @param {Number} [options.delay]
    The delay before the animation starts. See [`up.animate`](/up.animate).
  @param {String} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate`](/up.animate).
  @return {Promise}
    A promise that will be resolved when the modal has been loaded and
    the opening animation has completed.
  @stable
  ###
  follow = (linkOrSelector, options) ->
    options = u.options(options)
    options.$link = $(linkOrSelector)
    open(options)

  ###*
  Opens a modal for the given URL.

  Example:

      up.modal.visit('/foo', { target: '.list' })

  This will request `/foo`, extract the `.list` selector from the response
  and open the selected container in a modal dialog.

  Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).

  @function up.modal.visit
  @param {String} url
    The URL to load.
  @param {String} options.target
    The CSS selector to extract from the response.
    The extracted content will be placed into the dialog window.
  @param {Object} options
    See options for [`up.modal.follow`](/up.modal.follow).
  @return {Promise}
    A promise that will be resolved when the modal has been loaded and the opening
    animation has completed.
  @stable
  ###
  visit = (url, options) ->
    options = u.options(options)
    options.url = url
    open(options)

  ###*
  @function open
  @internal
  ###
  open = (options) ->
    options = u.options(options)
    $link = u.option(options.$link, u.nullJQuery())
    url = u.option(options.url, $link.attr('up-href'), $link.attr('href'))
    target = u.option(options.target, $link.attr('up-modal'), 'body')
    options.width = u.option(options.width, $link.attr('up-width'), config.width)
    options.maxWidth = u.option(options.maxWidth, $link.attr('up-max-width'), config.maxWidth)
    options.height = u.option(options.height, $link.attr('up-height'), config.height)
    options.animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation)
    options.sticky = u.option(options.sticky, u.castedAttr($link, 'up-sticky'))
    # Although we usually fall back to full page loads if a browser doesn't support pushState,
    # in the case of modals we assume that the developer would rather see a dialog
    # without an URL update.
    options.history = if up.browser.canPushState() then u.option(options.history, u.castedAttr($link, 'up-history'), config.history) else false
    animateOptions = up.motion.animateOptions(options, $link)

    if up.bus.nobodyPrevents('up:modal:open', url: url)
      wasOpen = isOpen()
      close(animation: false) if wasOpen
      options.beforeSwap = -> createFrame(target, options)
      promise =  up.replace(target, url, u.merge(options, animation: false))
      unless wasOpen
        promise = promise.then ->
          up.animate($('.up-modal'), options.animation, animateOptions)
      promise = promise.then ->
        up.emit('up:modal:opened')
      promise
    else
      # Although someone prevented opening the modal, keep a uniform API for
      # callers by returning a Deferred that will never be resolved.
      u.unresolvablePromise()

  ###*
  This event is [emitted](/up.emit) when a modal dialog is starting to open.

  @event up:modal:open
  @param event.preventDefault()
    Event listeners may call this method to prevent the modal from opening.
  @stable
  ###

  ###*
  This event is [emitted](/up.emit) when a modal dialog has finished opening.

  @event up:modal:opened
  @stable
  ###

  ###*
  Closes a currently opened modal overlay.

  Does nothing if no modal is currently open.

  Emits events [`up:modal:close`](/up:modal:close) and [`up:modal:closed`](/up:modal:closed).

  @function up.modal.close
  @param {Object} options
    See options for [`up.animate`](/up.animate)
  @return {Deferred}
    A promise that will be resolved once the modal's close
    animation has finished.
  @stable
  ###
  close = (options) ->
    $modal = $('.up-modal')
    if $modal.length
      if up.bus.nobodyPrevents('up:modal:close', $element: $modal)
        options = u.options(options,
          animation: config.closeAnimation,
          url: $modal.attr('up-covered-url')
          title: $modal.attr('up-covered-title')
        )
        currentUrl = undefined
        promise = up.destroy($modal, options)
        promise = promise.then ->
          unshiftElements()
          up.emit('up:modal:closed')
        promise
      else
        # Although someone prevented the destruction,
        # keep a uniform API for callers by returning
        # a Deferred that will never be resolved.
        u.unresolvableDeferred()
    else
      u.resolvedDeferred()

  ###*
  This event is [emitted](/up.emit) when a modal dialog
  is starting to [close](/up.modal.close).

  @event up:modal:close
  @param event.preventDefault()
    Event listeners may call this method to prevent the modal from closing.
  @stable
  ###

  ###*
  This event is [emitted](/up.emit) when a modal dialog
  is done [closing](/up.modal.close).

  @event up:modal:closed
  @stable
  ###

  autoclose = ->
    unless $('.up-modal').is('[up-sticky]')
      discardHistory()
      close()

  ###*
  Returns whether the given element or selector is contained
  within the current modal.

  @function up.modal.contains
  @param {String} elementOrSelector
  @stable
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

  @selector a[up-modal]
  @param [up-sticky]
  @param [up-animation]
  @param [up-height]
  @param [up-width]
  @param [up-history]
  @stable
  ###
  up.link.registerFollowVariant '[up-modal]', ($link) ->
    follow($link)

  # Close the modal when someone clicks outside the dialog
  # (but not on a modal opener).
  up.on('click', 'body', (event, $body) ->
    $target = $(event.target)
    unless $target.closest('.up-modal-dialog').length || $target.closest('[up-modal]').length
      close()
  )

  up.on('up:fragment:inserted', (event, $fragment) ->
    if contains($fragment)
      if newSource = $fragment.attr('up-source')
        currentUrl = newSource
    else if !up.popup.contains($fragment) && contains(event.origin)
      autoclose()
  )

  # Close the pop-up overlay when the user presses ESC.
  up.bus.onEscape(-> close())

  ###*
  When this element is clicked, closes a currently open dialog.

  Does nothing if no modal is currently open.

  To make a link that closes the current modal, but follows to
  a fallback destination if no modal is open:

      <a href="/fallback" up-close>Okay</a>

  @selector [up-close]
  @stable
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
  up.on 'up:framework:reset', reset

  knife: eval(Knife?.point)
  visit: visit
  follow: follow
  open: -> up.error('up.modal.open no longer exists. Please use either up.modal.follow or up.modal.visit.')
  close: close
  url: -> currentUrl
  coveredUrl: coveredUrl
  config: config
  defaults: -> u.error('up.modal.defaults(...) no longer exists. Set values on he up.modal.config property instead.')
  contains: contains
  source: -> up.error('up.modal.source no longer exists. Please use up.popup.url instead.')
  isOpen: isOpen

)(jQuery)
