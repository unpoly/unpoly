###*
Changing page fragments programmatically
========================================
  
This module contains Unpoly's core functions to [change](/up.replace) or
[destroy](/up.destroy) page fragments via Javascript.

All the other Unpoly modules (like [`up.link`](/up.link) or [`up.modal`](/up.modal))
are based on this module.
  
@class up.flow
###
up.flow = (($) ->
  
  u = up.util

  ###*
  Configures defaults for fragment insertion.

  @property up.flow.config
  @param {Boolean} [options.runInlineScripts=true]
    Whether inline `<script>` tags inside inserted HTML fragments will be executed.
  @param {Boolean} [options.runLinkedScripts=false]
    Whether `<script src='...'>` tags inside inserted HTML fragments will fetch and execute
    the linked Javascript file.
  @stable
  ###
  config = u.config
    runInlineScripts: true
    runLinkedScripts: false

  reset = ->
    config.reset()

  setSource = (element, sourceUrl) ->
    $element = $(element)
    sourceUrl = u.normalizeUrl(sourceUrl) if u.isPresent(sourceUrl)
    $element.attr("up-source", sourceUrl)

  ###*
  Returns the URL the given element was retrieved from.

  @method up.flow.source
  @param {String|Element|jQuery} selectorOrElement
  @experimental
  ###
  source = (selectorOrElement) ->
    $element = $(selectorOrElement).closest('[up-source]')
    u.presence($element.attr("up-source")) || up.browser.url()

  ###*
  Resolves the given selector (which might contain `&` references)
  to an absolute selector.

  @function up.flow.resolveSelector
  @param {String|Element|jQuery} selectorOrElement
  @param {String|Element|jQuery} origin
    The element that this selector resolution is relative to.
    That element's selector will be substituted for `&`.
  @internal
  ###
  resolveSelector = (selectorOrElement, origin) ->
    if u.isString(selectorOrElement)
      selector = selectorOrElement
      if u.contains(selector, '&')
        if origin
          originSelector = u.selectorForElement(origin)
          selector = selector.replace(/\&/, originSelector)
        else
          u.error("Found origin reference (%s) in selector %s, but options.origin is missing", '&', selector)
    else
      selector = u.selectorForElement(selectorOrElement)
    selector

  ###*
  Replaces elements on the current page with corresponding elements
  from a new page fetched from the server.

  The current and new elements must both match the given CSS selector.

  The UJS variant of this is the [`a[up-target]`](/a-up-target) selector.

  \#\#\#\# Example

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

  \#\#\#\# Appending or prepending instead of replacing

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

  \#\#\#\# Setting the window title from the server

  If the `replace` call changes history, the document title will be set
  to the contents of a `<title>` tag in the response.

  The server can also change the document title by setting
  an `X-Up-Title` header in the response.

  \#\#\#\# Optimizing response rendering

  The server is free to optimize Unpoly requests by only rendering the HTML fragment
  that is being updated. The request's `X-Up-Target` header will contain
  the CSS selector for the updating fragment.

  If you are using the `unpoly-rails` gem you can also access the selector via
  `up.target` in all controllers, views and helpers.

  \#\#\#\# Events

  Unpoly will emit [`up:fragment:destroyed`](/up:fragment:destroyed) on the element
  that was replaced and [`up:fragment:inserted`](/up:fragment:inserted) on the new
  element that replaces it.

  @function up.replace
  @param {String|Element|jQuery} selectorOrElement
    The CSS selector to update. You can also pass a DOM element or jQuery element
    here, in which case a selector will be inferred from the element's class and ID.
  @param {String} url
    The URL to fetch from the server.
  @param {String} [options.failTarget='body']
    The CSS selector to update if the server sends a non-200 status code.
  @param {String} [options.title]
    The document title after the replacement.

    If the call pushes an history entry and this option is missing, the title is extracted from the response's `<title>` tag.
    You can also pass `false` to explicitly prevent the title from being updated.
  @param {String} [options.method='get']
    The HTTP method to use for the request.
  @param {Object|Array} [options.data]
    Parameters that should be sent as the request's payload.

    Parameters can either be passed as an object (where the property names become
    the param names and the property values become the param values) or as
    an array of `{ name: 'param-name', value: 'param-value' }` objects
    (compare to jQuery's [`serializeArray`](https://api.jquery.com/serializeArray/)).
  @param {String} [options.transition='none']
  @param {String|Boolean} [options.history=true]
    If a `String` is given, it is used as the URL the browser's location bar and history.
    If omitted or true, the `url` argument will be used.
    If set to `false`, the history will remain unchanged.
  @param {String|Boolean} [options.source=true]
  @param {String} [options.reveal=false]
    Whether to [reveal](/up.reveal) the element being updated, by
    scrolling its containing viewport.
  @param {Boolean} [options.restoreScroll=false]
    If set to true, Unpoly will try to restore the scroll position
    of all the viewports around or below the updated element. The position
    will be reset to the last known top position before a previous
    history change for the current URL.
  @param {Boolean} [options.cache]
    Whether to use a [cached response](/up.proxy) if available.
  @param {String} [options.historyMethod='push']
  @param {Object} [options.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
  @param {Boolean} [options.requireMatch=true]
    Whether to raise an error if the given selector is missing in
    either the current page or in the response.
  @param {Element|jQuery} [options.origin]
    The element that triggered the replacement.

    The element's selector will be substituted for the `&` shorthand in the target selector.
  @param {String} [options.layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `auto`, `page`, `modal` and `popup`.

    If set to `auto` (default), Unpoly will try to find a match in the
    same layer as the element that triggered the replacement (see `options.origin`).
    If that element is not known, or no match was found in that layer,
    Unpoly will search in other layers, starting from the topmost layer.
  @return {Promise}
    A promise that will be resolved when the page has been updated.
  @stable
  ###
  replace = (selectorOrElement, url, options) ->
    up.puts "Replacing %s from %s (%o)", selectorOrElement, url, options
    options = u.options(options)
    target = resolveSelector(selectorOrElement, options.origin)
    failTarget = u.option(options.failTarget, 'body')
    failTarget = resolveSelector(failTarget, options.origin)

    if !up.browser.canPushState() && options.history != false
      unless options.preload
        up.browser.loadPage(url, u.only(options, 'method', 'data'))
      return u.unresolvablePromise()

    request =
      url: url
      method: options.method
      data: options.data
      target: target
      failTarget: failTarget
      cache: options.cache
      preload: options.preload
      headers: options.headers
      
    options.inspectResponse = -> up.browser.loadPage(url, u.only(options, 'method', 'data'))

    promise = up.ajax(request)

    onSuccess = (html, textStatus, xhr) ->
      processResponse(true, target, url, request, xhr, options)

    onFailure = (xhr, textStatus, errorThrown) ->
      processResponse(false, failTarget, url, request, xhr, options)

    promise = promise.then(onSuccess, onFailure)

    promise

  ###*
  @internal
  ###
  processResponse = (isSuccess, selector, url, request, xhr, options) ->
    options.method = u.normalizeMethod(u.option(u.methodFromXhr(xhr), options.method))

    isReloadable = (options.method == 'GET')

    # The server can send us the current path using a header value.
    # This way we know the actual URL if the server has redirected.
    # TODO: This logic should be moved to up.proxy.
    if urlFromServer = u.locationFromXhr(xhr)
      url = urlFromServer
      if isSuccess && up.proxy.isCachable(request)
        newRequest =
          url: url
          method: u.methodFromXhr(xhr) # If the server redirects, we must use the signaled method (should be GET)
          target: selector
        up.proxy.alias(request, newRequest)
    else if isReloadable
      if query = u.requestDataAsQuery(options.data)
        url = "#{url}?#{query}"

    if isSuccess
      if isReloadable # e.g. GET returns 200 OK
        options.history = url unless options.history is false || u.isString(options.history)
        options.source  = url unless options.source  is false || u.isString(options.source)
      else # e.g. POST returns 200 OK
        options.history = false  unless u.isString(options.history)
        options.source  = 'keep' unless u.isString(options.source)
    else
      options.transition = options.failTransition
      options.failTransition = undefined
      if isReloadable # e.g. GET returns 500 Internal Server Error
        options.history = url unless options.history is false
        options.source  = url unless options.source  is false
      else # e.g. POST returns 500 Internal Server Error
        options.source  = 'keep'
        options.history = false

    options.title = u.titleFromXhr(xhr) if shouldExtractTitle(options)

    if options.preload
      u.resolvedPromise()
    else
      extract(selector, xhr.responseText, options)

  shouldExtractTitle = (options) ->
    not (options.title is false || u.isString(options.title) || (options.history is false && options.title isnt true))

  ###*
  Updates a selector on the current page with the
  same selector from the given HTML string.

  \#\#\#\# Example

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
  @param {String|Element|jQuery} selectorOrElement
  @param {String} html
  @param {Object} [options]
    See options for [`up.replace`](/up.replace).
  @return {Promise}
    A promise that will be resolved then the selector was updated
    and all animation has finished.
  @experimental
  ###
  extract = (selectorOrElement, html, options) ->
    up.log.group 'Extracting %s from %d bytes of HTML', selectorOrElement, html?.length, ->
      options = u.options(options,
        historyMethod: 'push'
        requireMatch: true
        keep: true
        layer: 'auto'
      )
      selector = resolveSelector(selectorOrElement, options.origin)
      response = parseResponse(html, options)
      options.title = response.title() if shouldExtractTitle(options)

      up.layout.saveScroll() unless options.saveScroll == false

      promise = u.resolvedPromise()
      promise = promise.then(options.beforeSwap) if options.beforeSwap
      promise = promise.then -> updateHistory(options)
      promise = promise.then ->
        swapPromises = []
        for step in parseImplantSteps(selector, options)
          up.log.group 'Updating %s', step.selector, ->
            $old = findOldFragment(step.selector, options)
            $new = response.first(step.selector)
            if $old && $new
              filterScripts($new, options)
              swapPromise = swapElements($old, $new, step.pseudoClass, step.transition, options)
              swapPromises.push(swapPromise)
              options.reveal = false
        # Delay all further links in the promise chain until all fragments have been swapped
        return $.when(swapPromises...)
      promise = promise.then(options.afterSwap) if options.afterSwap
      promise

  findOldFragment = (selector, options) ->
    first(selector, options) || oldFragmentNotFound(selector, options)

  oldFragmentNotFound = (selector, options) ->
    if options.requireMatch
      layerProse = options.layer
      layerProse = 'page, modal or popup' if layerProse == 'auto'
      message = "Could not find selector %s in the current #{layerProse}"
      if message[0] == '#'
        message += ' (avoid using IDs)'
      u.error(message, selector)

  filterScripts = ($element, options) ->
    runInlineScripts = u.option(options.runInlineScripts, config.runInlineScripts)
    runLinkedScripts = u.option(options.runLinkedScripts, config.runLinkedScripts)
    $scripts = u.findWithSelf($element, 'script')
    for script in $scripts
      $script = $(script)
      isLinked = u.isPresent($script.attr('src'))
      isInline = not isLinked
      unless (isLinked && runLinkedScripts) || (isInline && runInlineScripts)
        $script.remove()

  parseResponse = (html, options) ->
    # jQuery cannot construct transient elements that contain <html> or <body> tags
    htmlElement = u.createElementFromHtml(html)
    title: -> htmlElement.querySelector("title")?.textContent
    first: (selector) ->
      # Although we cannot have a jQuery collection from an entire HTML document,
      # we can use jQuery's Sizzle engine to grep through a DOM tree.
      # jQuery.find is the Sizzle function (https://github.com/jquery/sizzle/wiki#public-api)
      # which gives us non-standard CSS selectors such as `:has`.
      # It returns an array of DOM elements, NOT a jQuery collection.
      if child = $.find(selector, htmlElement)[0]
        $(child)
      else if options.requireMatch
        inspectAction = { label: 'Open response', callback: options.inspectResponse }
        u.error(["Could not find selector %s in response %o", selector, html], action: inspectAction)

  updateHistory = (options) ->
    options = u.options(options, historyMethod: 'push')
    if options.history
      up.history[options.historyMethod](options.history)
    if options.title
      document.title = options.title

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
      promise = up.layout.revealOrRestoreScroll($wrapper, options)

      # Since we're adding content instead of replacing, we'll only
      # animate $new instead of morphing between $old and $new
      promise = promise.then -> up.animate($wrapper, transition, options)

      # Remove the wrapper now that is has served it purpose
      promise = promise.then -> u.unwrapElement($wrapper)

    else if keepPlan = findKeepPlan($old, $new, options)
      emitFragmentKept(keepPlan)
      promise = u.resolvedPromise()

    else
      replacement = ->

        options.keepPlans = transferKeepableElements($old, $new, options)

        if $old.is('body')
          # We would prefer to delay cleaning until the destroy transition ends, but a
          # swap of <body> cannot be animated. Also the replaceWith call below will clean the
          # destroyer's data property from $old, making the up.syntax.clean call in `destroy` blow up.
          up.syntax.clean($old)
          # jQuery will actually let us .insertBefore the new <body> tag,
          # but that's probably bad Karma.
          $old.replaceWith($new)
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
      promise = destroy($old, animation: replacement)

    promise

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
          $keepable.replaceWith($keepableClone)
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
          $partner = u.findWithSelf($new, partnerSelector)
        $partner = $partner.first()
        if $partner.length && $partner.is('[up-keep]')
          description =
            $element: $keepable               # the element that should be kept
            $newElement: $partner             # the element that would have replaced it but now does not
            newData: up.syntax.data($partner) # the parsed up-data attribute of the element we will discard
          keepEventArgs = u.merge(description, message: ['Keeping element %o', $keepable.get(0)])
          if up.bus.nobodyPrevents('up:fragment:keep', keepEventArgs)
            description

  ###*
  Elements with an `up-keep` attribute will be persisted during
  [fragment updates](/a-up-target).

  For example:

      <audio up-keep src="song.mp3"></audio>

  The element you're keeping should have an umambiguous class name, ID or `up-id`
  attribute so Unpoly can find its new position within the page update.

  Emits events [`up:fragment:keep`](/up:fragment:keep) and [`up:fragment:kept`](/up:fragment:kept).

  \#\#\#\# Controlling if an element will be kept

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
  @param {jqQuery} event.$newElement
    The discarded element.
  @param {jQuery} event.newData
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
  @param {jqQuery} event.$newElement
    The discarded element.
  @param {jQuery} event.newData
    The value of the [`up-data`](/up-data) attribute of the discarded element,
    parsed as a JSON object.
  @stable
  ###

  parseImplantSteps = (selector, options) ->
    transitionArg = options.transition || options.animation || 'none'
    comma = /\ *,\ */
    disjunction = selector.split(comma)
    if u.isString(transitions)
      transitions = transitionArg.split(comma)
    else
      transitions = [transitionArg]
    for selectorAtom, i in disjunction
      # Splitting the atom
      selectorParts = selectorAtom.match(/^(.+?)(?:\:(before|after))?$/)
      selectorParts or u.error('Could not parse selector atom "%s"', selectorAtom)
      selector = selectorParts[1]
      if selector == 'html'
        # If someone really asked us to replace the <html> root, the best
        # we can do is replace the <body>.
        selector = 'body'
      pseudoClass = selectorParts[2]
      transition = transitions[i] || u.last(transitions)
      selector: selector
      pseudoClass: pseudoClass
      transition: transition

  ###*
  Compiles a page fragment that has been inserted into the DOM
  by external code.

  **As long as you manipulate the DOM using Unpoly, you will never
  need to call this method.** You only need to use `up.hello` if the
  DOM is manipulated without Unpoly' involvement, e.g. by setting
  the `innerHTML` property or calling jQuery methods like
  `html`, `insertAfter` or `appendTo`:

      $element = $('.element');
      $element.html('<div>...</div>');
      up.hello($element);

  This function emits the [`up:fragment:inserted`](/up:fragment:inserted)
  event.

  @function up.hello
  @param {String|Element|jQuery} selectorOrElement
  @param {String|Element|jQuery} [options.origin]
  @param {String|Element|jQuery} [options.kept]
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

  \#\#\#\# Example

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
    $control = u.findWithSelf($element, selector)
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
  @param {String|Element|jQuery|Array<Element>} selectorOrElement
  @param {String} options.layer
    The name of the layer in which to find the element. Valid values are
    `auto`, `page`, `modal` and `popup`.
  @param {}
  @return {jQuery|Undefined}
    The first element that is neither a ghost or being destroyed,
    or `undefined` if no such element was given.
  @experimental
  ###
  first = (selectorOrElement, options) ->
    options = u.options(options, layer: 'auto')
    if options.layer == 'auto'
      firstInPriority(selectorOrElement, options.origin)
    else
      firstInLayer(selectorOrElement, options.layer)

  firstInPriority = (selectorOrElement, origin) ->
    layers = ['popup', 'modal', 'page']
    $match = undefined
    if u.isPresent(origin)
      originLayer = layerOf(origin)
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

  Takes care that all [`up.compiler`](/up.compiler) destructors, if any, are called.

  The element is removed from the DOM.
  Note that if you choose to animate the element removal using `options.animate`,
  the element won't be removed until after the animation has completed.

  Emits events [`up:fragment:destroy`](/up:fragment:destroy) and [`up:fragment:destroyed`](/up:fragment:destroyed).
  
  @function up.destroy
  @param {String|Element|jQuery} selectorOrElement 
  @param {String} [options.history]
    A URL that will be pushed as a new history entry when the element begins destruction.
  @param {String} [options.title]
    The document title to set when the element begins destruction.
  @param {String|Function} [options.animation='none']
    The animation to use before the element is removed from the DOM.
  @param {Number} [options.duration]
    The duration of the animation. See [`up.animate`](/up.animate).
  @param {Number} [options.delay]
    The delay before the animation starts. See [`up.animate`](/up.animate).
  @param {String} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate`](/up.animate).
  @return {Deferred}
    A promise that will be resolved once the element has been removed from the DOM.
  @stable
  ###
  destroy = (selectorOrElement, options) ->

    $element = $(selectorOrElement)
    unless $element.is('.up-placeholder, .up-tooltip, .up-modal, .up-popup')
      destroyMessage = ['Destroying fragment %o', $element.get(0)]
      destroyedMessage = ['Destroyed fragment %o', $element.get(0)]
    if $element.length == 0
      u.resolvedDeferred()
    else if up.bus.nobodyPrevents('up:fragment:destroy', $element: $element, message: destroyMessage)
      options = u.options(options, animation: false)
      animateOptions = up.motion.animateOptions(options)
      $element.addClass('up-destroying')
      # If e.g. a modal or popup asks us to restore a URL, do this
      # before emitting `fragment:destroy`. This way up.navigate sees the
      # new URL and can assign/remove .up-current classes accordingly.
      updateHistory(options)

      animationDeferred = u.presence(options.animation, u.isDeferred) ||
        up.motion.animate($element, options.animation, animateOptions)

      animationDeferred.then ->
        up.syntax.clean($element)
        # Emit this while $element is still part of the DOM, so event
        # listeners bound to the document will receive the event.
        up.emit 'up:fragment:destroyed', $element: $element, message: destroyedMessage
        $element.remove()
      animationDeferred
    else
      # Although someone prevented the destruction, keep a uniform API for
      # callers by returning a Deferred that will never be resolved.
      $.Deferred()

  ###*
  Before a page fragment is being [destroyed](/up.destroy), this
  event is [emitted](/up.emit) on the fragment.

  If the destruction is animated, this event is emitted before the
  animation begins.

  @event up:fragment:destroy
  @param {jQuery} event.$element
    The page fragment that is about to be destroyed.
  @param event.preventDefault()
    Event listeners may call this method to prevent the fragment from being destroyed.
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

  \#\#\#\# Example

      up.on('new-mail', function() {
        up.reload('.inbox');
      });

  Unpoly remembers the URL from which a fragment was loaded, so you
  don't usually need to give an URL when reloading.

  @function up.reload
  @param {String|Element|jQuery} selectorOrElement
  @param {Object} [options]
    See options for [`up.replace`](/up.replace)
  @param {String} [options.url]
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

up.replace = up.flow.replace
up.extract = up.flow.extract
up.reload = up.flow.reload
up.destroy = up.flow.destroy
up.first = up.flow.first
up.hello = up.flow.hello

