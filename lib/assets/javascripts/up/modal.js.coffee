up.modal = (->

  configuration =
    width: 600
    height: 400
    template:
      """
      <div class="up-modal">
        <div class="up-modal-overlay"></div>
        <div class="up-modal-dialog">
          <a href="#" class="up-modal-close">
            <span class="up-modal-close-label">Close</span>
            <span class="up-modal-close-key">ESC</span>
          </a>
          <div class="up-modal-contant"></div>
        </div>
      </div>
      """

  defaults = (defaults) ->
    up.util.extend(configuration, defaults)

  open = (link, options) ->
    $link = $(link)
    url = $link.attr("href")
    selector = $link.attr("up-modal") || $link.attr("up-target") || 'body'
    replace(selector, url, options)


    options = up.util.options(options, configuration)
    createElements()
    update(options)

  close = ->
    if $container
      $container.remove()
      $container = null

  defaults: defaults

)()
