###*
Page flow.

@class up.flow
###
up.flow = (->
  
  u = up.util

  setSource = (element, sourceUrl) ->
    $element = $(element)
    sourceUrl = u.normalizeUrl(sourceUrl) if u.isPresent(sourceUrl)
    $element.attr("up-source", sourceUrl)

  source = (element) ->
    $element = $(element).closest("[up-source]")
    u.presence($element.attr("up-source")) || up.browser.url()

  ###*
  Replaces elements on the current page with corresponding elements
  from a new page fetched from the server.

  The current and new elements must have the same CSS selector.

  @method up.replace
  @param {String|Element|jQuery} selectorOrElement
    The CSS selector to update. You can also pass a DOM element or jQuery element
    here, in which case a selector will be inferred from the element's class and ID.
  @param {String} url
    The URL to fetch from the server.
  @param {String} [options.title]
  @param {String|Boolean} [options.history=true]
    If a `String` is given, it is used as the URL the browser's location bar and history.
    If omitted or true, the `url` argument will be used.
    If set to `false`, the history will remain unchanged.
  @param {String|Boolean} [options.source=true]
  @param {String} [options.transition]
  @param {String} [options.historyMethod='push']
  ###
  replace = (selectorOrElement, url, options) ->

    options = u.options(options)
    
    selector = if u.presence(selectorOrElement)
      selectorOrElement
    else
      u.createSelectorFromElement($(selectorOrElement))

    if u.isMissing(options.history) || u.castsToTrue(options.history) 
      options.history = url
    
    if u.isMissing(options.source) || u.castsToTrue(options.source)
      options.source = url
      
    u.get(url, selector: selector)
      .done (html) -> implant(selector, html, options)
      .fail(u.error)

  ###*
  Replaces the given selector with the same selector from the given HTML string.
  
  @method up.flow.implant
  @protected
  @param {String} selector
  @param {String} html
  @param {String} [options.title]
  @param {String} [options.source]
  @param {Object} [options.transition]
  @param {String] [options.history]
  @param {String] [options.historyMethod='push']
  ###
  implant = (selector, html, options) ->
    
    options = u.options(options, 
      historyMethod: 'push'
    )
    # jQuery cannot construct transient elements that contain <html> or <body> tags,
    # so we're using the native browser API to grep through the HTML
    htmlElement = u.createElementFromHtml(html)

    # TODO: extract title from HTTP header
    options.title ||= htmlElement.querySelector("title")?.textContent 

    for step in implantSteps(selector, options)
      $old =
        # always prefer to replace content in popups or modals
        u.presence($(".up-popup " + step.selector)) || 
        u.presence($(".up-modal " + step.selector)) || 
        u.presence($(step.selector)) 
      if fragment = htmlElement.querySelector(step.selector)
        $new = $(fragment)
        swapElements $old, $new, step.pseudoClass, step.transition, options
      else
        u.error("Could not find selector (#{step.selector}) in response (#{html})")
        
  elementsInserted = ($new, options) ->
    $new.each ->
      $element = $(this)
      options.insert?($element)
      if options.history
        document.title = options.title if options.title
        up.history[options.historyMethod](options.history)
      # Remember where the element came from so we can
      # offer reload functionality.
      setSource($element, u.presence(options.source) || options.history)
      autofocus($element)
      # The fragment should be readiet before the transition,
      # so transitions see .up-current classes
      up.ready($element)

  swapElements = ($old, $new, pseudoClass, transition, options) ->
    transition ||= 'none'
    if pseudoClass
      insertionMethod = if pseudoClass == 'before' then 'prepend' else 'append'
      # Keep a reference to the children append/prepend because
      # we need to compile them further down
      $addedChildren = $new.children()
      # Insert contents() instead of $children since contents()
      # also includes text nodes.
      $old[insertionMethod]($new.contents())
      u.copyAttributes($new, $old)
      elementsInserted($addedChildren, options)
      # Since we're adding content instead of replacing, we'll only
      # animate $new instead of morphing between $old and $new
      up.animate($new, transition)
    else
      # Wrap the replacement as a destroy animation, so $old will
      # get marked as .up-destroying right away.
      destroy $old, animation: ->
        $new.insertAfter($old)
        elementsInserted($new, options)
        if $old.is('body') && transition != 'none'
          u.error('Cannot apply transitions to body-elements', transition)
        up.morph($old, $new, transition)

  implantSteps = (selector, options) ->
    transitionString = options.transition || options.animation || 'none'
    comma = /\ *,\ */
    disjunction = selector.split(comma)
    transitions = transitionString.split(comma) if u.isPresent(transitionString)    
    for selectorAtom, i in disjunction
      # Splitting the atom
      selectorParts = selectorAtom.match(/^(.+?)(?:\:(before|after))?$/)
      transition = transitions[i] || u.last(transitions)
      selector: selectorParts[1]
      pseudoClass: selectorParts[2]
      transition: transition

  autofocus = ($element) ->
    selector = '[autofocus]:last'
    $control = u.findWithSelf($element, selector)
    if $control.length && $control.get(0) != document.activeElement
      $control.focus()
      
#  executeScripts = ($new) ->
#    $new.find('script').each ->
#      $script = $(this)
#      type = $script.attr('type')
#      if u.isBlank(type) || type.indexOf('text/javascript') == 0
#        code = $script.text()
#        console.log("Evaling javascript code", code)
#        eval(code)
      
  ###*
  Destroys the given element or selector.
  Takes care that all destructors, if any, are called.
  
  @method up.destroy
  @param {String|Element|jQuery} selectorOrElement 
  @param {String|Function|Object} [options.animation]
  @param {String} [options.url]
  @param {String} [options.title]
  ###
  destroy = (selectorOrElement, options) ->
    $element = $(selectorOrElement)
    options = u.options(options, animation: 'none')
    $element.addClass('up-destroying')
    up.bus.emit('fragment:destroy', $element)
    up.history.push(options.url) if u.isPresent(options.url)
    document.title = options.title if u.isPresent(options.title)
    animationPromise = u.presence(options.animation, u.isPromise) ||
      up.motion.animate($element, options.animation)
    animationPromise.then -> $element.remove()
    
      
  ###*
  Replaces the given selector or element with a fresh copy
  fetched from the server.

  @method up.reload
  @param {String|Element|jQuery} selectorOrElement
  ###
  reload = (selectorOrElement) ->
    sourceUrl = source(selectorOrElement)
    replace(selectorOrElement, sourceUrl)

  ###*
  Resets Up.js to the state when it was booted.
  All custom event handlers, animations, etc. that have been registered
  will be discarded.
  
  This is an internal method for to enable unit testing.
  Don't use this in production.
  
  @protected
  @method up.reset
  ###
  reset = ->
    up.bus.emit('framework:reset')
  
  up.bus.on('app:ready', ->
    setSource(document.body, up.browser.url())
  )

  replace: replace
  reload: reload
  destroy: destroy
  implant: implant
  reset: reset

)()

up.replace = up.flow.replace
up.reload = up.flow.reload
up.destroy = up.flow.destroy
up.reset = up.flow.reset
