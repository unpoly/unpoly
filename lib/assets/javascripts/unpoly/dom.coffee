###*
Fragment update API
===================
  
This module exposes a low-level Javascript API to [change](/up.replace) or
[destroy](/up.destroy) page fragments.

Most of Unpoly's functionality (like [fragment links](/up.link) or [modals](/up.modal))
is built from these functions. You can use them to extend Unpoly from your
[custom Javascript](/up.syntax).

@class up.dom
###
up.dom = (($) ->
  
  u = up.util

  ###*
  Configures defaults for fragment insertion.

  @property up.dom.config
  @param {string} [options.fallbacks=['body']]
    When a fragment updates cannot find the requested element, Unpoly will try this list of alternative selectors.

    The first selector that matches an element in the current page (or response) will be used.
    If the response contains none of the selectors, an error message will be shown.

    It is recommend to always keep `'body'` as the last selector in the last in the case
    your server or load balancer renders an error message that does not contain your
    application layout.
  @param {string} [options.fallbackTransition=null]
    The transition to use when using a [fallback target](/#options.fallbacks).

    By default this is not set and the original replacement's transition is used.
  @stable
  ###
  config = u.config
    fallbacks: ['body']
    fallbackTransition: null

  reset = ->
    config.reset()

  setSource = (element, sourceUrl) ->
    $element = $(element)
    sourceUrl = u.normalizeUrl(sourceUrl) if u.isPresent(sourceUrl)
    $element.attr("up-source", sourceUrl)

  ###*
  Returns the URL the given element was retrieved from.

  @method up.dom.source
  @param {string|Element|jQuery} selectorOrElement
  @experimental
  ###
  source = (selectorOrElement) ->
    $element = $(selectorOrElement).closest('[up-source]')
    u.presence($element.attr("up-source")) || up.browser.url()

  ###*
  Resolves the given selector (which might contain `&` references)
  to an absolute selector.

  @function up.dom.resolveSelector
  @param {string|Element|jQuery} selectorOrElement
  @param {string|Element|jQuery} origin
    The element that this selector resolution is relative to.
    That element's selector will be substituted for `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  @internal
  ###
  resolveSelector = (selectorOrElement, origin) ->
    if u.isString(selectorOrElement)
      selector = selectorOrElement
      if u.contains(selector, '&')
        if u.isPresent(origin) # isPresent returns false for empty jQuery collection
          originSelector = u.selectorForElement(origin)
          selector = selector.replace(/\&/, originSelector)
        else
          up.fail("Found origin reference (%s) in selector %s, but no origin was given", '&', selector)
    else
      selector = u.selectorForElement(selectorOrElement)
    selector

  ###*
  Replaces elements on the current page with corresponding elements
  from a new page fetched from the server.

  The current and new elements must both match the given CSS selector.

  The unobtrusive variant of this is the [`a[up-target]`](/a-up-target) selector.

  \#\#\# Example

  Let's say your curent HTML looks like this:

      <div class="one">old one</div>
      <div class="two">old two</div>

  We now replace the second `<div>`:

      up.replace('.two', '/new');

  The server renders a response for `/new`:

      <div class="one">new one</div>
      <div class="two">new two</div>

  Unpoly looks for the selector `.two` in the response and [implants](/up.extract) it into
  the current page. The current page now looks like this:

      <div class="one">old one</div>
      <div class="two">new two</div>

  Note how only `.two` has changed. The update for `.one` was
  discarded, since it didn't match the selector.

  \#\#\# Appending or prepending instead of replacing

  By default Unpoly will replace the given selector with the same
  selector from a freshly fetched page. Instead of replacing you
  can *append* the loaded content to the existing content by using the
  `:after` pseudo selector. In the same fashion, you can use `:before`
  to indicate that you would like the *prepend* the loaded content.

  A practical example would be a paginated list of items:

      <ul class="tasks">
        <li>Wash car</li>
        <li>Purchase supplies</li>
        <li>Fix tent</li>
      </ul>

  In order to append more items from a URL, replace into
  the `.tasks:after` selector:

      up.replace('.tasks:after', '/page/2')

  \#\#\# Setting the window title from the server

  If the `replace` call changes history, the document title will be set
  to the contents of a `<title>` tag in the response.

  The server can also change the document title by setting
  an `X-Up-Title` header in the response.

  \#\#\# Optimizing response rendering

  The server is free to optimize Unpoly requests by only rendering the HTML fragment
  that is being updated. The request's `X-Up-Target` header will contain
  the CSS selector for the updating fragment.

  If you are using the `unpoly-rails` gem you can also access the selector via
  `up.target` in all controllers, views and helpers.

  \#\#\# Events

  Unpoly will emit [`up:fragment:destroyed`](/up:fragment:destroyed) on the element
  that was replaced and [`up:fragment:inserted`](/up:fragment:inserted) on the new
  element that replaces it.

  @function up.replace
  @param {string|Element|jQuery} selectorOrElement
    The CSS selector to update. You can also pass a DOM element or jQuery element
    here, in which case a selector will be inferred from the element's class and ID.
  @param {string} url
    The URL to fetch from the server.
  @param {string} [options.failTarget]
    The CSS selector to update if the server sends a non-200 status code.
  @param {string} [options.fallback]
    The selector to update when the original target was not found in the page.
  @param {string} [options.title]
    The document title after the replacement.

    If the call pushes an history entry and this option is missing, the title is extracted from the response's `<title>` tag.
    You can also pass `false` to explicitly prevent the title from being updated.
  @param {string} [options.method='get']
    The HTTP method to use for the request.
  @param {Object|Array|FormData} [options.data]
    Parameters that should be sent as the request's payload.

    Parameters can either be passed as an object (where the property names become
    the param names and the property values become the param values) or as
    an array of `{ name: 'param-name', value: 'param-value' }` objects

  @param {string} [options.transition='none']
  @param {string|boolean} [options.history=true]
    If a string is given, it is used as the URL the browser's location bar and history.
    If omitted or true, the `url` argument will be used.
    If set to `false`, the history will remain unchanged.
  @param {boolean|string} [options.source=true]
  @param {boolean|string} [options.reveal=false]
    Whether to [reveal](/up.reveal) the new fragment.

    You can also pass a CSS selector for the element to reveal.
  @param {boolean|string} [options.failReveal=false]
    Whether to [reveal](/up.reveal) the new fragment when the server responds with an error.

    You can also pass a CSS selector for the element to reveal.
  @param {boolean} [options.restoreScroll=false]
    If set to true, Unpoly will try to restore the scroll position
    of all the viewports around or below the updated element. The position
    will be reset to the last known top position before a previous
    history change for the current URL.
  @param {boolean} [options.cache]
    Whether to use a [cached response](/up.proxy) if available.
  @param {string} [options.historyMethod='push']
  @param {Object} [options.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
  @param {boolean} [options.requireMatch=true]
    Whether to raise an error if the given selector is missing in
    either the current page or in the response.
  @param {Element|jQuery} [options.origin]
    The element that triggered the replacement.

    The element's selector will be substituted for the `&` shorthand in the target selector ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  @param {string} [options.layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `auto`, `page`, `modal` and `popup`.

    If set to `auto` (default), Unpoly will try to find a match in the
    same layer as the element that triggered the replacement (see `options.origin`).
    If that element is not known, or no match was found in that layer,
    Unpoly will search in other layers, starting from the topmost layer.
  @param {string} [options.failLayer='auto']
    The name of the layer that ought to be updated if the server sends a non-200 status code.
  @param {boolean} [options.keep=true]
    Whether this replacement will preserve [`[up-keep]`](/up-keep) elements.
  @param {boolean} [options.hungry=true]
    Whether this replacement will update [`[up-hungry]`](/up-hungry) elements.

  @return {Promise}
    A promise that will be fulfilled when the page has been updated.
  @stable
  ###
  replace = (selectorOrElement, url, options) ->
    options = u.options(options)

    options.inspectResponse = fullLoad = -> up.browser.navigate(url, u.only(options, 'method', 'data'))

    if !up.browser.canPushState() && options.history != false
      fullLoad() unless options.preload
      return u.unresolvablePromise()

    successOptions = u.merge options,
      humanizedTarget: 'target'

    failureOptions = u.merge options,
      humanizedTarget: 'failure target'
      provideTarget: undefined # don't provide a target if we're targeting the failTarget
      restoreScroll: false

    u.renameKey(failureOptions, 'failTransition', 'transition')
    u.renameKey(failureOptions, 'failLayer', 'layer')
    u.renameKey(failureOptions, 'failReveal', 'reveal')

    try
      improvedTarget = bestPreflightSelector(selectorOrElement, successOptions)
      improvedFailTarget = bestPreflightSelector(options.failTarget, failureOptions)
    catch e
      # Since we're an async function, we should not throw exceptions but return a rejected promise.
      # http://2ality.com/2016/03/promise-rejections-vs-exceptions.html
      return Promise.reject(e)

    request =
      url: url
      method: options.method
      data: options.data
      target: improvedTarget
      failTarget: improvedFailTarget
      cache: options.cache
      preload: options.preload
      headers: options.headers
      timeout: options.timeout

    onSuccess = (response) ->
      processResponse(true, improvedTarget, response, successOptions)

    onFailure = (response) ->
      rejection = -> Promise.reject(response)
      if response.isFatalError()
        rejection()
      else
        promise = processResponse(false, improvedFailTarget, response, failureOptions)
        # Although processResponse() we will perform a successful replacement of options.failTarget,
        # we still want to reject the promise that's returned to our API client.
        u.always(promise, rejection)

    promise = up.request(request)
    promise = promise.then(onSuccess, onFailure) unless options.preload
    promise

  ###*
  @internal
  ###
  processResponse = (isSuccess, selector, response, options) ->
    request = response.request
    sourceUrl = response.url
    historyUrl = sourceUrl
    hash = request.hash

    if options.reveal == true && hash
      # If the request URL had a #hash and options.reveal is not given, we reveal that #hash.
      options.reveal = hash
      historyUrl += hash

    isReloadable = (response.method == 'GET')

    if isSuccess
      if isReloadable # e.g. GET returns 200 OK
        options.history = historyUrl unless options.history is false || u.isString(options.history)
        options.source  = sourceUrl unless options.source is false || u.isString(options.source)
      else # e.g. POST returns 200 OK
        # We allow the developer to pass GETable URLs as { history } and { source } options.
        options.history = false unless u.isString(options.history)
        options.source  = 'keep' unless u.isString(options.source)
    else
      if isReloadable # e.g. GET returns 500 Internal Server Error
        options.history = historyUrl unless options.history is false
        options.source  = sourceUrl unless options.source is false
      else # e.g. POST returns 500 Internal Server Error
        options.history = false
        options.source  = 'keep'

    if shouldExtractTitle(options) && response.title
      options.title = response.title

    extract(selector, response.text, options)

  shouldExtractTitle = (options) ->
    not (options.title is false || u.isString(options.title) || (options.history is false && options.title isnt true))

  ###*
  Updates a selector on the current page with the
  same selector from the given HTML string.

  \#\#\# Example

  Let's say your curent HTML looks like this:

      <div class="one">old one</div>
      <div class="two">old two</div>

  We now replace the second `<div>`, using an HTML string
  as the source:

      html = '<div class="one">new one</div>' +
             '<div class="two">new two</div>';

      up.extract('.two', html);

  Unpoly looks for the selector `.two` in the strings and updates its
  contents in the current page. The current page now looks like this:

      <div class="one">old one</div>
      <div class="two">new two</div>

  Note how only `.two` has changed. The update for `.one` was
  discarded, since it didn't match the selector.

  @function up.extract
  @param {string|Element|jQuery} selectorOrElement
  @param {string} html
  @param {Object} [options]
    See options for [`up.replace()`](/up.replace).
  @return {Promise}
    A promise that will be fulfilled then the selector was updated
    and all animation has finished.
  @stable
  ###
  extract = (selectorOrElement, html, options) ->
    up.log.group 'Extracting %s from %d bytes of HTML', selectorOrElement, html?.length, ->
      options = u.options options,
        historyMethod: 'push'
        requireMatch: true
        keep: true
        layer: 'auto'

      up.layout.saveScroll() unless options.saveScroll == false

      u.rejectOnError ->
        # Allow callers to create the targeted element right before we swap.
        options.provideTarget?()
        responseDoc = parseResponseDoc(html)
        extractSteps = bestMatchingSteps(selectorOrElement, responseDoc, options)

        if shouldExtractTitle(options) && responseTitle = responseDoc.title()
          options.title = responseTitle
        updateHistoryAndTitle(options)

        swapPromises = []

        for step in extractSteps
          up.log.group 'Updating %s', step.selector, ->
            # Note that we must copy the options hash instead of changing it in-place,  since the
            # async swapElements() is scheduled for the next microtask and we must not change the options
            # for the previous iteration.
            swapOptions = u.merge(options, u.only(step, 'origin', 'reveal'))

            fixScripts(step.$new)

            swapPromise = swapElements(step.$old, step.$new, step.pseudoClass, step.transition, swapOptions)
            swapPromises.push(swapPromise)

        # Delay all further links in the promise chain until all fragments have been swapped
        Promise.all(swapPromises)

  bestPreflightSelector = (selector, options) ->
    cascade = new up.ExtractCascade(selector, options)
    cascade.bestPreflightSelector()

  bestMatchingSteps = (selector, response, options) ->
    options = u.merge(options, { response })
    cascade = new up.ExtractCascade(selector, options)
    cascade.bestMatchingSteps()

  fixScripts = ($element) ->
    # detectScriptFixes() both (1) iterates over element.children and
    # (2) removes elements from that live array. This would cause calls to
    # detectScriptFixes(undefined). Hence we collect all required deletions
    # and replacements and execute them in one sweep when we're done iterating.
    fixes = []
    detectScriptFixes($element.get(0), fixes)
    fix() for fix in fixes

  detectScriptFixes = (element, fixes) ->
    # IE11 and Edge cannot find <noscript> tags with jQuery or querySelector() or getElementsByTagName()
    # when the tag was created by DOMParser. That's why we traverse the DOM manually.
    # https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12453464/
    if element.tagName == 'NOSCRIPT'
      # Create a clone of the <noscript> element because IE11 and Edge cannot find <noscript> tags
      # created by DOMParser. They will be able to find the clone.
      clone = document.createElement('noscript')
      # The children of a <nonscript> tag are expected to be a verbatim text node
      # in a scripting-capable browser. However, due to rules in the DOMParser spec,
      # the children are parsed into actual DOM nodes. This confuses libraries that
      # work with <noscript> tags, such as lazysizes.
      # http://w3c.github.io/DOM-Parsing/#dom-domparser-parsefromstring
      clone.textContent = element.innerHTML
      fixes.push -> element.parentNode.replaceChild(clone, element)
    else if element.tagName == 'SCRIPT'
      # We don't support the execution of <script> tags in new fragments.
      # This is a feature that we had in Unpoly once, but no one used it for years.
      # It's also tricky to implement since <script> tags created by DOMParser are
      # marked as non-executable.
      # http://w3c.github.io/DOM-Parsing/#dom-domparser-parsefromstring
      fixes.push -> element.parentNode.removeChild(element)
    else
      for child in element.children
        detectScriptFixes(child, fixes)

  parseResponseDoc = (html) ->
    # jQuery cannot construct transient elements that contain <html> or <body> tags
    htmlElement = u.createElementFromHtml(html)
    title: ->
      htmlElement.querySelector("head title")?.textContent
    first: (selector) ->
      # Although we cannot have a jQuery collection from an entire HTML document,
      # we can use jQuery's Sizzle engine to grep through a DOM tree.
      # jQuery.find is the Sizzle function (https://github.com/jquery/sizzle/wiki#public-api)
      # which gives us non-standard CSS selectors such as `:has`.
      # It returns an array of DOM elements, NOT a jQuery collection.
      if child = $.find(selector, htmlElement)[0]
        $(child)

  updateHistoryAndTitle = (options) ->
    options = u.options(options, historyMethod: 'push')
    up.history[options.historyMethod](options.history) if options.history
    document.title = options.title if u.isString(options.title)

  swapElements = ($old, $new, pseudoClass, transition, options) ->
    transition ||= 'none'

    if options.source == 'keep'
      options = u.merge(options, source: source($old))

    # Ensure that all transitions and animations have completed.
    up.motion.finish($old)

    if pseudoClass
      # Text nodes are wrapped in a .up-insertion container so we can
      # animate them and measure their position/size for scrolling.
      # This is not possible for container-less text nodes.
      $wrapper = $new.contents().wrapAll('<div class="up-insertion"></div>').parent()

      # Note that since we're prepending/appending instead of replacing,
      # `$new` will not actually be inserted into the DOM, only its children.
      if pseudoClass == 'before'
        $old.prepend($wrapper)
      else
        $old.append($wrapper)

      hello($wrapper.children(), options)

      # Reveal element that was being prepended/appended.
      # Since we will animate (not morph) it's OK to allow animation of scrolling
      # if the user has configured up.layout.config.duration.
      promise = up.layout.revealOrRestoreScroll($wrapper, options)

      # Since we're adding content instead of replacing, we'll only
      # animate $new instead of morphing between $old and $new
      promise = promise.then -> up.animate($wrapper, transition, options)

      # Remove the wrapper now that is has served it purpose
      promise = promise.then -> u.unwrapElement($wrapper)

    else if keepPlan = findKeepPlan($old, $new, options)
      # Since we're keeping the element that was requested to be swapped,
      # there is nothing left to do here.
      emitFragmentKept(keepPlan)
      promise = Promise.resolve()

    else
      # This needs to happen before prepareClean() below.
      options.keepPlans = transferKeepableElements($old, $new, options)

      # Collect destructor functions before swapping the elements.
      # Detaching an element from the DOM will cause jQuery to remove the data properties
      # where we store constructor functions.
      clean = up.syntax.prepareClean($old)

      replacement = ->
        if shouldSwapElementsDirectly($old, $new, transition, options)
          # jQuery will actually let us .insertBefore the new <body> tag,
          # but that's probably bad Karma.
          swapElementsDirectly($old, $new)
          # We cannot morph the <body> tag. Also in case we have found that we won't
          # animate above, save ourselves from reepeating the expensive check in up.morph().
          transition = false
        else
          # Don't insert the new element after the old element. For some reason
          # this will make the browser scroll to the bottom of the new element.
          $new.insertBefore($old)

        # Remember where the element came from so we can
        # offer reload functionality.
        setSource($new, options.source) unless options.source is false

        autofocus($new)

        # The fragment should be compiled before animating,
        # so transitions see .up-current classes
        hello($new, options)

        # Morphing will also process options.reveal
        up.morph($old, $new, transition, options)

      # Wrap the replacement as a destroy animation, so $old will
      # get marked as .up-destroying right away.
      promise = destroy($old, { clean, beforeWipe: replacement, log: false })

    promise

  shouldSwapElementsDirectly = ($old, $new, transition, options) ->
    $both = $old.add($new)
    $old.is('body') || !up.motion.willAnimate($both, transition, options)

  # This is a separate method so we can mock it in specs
  swapElementsDirectly = ($old, $new) ->
    # jQuery will actually let us .insertBefore the new <body> tag,
    # but that's probably bad Karma.
    $old.replaceWith($new)

  transferKeepableElements = ($old, $new, options) ->
    keepPlans = []
    if options.keep
      for keepable in $old.find('[up-keep]')
        $keepable = $(keepable)
        if plan = findKeepPlan($keepable, $new, u.merge(options, descendantsOnly: true))
          # Replace $keepable with its clone so it looks good in a transition between
          # $old and $new. Note that $keepable will still point to the same element
          # after the replacement, which is now detached.
          $keepableClone = $keepable.clone()
          up.util.detachWith($keepable, $keepableClone)

          # $keepable.replaceWith($keepableClone)
          # Since we're going to swap the entire $old and $new containers afterwards,
          # replace the matching element with $keepable so it will eventually return to the DOM.
          plan.$newElement.replaceWith($keepable)
          keepPlans.push(plan)
    keepPlans

  findKeepPlan = ($element, $new, options) ->
    if options.keep
      $keepable = $element
      if partnerSelector = u.castedAttr($keepable, 'up-keep')
        u.isString(partnerSelector) or partnerSelector = '&'
        partnerSelector = resolveSelector(partnerSelector, $keepable)
        if options.descendantsOnly
          $partner = $new.find(partnerSelector)
        else
          $partner = u.selectInSubtree($new, partnerSelector)
        $partner = $partner.first()
        if $partner.length && $partner.is('[up-keep]')
          plan =
            $element: $keepable               # the element that should be kept
            $newElement: $partner             # the element that would have replaced it but now does not
            newData: up.syntax.data($partner) # the parsed up-data attribute of the element we will discard
          keepEventArgs = u.merge(plan, message: ['Keeping element %o', $keepable.get(0)])
          if up.bus.nobodyPrevents('up:fragment:keep', keepEventArgs)
            plan

  ###*
  Elements with an `up-keep` attribute will be persisted during
  [fragment updates](/a-up-target).

  For example:

      <audio up-keep src="song.mp3"></audio>

  The element you're keeping should have an umambiguous class name, ID or `up-id`
  attribute so Unpoly can find its new position within the page update.

  Emits events [`up:fragment:keep`](/up:fragment:keep) and [`up:fragment:kept`](/up:fragment:kept).

  \#\#\# Controlling if an element will be kept

  Unpoly will **only** keep an existing element if:

  - The existing element has an `up-keep` attribute
  - The response contains an element matching the CSS selector of the existing element
  - The matching element *also* has an `up-keep` attribute
  - The [`up:fragment:keep`](/up:fragment:keep) event that is [emitted](/up.emit) on the existing element
    is not prevented by a event listener.

  Let's say we want only keep an `<audio>` element as long as it plays
  the same song (as identified by the tag's `src` attribute).

  On the client we can achieve this by listening to an `up:keep:fragment` event
  and preventing it if the `src` attribute of the old and new element differ:

      up.compiler('audio', function($element) {
        $element.on('up:fragment:keep', function(event) {
          if $element.attr('src') !== event.$newElement.attr('src') {
            event.preventDefault();
          }
        });
      });

  If we don't want to solve this on the client, we can achieve the same effect
  on the server. By setting the value of the `up-keep` attribute we can
  define the CSS selector used for matching elements.

      <audio up-keep="audio[src='song.mp3']" src="song.mp3"></audio>

  Now, if a response no longer contains an `<audio src="song.mp3">` tag, the existing
  element will be destroyed and replaced by a fragment from the response.

  @selector [up-keep]
  @stable
  ###

  ###*
  This event is [emitted](/up.emit) before an existing element is [kept](/up-keep) during
  a page update.

  Event listeners can call `event.preventDefault()` on an `up:fragment:keep` event
  to prevent the element from being persisted. If the event is prevented, the element
  will be replaced by a fragment from the response.

  @event up:fragment:keep
  @param event.preventDefault()
    Event listeners may call this method to prevent the element from being preserved.
  @param {jQuery} event.$element
    The fragment that will be kept.
  @param {jQuery} event.$newElement
    The discarded element.
  @param {Object} event.newData
    The value of the [`up-data`](/up-data) attribute of the discarded element,
    parsed as a JSON object.
  @stable
  ###

  ###*
  This event is [emitted](/up.emit) when an existing element has been [kept](/up-keep)
  during a page update.

  Event listeners can inspect the discarded update through `event.$newElement`
  and `event.newData` and then modify the preserved element when necessary.

  @event up:fragment:kept
  @param {jQuery} event.$element
    The fragment that has been kept.
  @param {jQuery} event.$newElement
    The discarded element.
  @param {Object} event.newData
    The value of the [`up-data`](/up-data) attribute of the discarded element,
    parsed as a JSON object.
  @stable
  ###

  ###*
  Compiles a page fragment that has been inserted into the DOM
  by external code.

  **As long as you manipulate the DOM using Unpoly, you will never
  need to call this method.** You only need to use `up.hello()` if the
  DOM is manipulated without Unpoly' involvement, e.g. by setting
  the `innerHTML` property or calling jQuery methods like
  `html`, `insertAfter` or `appendTo`:

      $element = $('.element');
      $element.html('<div>...</div>');
      up.hello($element);

  This function emits the [`up:fragment:inserted`](/up:fragment:inserted)
  event.

  @function up.hello
  @param {string|Element|jQuery} selectorOrElement
  @param {string|Element|jQuery} [options.origin]
  @param {string|Element|jQuery} [options.kept]
  @return {jQuery}
    The compiled element
  @stable
  ###
  hello = (selectorOrElement, options) ->
    $element = $(selectorOrElement)
    options = u.options(options, keepPlans: [])
    keptElements = []
    for plan in options.keepPlans
      emitFragmentKept(plan)
      keptElements.push(plan.$element)
    up.syntax.compile($element, skip: keptElements)
    emitFragmentInserted($element, options)
    $element

  ###*
  When a page fragment has been [inserted or updated](/up.replace),
  this event is [emitted](/up.emit) on the fragment.

  \#\#\# Example

      up.on('up:fragment:inserted', function(event, $fragment) {
        console.log("Looks like we have a new %o!", $fragment);
      });

  @event up:fragment:inserted
  @param {jQuery} event.$element
    The fragment that has been inserted or updated.
  @stable
  ###
  emitFragmentInserted = (fragment, options) ->
    $fragment = $(fragment)
    up.emit 'up:fragment:inserted',
      $element: $fragment
      message: ['Inserted fragment %o', $fragment.get(0)]
      origin: options.origin

  emitFragmentKept = (keepPlan) ->
    eventAttrs = u.merge(keepPlan, message: ['Kept fragment %o', keepPlan.$element.get(0)])
    up.emit('up:fragment:kept', eventAttrs)

  autofocus = ($element) ->
    selector = '[autofocus]:last'
    $control = u.selectInSubtree($element, selector)
    if $control.length && $control.get(0) != document.activeElement
      $control.focus()

  isRealElement = ($element) ->
    unreal = '.up-ghost, .up-destroying'
    # Closest matches both the element itself
    # as well as its ancestors
    $element.closest(unreal).length == 0

  ###*
  Returns the first element matching the given selector, but
  ignores elements that are being [destroyed](/up.destroy) or [transitioned](/up.morph).

  If the given argument is already a jQuery collection (or an array
  of DOM elements), the first element matching these conditions
  is returned.

  Returns `undefined` if no element matches these conditions.

  @function up.first
  @param {string|Element|jQuery|Array<Element>} selectorOrElement
  @param {string} options.layer
    The name of the layer in which to find the element. Valid values are
    `auto`, `page`, `modal` and `popup`.
  @param {string|Element|jQuery} [options.origin]
    An second element or selector that can be referenced as `&` in the first selector:

        $input = $('input.email');
        up.first('.field:has(&)', $input); // returns the .field containing $input
  @return {jQuery|undefined}
    The first element that is neither a ghost or being destroyed,
    or `undefined` if no such element was found.
  @experimental
  ###
  first = (selectorOrElement, options) ->
    options = u.options(options, layer: 'auto')
    resolved = resolveSelector(selectorOrElement, options.origin)
    if options.layer == 'auto'
      firstInPriority(resolved, options.origin)
    else
      firstInLayer(resolved, options.layer)

  firstInPriority = (selectorOrElement, origin) ->
    layers = ['popup', 'modal', 'page']
    $match = undefined
    if u.isPresent(origin)
      originLayer = layerOf(origin)
      # Make the origin's layer the top priority
      u.remove(layers, originLayer)
      layers.unshift(originLayer)
    for layer in layers
      if $match = firstInLayer(selectorOrElement, layer)
        break
    $match

  firstInLayer = (selectorOrElement, layer) ->
    $elements = $(selectorOrElement)
    $match = undefined
    for element in $elements
      $element = $(element)
      if isRealElement($element) && matchesLayer($element, layer)
        $match = $element
        break
    $match

  layerOf = (selectorOrElement) ->
    $element = $(selectorOrElement)
    if up.popup.contains($element)
      'popup'
    else if up.modal.contains($element)
      'modal'
    else
      'page'

  matchesLayer = (selectorOrElement, layer) ->
    layerOf(selectorOrElement) == layer

  ###*
  Destroys the given element or selector.

  Takes care that all [`up.compiler()`](/up.compiler) destructors, if any, are called.

  The element is removed from the DOM.
  Note that if you choose to animate the element removal using `options.animate`,
  the element won't be removed until after the animation has completed.

  Emits events [`up:fragment:destroy`](/up:fragment:destroy) and [`up:fragment:destroyed`](/up:fragment:destroyed).
  
  @function up.destroy
  @param {string|Element|jQuery} selectorOrElement
  @param {string} [options.history]
    A URL that will be pushed as a new history entry when the element begins destruction.
  @param {string} [options.title]
    The document title to set when the element begins destruction.
  @param {string|Function} [options.animation='none']
    The animation to use before the element is removed from the DOM.
  @param {number} [options.duration]
    The duration of the animation. See [`up.animate()`](/up.animate).
  @param {number} [options.delay]
    The delay before the animation starts. See [`up.animate()`](/up.animate).
  @param {string} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate()`](/up.animate).
  @return {Promise}
    A promise that will be fulfilled once the element has been removed from the DOM.
  @stable
  ###
  destroy = (selectorOrElement, options) ->
    $element = $(selectorOrElement)
    options = u.options(options, animation: false)

    if shouldLogDestruction($element, options)
      destroyMessage = ['Destroying fragment %o', $element.get(0)]
      destroyedMessage = ['Destroyed fragment %o', $element.get(0)]

    if $element.length == 0
      Promise.resolve()
    else
      up.emit 'up:fragment:destroy', $element: $element, message: destroyMessage
      $element.addClass('up-destroying')
      # If e.g. a modal or popup asks us to restore a URL, do this
      # before emitting `fragment:destroy`. This way up.navigate sees the
      # new URL and can assign/remove .up-current classes accordingly.
      updateHistoryAndTitle(options)

      animate = ->
        animateOptions = up.motion.animateOptions(options)
        up.motion.animate($element, options.animation, animateOptions)

      beforeWipe = options.beforeWipe || Promise.resolve()

      wipe = ->
        options.clean ||= -> up.syntax.clean($element)
        options.clean()
        up.syntax.clean($element)
        # Emit this while $element is still part of the DOM, so event
        # listeners bound to the document will receive the event.
        up.emit 'up:fragment:destroyed', $element: $element, message: destroyedMessage
        $element.remove()

      animate().then(beforeWipe).then(wipe)

  shouldLogDestruction = ($element, options) ->
    # Don't log destruction for elements that are either Unpoly internals or frequently destroyed
    options.log != false && !$element.is('.up-placeholder, .up-tooltip, .up-modal, .up-popup')

  ###*
  Before a page fragment is being [destroyed](/up.destroy), this
  event is [emitted](/up.emit) on the fragment.

  If the destruction is animated, this event is emitted before the
  animation begins.

  @event up:fragment:destroy
  @param {jQuery} event.$element
    The page fragment that is about to be destroyed.
  @stable
  ###

  ###*
  This event is [emitted](/up.emit) right before a [destroyed](/up.destroy)
  page fragment is removed from the DOM.

  If the destruction is animated, this event is emitted after
  the animation has ended.

  @event up:fragment:destroyed
  @param {jQuery} event.$element
    The page fragment that is about to be removed from the DOM.
  @stable
  ###

  ###*
  Replaces the given element with a fresh copy fetched from the server.

  \#\#\# Example

      up.on('new-mail', function() {
        up.reload('.inbox');
      });

  Unpoly remembers the URL from which a fragment was loaded, so you
  don't usually need to give an URL when reloading.

  @function up.reload
  @param {string|Element|jQuery} selectorOrElement
  @param {Object} [options]
    See options for [`up.replace()`](/up.replace)
  @param {string} [options.url]
    The URL from which to reload the fragment.
    This defaults to the URL from which the fragment was originally loaded.
  @stable
  ###
  reload = (selectorOrElement, options) ->
    options = u.options(options, cache: false)
    sourceUrl = options.url || source(selectorOrElement)
    replace(selectorOrElement, sourceUrl, options)

  up.on 'up:app:boot', ->
    $body = $(document.body)
    setSource($body, up.browser.url())
    hello($body)

  up.on 'up:framework:reset', reset

  knife: eval(Knife?.point)
  replace: replace
  reload: reload
  destroy: destroy
  extract: extract
  first: first
  source: source
  resolveSelector: resolveSelector
  hello: hello
  config: config

)(jQuery)

up.replace = up.dom.replace
up.extract = up.dom.extract
up.reload = up.dom.reload
up.destroy = up.dom.destroy
up.first = up.dom.first
up.hello = up.dom.hello

up.renamedModule 'flow', 'dom'
