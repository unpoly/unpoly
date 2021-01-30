###**
Linking to fragments
====================

The `up.link` module lets you build links that update fragments instead of entire pages.

\#\#\# Motivation

In a traditional web application, the entire page is destroyed and re-created when the
user follows a link:

![Traditional page flow](/images/tutorial/fragment_flow_vanilla.svg){:width="620" class="picture has_border is_sepia has_padding"}

This makes for an unfriendly experience:

- State changes caused by AJAX updates get lost during the page transition.
- Unsaved form changes get lost during the page transition.
- The JavaScript VM is reset during the page transition.
- If the page layout is composed from multiple scrollable containers
  (e.g. a pane view), the scroll positions get lost during the page transition.
- The user sees a "flash" as the browser loads and renders the new page,
  even if large portions of the old and new page are the same (navigation, layout, etc.).

Unpoly fixes this by letting you annotate links with an [`up-target`](/a-up-target)
attribute. The value of this attribute is a CSS selector that indicates which page
fragment to update. The server **still renders full HTML pages**, but we only use
the targeted fragments and discard the rest:

![Unpoly page flow](/images/tutorial/fragment_flow_unpoly.svg){:width="620" class="picture has_border is_sepia has_padding"}

With this model, following links feels smooth. All transient DOM changes outside the updated fragment are preserved.
Pages also load much faster since the DOM, CSS and Javascript environments do not need to be
destroyed and recreated for every request.


\#\#\# Example

Let's say we are rendering three pages with a tabbed navigation to switch between screens:

Your HTML could look like this:

```
<nav>
  <a href="/pages/a">A</a>
  <a href="/pages/b">B</a>
  <a href="/pages/b">C</a>
</nav>

<article>
  Page A
</article>
```

Since we only want to update the `<article>` tag, we annotate the links
with an `up-target` attribute:

```
<nav>
  <a href="/pages/a" up-target="article">A</a>
  <a href="/pages/b" up-target="article">B</a>
  <a href="/pages/b" up-target="article">C</a>
</nav>
```

Note that instead of `article` you can use any other CSS selector like `#main .article`.

With these [`up-target`](/a-up-target) annotations Unpoly only updates the targeted part of the screen.
The JavaScript environment will persist and the user will not see a white flash while the
new page is loading.

@module up.link
###

up.link = do ->

  u = up.util
  e = up.element

  preloadDelayTimer = undefined
  waitingLink = undefined
  linkPreloader = new up.LinkPreloader()

  lastMousedownTarget = null

  # Links with attribute-provided HTML are always followable.
  LINKS_WITH_LOCAL_HTML = ['a[up-content]', 'a[up-fragment]', 'a[up-document]']

  # Links with remote HTML are followable if there is one additional attribute
  # suggesting "follow me through Unpoly".
  LINKS_WITH_REMOTE_HTML = ['a[href]', '[up-href]']
  ATTRIBUTES_SUGGESTING_FOLLOW = [e.trueAttributeSelector('up-follow'), '[up-target]', '[up-layer]', '[up-mode]', '[up-transition]']

  combineFollowableSelectors = (elementSelectors, attributeSelectors = ATTRIBUTES_SUGGESTING_FOLLOW) ->
    return u.flatMap(elementSelectors, (elementSelector) ->
      attributeSelectors.map((attributeSelector) -> elementSelector + attributeSelector)
    )

  config = new up.Config ->
    preloadDelay: 90
    followSelectors: combineFollowableSelectors(LINKS_WITH_REMOTE_HTML).concat(LINKS_WITH_LOCAL_HTML)
    instantSelectors: [e.trueAttributeSelector('up-instant')]
    preloadSelectors: combineFollowableSelectors(LINKS_WITH_REMOTE_HTML, [e.trueAttributeSelector('up-preload')])
    clickableSelectors: LINKS_WITH_LOCAL_HTML.concat ['[up-emit]', '[up-accept]', '[up-dismiss]', '[up-clickable]']

  fullFollowSelector = ->
    config.followSelectors.join(',')

  fullPreloadSelector = ->
    config.preloadSelectors.join(',')

  fullInstantSelector = ->
    config.instantSelectors.join(',')

  fullClickableSelector = ->
    config.clickableSelectors.join(',')

  isInstant = (linkOrDescendant) ->
    !!e.closest(linkOrDescendant, fullInstantSelector())

  ###**
  @property up.link.config
  @param {number} [config.preloadDelay=75]
    The number of milliseconds to wait before [`[up-preload]`](/a-up-preload)
    starts preloading.
  ###
  reset = ->
    lastMousedownTarget = null
    config.reset()
    linkPreloader.reset()

  ###**
  Fetches the given link's `[href]` with JavaScript and [replaces](/up.replace) the
  [current layer](/up.layer.current) with HTML from the response.

  By default the layer's [main element](/up.fragment.config#config.mainTargets)
  will be replaced. Attributes like `a[up-target]`
  or `a[up-modal]` will be honored.

  Emits the event `up:link:follow`.

  \#\#\# Examples

  Assume we have a link with an `a[up-target]` attribute:

      <a href="/users" up-target=".main">Users</a>

  Calling `up.follow()` with this link will replace the page's `.main` fragment
  as if the user had clicked on the link:

      var link = document.querySelector('a')
      up.follow(link)

  @function up.follow
  @param {Element|jQuery|string} link
    An element or selector which is either an `<a>` tag or any element with an `[up-href]` attribute.
  @param {string} [options.target]
    The selector to replace.

    Defaults to the link's `[up-target]`, `[up-modal]` or `[up-popup]` attribute.
    If no target is given, the `<body>` element will be replaced.
  @param {string} [options.url]
    The URL to navigate to.

    Defaults to the link's `[up-href]` or `[href]` attribute.
  @param {boolean|string} [options.reveal=true]
    Whether to [reveal](/up.reveal) the target fragment after it was replaced.

    You can also pass a CSS selector for the element to reveal.
  @param {boolean|string} [options.failReveal=true]
    Whether to [reveal](/up.reveal) the target fragment when the server responds with an error.

    You can also pass a CSS selector for the element to reveal.
  @return {Promise}
    A promise that will be fulfilled when the link destination
    has been loaded and rendered.
  @stable
  ###
  follow = up.mockable (link, options) ->
    return up.render(followOptions(link, options))


  ###**
  Parses the `render()` options that would be used to
  [`follow`](/up.follow) the given link, but does not render.

  @param {Element|jQuery|string} link
    A reference or selector for the link to follow.
  @param {Object} [options]
    Additional options for the form submissions.

    Will override any attribute values set on the given form element.

    See `up.follow()` for detailled documentation of individual option properties.
  @function up.link.followOptions
  @return {Object}
  @stable
  ###
  followOptions = (link, options) ->
    # If passed a selector, up.fragment.get() will prefer a match on the current layer.
    link = up.fragment.get(link)
    options = u.options(options)

    # TODO: Document new follow options like onOpened, [up-on-opened], ...
    parser = new up.OptionsParser(options, link, fail: true)

    # Request options
    parser.string('url', attr: ['up-href', 'href']) # preflight / same
    # Developers sometimes make a <a href="#"> to give a JavaScript interaction standard
    # link behavior (keyboard navigation). However, we don't want to consider this
    # a link with remote content, and rather honor [up-content], [up-document] and
    # [up-fragment] attributes.
    options.url = undefined if options.url == '#'
    options.method = followMethod(link, options)
    parser.json('headers')
    parser.json('params')
    parser.booleanOrString('cache')
    parser.booleanOrString('clearCache')
    parser.boolean('solo')

    # Feedback options
    parser.boolean('feedback')

    # Fragment options
    parser.boolean('fail')
    parser.options.origin ?= link
    parser.boolean('navigate', default: true)
    parser.string('confirm')
    parser.string('target')
    parser.booleanOrString('fallback')
    parser.parse(((link, attrName) -> e.callbackAttr(link, attrName, ['request', 'response', 'renderOptions'])), 'onLoaded') # same
    parser.string('content')
    parser.string('fragment')
    parser.string('document')

    parser.string('contentType', attr: ['enctype', 'up-content-type'])

    # Layer options
    parser.boolean('peel')
    parser.string('layer')
    parser.json('context')
    parser.string('flavor') # Renamed to { mode }. Legacy calls handled by up.layer.normalizeOptions.
    parser.string('mode')
    parser.string('align')
    parser.string('position')
    parser.string('class')
    parser.string('size')
    parser.boolean('closable') # Renamed to { dismissable }. Legacy calls handled by up.layer.normalizeOptions.
    parser.boolean('dismissable')
    parser.boolean('buttonDismissable')
    parser.boolean('keyDismissable')
    parser.boolean('outsideDismissable')
    parser.parse(up.layer.openCallbackAttr, 'onOpened')
    # parser.parse(up.layer.closeCallbackAttr, 'onAccept')
    parser.parse(up.layer.closeCallbackAttr, 'onAccepted')
    # parser.parse(up.layer.closeCallbackAttr, 'onDismiss')
    parser.parse(up.layer.closeCallbackAttr, 'onDismissed')
    parser.string('acceptEvent')
    parser.string('dismissEvent')
    parser.string('acceptLocation')
    parser.string('dismissLocation')

    # Viewport options
    parser.booleanOrString('focus')
    parser.boolean('saveScroll')
    parser.booleanOrString('scroll')
    parser.booleanOrString('reveal')  # legacy option for { scroll: 'target' }
    parser.boolean('resetScroll')     # legacy option for { scroll: 'top' }
    parser.boolean('restoreScroll')   # legacy option for { scroll: 'restore' }

    parser.boolean('revealTop')
    parser.number('revealMax')
    parser.number('revealPadding')
    parser.number('revealSnap')
    parser.string('scrollBehavior')

    # History options
    # { history } is actually a boolean, but we keep the deprecated string
    # variant which should now be passed as { location }.
    parser.booleanOrString('history')
    parser.booleanOrString('location')
    parser.booleanOrString('title')

    # Motion options
    parser.booleanOrString('animation')
    parser.booleanOrString('transition')
    parser.string('easing')
    parser.number('duration')

    # This is the event that may be prevented to stop the follow.
    # up.form.submit() changes this to be up:form:submit instead.
    # The guardEvent will also be assigned a { renderOptions } property in up.render()
    options.guardEvent ||= up.event.build('up:link:follow', log: 'Following link')

    return options

  ###**
  This event is [emitted](/up.emit) when a link is [followed](/up.follow) through Unpoly.

  The event is emitted on the `<a>` element that is being followed.

  @event up:link:follow
  @param {Element} event.target
    The link element that will be followed.
  @param event.preventDefault()
    Event listeners may call this method to prevent the link from being followed.
  @stable
  ###

  ###**
  Preloads the given link.

  When the link is clicked later, the response will already be [cached](/up.cache),
  making the interaction feel instant.

  @function up.link.preload
  @param {string|Element|jQuery} link
    The element or selector whose destination should be preloaded.
  @param {Object} options
    See options for `up.follow()`.
  @return {Promise}
    A promise that will be fulfilled when the request was loaded and cached
  @stable
  ###
  preload = (link, options) ->
    # If passed a selector, up.fragment.get() will match in the current layer.
    link = up.fragment.get(link)

    if issue = preloadIssue(link)
      return up.error.failed.async(preloadIssue)

    guardEvent = up.event.build('up:link:preload', log: ['Preloading link %o', link])
    follow(link, u.merge(options, preload: true, { guardEvent }))

  preloadIssue = (link) ->
    unless isSafe(link)
      return "Won't preload unsafe link"

    unless e.matches(link, '[href], [up-href]')
      return "Won't preload link without a URL"

  ###**
  This event is [emitted](/up.emit) before a link is [preloaded](/up.preload).

  @event up:link:preload
  @param {Element} event.target
    The link element that will be preloaded.
  @param event.preventDefault()
    Event listeners may call this method to prevent the link from being preloaded.
  @stable
  ###

  ###**
  Returns the HTTP method that should be used when following the given link.

  Looks at the link's `up-method` or `data-method` attribute.
  Defaults to `"get"`.

  @function up.link.followMethod
  @param link
  @param options.method {string}
  @internal
  ###
  followMethod = (link, options = {}) ->
    u.normalizeMethod(options.method || link.getAttribute('up-method') || link.getAttribute('data-method'))

  ###**
  Returns whether the given link will be [followed](/up.follow) by Unpoly
  instead of making a full page load.

  By default Unpoly will follow links and elements with an `[up-href]` attribute if the element has
  one of the following attributes:

  - `[up-follow]`
  - `[up-target]`
  - `[up-layer]`
  - `[up-mode]`
  - `[up-transition]`
  - `[up-content]`
  - `[up-fragment]`
  - `[up-document]`

  To make additional elements followable, see `up.link.config.followSelectors`.

  @function up.link.isFollowable
  @param {Element|jQuery|string} link
    The link to check.
  @stable
  ###
  isFollowable = (link) ->
    # If passed a selector, up.fragment.get() will prefer a match on the current layer.
    link = up.fragment.get(link)
    e.matches(link, fullFollowSelector())

  ###**
  Makes sure that the given link will be [followed](/up.follow)
  by Unpoly instead of making a full page load.

  If the link is not already [followable](/up.link.isFollowable), the link
  will receive an `a[up-follow]` attribute.

  @function up.link.makeFollowable
  @param {Element|jQuery|string} link
    The element or selector for the link to make followable.
  @stable
  ###
  makeFollowable = (link) ->
    unless isFollowable(link)
      link.setAttribute('up-follow', '')

  # TODO: Document up.link.makeClickable
  makeClickable = (link) ->
    if e.matches(link, 'a[href], button')
      return

    e.setMissingAttrs(link, {
      tabindex: '0' # Make them part of the natural tab order
      role: 'link'  # Make screen readers pronounce "link"
    })

    link.addEventListener 'keydown', (event) ->
      if event.key == 'Enter' || event.key == 'Space'
        forkEventAsUpClick(event)


  # Support keyboard navigation for elements that behave like links
  # or buttons, but  aren't <a href> or <button> elements..
  # TODO: Document [up-clickable]
  up.macro(fullClickableSelector, makeClickable)

  shouldFollowEvent = (event, link) ->
    # We never handle events for the right mouse button, or when Shift/CTRL/Meta/ALT is pressed
    return false unless up.event.isUnmodified(event)

    # If user clicked on a child link of $link, or in an <input> within an [up-expand][up-href]
    # we want those other elements handle the click.
    betterTargetSelector = "a, [up-href], #{up.form.fieldSelector()}"
    betterTarget = e.closest(event.target, betterTargetSelector)
    return !betterTarget || betterTarget == link

  ###**
  Provide an `up:click` event that improves on standard click
  in several ways:

  - It is emitted on mousedown for [up-instant] elements
  - It is not emitted if the element has disappeared (or was overshadowed)
    between mousedown and click. This can happen if mousedown creates a layer
    over the element, or if a mousedown handler removes a handler.

  Stopping an up:click event will also stop the underlying event.

  Also see docs for `up:click`.

  @function up.link.convertClicks
  @param {up.Layer} layer
  @internal
  ###
  convertClicks = (layer) ->
    layer.on 'click', (event, element) ->
      # Instant links should not have a `click` event.
      # This would trigger the browsers default follow-behavior and possibly activate JS libs.
      # A11Y: We also need to check whether the [up-instant] behavior did trigger on mousedown.
      # Keyboard navigation will not necessarily trigger a mousedown event.
      if isInstant(element) && lastMousedownTarget
        up.event.halt(event)

      # In case mousedown has created a layer over the click coordinates,
      # Chrome will emit an event with { target: document.body } on click.
      # Ignore that event and only process if we would still hit the
      # expect layers at the click coordinates.
      else if layer.wasHitByMouseEvent(event) && !didUserDragAway(event)
        forkEventAsUpClick(event)

      # In case the user switches input modes.
      lastMousedownTarget = null

    layer.on 'mousedown', (event, element) ->
      lastMousedownTarget = element

      if isInstant(element)
        # A11Y: Keyboard navigation will not necessarily trigger a mousedown event.
        # We also don't want to listen to the enter key, since some screen readers
        # use the enter key for something else.
        forkEventAsUpClick(event)

  didUserDragAway = (clickEvent) ->
    lastMousedownTarget && lastMousedownTarget != clickEvent.target

  forkEventAsUpClick = (originalEvent) ->
    newEvent = up.event.fork(originalEvent, 'up:click', ['clientX', 'clientY', 'button', up.event.keyModifiers...])
    up.emit(originalEvent.target, newEvent, log: false)

  ###**
  A `click` event that honors the [`[up-instant]`](/a-up-instant) attribute.

  This event is generally emitted when an element is clicked. However, for elements
  with an [`[up-instant]`](/a-up-instant) attribute this event is emitted on `mousedown` instead.

  This is useful to listen to links being activated, without needing to know whether
  a link is `[up-instant]`.

  \#\#\# Example

  Assume we have two links, one of which is `[up-instant]`:

      <a href="/one">Link 1</a>
      <a href="/two" up-instant>Link 2</a>

  The following event listener will be called when *either* link is activated:

      document.addEventListener('up:click', function(event) {
        ...
      })

  \#\#\# Cancelation is forwarded

  If the user cancels an `up:click` event using `event.preventDefault()`,
  the underlying `click` or `mousedown` will also be canceled.

  \#\#\# Accessibility

  If the user activates an element using their keyboard, the `up:click` event will be emitted
  on `click`, even if the element has an `[up-instant]` attribute.

  @event up:click
  @param {Element} event.target
    The clicked element.
  @param {Event} event.originalEvent
    The underlying `click` or `mousedown` event.
  @stable
  ###

  ###**
  Returns whether the given link has a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
  HTTP method like `GET`.

  @function up.link.isSafe
  @return {boolean}
  @stable
  ###
  isSafe = (selectorOrLink, options) ->
    method = followMethod(selectorOrLink, options)
    up.network.isSafeMethod(method)

  targetMacro = (queryAttr, fixedResultAttrs, callback) ->
    up.macro "[#{queryAttr}]", (link) ->
      resultAttrs = u.copy(fixedResultAttrs)
      if optionalTarget = link.getAttribute(queryAttr)
        resultAttrs['up-target'] = optionalTarget
      else
        resultAttrs['up-follow'] = ''
      e.setMissingAttrs(link, resultAttrs)
      link.removeAttribute(queryAttr)
      callback?()

  ###**
  [Follows](/up.follow) this link with JavaScript and replaces a CSS selector
  on the current page with a corresponding element from the response.

  \#\#\# Example

  This will update the fragment `<div class="main">` with the same element
  fetched from `/posts/5`:

      <a href="/posts/5" up-target=".main">Read post</a>

  \#\#\# Updating multiple fragments

  You can update multiple fragments from a single request by separating
  separators with a comma (like in CSS).

  For instance, if opening a post should
  also update a bubble showing the number of unread posts, you might
  do this:

      <a href="/posts/5" up-target=".main, .unread-count">Read post</a>

  \#\#\# Matching in the link's vicinity

  It is often helpful to match elements within the same container as the the
  link that's being followed.

  Let's say we have two links that replace `.card`:

  ```html
  <div class="card">
    Card #1 preview
    <a href="/cards/1" up-target=".card">Show full card #1</a>
  </div>

  <div class="card">
    Card #2 preview
    <a href="/cards/2" up-target=".card">Show full card #2</a>
  </div>
  ```

  When clicking on *"Show full card #2"*, Unpoly will replace the second card.
  The server should only render a single `.card` element.

  This also works with descendant selectors:

  ```html
  <div class="card">
    <a href="/cards/1/links" up-target=".card .card-links">Show card #2 links</a>
    <div class="card-links"></div>
  </div>

  <div class="card">
    <a href="/cards/2/links" up-target=".card .card-links">Show card #2 links</a>
    <div class="card-links"></div>
  </div>
  ```

  When clicking on *"Show full card #2"*, Unpoly will replace the second card.
  The server should only render a single `.card` element.

  \#\#\# Appending or prepending content

  By default Unpoly will replace the given selector with the same
  selector from the server response. Instead of replacing you
  can *append* the loaded content to the existing content by using the
  `:after` pseudo selector. In the same fashion, you can use `:before`
  to indicate that you would like the *prepend* the loaded content.

  A practical example would be a paginated list of items. Below the list is
  a button to load the next page. You can append to the existing list
  by using `:after` in the `up-target` selector like this:

      <ul class="tasks">
        <li>Wash car</li>
        <li>Purchase supplies</li>
        <li>Fix tent</li>
      </ul>

      <a href="/page/2" class="next-page" up-target=".tasks:after, .next-page">
        Load more tasks
      </a>

  \#\#\# Replacing an element's inner HTML

  If you would like to preserve the target element, but replace all of its child content,
  use the `:content` pseudo selector:

      <a href="/cards/5" up-target=".card:content">Show card #5</a>

  \#\#\# Following elements that are no links

  You can also use `[up-target]` to turn an arbitrary element into a link.
  In this case, put the link's destination into the `[up-href]` attribute:

      <button up-target=".main" up-href="/foo/bar">Go</button>

  Note that using any element other than `<a>` will prevent users from
  opening the destination in a new tab.

  @selector a[up-target]
  @param {string} up-target
    The CSS selector to replace

    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  @param {string} [up-method='get']
    The HTTP method to use for the request.
  @param {string} [up-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements.
  @param [up-fail-target='body']
    The CSS selector to replace if the server responds with an error.

    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  @param {string} [up-fail-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements
    when the server responds with an error.
  @param {string} [up-fallback]
    The selector to update when the original target was not found in the page.
  @param {string} [up-href]
    The destination URL to follow.
    If omitted, the the link's `href` attribute will be used.
  @param {string} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the link is followed.
  @param {string} [up-reveal='true']
    Whether to reveal the target element after it was replaced.

    You can also pass a CSS selector for the element to reveal.
    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  @param {string} [up-fail-reveal='true']
    Whether to reveal the target element when the server responds with an error.

    You can also pass a CSS selector for the element to reveal.
    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  @param {string} [up-restore-scroll='false']
    Whether to restore previously known scroll position of all viewports
    within the target selector.
  @param {string} [up-cache]
    Whether to force the use of a cached response (`true`)
    or never use the cache (`false`)
    or make an educated guess (default).
  @param {string} [up-layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `'auto'`, `'page'`, `'modal'` and `'popup'`.

    If set to `'auto'` (default), Unpoly will try to find a match in the link's layer.
    If no match was found in that layer,
    Unpoly will search in other layers, starting from the topmost layer.
  @param {string} [up-fail-layer='auto']
    The name of the layer that ought to be updated if the server sends a
    non-200 status code.
  @param [up-history]
    Whether to push an entry to the browser history when following the link.

    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
  @stable
  ###

  ###**
  Fetches this link's `[href]` with JavaScript and [replaces](/up.replace) the
  current `<body>` element with the response's `<body>` element.

  To only update a fragment instead of the entire `<body>`, see `a[up-target]`.

  \#\#\# Example

      <a href="/users" up-follow>User list</a>

  \#\#\# Turn any element into a link

  You can also use `[up-follow]` to turn an arbitrary element into a link.
  In this case, put the link's destination into the `up-href` attribute:

      <span up-follow up-href="/foo/bar">Go</span>

  Note that using any element other than `<a>` will prevent users from
  opening the destination in a new tab.

  @selector a[up-follow]

  @param {string} [up-method='get']
    The HTTP method to use for the request.
  @param [up-fail-target='body']
    The selector to replace if the server responds with an error.
  @param {string} [up-fallback]
    The selector to update when the original target was not found in the page.
  @param {string} [up-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements.
  @param {string} [up-fail-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements
    when the server responds with an error.
  @param [up-href]
    The destination URL to follow.
    If omitted, the the link's `href` attribute will be used.
  @param {string} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the link is followed.
  @param {string} [up-history]
    Whether to push an entry to the browser history when following the link.

    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
  @param [up-restore-scroll='false']
    Whether to restore the scroll position of all viewports
    within the response.
  @stable
  ###
  up.on 'up:click', fullFollowSelector, (event, link) ->
    if shouldFollowEvent(event, link)
      up.event.halt(event)
      up.log.muteRejection follow(link)

  ###**
  By adding an `up-instant` attribute to a link, the destination will be
  fetched on `mousedown` instead of `click` (`mouseup`).

      <a href="/users" up-follow up-instant>User list</a>

  This will save precious milliseconds that otherwise spent
  on waiting for the user to release the mouse button. Since an
  AJAX request will be triggered right way, the interaction will
  appear faster.

  Note that using `[up-instant]` will prevent a user from canceling a
  click by moving the mouse away from the link. However, for
  navigation actions this isn't needed. E.g. popular operation
  systems switch tabs on `mousedown` instead of `click`.

  `[up-instant]` will also work for links that open [overlays](/up.layer).

  \#\#\# Accessibility

  If the user activates an element using their keyboard, the `up:click` event will be emitted
  on `click`, even if the element has an `[up-instant]` attribute.

  @selector a[up-instant]
  @stable
  ###

  ###**
  [Follows](/up.follow) this link *as fast as possible*.

  This is done by:

  - [Following the link through AJAX](/a-up-target) instead of a full page load
  - [Preloading the link's destination URL](/a-up-preload)
  - [Triggering the link on `mousedown`](/a-up-instant) instead of on `click`

  \#\#\# Example

  Use `[up-dash]` like this:

      <a href="/users" up-dash=".main">User list</a>

  This is shorthand for:

      <a href="/users" up-target=".main" up-instant up-preload>User list</a>

  @selector a[up-dash]
  @param {string} [up-dash='body']
    The CSS selector to replace

    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  @stable
  ###
  targetMacro 'up-dash', { 'up-preload': '', 'up-instant': '' }

  ###**
  Add an `[up-expand]` attribute to any element to enlarge the click area of a
  descendant link.

  `[up-expand]` honors all the Unppoly attributes in expanded links, like
  `a[up-target]`, `a[up-instant]` or `a[up-preload]`.
  It also expands links that open [modals](/up.modal) or [popups](/up.popup).

  \#\#\# Example

      <div class="notification" up-expand>
        Record was saved!
        <a href="/records">Close</a>
      </div>

  In the example above, clicking anywhere within `.notification` element
  would [follow](/up.follow) the *Close* link.

  \#\#\# Elements with multiple contained links

  If a container contains more than one link, you can set the value of the
  `up-expand` attribute to a CSS selector to define which link should be expanded:

      <div class="notification" up-expand=".close">
        Record was saved!
        <a class="details" href="/records/5">Details</a>
        <a class="close" href="/records">Close</a>
      </div>

  \#\#\# Limitations

  `[up-expand]` has some limitations for advanced browser users:

  - Users won't be able to right-click the expanded area to open a context menu
  - Users won't be able to `CTRL`+click the expanded area to open a new tab

  To overcome these limitations, consider nesting the entire clickable area in an actual `<a>` tag.
  [It's OK to put block elements inside an anchor tag](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).

  @selector [up-expand]
  @param {string} [up-expand]
    A CSS selector that defines which containing link should be expanded.

    If omitted, the first link in this element will be expanded.
  @stable
  ###
  up.macro '[up-expand]', (area) ->
    selector = area.getAttribute('up-expand') || 'a, [up-href]'

    if childLink = e.get(area, selector)
      areaAttrs = e.upAttrs(childLink)
      areaAttrs['up-href'] ||= childLink.getAttribute('href')
      e.setMissingAttrs(area, areaAttrs)
      makeFollowable(area)

  ###**
  Links with an `up-preload` attribute will silently fetch their target
  when the user hovers over the click area, or when the user puts her
  mouse/finger down (before releasing).

  When the link is clicked later, the response will already be cached,
  making the interaction feel instant.

  @selector a[up-preload]
  @param [up-delay]
    The number of milliseconds to wait between hovering
    and preloading. Increasing this will lower the load in your server,
    but will also make the interaction feel less instant.

    Defaults to `up.link.config.preloadDelay`.
  @stable
  ###
  up.compiler fullPreloadSelector, (link) ->
    linkPreloader.observeLink(link)

  up.on 'up:framework:reset', reset

  follow: follow
  followOptions: followOptions
  preload: preload
  makeFollowable: makeFollowable
  makeClickable: makeClickable
  isSafe: isSafe
  isFollowable: isFollowable
  shouldFollowEvent: shouldFollowEvent
  followMethod: followMethod
  targetMacro: targetMacro
  convertClicks: convertClicks
  config: config
  combineFollowableSelectors: combineFollowableSelectors

up.follow = up.link.follow