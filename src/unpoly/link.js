require('./link.sass')

/*-
Linking to fragments
====================

The `up.link` module lets you build links that update fragments instead of entire pages.

### Motivation

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

Unpoly fixes this by letting you annotate links with an [`[up-target]`](/a-up-follow#up-target)
attribute. The value of this attribute is a CSS selector that indicates which page
fragment to update. The server **still renders full HTML pages**, but we only use
the targeted fragments and discard the rest:

![Unpoly page flow](/images/tutorial/fragment_flow_unpoly.svg){:width="620" class="picture has_border is_sepia has_padding"}

With this model, following links feels smooth. All DOM state outside the updated fragment is preserved.
Pages also load much faster since the DOM, CSS and JavaScript environments do not need to be
destroyed and recreated for every request.


### Example

Let's say we are rendering three pages with a tabbed navigation to switch between screens:

Your HTML could look like this:

```html
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

```html
<nav>
  <a href="/pages/a" up-target="article">A</a>
  <a href="/pages/b" up-target="article">B</a>
  <a href="/pages/b" up-target="article">C</a>
</nav>
```

> [NOTE]
> Instead of `article` you can use any other CSS selector like `#main .article`.

With these [`[up-target]`](/a-up-follow#up-target) annotations Unpoly only updates the targeted part of the screen.
The JavaScript environment will persist and the user will not see a white flash while the
new page is loading.

@see targeting-fragments
@see handling-everything
@see failed-responses

@see a[up-follow]
@see a[up-instant]
@see a[up-preload]
@see up.follow

@module up.link
*/

up.link = (function() {

  const u = up.util
  const e = up.element

  let lastMousedownTarget = null

  // Links with attribute-provided HTML are always followable.
  const LINKS_WITH_LOCAL_HTML = ['a[up-content]', 'a[up-fragment]', 'a[up-document]']

  // Links with remote HTML are followable if there is one additional attribute
  // suggesting "follow me through Unpoly".
  const LINKS_WITH_REMOTE_HTML = ['a[href]', '[up-href]']
  const ATTRIBUTES_SUGGESTING_FOLLOW = ['[up-follow]', '[up-target]', '[up-layer]', '[up-transition]', '[up-preload]', '[up-instant]', '[up-href]']

  function combineFollowableSelectors(elementSelectors, attributeSelectors) {
    return u.flatMap(elementSelectors, elementSelector => attributeSelectors.map(attrSelector => elementSelector + attrSelector))
  }

  /*-
  Configures defaults for link handling.

  In particular you can configure Unpoly to handle [all links on the page](/handling-everything)
  without requiring developers to set `[up-...]` attributes.

  @property up.link.config

  @param {Array<string>} config.followSelectors
    An array of CSS selectors matching links that will be [followed through Unpoly](/a-up-follow).

    You can customize this property to automatically follow *all* links on a page without requiring an `[up-follow]` attribute.
    See [Handling all links and forms](/handling-everything).

  @param {Array<string>} config.noFollowSelectors
    Exceptions to `up.link.config.followSelectors`.

    Matching links will *not* be [followed through Unpoly](/a-up-follow), even if they match `up.link.config.followSelectors`.

    By default Unpoly excludes:

    - Links with an `[up-follow=false]` attribute.
    - Links with a cross-origin `[href]`.
    - Links with a [`[target]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target) attribute
      (to target an iframe or open new browser tab).
    - Links with a [`[download]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download) attribute.
    - Links with an `[href]` attribute starting with `javascript:`.
    - Links with an `[href="#"]` attribute that don't also have local HTML
      in an `[up-document]`, `[up-fragment]` or `[up-content]` attribute.

  @param {Array<string>} config.instantSelectors
    An array of CSS selectors matching links that are [followed on `mousedown`](/a-up-instant)
    instead of on `click`.

    You can customize this property to follow *all* links on `mousedown` without requiring an `[up-instant]` attribute.
    See [Handling all links and forms](/handling-everything).

    Note that an instant link must also by [followable](/up.link.isFollowable), usually by giving it an
    [`[up-follow]`](/a-up-follow) attribute or by configuring `up.link.config.followSelectors`.

  @param {Array<string>} config.noInstantSelectors
    Exceptions to `up.link.config.instantSelectors`.

    Matching links will *not* be [followed on `mousedown`](/a-up-instant), even if they match `up.link.config.instantSelectors`.

    By default Unpoly excludes:

    - Links with an `[up-instant=false]` attribute.
    - Links that are [not followable](#config.noFollowSelectors).

  @param {Array<string>} config.preloadSelectors
    An array of CSS selectors matching links that are [preloaded on hover](/a-up-preload).

    You can customize this property to preload *all* links on `mousedown` without requiring an `[up-preload]` attribute.
    See [Handling all links and forms](/handling-everything).

  @param {Array<string>} config.noPreloadSelectors
    Exceptions to `up.link.config.preloadSelectors`.

    Matching links will *not* be [preloaded on hover](/a-up-preload), even if they match `up.link.config.preloadSelectors`.

    By default Unpoly excludes:

    - Links with an `[up-preload=false]` attribute.
    - Links that are [not followable](#config.noFollowSelectors).
    - Links with an [unsafe method](/up.link.isSafe).
    - When the link destination [cannot be cached](/up.network.config#config.autoCache).

  @param {number} [config.preloadDelay=90]
    The number of milliseconds to wait before [`[up-preload]`](/a-up-preload)
    starts preloading.

  @param {Array<string>} [config.clickableSelectors]
    A list of CSS selectors matching elements that should behave like links or buttons.

    @include clickable-behaviors

    @see [up-clickable]
    @see [up-href]
    @experimental
  @stable
  */
  const config = new up.Config(() => ({
    followSelectors: combineFollowableSelectors(LINKS_WITH_REMOTE_HTML, ATTRIBUTES_SUGGESTING_FOLLOW).concat(LINKS_WITH_LOCAL_HTML),

    // (1) We don't want to follow <a href="#anchor"> links without a path. Instead
    //     we will let the browser change the current location's anchor and up.reveal()
    //     on hashchange to scroll past obstructions.
    // (2) We want to follow links with [href=#] only if they have a local source of HTML
    //     through [up-content], [up-fragment] or [up-document].
    //     Many web developers are used to give JavaScript-handled links an [href="#"]
    //     attribute. Also frameworks like Bootstrap only style links if they have an [href].
    // (3) We don't want to handle <a href="javascript:foo()"> links.
    noFollowSelectors: ['[up-follow=false]', 'a[download]', 'a[target]', 'a[href^="#"]:not([up-content]):not([up-fragment]):not([up-document])', 'a[href^="javascript:"]', 'a[href^="mailto:"]', e.crossOriginSelector('href'), e.crossOriginSelector('up-href')],

    instantSelectors: ['[up-instant]'],
    noInstantSelectors: ['[up-instant=false]', '[onclick]'],
    preloadSelectors: combineFollowableSelectors(LINKS_WITH_REMOTE_HTML, ['[up-preload]']),
    noPreloadSelectors: ['[up-preload=false]'],
    clickableSelectors: LINKS_WITH_LOCAL_HTML.concat(['[up-emit]', '[up-accept]', '[up-dismiss]', '[up-clickable]']),
    preloadDelay: 90,
  }))

  function isPreloadDisabled(link) {
    // (1) Don't preload when we cannot change history. Following such a link will make a full page load ignoring our cache.
    // (2) Don't preload when the link isn't going to be handled by Unpoly.
    // (3) Don't preload when we're not going to cache the content according to up.network.config.autoCache.
    //     By default this only caches safe links.
    return !up.browser.canPushState() || !isFollowable(link) || !willCache(link)
  }

  function willCache(link) {
    // Instantiate a lightweight request with basic link attributes needed for the cache-check.
    const options = parseRequestOptions(link)
    if (options.url) {
      if (options.cache == null) { options.cache = 'auto' }
      options.basic = true
      const request = new up.Request(options)
      return request.willCache()
    }
  }

  function reset() {
    lastMousedownTarget = null
  }

  /*-
  Follows the given link with JavaScript and updates a fragment with the server response.

  By default the layer's [main element](/up-main)
  will be replaced. Attributes like `a[up-target]`
  or `a[up-layer]` will be honored.

  Following a link is considered [navigation](/navigation) by default.

  Emits the event `up:link:follow`.

  ### Examples

  Assume we have a link with an `a[up-target]` attribute:

  ```html
  <a href="/users" up-target=".main">Users</a>
  ```

  Calling `up.follow()` with this link will replace the page's `.main` fragment
  as if the user had clicked on the link:

  ```js
  var link = document.querySelector('a')
  up.follow(link)
  ```

  @function up.follow

  @param {Element|jQuery|string} link
    The link to follow.

  @param {Object} [options]
    [render options](/up.render#parameters) that should be used for following the link.

    Unpoly will parse render options from the given link's attributes
    like `[up-target]` or `[up-transition]`. See `a[up-follow]` for a list
    of supported attributes.

    You may pass this additional `options` object to supplement or override
    options parsed from the link attributes.

  @param {boolean} [options.navigate=true]
    Whether this fragment update is considered [navigation](/navigation).

    Setting this to `false` will disable most defaults, causing
    Unpoly to render a fragment without side-effects like [updating history](/updating-history)
    or [scrolling](/scrolling).

  @return {up.RenderJob}
    A promise that fulfills with an `up.RenderResult` once the link destination
    has been loaded and rendered.

  @stable
  */
  const follow = up.mockable(function(link, options) {
    return up.render(followOptions(link, options))
  })

  function parseRequestOptions(link, options, parserOptions) {
    options = u.options(options)
    const parser = new up.OptionsParser(link, options, { ...parserOptions, fail: false })

    options.url = followURL(link, options)
    options.method = followMethod(link, options)
    parser.json('headers')
    parser.json('params')
    parser.booleanOrString('cache')
    parser.booleanOrString('expireCache')
    parser.booleanOrString('evictCache')
    parser.booleanOrString('revalidate')
    parser.booleanOrString('abort')
    parser.boolean('abortable')
    parser.boolean('background')
    parser.string('contentType')
    parser.number('badResponseTime')
    parser.number('timeout')

    return options
  }

  /*-
  Parses the [render](/up.render) options that would be used to
  [follow](/up.follow) the given link, but does not render.

  ### Example

  Given a link with some `[up-...]` attributes:

  ```html
  <a href="/foo" up-target=".content" up-layer="new">...</a>
  ```

  We can parse the link's render options like this:

  ```js
  let link = document.querySelector('a[href="/foo"]')
  let options = up.link.followOptions(link)
  // => { url: '/foo', method: 'GET', target: '.content', layer: 'new', ... }
  ```

  @function up.link.followOptions
  @param {Element|jQuery|string} link
    The link to follow.
  @param {Object} [options]
    Additional options for following the link.

    Values from these options will override any attributes set on the given link element.
  @return {Object}
  @stable
  */
  function followOptions(link, options, parserOptions) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    link = up.fragment.get(link)
    options = u.options(options)

    const parser = new up.OptionsParser(link, options, { fail: true, ...parserOptions })

    parser.include(parseRequestOptions)

    // Feedback options
    parser.boolean('feedback')

    // Fragment options
    options.origin ||= link
    parser.boolean('fail')
    parser.boolean('navigate', {default: true})
    parser.string('confirm', { attr: ['up-confirm', 'data-confirm'] })
    parser.string('target')
    parser.booleanOrString('fallback')
    parser.string('match')
    parser.string('content')
    parser.string('fragment')
    parser.string('document')
    parser.boolean('useKeep')
    parser.boolean('useHungry')

    // Lifecycle options
    parser.callback('onLoaded')
    parser.callback('onRendered', { mainKey: 'result' })
    parser.callback('onFinished', { mainKey: 'result' })
    parser.callback('onOffline', { mainKey: 'error' }) // not a request option!
    parser.callback('onError', { mainKey: 'error' }) // not a request option!

    // Layer options
    parser.boolean('peel')
    parser.string('layer')
    parser.string('baseLayer')
    parser.json('context')
    parser.string('mode')
    parser.string('align')
    parser.string('position')
    parser.string('class')
    parser.string('size')
    parser.booleanOrString('dismissable')
    parser.parse(up.layer.openCallbackAttr, 'onOpened')
    parser.parse(up.layer.closeCallbackAttr, 'onAccepted')
    parser.parse(up.layer.closeCallbackAttr, 'onDismissed')
    parser.string('acceptEvent')
    parser.string('dismissEvent')
    parser.string('acceptLocation')
    parser.string('dismissLocation')
    parser.booleanOrString('history')

    // Viewport options
    parser.booleanOrString('focus')
    parser.boolean('saveScroll')
    parser.boolean('saveFocus')
    parser.booleanOrString('scroll')
    parser.boolean('revealTop')
    parser.number('revealMax')
    parser.number('revealPadding')
    parser.number('revealSnap')
    parser.string('scrollBehavior')

    // History options
    // { history } is actually a boolean, but we keep the deprecated string
    // variant which should now be passed as { location }.
    parser.booleanOrString('history')
    parser.booleanOrString('location')
    parser.booleanOrString('title')
    parser.boolean('metaTags')

    // Motion options
    parser.include(up.motion.motionOptions)

    // This is the event that may be prevented to stop the follow.
    // up.form.submit() changes this to be up:form:submit instead.
    // The guardEvent will also be assigned a { renderOptions } property in up.render()
    if (!options.guardEvent) { options.guardEvent = up.event.build('up:link:follow', {log: 'Following link'}) }

    return options
  }

  /*-
  This event is [emitted](/up.emit) when a link is [followed](/up.follow) through Unpoly.

  The event is emitted on the `<a>` element that is being followed.

  ### Changing render options

  Listeners may inspect and manipulate [render options](/up.render#parameters) for the coming fragment update.

  The code below will open all form-contained links in an overlay, as to not
  lose the user's form data:

  ```js
  up.on('up:link:follow', function(event, link) {
    if (link.closest('form')) {
      event.renderOptions.layer = 'new'
    }
  })
  ```

  @event up:link:follow
  @param {Element} event.target
    The link element that will be followed.
  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the coming fragment update.

    Listeners may inspect and modify these options.
  @param event.preventDefault()
    Prevents the link from being followed.
  @stable
  */

  /*-
  Preloads the given link.

  When the link is clicked later, the response will already be [cached](/caching),
  making the interaction feel instant.

  You may use this function to programmatically populate the cache
  with pages the user is likely to click or requires
  [accessible while offline](/network-issues#offline-cache).

  Preload requests are considered [background requests](/up.render#options.background)
  and will not show the [progress bar](/loading-indicators#progress-bar).

  Preloading a link will [enable caching](/caching#enabling-caching) for that link automatically.

  @function up.link.preload
  @param {string|Element|jQuery} link
    The element or selector whose destination should be preloaded.
  @param {Object} options
    See options for `up.follow()`.
  @param {boolean} [options.abortable=false]
    Whether the preload request may be aborted when the user [navigates](/navigation)
    or when `up.fragment.abort()` is called.

    @experimental
  @return {Promise}
    A promise that will be fulfilled when the request was loaded and cached.

    When the link cannot be preloaded, the promise rejects with an `up.AbortError`.
  @stable
  */
  function preload(link, options) {
    // If passed a selector, up.fragment.get() will match in the current layer.
    link = up.fragment.get(link)

    let issue = preloadIssue(link)
    if (issue) {
      return Promise.reject(new up.Error(issue))
    }

    const guardEvent = up.event.build('up:link:preload', {log: ['Preloading link %o', link]})

    return follow(link, {
      abortable: false,
      ...options,
      guardEvent,
      preload: true
    })
  }

  function preloadIssue(link) {
    if (!isSafe(link)) {
      return 'Will not preload an unsafe link'
    }
  }

  /*-
  This event is [emitted](/up.emit) before a link is [preloaded](/a-up-preload).

  @event up:link:preload
  @param {Element} event.target
    The link element that will be preloaded.
  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the preloading.

    Listeners may inspect and modify these options.
  @param event.preventDefault()
    Prevents the link from being preloaded.
  @stable
  */

  /*-
  Returns the HTTP method that should be used when following the given link.

  Looks at the link's `up-method` or `data-method` attribute.
  Defaults to `"get"`.

  @function up.link.followMethod
  @param link
  @param options.method {string}
  @internal
  */
  function followMethod(link, options = {}) {
    return u.normalizeMethod(options.method || link.getAttribute('up-method') || link.getAttribute('data-method'))
  }

  function followURL(link, options = {}) {
    const url = options.url || link.getAttribute('up-href') || link.getAttribute('href')

    // Developers sometimes make a <a href="#"> to give a JavaScript interaction standard
    // link behavior (like keyboard navigation or default styles). However, we don't want to
    // consider this  a link with remote content, and rather honor [up-content], [up-document]
    // and [up-fragment] attributes.
    if (url !== '#') {
      return url
    }
  }

  /*-
  Returns whether the given link will be [followed](/up.follow) by Unpoly
  instead of making a full page load.

  By default Unpoly will follow links if the element has
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
  */
  function isFollowable(link) {
    link = up.fragment.get(link)
    return config.matches(link, 'followSelectors')
  }

  /*-
  Makes sure that the given link will be [followed](/up.follow)
  by Unpoly instead of making a full page load.

  If the link is not already [followable](/up.link.isFollowable), the link
  will receive an `a[up-follow]` attribute.

  @function up.link.makeFollowable
  @param {Element|jQuery|string} link
    The element or selector for the link to make followable.
  @experimental
  */
  function makeFollowable(link) {
    if (!isFollowable(link)) {
      link.setAttribute('up-follow', '')
    }
  }

  function makeClickable(link) {
    if (link.matches('a[href], button')) {
      return
    }

    e.setMissingAttrs(link, {
      tabindex: '0',     // Make them part of the natural tab order
      role: 'link',      // Make screen readers pronounce "link"
      'up-clickable': '' // Get pointer pointer from link.css
    })

    link.addEventListener('keydown', function(event) {
      if ((event.key === 'Enter') || (event.key === 'Space')) {
        return forkEventAsUpClick(event)
      }
    })
  }

  /*-
  Enables keyboard interaction for elements that represent links or buttons.

  To define the element's effect when activated, handle the `up:click` event.
  If you want Unpoly to treat this element like a hyperlink, set an `[up-href]` attribute.

  ### Accessibility

  @include clickable-behaviors

  ### Unobtrusive use

  To add these behaviors to existing elements without setting the `[up-clickable]`,
  push a selector into [`up.link.config.clickableSelectors`](/up.link.config#config.clickableSelectors).

  @selector [up-clickable]
  @experimental
  */
  up.macro(config.selectorFn('clickableSelectors'), makeClickable)

  function shouldFollowEvent(event, link) {
    // Users may configure up.link.config.followSelectors.push('a')
    // and then opt out individual links with [up-follow=false].
    if (event.defaultPrevented) {
      return false
    }

    // If user clicked on a child link of $link, or in an <input> within an [up-expand][up-href]
    // we want those other elements handle the click.
    const betterTargetSelector = `a, [up-href], ${up.form.fieldSelector()}`
    const betterTarget = event.target.closest(betterTargetSelector)
    return !betterTarget || (betterTarget === link)
  }

  function isInstant(linkOrDescendant) {
    const element = linkOrDescendant.closest(config.selector('instantSelectors'))
    // Allow users to configure up.link.config.instantSelectors.push('a')
    // but opt out individual links with [up-follow=false].
    return element && !isInstantDisabled(element)
  }

  function isInstantDisabled(link) {
    // (1) We cannot resolve config.noInstantSelectors via a :not() selector because
    //     convertClicks() needs to check if a given link is instant.
    // (2) We cannot implement this as !isFollowable(link) because [up-clickable] can add
    //     instant support for non-followable elements.
    return config.matches(link, 'noInstantSelectors') || config.matches(link, 'noFollowSelectors')
  }

  /*-
  Provide an `up:click` event that improves on standard click
  in several ways:

  - It is emitted on mousedown for [up-instant] elements
  - It is not emitted if the element has disappeared (or was overshadowed)
    between `mousedown` and `click`. This can happen if `mousedown` creates a new element
    that obstructs interaction with this element, or if a `mousedown` handler removes a handler.

  Stopping an up:click event will also stop the underlying event.

  Also see docs for `up:click`.

  @function up.link.convertClicks
  @param {up.Layer} layer
  @internal
  */
  function convertClicks(layer) {
    layer.on('click', function(event, element) {
      // We never handle events for the right mouse button,
      // or when Shift/CTRL/Meta/ALT is pressed
      if (!up.event.isUnmodified(event)) {
        return
      }

      // (1) Instant links should not have a `click` event.
      //     This would trigger the browsers default follow-behavior and possibly activate JS libs.
      // (2) A11Y: We also need to check whether the [up-instant] behavior did trigger on mousedown.
      //     Keyboard navigation will not necessarily trigger a mousedown event.
      if (isInstant(element) && lastMousedownTarget) {
        up.event.halt(event)

      // In case mousedown has created a layer over the click coordinates,
      // Chrome will emit an event with { target: document.body } on click.
      // Ignore that event and only process if we would still hit the
      // expect layers at the click coordinates.
      } else if (layer.wasHitByMouseEvent(event) && !didUserDragAway(event)) {
        // Event is a `PointerEvent` with an { pointerType } property.
        // Its values are 'mouse', 'pen', 'touch' or '' (unknown, meaning synthetic or keyboard).
        forkEventAsUpClick(event)
      }

      // In case the user switches input modes.
      return lastMousedownTarget = null
    })

    layer.on('mousedown', function(event, element) {
      // We never handle events for the right mouse button,
      // or when Shift/CTRL/Meta/ALT is pressed
      if (!up.event.isUnmodified(event)) {
        return
      }

      lastMousedownTarget = event.target

      if (isInstant(element)) {
        // A11Y: Keyboard navigation will not necessarily trigger a mousedown event.
        // We also don't want to listen to the enter key, since some screen readers
        // use the enter key for something else.
        forkEventAsUpClick(event)
      }
    })
  }

  function didUserDragAway(clickEvent) {
    return lastMousedownTarget && (lastMousedownTarget !== clickEvent.target)
  }

  function forkEventAsUpClick(originalEvent) {
    let forwardedProps = ['clientX', 'clientY', 'button', ...up.event.keyModifiers]
    const newEvent = up.event.fork(originalEvent, 'up:click', forwardedProps)
    up.emit(originalEvent.target, newEvent, { log: false })
  }

  /*-
  A `click` event that honors the [`[up-instant]`](/a-up-instant) attribute.

  This event is generally emitted when an element is clicked. However, for elements
  with an [`[up-instant]`](/a-up-instant) attribute this event is emitted on `mousedown` instead.

  This is useful to listen to links being activated, without needing to know whether
  a link is `[up-instant]`.

  ### Example

  Assume we have two links, one of which is `[up-instant]`:

  ```html
  <a href="/one">Link 1</a>
  <a href="/two" up-instant>Link 2</a>
  ```

  The following event listener will be called when *either* link is activated:

  ```js
  document.addEventListener('up:click', function(event) {
    ...
  })
  ```

  ### Cancelation

  You may cancel an `up:click` event using `event.preventDefault()`.

  Canceling `up:click` on a hyperlink will prevent any Unpoly from [following](/a-up-follow) that link.

  The underlying `click` or `mousedown` event will also be canceled.

  ### Accessibility

  If the user activates an element using their keyboard, the `up:click` event will be emitted
  when the key is pressed even if the element has an `[up-instant]` attribute.

  ### Only unmodified clicks are considered

  To prevent overriding native browser behavior, the `up:click` is only emitted for unmodified clicks.

  In particular, it is not emitted when the user holds `Shift`, `CTRL` or `Meta` while clicking.
  Neither it is emitted when the user clicks with a secondary mouse button.

  @event up:click
  @param {Element} event.target
    The clicked element.
  @param {Event} event.originalEvent
    The underlying `click` or `mousedown` event.
  @param event.preventDefault()
    Prevents this event and also the original `click` or `mousedown` event.
  @stable
  */

  /*-
  Returns whether the given link has a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
  HTTP method like `GET`.

  @function up.link.isSafe
  @param {Element} link
  @return {boolean}
  @stable
  */
  function isSafe(link) {
    const method = followMethod(link)
    return up.network.isSafeMethod(method)
  }

  function onLoadCondition(link, condition, callback) {
    switch (condition) {
      case 'insert':
        callback()
        break
      case 'reveal':
        up.fragment.onFirstIntersect(link, callback)
        break
      case 'hover':
        new up.LinkFollowIntent(link, callback)
        break
    }
  }

  /*-
  TODO: DOcs

  - Must have good target like an #id
  - Most [up-follow] options can be used
  - Gets .up-active

  @selector [up-partial]
  @param [up-load-on='insert']
  */
  // TODO: Test that it runs if already intersecting on load
  // TODO: Test that it runs in viewports
  // TODO: Test that it targets itself by default
  // TODO: Test that it makes a background request
  // TODO: Test that it does not flicker during revalidation when already cached
  // TODO: Test that it gets .up-active by default
  // TODO: Test that we don't see navigation effects
  up.compiler('[up-partial]', function(link) {
    let loadCondition = e.attr(link, 'up-load-on') || 'insert'
    let target = e.attr(link, 'up-target') || ':origin'
    let loadPartial = () => up.link.follow(link, { target, navigate: false, background: true })
    onLoadCondition(link, loadCondition, loadPartial)
  })


  /*-
  [Follows](/up.follow) this link with JavaScript and updates a fragment with the server response.

  Following a link is considered [navigation](/navigation) by default.

  ### Example

  This will update the fragment `<div class="content">` with the same element
  fetched from `/posts/5`:

  ```html
  <a href="/posts/5" up-follow up-target=".content">Read post</a>
  ```

  If no `[up-target]` attribute is set, the [main target](/up-main) is updated.

  ### Advanced fragment changes

  See [fragment placement](/targeting-fragments) for advanced use cases
  like updating multiple fragments or appending content to an existing element.

  ### Short notation

  You may omit the `[up-follow]` attribute if the link has one of the following attributes:

  - `[up-target]`
  - `[up-layer]`
  - `[up-transition]`
  - `[up-content]`
  - `[up-fragment]`
  - `[up-document]`

  Such a link will still be followed through Unpoly.

  ### Following all links automatically

  You can configure Unpoly to follow *all* links on a page without requiring an `[up-follow]` attribute.

  See [Handling all links and forms](/handling-everything).

  ### Preventing Unpoly from following links

  To prevent Unpoly from following an `a[up-follow]` link, use one of the following options:

  - Prevent the `up:link:follow` event on the link element
  - Prevent the `up:click` event on the link element
  - Set an `[up-follow=false]` attribute on the link element

  @selector a[up-follow]

  @param [up-navigate='true']
    Whether this fragment update is considered [navigation](/navigation).

    Setting this to `false` will disable most defaults documented below,
    causing Unpoly to render a fragment without side-effects like updating history
    or scrolling.

  @param [href]
    The URL to fetch from the server.

    See [loading content from a URL](/render-content#url).

    To use a different URL when a link is followed through Unpoly (as opposed to a browser's full page load),
    set an `[up-href]` attribute.

    Instead of making a server request, you may also render an [existing string of HTML](/render-content#local).

  @param [up-target]
    The [target selector](/targeting-fragments) to update.

    If omitted a [main target](/up-main) will be rendered.

  @param [up-fallback='true']
    Specifies behavior if the [target selector](/up.render#options.target) is missing from the current page or the server response.

    If set to a CSS selector, Unpoly will attempt to replace that selector instead.

    If set to `true` Unpoly will attempt to replace a [main target](/up-main) instead.

    If set to `false` Unpoly will immediately reject the render promise.

  @param [up-match='region']
    Controls which fragment to update when the [`[up-target]`](#up-target) selector yields multiple results.

    When set to `'region'` Unpoly will prefer to update fragments in the
    [region](/targeting-fragments#resolving-ambiguous-selectors) of the [origin element](/up.render#options.origin).

    If set to `'first'` Unpoly will always update the first matching fragment.

    Defaults to `up.fragment.config.match`, which defaults to `'region'`.

  @param [up-method='get']
    The HTTP method to use for the request.

    Common values are `get`, `post`, `put`, `patch` and `delete`. The value is case insensitive.

    The HTTP method may also be passed as an `[data-method]` attribute.

    By default, methods other than `get` or `post` will be converted into a `post` request, and carry
    their original method as a configurable [`_method` parameter](/up.protocol.config#config.methodParam).

  @param [up-params]
    A JSON object with additional [parameters](/up.Params) that should be sent as the request's
    [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

    When making a `GET` request to a URL with a query string, the given `{ params }` will be added
    to the query parameters.

  @param [up-headers]
    A JSON object with additional request headers.

    Unpoly will by default send a number of custom request headers.
    E.g. the `X-Up-Target` header includes the [target selector](/targeting-fragments).
    See `up.protocol` for details.

  @param [up-content]
    The new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
    for the targeted fragment.

    See [Updating an element's inner HTML from a string](/render-content#content).

  @param [up-fragment]
    A string of HTML comprising *only* the new fragment's
    [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML).

    With an `[up-fragment]` attribute you can omit the `[up-target]` attribute.
    The target will be [derived](/target-derivation) from the root element in the given HTML.

    See [Rendering a string that only contains the fragment](/render-content#fragment).

  @param [up-document]
    A string of HTML containing the targeted fragment.

    See [Extracting an element's outer HTML from a larger HTML string](/render-content#document).

  @param [up-fail]
    Whether the server response should be considered failed.

    By [default](/up.network.config#config.fail) any HTTP status code other than 2xx or [304](/skipping-rendering#rendering-nothing) is considered an error code.

    For failed responses Unpoly will use attributes prefixed with `up-fail`, e.g. `[up-fail-target]`.
    See [handling server errors](/failed-responses) for details.

  @param [up-history='auto']
    Whether the browser URL, window title and meta tags will be [updated](/updating-history).

    If set to `true`, the history will always be updated, using the title and URL from
    the server response, or from given `[up-title]` and `[up-location]` attributes.

    If set to `auto` history will be updated if the `[up-target]` matches
    a selector in `up.fragment.config.autoHistoryTargets`. By default this contains all
    [main targets](/up-main).

    If set to `false`, the history will remain unchanged.

    @see updating-history

  @param [up-title]
    An explicit document title to set before rendering.

    By default the title is extracted from the response's `<title>` tag.
    To prevent the title from being updated, set `[up-title=false]` to explicitly

    This attribute is only used when [updating history](#up-history).

  @param [up-location]
    An explicit URL to set before rendering.

    By default Unpoly will use the link's `[href]` or the final URL after the server redirected.
    To prevent the URL from being updated, set `[up-location=false]`.

    This attribute is only used when [updating history](#up-history).

  @param [up-meta-tags]
    Whether to update [meta tags](/up-meta) in the `<head>`.

    By default Unpoly will extract meta tags from the response's `<head>`.
    To prevent meta tags from being updated, set `[up-meta-tags=false]`.

    This attribute is only used when [updating history](#up-history).

  @param [up-transition]
    The name of an [transition](/up.motion) to morph between the old and few fragment.

    If you are [prepending or appending content](/targeting-fragments#appending-or-prepending-content),
    use the `[up-animation]` attribute instead.

  @param [up-animation]
    The name of an [animation](/up.motion) to reveal a new fragment when
    [prepending or appending content](/targeting-fragments#appending-or-prepending-content).

    If you are replacing content (the default), use the `[up-transition]` attribute instead.

  @param [up-duration]
    The duration of the transition or animation (in millisconds).

  @param [up-easing]
    The timing function that accelerates the transition or animation.

    See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    for a list of available timing functions.

  @param [up-cache='auto']
    Whether to read from and write to the [cache](/caching).

    With `[up-cache=true]` Unpoly will try to re-use a cached response before connecting
    to the network. To prevent display of stale content, cached responses are
    [reloaded once rendered](#up-revalidate). If no cached response exists,
    Unpoly will make a request and cache the server response.

    With `[up-cache=auto]` Unpoly will use the cache only if `up.network.config.autoCache`
    returns `true` for the request.

    With `[up-cache=false]` Unpoly will always make a network request.

  @param [up-revalidate='auto']
    Whether to reload the [targeted fragment](/targeting-fragments)
    after it was rendered from a cached response.

    With `[up-revalidate='auto']` Unpoly will revalidate if the `up.fragment.config.autoRevalidate(response)`
    returns `true`. By default this configuration will return true for
    [expired](/up.fragment.config#config.autoRevalidate) responses.

    With `[up-revalidate='true']` Unpoly will always revalidate cached content, regardless
    of its age.

    With `[up-revalidate='false']` Unpoly will never revalidate cached content.

  @param [up-expire-cache]
    Whether existing [cache](/caching) entries will be [expired](/caching#expiration) with this request.

    By default a non-GET request will expire the entire cache.
    You may also pass a [URL pattern](/url-patterns) to only expire matching requests.

    Also see [`up.request({ expireCache })`](/up.request#options.expireCache) and `up.network.config.expireCache`.

  @param [up-evict-cache]
    Whether existing [cache](/caching) entries will be [evicted](/caching#eviction) with this request.

    You may also pass a [URL pattern](/url-patterns) to only evict matching requests.

    Also see [`up.request({ evictCache })`](/up.request#options.evictCache) and `up.network.config.evictCache`.

  @param [up-abort='target']
    Whether to [abort existing requests](/aborting-requests) before rendering.

  @param [up-abortable='true']
    Whether this request may be aborted by other requests targeting the same fragments or layer.

    See [aborting requests](/aborting-requests) for details.

    @experimental

  @param [up-background='false']
    Whether this request will load in the background.

    Background requests deprioritized over foreground requests.
    Background requests also won't emit `up:network:late` events and won't trigger
    the [progress bar](/loading-indicators#progress-bar).

  @param [up-bad-response-time]
    The number of milliseconds after which this request can cause
    an `up:network:late` event.

    Defaults to `up.network.config.badResponseTime`.

    @experimental

  @param [up-timeout]
    The number of milliseconds after which this request fails with a timeout.

    Defaults to `up.network.config.timeout`.

  @param [up-layer='origin current']
    The [layer](/up.layer) in which to match and render the fragment.

    See [layer option](/layer-option) for a list of allowed values.

    To [open the fragment in a new overlay](/opening-overlays), pass `[up-layer=new]`.
    In this case attributes for `a[up-layer=new]` may also be used.

  @param [up-peel='true']
    Whether to close overlays obstructing the updated layer when the fragment is updated.

    This is only relevant when updating a layer that is not the [frontmost layer](/up.layer.front).

  @param [up-context]
    A JSON object that will be merged into the [context](/context)
    of the current layer once the fragment is rendered.

    @experimental

  @param [up-scroll='auto']
    How to scroll after the new fragment was rendered.

    See [Scrolling](/scrolling) for a list of allowed values.

  @param [up-scroll-behavior='instant']
    Whether to [animate the scroll motion](/scroll-tuning#animating-the-scroll-motion)
    when [prepending or appending](/targeting-fragments#appending-or-prepending-content) content.

  @param [up-reveal-snap]
    When to [snap to the top](/scroll-tuning#snapping-to-the-screen-edge)
    when scrolling to an element near the top edge of the viewport's scroll buffer.

  @param [up-reveal-top]
    When to [move a revealed element to the top](/scroll-tuning#moving-revealed-elements-to-the-top)
    when scrolling to an element.

  @param [up-reveal-padding]
    How much [space to leave to the closest viewport edge](/scroll-tuning#revealing-with-padding)
    when scrolling to an element.

  @param [up-reveal-max]
    How many pixel lines of [high element to reveal](/scroll-tuning#revealing-with-padding) when scrolling to an element.

  @param [up-save-scroll]
    Whether to [save scroll positions](/up.viewport.saveScroll) before updating the fragment.

    Saved scroll positions can later be restored with [`[up-scroll=restore]`](/scrolling#restoring-scroll-positions).

  @param [up-focus='auto']
    What to focus after the new fragment was rendered.

    See [Controlling focus](/focus) for a list of allowed values.

  @param [up-save-focus]
    Whether to [save focus-related state](/up.viewport.saveFocus) before updating the fragment.

    Saved scroll positions can later be restored with [`[up-focus=restore]`](/focus#restoring-focus).

  @param [up-confirm]
    A message the user needs to confirm before fragments are updated.

    The message will be shown as a [native browser prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt).

    If the user does not confirm the render promise will reject and no fragments will be updated.

  @param [up-feedback='true']
    Whether to give the link an `.up-active` class and the targeted element an `.up-loading` class
    while loading content.

    See [navigation feedback](/up.feedback).

  @param [up-on-loaded]
    A JavaScript snippet that is executed when the server responds with new HTML,
    but before the HTML is rendered.

    The snippet runs in the following scope:

    | Expression | Value                                         |
    |------------|-----------------------------------------------|
    | `this`     | The link being followed                       |
    | `event`    | A preventable `up:fragment:loaded` event      |

    The snippet will also run for [failed responses](/failed-responses).

  @param [up-on-rendered]
    A JavaScript snippet that is executed when Unpoly has updated fragments.

    The snippet runs in the following scope:

    | Expression | Value                                                |
    |------------|------------------------------------------------------|
    | `this`     | The link being followed                              |
    | `result`   | The `up.RenderResult` for the respective render pass |

    The snippet will be called zero, one or two times:

    - When the server rendered an [empty response](/skipping-rendering#rendering-nothing), no fragments are updated. `[up-on-rendered]` is not called.
    - When the server rendered a matching fragment, it will be updated on the page. `[up-on-rendered]` is called with the [result](/up.RenderResult).
    - When [revalidation](/caching#revalidation) renders a second time, `[up-on-rendered]` is called again with the final result.

    Also see [Running code after rendering](/render-hooks#running-code-after-rendering).

  @param [up-on-finished]
    A JavaScript snippet that is execvuted when no further DOM changes will be caused by this render pass.

    In particular:

    - [Animations](/up.motion) have concluded and [transitioned](https://unpoly.com/a-up-transition) elements were removed from the DOM tree.
    - A [cached response](#up-cache) was [revalidated with the server](/caching#revalidation).
      If the server has responded with new content, this content has also been rendered.

    | Expression | Value                                                                  |
    |------------|------------------------------------------------------------------------|
    | `this`     | The link being followed                                                |
    | `result`   | The `up.RenderResult` for the last render pass that updated a fragment |

    If [revalidation](/caching#revalidation) re-rendered the fragment, `result` describes updates from the
    second render pass. If no revalidation was performed, or if revalidation yielded an [empty response](/caching#when-nothing-changed),
    it is the result from the initial render pass.

    Also see [Awaiting postprocessing](/render-hooks#awaiting-postprocessing).

  @param [up-on-offline]
    A JavaScript snippet that is executed when the fragment could not be loaded
    due to a [disconnect or timeout](/network-issues).

    | Expression | Value                                         |
    |------------|-----------------------------------------------|
    | `this`     | The link being followed                       |
    | `error`    | An `up.Offline` error                         |

  @param [up-on-error]
    A JavaScript snippet that is run when any error is thrown during the rendering process.

    | Expression | Value                                         |
    |------------|-----------------------------------------------|
    | `this`     | The link being followed                       |
    | `error`    | An `Error` object                             |

    The callback is also called when the render pass fails due to [network issues](/network-issues),
    or [aborts](/aborting-requests).

    Also see [Handling errors](/render-hooks#handling-errors).

  @param [up-use-keep='true']
    Whether [`[up-keep]`](/up-keep) elements will be preserved in the updated fragment.

    @experimental

  @param [up-use-hungry='true']
    Whether [`[up-hungry]`](/up-hungry) elements outside the updated fragment will also be updated.

    @experimental

  @stable
  */
  up.on('up:click', config.selectorFn('followSelectors'), function(event, link) {
    if (shouldFollowEvent(event, link)) {
      up.event.halt(event, { log: true })

      // When the user clicks an hyperlink, the browser will focus the link element on `click`.
      // However, for an `a[up-instant]` link we will emit `up:click` on `mousedown` and halt the `click` event.
      // Without a `click` event the browser won't focus the link.
      //
      // This also has an unfortunate effect on `input[up-validate]`:
      //
      // - User types into a text field
      // - With focus still on the text field, the user clicks on an `a[up-instant]`.
      // - The link is being followed, causing a request for the new fragment.
      // - When the response is received, Unpoly will update the targeted fragment.
      // - This causes the text field (probably being replaced) from losing focus, causing a `change` event,
      //   triggering `[up-validate]` and another server request for the validation.
      // - The link request is probably `{ abort: true }`, but since it happened *before* the
      //   validation request there was nothing to abort.
      // - When the validation response is received, the text field is probably gone, causing error.
      //
      // To preseve behavioral symmetry to standard links, we manually focus the link when it was activated
      // on `mousedown`.
      up.focus(link, { preventScroll: true })

      up.error.muteUncriticalRejection(follow(link))
    }
  })

  /*-
  Makes any element behave like a hyperlink.

  ### Example

  The following `<span>` element will [navigate](/a-up-follow) to `/details` when clicked:

  ```html
  <span up-href="/details">Read more</span>
  ```

  ### Accessibility

  @include clickable-behaviors

  The link-like element cannot be opened in a new tab.

  ### Advantages of `<a>` elements

  In general you should prefer using regular hyperlinks (`a[href]`) over elements with `[up-href]`:

  - Only regular links allow the user to open the destination in a new tab
  - Regular links still work when JavaScript is unavailable.
  - Regular links can be followed from crawlers like Google

  `<a>` elements are also exceptional in that they may [contain block elements](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).

  ### Use cases of `[up-href]`

  There are some use cases for `[up-href]`:

  - When you want to *prevent* the user from opening a link in a new tab.
  - When the element cannot be wrapped in an `<a>`, e.g. a `<tr>`.

  @selector [up-href]
  @param [up-href]
    The URL to load when activated.
  @params-note
    All attributes for `a[up-follow]` may be used.
  @stable
  */

  /*-
  Follows this link on `mousedown` instead of `click`.

  This will save precious milliseconds that otherwise spent
  on waiting for the user to release the mouse button. Since an
  AJAX request will be triggered right way, the interaction will
  appear faster.

  > [INFO]
  > With `[up-instant]` users can no longer cancel a click by dragging the pressed mouse away from the link.
  > However, for navigation actions this isn't needed. E.g. many operation systems switch tabs on `mousedown`
  > instead of `click`.

  ### Example

  ```html
  <a href="/users" up-follow up-instant>User list</a>
  ```

  ### Accessibility

  If the user activates an element using their keyboard, the `up:click` event will be emitted
  on `click`, even if the element has an `[up-instant]` attribute.

  @selector a[up-instant]
  @stable
  */

  /*-
  Add an `[up-expand]` attribute to any element to enlarge the click area of a
  descendant link.

  `[up-expand]` honors all the Unppoly attributes in expanded links, like
  `a[up-target]`, `a[up-instant]` or `a[up-preload]`.

  ### Example

  ```html
  <div class="notification" up-expand>
    Record was saved!
    <a href="/records">Close</a>
  </div>
  ```

  In the example above, clicking anywhere within `.notification` element
  would [follow](/up.follow) the *Close* link.

  ### Elements with multiple contained links

  If a container contains more than one link, you can set the value of the
  `[up-expand]` attribute to a CSS selector to define which link should be expanded:

  ```html
  <div class="notification" up-expand=".close">
    Record was saved!
    <a class="details" href="/records/5">Details</a>
    <a class="close" href="/records">Close</a>
  </div>
  ```

  ### Limitations

  `[up-expand]` has some limitations for advanced browser users:

  - Users won't be able to right-click the expanded area to open a context menu
  - Users won't be able to `CTRL`+click the expanded area to open a new tab

  To overcome these limitations, consider nesting the entire clickable area in an actual `<a>` tag.
  [It's OK to put block elements inside an anchor tag](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).

  @selector [up-expand]
  @param [up-expand]
    A CSS selector that defines which containing link should be expanded.

    If omitted, the first link in this element will be expanded.
  @stable
  */
  up.macro('[up-expand]', function(area) {
    const selector = area.getAttribute('up-expand') || 'a, [up-href]'

    let childLink = e.get(area, selector)
    if (childLink) {
      const areaAttrs = e.upAttrs(childLink)
      areaAttrs['up-href'] ||= childLink.getAttribute('href')
      e.setMissingAttrs(area, areaAttrs)

      const areaClasses = e.upClasses(childLink)
      area.classList.add(...areaClasses)

      makeFollowable(area)
      // We could also consider making the area clickable, via makeClickable().
      // However, since the original link is already present within the area,
      // we would not add accessibility benefits. We might also confuse screen readers
      // with a nested link.
    }
  })

  /*-
  Preloads this link when the user hovers over it.

  When the link is clicked later the response will already be cached,
  making the interaction feel instant.

  Preloading a link will *not* [abort](/aborting-requests) pending requests
  [targeting](/targeting-fragments) the same fragments. Only when the link is clicked later
  conflicting requests are aborted.

  Preload requests are considered [background requests](/up.render#options.background)
  and will not show the [progress bar](/loading-indicators#progress-bar).

  Preloading a link will [enable caching](/caching#enabling-caching) for that link automatically.

  Unpoly will only preload [links with safe methods](/up.link.isSafe).

  @selector a[up-preload]
  @param [up-preload-delay]
    The number of milliseconds to wait between hovering
    and preloading. Increasing this will lower the load in your server,
    but will also make the interaction feel less instant.

    Defaults to `up.link.config.preloadDelay`.
  @stable
  */
  up.compiler(config.selectorFn('preloadSelectors'), function(link) {
    if (!isPreloadDisabled(link)) {
      let loadCondition = e.attr(link, 'up-load-on') || 'hover'
      let preload = () => up.link.preload(link)
      onLoadCondition(link, loadCondition, preload)
    }
  })

  up.on('up:framework:reset', reset)

  return {
    follow,
    followOptions,
    preload,
    makeFollowable,
    makeClickable,
    isSafe,
    isFollowable,
    shouldFollowEvent,
    followMethod,
    convertClicks,
    config,
    combineFollowableSelectors,
    preloadIssue,
  }
})()

up.follow = up.link.follow
