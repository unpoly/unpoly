###*
Registering behavior and custom elements
========================================
  
TODO: Write some documentation  
  
@class up.magic
###
up.magic = (->
  
  util = up.util

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
  liveDescriptions = []
  defaultLiveDescriptions = null

  live = (events, selector, behavior) ->
    description = [
      events,
      selector,
      (event) -> behavior.apply(this, [event, $(this)])
    ]
    liveDescriptions.push(description)
    $(document).on(description...)
  
  ###*
  Registers a function to be called whenever an element with
  the given selector is inserted into the DOM through Up.js.
  
  @method up.awaken
  @param {String} selector
    The selector to match.
  @param {Function($element)} awakener
    The function to call when a matching element is inserted.
    The function takes the new element as the first argument (as a jQuery object).

    The function may return another function that destroys the awakened
    object when it is removed from the DOM, by clearing global state such as
    time-outs and event handlers bound to the document.
  ###
  awakeners = []
  defaultAwakeners = null

  awaken = (selector, awakener) ->
    awakeners.push
      selector: selector
      callback: awakener

  compile = ($fragment) ->
    console.log("Compiling fragment", $fragment, "with", awakeners)
    for awakener in awakeners
      console.log("running", awakener.selector, "on", $fragment)
      util.findWithSelf($fragment, awakener.selector).each ->
        $element = $(this)
        destroyer = awakener.callback.apply(this, [$element])
        console.log("got destroyer", destroyer)
        if util.isFunction(destroyer)
          $element.addClass(DESTROYABLE_CLASS)
          $element.data(DESTROYER_KEY, destroyer)

  destroy = ($fragment) ->
    util.findWithSelf($fragment, ".#{DESTROYABLE_CLASS}").each ->
      $element = $(this)
      destroyer = $element.data(DESTROYER_KEY)
      destroyer()
      
  ###*
  Makes a snapshot of the currently registered event listeners,
  to later be restored through [`up.bus.reset`](/up.bus#up.bus.reset).
  
  @private
  @method up.magic.snapshot
  ###
  snapshot = ->
    defaultLiveDescriptions = util.copy(liveDescriptions) 
    defaultAwakeners = util.copy(awakeners)

  ###*
  Resets the list of registered event listeners to the
  moment when the framework was booted.
  
  @private
  @method up.magic.reset
  ###
  reset = ->
    for description in liveDescriptions
      unless util.contains(defaultLiveDescriptions, description)
        $(document).off(description...)
    liveDescriptions = util.copy(defaultLiveDescriptions)
    awakeners = util.copy(defaultAwakeners)

  ###*
  Sends a notification that the given element has been inserted
  into the DOM. This causes Up.js to compile the fragment (apply
  event listeners, etc.).

  This method is called automatically if you change elements through
  other Up.js methods. You will only need to call this if you
  manipulate the DOM without going through Up.js.

  @method up.ready
  @param {String|Element|jQuery} selectorOrFragment
  ###
  ready = (selectorOrFragment) ->
    $fragment = $(selectorOrFragment)
    up.bus.emit('fragment:ready', $fragment)
    $fragment

  onEscape = (handler) ->
    live('keydown', 'body', (event) ->
      if util.escapePressed(event)
        handler(event)
    )

  up.bus.on 'app:ready', (-> ready(document.body))
  up.bus.on 'fragment:ready', compile
  up.bus.on 'fragment:destroy', destroy
  up.bus.on 'framework:ready', snapshot
  up.bus.on 'framework:reset', reset

  awaken: awaken
  on: live
  ready: ready
  onEscape: onEscape

)()

up.awaken = up.magic.awaken
up.on = up.magic.on
up.ready = up.magic.ready
