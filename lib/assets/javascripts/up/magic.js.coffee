up.magic = (->

  AWAKENED_CLASS = 'up-awakened'
  DESTROYER_KEY = 'up-destroyer'

  live = (events, selector, behavior) ->
    $(document).on events, selector, (event) ->
      behavior.apply(this, [event, $(this)])

  awakeners = []

  awaken = (selector, behavior) ->
    awakeners.push
      selector: selector
      behavior: behavior

  $deepFilter = ($element, selector) ->
    $element.find(selector).addBack(selector)

  compile = ($fragment) ->
    for awakener in awakeners
      $deepFilter($fragment, awakener.selector).each ->
        $element = $(this)
        destroyer = awakener.behavior.apply(this, [$element])
        if up.util.isFunction(destroyer)
          $element.prop(AWAKENED_CLASS, true)
          $element.data(DESTROYER_KEY, destroyer)

  destroy = ($fragment) ->
    $deepFilter($fragment, "[#{AWAKENED_CLASS}]").each ->
      $element = $(this)
      destroyer = $element.data(DESTROYER_KEY)
      destroyer()

  up.bus.on 'app:ready', (-> up.bus.emit 'fragment:ready', $(document.body))
  up.bus.on 'fragment:ready', compile
  up.bus.on 'fragment:destroy', destroy
  $(document).on 'ready', -> up.bus.emit('app:ready')

  awaken: awaken
  on: live

)()

up.awaken = up.magic.awaken
up.on = up.magic.on

