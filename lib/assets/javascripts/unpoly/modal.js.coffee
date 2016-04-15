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

Loading the Unpoly stylesheet will give you a minimal dialog design:

- Dialog contents are displayed in a white box that is centered vertically and horizontally.
- There is a a subtle box shadow around the dialog
- The box will grow to fit the dialog contents, but never grow larger than the screen
- The box is placed over a semi-transparent background to dim the rest of the page
- There is a button to close the dialog in the top-right corner

The easiest way to change how the dialog looks is by overriding the [default CSS styles](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/up/modal.css.sass).

By default the dialog uses the following DOM structure:

    <div class="up-modal">
      <div class="up-modal-backdrop">
      <div class="up-modal-viewport">
        <div class="up-modal-dialog">
          <div class="up-modal-content">
            ...
          </div>
          <div class="up-modal-close" up-close>X</div>
        </div>
      </div>
    </div>

If you want to change the design beyond CSS, you can
configure Unpoly to [use a different HTML structure](/up.modal.config).


\#\#\#\# Closing behavior

By default the dialog automatically closes
*when a link inside a modal changes a fragment behind the modal*.
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
  @param {String} [config.history=true]
    Whether opening a modal will add a browser history entry.
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
    The animation used to open the viewport around the dialog.
  @param {String} [config.closeAnimation='fade-out']
    The animation used to close the viewport the dialog.
  @param {String} [config.backdropOpenAnimation='fade-in']
    The animation used to open the backdrop that dims the page below the dialog.
  @param {String} [config.backdropCloseAnimation='fade-out']
    The animation used to close the backdrop that dims the page below the dialog.
  @param {String} [config.openDuration]
    The duration of the open animation (in milliseconds).
  @param {String} [config.closeDuration]
    The duration of the close animation (in milliseconds).
  @param {String} [config.openEasing]
    The timing function controlling the acceleration of the opening animation.
  @param {String} [config.closeEasing]
    The timing function controlling the acceleration of the closing animation.
  @param {Boolean} [options.sticky=false]
    If set to `true`, the modal remains
    open even it changes the page in the background.
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
    openDuration: null
    closeDuration: null
    openEasing: null
    closeEasing: null
    backdropOpenAnimation: 'fade-in'
    backdropCloseAnimation: 'fade-out'
    closeLabel: '×'
    flavors: { default: {} }

    template: (config) ->
      """
      <div class="up-modal">
        <div class="up-modal-backdrop"></div>
        <div class="up-modal-viewport">
          <div class="up-modal-dialog">
            <div class="up-modal-content"></div>
            <div class="up-modal-close" up-close>#{flavorDefault('closeLabel')}</div>
          </div>
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

  currentFlavor = undefined

  ###*
  Returns the URL of the page behind the modal overlay.

  @function up.modal.coveredUrl
  @return {String}
  @experimental
  ###
  coveredUrl = ->
    $('.up-modal').attr('up-covered-url')

  reset = ->
    # Destroy the modal container regardless whether it's currently in a closing animation
    close(animation: false)
    currentUrl = undefined
    currentFlavor = undefined
    config.reset()

  templateHtml = ->
    template = flavorDefault('template')
    if u.isFunction(template)
      template(config)
    else
      template

  discardHistory = ->
    $modal = $('.up-modal')
    $modal.removeAttr('up-covered-url')
    $modal.removeAttr('up-covered-title')

  createFrame = (target, options) ->
    $modal = $(templateHtml())
    $modal.attr('up-flavor', currentFlavor)
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
    u.$createPlaceholder(target, $content)
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
    if unshifters.length
      u.error('Tried to call shiftElements multiple times %o', unshifters.length)
    $('.up-modal').addClass('up-modal-ready')
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
    $('.up-modal').removeClass('up-modal-ready')
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
    open even it changes the page in the background.
  @param {String} [options.confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the modal is being opened.
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

      up.modal.visit('/foo', { target: '.list' });

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
  [Extracts](/up.extract) the given CSS selector from the given HTML string and
  opens the results in a modal.

  Example:

      var html = 'before <div class="content">inner</div> after';
      up.modal.extract('/foo', '.content', html);

  The would open a modal with the following contents:

      <div class="content">inner</div>

  Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).

  @function up.modal.extract
  @param {String} url
    The URL to load.
  @param {Object} options
    See options for [`up.modal.follow`](/up.modal.follow).
  @return {Promise}
    A promise that will be resolved when the modal has been opened and the opening
    animation has completed.
  @stable
  ###
  extract = (selector, html, options) ->
    options = u.options(options)
    options.html = html
    options.history = u.option(options.history, false)
    options.target = selector
    open(options)

  ###*
  @function open
  @internal
  ###
  open = (options) ->
    options = u.options(options)
    $link = u.option(u.pluckKey(options, '$link'), u.nullJQuery())
    url = u.option(u.pluckKey(options, 'url'), $link.attr('up-href'), $link.attr('href'))
    html = u.pluckKey(options, 'html')
    target = u.option(u.pluckKey(options, 'target'), $link.attr('up-modal'), 'body')
    currentFlavor = u.option(options.flavor, $link.attr('up-flavor'), 'default')
    options.width = u.option(options.width, $link.attr('up-width'), flavorDefault('width'))
    options.maxWidth = u.option(options.maxWidth, $link.attr('up-max-width'), flavorDefault('maxWidth'))
    options.height = u.option(options.height, $link.attr('up-height'), flavorDefault('height'))
    options.animation = u.option(options.animation, $link.attr('up-animation'), flavorDefault('openAnimation'))
    options.backdropAnimation = u.option(options.backdropAnimation, $link.attr('up-backdrop-animation'), flavorDefault('backdropOpenAnimation'))
    options.sticky = u.option(options.sticky, u.castedAttr($link, 'up-sticky'), flavorDefault('sticky'))
    options.confirm = u.option(options.confirm, $link.attr('up-confirm'))
    animateOptions = up.motion.animateOptions(options, $link, duration: flavorDefault('openDuration'), easing: flavorDefault('openEasing'))

    # Although we usually fall back to full page loads if a browser doesn't support pushState,
    # in the case of modals we assume that the developer would rather see a dialog
    # without an URL update.
    options.history = u.option(options.history, u.castedAttr($link, 'up-history'), flavorDefault('history'))
    options.history = false unless up.browser.canPushState()

    up.browser.confirm(options).then ->
      if up.bus.nobodyPrevents('up:modal:open', url: url, message: 'Opening modal')
        wasOpen = isOpen()
        close(animation: false) if wasOpen
        options.beforeSwap = -> createFrame(target, options)
        extractOptions = u.merge(options, animation: false)
        if url
          promise = up.replace(target, url, extractOptions)
        else
          promise = up.extract(target, html, extractOptions)
        # If we're not animating the dialog, don't animate the backdrop either
        unless wasOpen || up.motion.isNone(options.animation)
          promise = promise.then ->
            $.when(
              up.animate($('.up-modal-backdrop'), options.backdropAnimation, animateOptions),
              up.animate($('.up-modal-viewport'), options.animation, animateOptions)
            )
        promise = promise.then ->
          shiftElements()
          up.emit('up:modal:opened', message: 'Modal opened')
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
  @return {Promise}
    A promise that will be resolved once the modal's close
    animation has finished.
  @stable
  ###
  close = (options) ->
    options = u.options(options)
    $modal = $('.up-modal')
    if $modal.length
      if up.bus.nobodyPrevents('up:modal:close', $element: $modal, message: 'Closing modal')
        unshiftElements()
        viewportCloseAnimation = u.option(options.animation, flavorDefault('closeAnimation'))
        backdropCloseAnimation = u.option(options.backdropAnimation, flavorDefault('backdropCloseAnimation'))
        animateOptions = up.motion.animateOptions(options, duration: flavorDefault('closeDuration'), easing: flavorDefault('closeEasing'))
        if up.motion.isNone(viewportCloseAnimation)
          # If we're not animating the dialog, don't animate the backdrop either
          promise = u.resolvedPromise()
        else
          promise = $.when(
            up.animate($('.up-modal-viewport'), viewportCloseAnimation, animateOptions),
            up.animate($('.up-modal-backdrop'), backdropCloseAnimation, animateOptions)
          )
        promise = promise.then ->
          destroyOptions = u.options(
            u.except(options, 'animation', 'duration', 'easing', 'delay'),
            url: $modal.attr('up-covered-url')
            title: $modal.attr('up-covered-title')
          )
          # currentUrl must be deleted *before* calling up.destroy,
          # since up.navigation listens to up:fragment:destroyed and then
          # re-assigns .up-current classes.
          currentUrl = undefined
          up.destroy($modal, destroyOptions)
          currentFlavor = undefined
          up.emit('up:modal:closed', message: 'Modal closed')
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
  Register a new modal variant with its own default configuration, CSS or HTML template.

  \#\#\#\# Example

  Let's implement a drawer that slides in from the right:

      up.modal.flavor('drawer', {
        openAnimation: 'move-from-right',
        closeAnimation: 'move-to-right',
        maxWidth: 400
      }

  Modals with that flavor will have a container `<div class='up-modal' up-flavor='drawer'>...</div>`.
  We can target the `up-flavor` attribute override the default dialog styles:

      .up-modal[up-flavor='drawer'] {

        // Align drawer on the right
        .up-modal-viewport { text-align: right; }

        // Remove margin so the drawer starts at the screen edge
        .up-modal-dialog { margin: 0; }

        // Stretch drawer background to full window height
        .up-modal-content { min-height: 100vh; }
      }

  @function up.modal.flavor
  @param {String} name
    The name of the new flavor.
  @param {Object} [overrideConfig]
    An object whose properties override the defaults in [`/up.modal.config`](/up.modal.config).
  @experimental
  ###
  flavor = (name, overrideConfig = {}) ->
    u.extend(flavorOverrides(name), overrideConfig)

  ###*
  Returns a config object for the given flavor.
  Properties in that config should be preferred to the defaults in
  [`/up.modal.config`](/up.modal.config).

  @function flavorOverrides
  @internal
  ###
  flavorOverrides = (flavor) ->
    config.flavors[flavor] ||= {}

  ###*
  Returns the config option for the current flavor.

  @function flavorDefault
  @internal
  ###
  flavorDefault = (key) ->
    value = flavorOverrides(currentFlavor)[key] if currentFlavor
    value = config[key] if u.isMissing(value)
    value

  ###*
  Clicking this link will load the destination via AJAX and open
  the given selector in a modal dialog.

  Example:

      <a href="/blogs" up-modal=".blog-list">Switch blog</a>

  Clicking would request the path `/blog` and select `.blog-list` from
  the HTML response. Unpoly will dim the page with an overlay
  and place the matching `.blog-list` tag will be placed in
  a modal dialog.

  @selector a[up-modal]
  @param {String} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the modal is opened.
  @param {String} [up-sticky]
    If set to `"true"`, the modal remains
    open even if the page changes in the background.
  @param {String} [up-animation]
    The animation to use when opening the viewport containing the dialog.
  @param {String} [up-backdrop-animation]
    The animation to use when opening the backdrop that dims the page below the dialog.
  @param {String} [up-height]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
  @param [up-width]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
  @param [up-history="true"]
    Whether to add a browser history entry for the modal's source URL.
  @stable
  ###
  up.link.onAction '[up-modal]', ($link) ->
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
  extract: extract
  open: -> up.error('up.modal.open no longer exists. Please use either up.modal.follow or up.modal.visit.')
  close: close
  url: -> currentUrl
  coveredUrl: coveredUrl
  config: config
  defaults: -> u.error('up.modal.defaults(...) no longer exists. Set values on he up.modal.config property instead.')
  contains: contains
  source: -> up.error('up.modal.source no longer exists. Please use up.popup.url instead.')
  isOpen: isOpen
  flavor: flavor

)(jQuery)
