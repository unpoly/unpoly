###*
Modal dialogs
=============

Instead of linking to another page fragment, you can also choose
to open any target CSS selector in a modal dialog.
  
For popup overlays see [up.popup](/up.popup) instead.
  
\#\#\# Incomplete documentation!
  
We need to work on this page:

- Show the HTML structure of the dialog elements, and how to style them via CSS
- Explain how dialogs auto-close themselves when a fragment changes behind the modal layer
- Document method parameters

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
  @method up.modal.defaults
  @param {Number} [options.width]
  @param {Number} [options.height]
  @param {String|Function(config)} [options.template]
  @param {String} [options.closeLabel]
  @param {String} [options.openAnimation]
  @param {String} [options.closeAnimation]
  ###
  defaults = (options) ->
    u.extend(config, options)
    
  templateHtml = ->
    template = config.template
    if u.isFunction(template)
      template(config)
    else
      template

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
    $modal.hide()
    $modal

  updated = ($modal, animation) ->
    $modal.show()
    up.animate($modal, animation)

  ###*
  Opens a modal overlay.
  
  @method up.modal.open
  @param {Element|jQuery|String} elementOrSelector
  @param {Number} [options.width]
  @param {Number} [options.height]
  @param {String} [options.origin='bottom-right']
  @param {String} [options.animation]
  @param {Boolean} [options.sticky=false]
    If set to `true`, the modal remains
    open even if the page changes in the background.
  @param {Object} [options.history=true]
  ###
  open = (linkOrSelector, options) ->
    $link = $(linkOrSelector)

    options = u.options(options)
    url = u.option($link.attr('href'))
    selector = u.option(options.target, $link.attr('up-modal'), 'body')
    width = u.option(options.width, $link.attr('up-width'), config.width)
    height = u.option(options.height, $link.attr('up-height'), config.height)
    animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation)
    sticky = u.option(options.sticky, $link.is('[up-sticky]'))
    history = if up.browser.canPushState() then u.option(options.history, $link.attr('up-history'), true) else false

    close()
    $modal = createHiddenModal(selector, width, height, sticky)

    up.replace(selector, url,
      history: history
      insert: -> updated($modal, animation)
    )

  ###*
  Returns the source URL for the fragment displayed
  in the current modal overlay, or `undefined` if no
  modal is open.
  
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
      close()

  ###*
  Opens the target of this link in a modal dialog:

      <a href="/decks" up-modal=".deck_list">Switch deck</a>

  If the `up-sticky` attribute is set, the dialog does not auto-close
  if a page fragment below the dialog updates:

      <a href="/settings" up-modal=".options" up-sticky>Settings</a>

  @method a[up-modal]
  @ujs
  @param [up-sticky]
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
