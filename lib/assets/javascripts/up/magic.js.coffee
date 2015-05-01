###*
Registering behavior and custom elements
========================================
  
Up.js keeps a persistent Javascript environment during page transitions.
To prevent memory leaks it is important to cleanly set up and tear down
event handlers and custom elements.
    
\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Explain when to use `up.on` and when to use `up.awaken`
- Example for integrating an external JS lib that is not aware of Up.js
- Example for defining a custom element
- Tell more about memory leaks and why they don't matter
  so much when you have full page loads.
  
@class up.magic
###
up.magic = (->
  
  u = up.util

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
  @param {Function(event, $element, data)} behavior
    The handler that should be called.
    The function takes the affected element as the first argument (as a jQuery object).
    If the element has an `up-data` attribute, its value is parsed as JSON
    and passed as a second argument.
  ###
  liveDescriptions = []
  defaultLiveDescriptions = null

  live = (events, selector, behavior) ->
    # Silently discard any awakeners that are registered on unsupported browsers
    return unless up.browser.isSupported()
    description = [
      events,
      selector,
      (event) ->
        behavior.apply(this, [event, $(this), data(this)])
    ]
    liveDescriptions.push(description)
    $(document).on(description...)
  
  ###*
  Registers a function to be called whenever an element with
  the given selector is inserted into the DOM through Up.js.
  
  @method up.awaken
  @param {String} selector
    The selector to match.
  @param {Boolean} [options.batch=false]
    If set to `true` and a fragment insertion contains multiple
    elements matching the selector, `awakener` is only called once
    with a jQuery collection containing all matching elements. 
  @param {Function($element, data)} awakener
    The function to call when a matching element is inserted.
    The function takes the new element as the first argument (as a jQuery object).
    If the element has an `up-data` attribute, its value is parsed as JSON
    and passed as a second argument.

    The function may return another function that destroys the awakened
    object when it is removed from the DOM, by clearing global state such as
    time-outs and event handlers bound to the document.
  ###
  awakeners = []
  defaultAwakeners = null

  awaken = (selector, args...) ->
    # Silently discard any awakeners that are registered on unsupported browsers
    return unless up.browser.isSupported()
    awakener = args.pop()
    options = u.options(args[0], batch: false)
    awakeners.push
      selector: selector
      callback: awakener
      batch: options.batch
  
  applyAwakener = (awakener, $jqueryElement, nativeElement) ->
    destroyer = awakener.callback.apply(nativeElement, [$jqueryElement, data($jqueryElement)])
    if u.isFunction(destroyer)
      $jqueryElement.addClass(DESTROYABLE_CLASS)
      $jqueryElement.data(DESTROYER_KEY, destroyer)

  compile = ($fragment) ->
    u.debug "Compiling fragment %o", $fragment, ->
      for awakener in awakeners
        u.debug "Applying awakener %o on %o", awakener.selector, $fragment, ->
          $matches = u.findWithSelf($fragment, awakener.selector)
          if $matches.length
            if awakener.batch
              applyAwakener(awakener, $matches, $matches.get())
            else
              $matches.each -> applyAwakener(awakener, $(this), this)

  destroy = ($fragment) ->
    u.findWithSelf($fragment, ".#{DESTROYABLE_CLASS}").each ->
      $element = $(this)
      destroyer = $element.data(DESTROYER_KEY)
      destroyer()

  ###
  Checks if the given element has an `up-data` attribute.
  If yes, parses the attribute value as JSON and returns the parsed object.

  Returns an empty object if the element has no `up-data` attribute.

  The API of this method is likely to change in the future, so
  we can support getting or setting individual keys.

  @protected
  @method up.magic.data
  @param {String|Element|jQuery} elementOrSelector
  ###
  data = (elementOrSelector) ->
    $element = $(elementOrSelector)
    json = $element.attr('up-data')
    if u.isString(json) && u.trim(json) != ''
      JSON.parse(json)
    else
      {}

  ###*
  Makes a snapshot of the currently registered event listeners,
  to later be restored through [`up.bus.reset`](/up.bus#up.bus.reset).
  
  @private
  @method up.magic.snapshot
  ###
  snapshot = ->
    defaultLiveDescriptions = u.copy(liveDescriptions) 
    defaultAwakeners = u.copy(awakeners)

  ###*
  Resets the list of registered event listeners to the
  moment when the framework was booted.
  
  @private
  @method up.magic.reset
  ###
  reset = ->
    for description in liveDescriptions
      unless u.contains(defaultLiveDescriptions, description)
        $(document).off(description...)
    liveDescriptions = u.copy(defaultLiveDescriptions)
    awakeners = u.copy(defaultAwakeners)

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
      if u.escapePressed(event)
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
  data: data

)()

up.awaken = up.magic.awaken
up.on = up.magic.on
up.ready = up.magic.ready
