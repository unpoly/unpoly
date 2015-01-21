###*
Pop-up overlays.
  
For modal dialogs see {{#crossLink "up.modal"}}{{/crossLink}}.
  
@class up.modal 
###
up.modal = (->

  u = up.util

  config =
    width: 500
    height: 300
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
  @param {Number} options.width
  @param {Number} options.height
  @param {String|Function} options.template
  @param {String} options.closeLabel
  @param {String} options.openAnimation
  @param {String} options.closeAnimation
  ###
  defaults = (options) ->
    u.extend(config, options)
    
  templateHtml = ->
    template = config.template
    if u.isFunction(template)
      template(config)
    else
      template

  createHiddenElements = (selector, sticky) ->
    $container = $(templateHtml())
    $container.attr('up-sticky', '') if sticky
    $dialog = $container.find('.up-modal-dialog')
    $content = $dialog.find('.up-modal-content')
    $placeholder = u.$createElementFromSelector(selector)
    $placeholder.appendTo($content)
    $container.appendTo(document.body)
    $container.hide()
    $container

  updated = ($modal, animation) ->
    $modal.show()
    up.animate($modal, animation)

  ###*
  Opens a modal overlay.
  
  @method up.modal.open
  @param {Element|jQuery|String} elementOrSelector
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
    history = u.option(options.history, $link.attr('up-history'), true)

    close()
    $container = createHiddenElements(selector, sticky)

    up.replace(selector, url,
      history: history
      # source: true
      insert: -> updated($container, animation)
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
    $popup = $('.up-modal')
    unless $popup.is('.up-destroying')
      $popup.find('[up-source]').attr('up-source')

  ###*
  Closes a currently opened modal overlay.
  Does nothing if no modal is currently open.
  
  @method up.modal.close
  @param {Object} options
    See options for {{#crossLink "up.motion/up.animate"}}{{/crossLink}}.
  ###
  close = (options) ->
    $popup = $('.up-modal')
    if $popup.length
      options = u.options(options, animation: config.closeAnimation)
      up.destroy($popup, options)

  autoclose = ->
    unless $('.up-modal').is('[up-sticky]')
      close()

  ###*
  @method a[up-modal]
  @example
      <a href="/decks" up-modal=".deck_list">Switch deck</a>
  @example
      <a href="/settings" up-modal=".options" up-sticky>Settings</a>  
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
    unless $target.closest('.up-dialog').length || $target.closest('[up-modal]').length
      close()
  )

  up.bus.on('fragment:ready', ($fragment) ->
    unless $fragment.closest('.up-modal').length
      autoclose()
  )

  # Close the pop-up overlay when the user presses ESC.
  up.magic.onEscape(-> close())

  ###*
  @method [up-close]
  ###
  up.on('click', '[up-close]', (event, $element) ->
    if $element.closest('.up-modal')
      close()
  )

  open: open
  close: close
  source: source
  defaults: defaults

)()
