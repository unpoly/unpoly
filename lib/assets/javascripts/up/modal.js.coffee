###*
Pop-up overlays.
  
For modal dialogs see {{#crossLink "up.modal"}}{{/crossLink}}.
  
@class up.modal 
###
up.modal = (->

  presence = up.util.presence

  config =
    width: 500
    height: 300
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    template:
      """
      <div class="up-modal">
        <div class="up-modal-overlay"></div>
        <div class="up-modal-dialog">
          <span class="up-modal-close" up-close>
            <span class="up-modal-close-label">Close</span>
            <span class="up-modal-close-key">ESC</span>
          </span>
          <div class="up-modal-content"></div>
        </div>
      </div>
      """
  
  ###*
  @method up.modal.defaults
  @param {Number} options.width
  @param {Number} options.height
  @param {String} options.template
  @param {String} options.animation
  ###
  defaults = (options) ->
    up.util.extend(config, options)

  createHiddenElements = (selector, sticky) ->
    $container = $(config.template)
    $container.attr('up-sticky', '') if sticky
    $dialog = $container.find('.up-modal-dialog')
    $content = $dialog.find('.up-modal-content')
    $placeholder = up.util.$createElementFromSelector(selector)
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
  open = (linkOrSelector, options = {}) ->
    $link = $(linkOrSelector)

    url = up.util.presentAttr($link, 'href')
    selector = options.target || $link.attr('up-modal') || 'body'
    width = options.width || $link.attr('up-width') || config.width
    height = options.height || $link.attr('up-height') || config.height
    animation = options.animation || $link.attr('up-animation') || config.openAnimation
    sticky = options.sticky || $link.is('[up-sticky]')
    history = presence(options.history) || true

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
      options = up.util.options(options, animation: config.closeAnimation)
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
