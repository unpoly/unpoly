###*
Event handling.
  
@class up.magic
###
up.magic = (->

  DESTROYABLE_CLASS = 'up-destroyable'
  DESTROYER_KEY = 'up-destroyer'

  ###*
  Binds an event handler to the document,
  which will be executed whenever the given event
  is triggered on the given selector.
  
  @method up.on
  @param {String} events
    A space-separated list of event names to bind.
  @param {String} selector
    The selector an on which the event must be triggered.
  @param {Function} behavior
    The handler that should be called.
  ###
  live = (events, selector, behavior) ->
    $(document).on events, selector, (event) ->
      behavior.apply(this, [event, $(this)])

  awakeners = []

  ###*
  Registers a function to be called whenever an element with
  the given selector is inserted into the DOM through Up.js.
  
  @method up.awaken
  @param {String} selector
    The selector to match.
  @param {Function} awakener
    The function to call when a matching element is inserted.
    The function takes the new element as the first argument (as a jQuery object).
    It may return another function that destroys the awakened
    object when it is removed from the DOM, by clearing global state such as
    time-outs and event handlers bound to the document.
  ###
  awaken = (selector, awakener) ->
    awakeners.push
      selector: selector
      behavior: awakener

  compile = ($fragment) ->
    for awakener in awakeners
      up.util.findWithSelf($fragment, awakener.selector).each ->
        $element = $(this)
        destroyer = awakener.behavior.apply(this, [$element])
        if up.util.isFunction(destroyer)
          $element.addClass(DESTROYABLE_CLASS)
          $element.data(DESTROYER_KEY, destroyer)

  destroy = ($fragment) ->
    up.util.findWithSelf($fragment, ".#{DESTROYABLE_CLASS}").each ->
      $element = $(this)
      destroyer = $element.data(DESTROYER_KEY)
      destroyer()

  ###*
  @method up.ready
  ###
  ready = (selectorOrFragment) ->
    up.bus.emit('fragment:ready', $(selectorOrFragment))

  onEscape = (handler) ->
    live('keydown', 'body', (event) ->
      if up.util.escapePressed(event)
        handler(event)
    )

  up.bus.on 'app:ready', (-> ready(document.body))
  up.bus.on 'fragment:ready', compile
  up.bus.on 'fragment:destroy', destroy
  $(document).on 'ready', -> up.bus.emit('app:ready')

  awaken: awaken
  on: live
  ready: ready
  onEscape: onEscape

)()

up.awaken = up.magic.awaken
up.on = up.magic.on
up.ready = up.magic.ready
