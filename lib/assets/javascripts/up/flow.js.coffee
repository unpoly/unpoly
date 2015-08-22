###*
Changing page fragments programmatically
========================================
  
This module contains Up's core functions to insert, change
or destroy page fragments.

\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Explain the UJS approach vs. pragmatic approach
- Examples
  
  
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
  @param {String} [options.method='get']
  @param {String} [options.title]
  @param {String} [options.transition='none']
  @param {String|Boolean} [options.history=true]
    If a `String` is given, it is used as the URL the browser's location bar and history.
    If omitted or true, the `url` argument will be used.
    If set to `false`, the history will remain unchanged.
  @param {String|Boolean} [options.source=true]
  @param {String} [options.scroll='body']
  @param {Boolean} [options.cache]
    Whether to use a [cached response](/up.proxy) if available.
  @param {String} [options.historyMethod='push']
  @return {Promise}
    A promise that will be resolved when the page has been updated.
  ###
  replace = (selectorOrElement, url, options) ->

    options = u.options(options)
    
    selector = if u.presence(selectorOrElement)
      selectorOrElement
    else
      u.createSelectorFromElement($(selectorOrElement))
      
    if !up.browser.canPushState() && !u.castsToFalse(options.history)
      up.browser.loadPage(url, u.only(options, 'method')) unless options.preload
      return u.resolvedPromise()

    request =
      url: url
      method: options.method
      selector: selector
      cache: options.cache
      preload: options.preload
      
    promise = up.proxy.ajax(request)
    
    promise.done (html, textStatus, xhr) ->
      # The server can send us the current path using a header value.
      # This way we know the actual URL if the server has redirected.
      if currentLocation = u.locationFromXhr(xhr)
        u.debug('Location from server: %o', currentLocation)
        newRequest =
          url: currentLocation
          method: u.methodFromXhr(xhr)
          selector: selector
        up.proxy.alias(request, newRequest)
        url = currentLocation
      if u.isMissing(options.history) || u.castsToTrue(options.history)
        options.history = url
      if u.isMissing(options.source) || u.castsToTrue(options.source)
        options.source = url
      implant(selector, html, options) unless options.preload

    promise.fail(u.error)
      
    promise

  ###*
  Updates a selector on the current page with the
  same selector from the given HTML string.

  Example:

      html = '<div class="before">new-before</div>' +
             '<div class="middle">new-middle</div>' +
              '<div class="after">new-after</div>';

      up.flow.implant('.middle', html):
  
  @method up.flow.implant
  @protected
  @param {String} selector
  @param {String} html
  @param {String} [options.title]
  @param {String} [options.source]
  @param {Object} [options.transition]
  @param {String} [options.scroll='body']
  @param {String} [options.history]
  @param {String} [options.historyMethod='push']
  ###
  implant = (selector, html, options) ->
    
    options = u.options(options, 
      historyMethod: 'push'
    )
    
    if u.castsToFalse(options.history)
      options.history = null

    if u.castsToFalse(options.scroll)
      options.scroll = null

    options.source = u.option(options.source, options.history)
    response = parseResponse(html)
    options.title ||= response.title()

    for step in parseImplantSteps(selector, options)
      $old = findOldFragment(step.selector)
      $new = response.find(step.selector)
      prepareForReplacement($old, options).then ->
        swapElements($old, $new, step.pseudoClass, step.transition, options)

  findOldFragment = (selector) ->
    # Prefer to replace fragments in an open popup or modal
    first(".up-popup #{selector}") ||
      first(".up-modal #{selector}") ||
      first(selector) ||
      fragmentNotFound(selector)

  fragmentNotFound = (selector) ->
    message = 'Could not find selector %o in current body HTML'
    if message[0] == '#'
      message += ' (avoid using IDs)'
    u.error(message, selector)

  parseResponse = (html) ->
    # jQuery cannot construct transient elements that contain <html> or <body> tags,
    # so we're using the native browser API to grep through the HTML
    htmlElement = u.createElementFromHtml(html)
    title: -> htmlElement.querySelector("title")?.textContent
    find: (selector) ->
      if child = htmlElement.querySelector(selector)
        $(child)
      else
        u.error("Could not find selector %o in response %o", selector, html)

  prepareForReplacement = ($element, options) ->
    # Ensure that all transitions and animations have completed.
    up.motion.finish($element)
    # Make sure the old element is visible in the viewport
    # to mimick browser behavior during a page switch.
    reveal($element, options.scroll)

  reveal = ($element, viewport) ->
    if viewport # empty strings are falsish in Javascript
      up.reveal($element, viewport: viewport)
    else
      u.resolvedDeferred()

  elementsInserted = ($new, options) ->
    options.insert?($new)
    if options.history
      document.title = options.title if options.title
      up.history[options.historyMethod](options.history)
    # Remember where the element came from so we can
    # offer reload functionality.
    setSource($new, options.source)
    autofocus($new)
    # The fragment should be readiet before animating,
    # so transitions see .up-current classes
    up.ready($new)

  swapElements = ($old, $new, pseudoClass, transition, options) ->
    transition ||= 'none'
    if pseudoClass
      insertionMethod = if pseudoClass == 'before' then 'prepend' else 'append'
      # Keep a reference to the children append/prepend because
      # we need to compile them further down. Note that since we're
      # prepending/appending instead of rpelacing, `$new` will not
      # actually be inserted into the DOM, only its children.
      $addedChildren = $new.children()
      # Insert contents() instead of $children since contents()
      # also includes text nodes.
      $old[insertionMethod]($new.contents())
      u.copyAttributes($new, $old)
      elementsInserted($addedChildren, options)
      # Since we're adding content instead of replacing, we'll only
      # animate $new instead of morphing between $old and $new
      up.animate($new, transition, options)
    else
      # Wrap the replacement as a destroy animation, so $old will
      # get marked as .up-destroying right away.
      destroy $old, animation: ->
        # Don't insert the new element after the old element.
        # For some reason this will make the browser scroll to the
        # bottom of the new element.
        $new.insertBefore($old)
        elementsInserted($new, options)
        if $old.is('body') && transition != 'none'
          u.error('Cannot apply transitions to body-elements (%o)', transition)
        up.morph($old, $new, transition, options)

  parseImplantSteps = (selector, options) ->
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

  isRealElement = ($element) ->
    unreal = '.up-ghost, .up-destroying'
    # Closest matches both the element itself
    # as well as its ancestors
    $element.closest(unreal).length == 0

  ###*
  Returns the first element matching the given selector.
  Excludes elements that also match `.up-ghost` or `.up-destroying`
  or that are children of elements with these selectors.

  Returns `null` if no element matches these conditions.

  @protected
  @method up.first
  @param {String} selector
  ###
  first = (selector) ->
    elements = $(selector).get()
    $match = null
    for element in elements
      $element = $(element)
      if isRealElement($element)
        $match = $element
        break
    $match

  ###*
  Destroys the given element or selector.
  Takes care that all destructors, if any, are called.
  The element is removed from the DOM.
  
  @method up.destroy
  @param {String|Element|jQuery} selectorOrElement 
  @param {String} [options.url]
  @param {String} [options.title]
  @param {String} [options.animation='none']
    The animation to use before the element is removed from the DOM.
  @param {Number} [options.duration]
    The duration of the animation. See [`up.animate`](/up.motion#up.animate).
  @param {Number} [options.delay]
    The delay before the animation starts. See [`up.animate`](/up.motion#up.animate).
  @param {String} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate`](/up.motion#up.animate).
  ###
  destroy = (selectorOrElement, options) ->
    $element = $(selectorOrElement)
    options = u.options(options, animation: 'none')
    animateOptions = up.motion.animateOptions(options)
    $element.addClass('up-destroying')
    # If e.g. a modal or popup asks us to restore a URL, do this
    # before emitting `fragment:destroy`. This way up.navigate sees the
    # new URL and can assign/remove .up-current classes accordingly.
    up.history.push(options.url) if u.isPresent(options.url)
    document.title = options.title if u.isPresent(options.title)
    up.bus.emit('fragment:destroy', $element)
    animationPromise = u.presence(options.animation, u.isPromise) ||
      up.motion.animate($element, options.animation, animateOptions)
    animationPromise.then -> $element.remove()
    
      
  ###*
  Replaces the given selector or element with a fresh copy
  fetched from the server.

  Up.js remembers the URL from which a fragment was loaded, so you
  don't usually need to give an URL when reloading.

  @method up.reload
  @param {String|Element|jQuery} selectorOrElement
  @param {Object} [options]
    See options for [`up.replace`](#up.replace)
  ###
  reload = (selectorOrElement, options) ->
    options = u.options(options, cache: false)
    sourceUrl = options.url || source(selectorOrElement)
    replace(selectorOrElement, sourceUrl, options)

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
  first: first

)()

up.replace = up.flow.replace
up.reload = up.flow.reload
up.destroy = up.flow.destroy
up.reset = up.flow.reset
up.first = up.flow.first
