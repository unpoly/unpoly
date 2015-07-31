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

  config =
    width: 'auto'
    height: 'auto'
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    closeLabel: 'X'
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
  Sets default options for future modals.

  @method up.modal.defaults
  @param {Number} [options.width='auto']
    The width of the dialog in pixels.
    Defaults to `'auto'`, meaning that the dialog will grow to fit its contents.
  @param {Number} [options.height='auto']
    The height of the dialog in pixels.
    Defaults to `'auto'`, meaning that the dialog will grow to fit its contents.
  @param {String|Function(config)} [options.template]
    A string containing the HTML structure of the modal.
    You can supply an alternative template string, but make sure that it
    contains tags with the classes `up-modal`, `up-modal-dialog` and `up-modal-content`.

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
  defaults = (options) ->
    u.extend(config, options)
    
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

  createHiddenModal = (selector, width, height, sticky) ->
    $modal = $(templateHtml())
    $modal.attr('up-sticky', '') if sticky
    $modal.attr('up-previous-url', up.browser.url())
    $modal.attr('up-previous-title', document.title)
    $dialog = $modal.find('.up-modal-dialog')
    $dialog.css('width', width) if u.isPresent(width)
    $dialog.css('height', height) if u.isPresent(height)
    $content = $dialog.find('.up-modal-content')
    $placeholder = u.$createElementFromSelector(selector)
    $placeholder.appendTo($content)
    $modal.appendTo(document.body)
    rememberHistory()
    $modal.hide()
    $modal

  updated = ($modal, animation, animateOptions) ->
    $modal.show()
    up.animate($modal, animation, animateOptions)

  ###*
  Opens the given link's destination in a modal overlay:

      var $link = $('...');
      up.modal.open($link);

  Any option attributes for [`a[up-modal]`](#a.up-modal) will be honored.

  You can also open a URL directly like this:

      up.modal.open({ url: '/foo', target: '.list' })

  This will request `/foo`, extract the `.list` selector from the response
  and open the selected container in a modal dialog.
  
  @method up.modal.open
  @param {Element|jQuery|String} [elementOrSelector]
    The link to follow.
    Can be omitted if you give `options.url` instead.
  @param {String} [options.url]
    The URL to open.
    Can be omitted if you give `elementOrSelector` instead.
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
    height = u.option(options.height, $link.attr('up-height'), config.height)
    animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation)
    sticky = u.option(options.sticky, $link.is('[up-sticky]'))
    history = if up.browser.canPushState() then u.option(options.history, $link.attr('up-history'), true) else false
    animateOptions = up.motion.animateOptions(options, $link)

    close()
    $modal = createHiddenModal(selector, width, height, sticky)

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
    $modal = $('.up-modal')
    unless $modal.is('.up-destroying')
      $modal.find('[up-source]').attr('up-source')

  ###*
  Closes a currently opened modal overlay.
  Does nothing if no modal is currently open.
  
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
      up.destroy($modal, options)

  autoclose = ->
    unless $('.up-modal').is('[up-sticky]')
      discardHistory()
      close()

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
    unless $fragment.closest('.up-modal').length
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
    if $element.closest('.up-modal')
      close()
  )

  # The framework is reset between tests, so also close
  # a currently open modal dialog.
  up.bus.on 'framework:reset', close

  open: open
  close: close
  source: source
  defaults: defaults

)()
