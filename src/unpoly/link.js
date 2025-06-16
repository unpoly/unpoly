require('./link.sass')

/*-
Linking to fragments
====================

The `up.link` module lets you build links that update fragments instead of entire pages.

## Motivation

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

Unpoly fixes this by letting you annotate links with an [`[up-target]`](/up-follow#up-target)
attribute. The value of this attribute is a CSS selector that indicates which page
fragment to update. The server **still renders full HTML pages**, but we only use
the targeted fragments and discard the rest:

![Unpoly page flow](/images/tutorial/fragment_flow_unpoly.svg){:width="620" class="picture has_border is_sepia has_padding"}

With this model, following links feels smooth. All DOM state outside the updated fragment is preserved.
Pages also load much faster since the DOM, CSS and JavaScript environments do not need to be
destroyed and recreated for every request.


## Example

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

With these [`[up-target]`](/up-follow#up-target) annotations Unpoly only updates the targeted part of the screen.
The JavaScript environment will persist and the user will not see a white flash while the
new page is loading.

@see attributes-and-options
@see targeting-fragments
@see handling-everything
@see failed-responses
@see preloading
@see lazy-loading
@see faux-interactive-elements

@see [up-follow]
@see [up-instant]
@see [up-preload]
@see up.follow

@module up.link
*/

up.link = (function() {

  const u = up.util
  const e = up.element

  let lastTouchstartTarget = null
  let lastMousedownTarget = null
  let lastInstantTarget = null

  const ATTRS_WITH_LOCAL_HTML = '[up-content], [up-fragment], [up-document]'
  const ATTRS_SUGGESTING_FOLLOW = `${ATTRS_WITH_LOCAL_HTML}, [up-target], [up-layer], [up-transition], [up-preload]`
  const DEFAULT_INTERACTIVE_ELEMENT = 'a[href], button'

  /*-
  Configures defaults for link handling.

  In particular you can configure Unpoly to handle [all links on the page](/handling-everything)
  without requiring developers to set `[up-...]` attributes.

  @property up.link.config

  @section Followable links

    @param {Array<string>} config.followSelectors
      An array of CSS selectors matching links that will be [followed through Unpoly](/up-follow).

      You can customize this property to automatically follow *all* links on a page without requiring an `[up-follow]` attribute.
      See [Handling all links and forms](/handling-everything).

    @param {Array<string>} config.noFollowSelectors
      Exceptions to `up.link.config.followSelectors`.

      Matching links will *not* be [followed through Unpoly](/up-follow), even if they match `up.link.config.followSelectors`.

      By default Unpoly excludes:

      - Links with an `[up-follow=false]` attribute.
      - Links with a cross-origin `[href]`.
      - Links with a [`[target]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-target) attribute
        (to target an iframe or open new browser tab).
      - Links with a [`[download]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#attr-download) attribute.
      - Links with an `[href]` attribute starting with `javascript:`.
      - Links with an `[href="#"]` attribute that don't also have local HTML
        in an `[up-document]`, `[up-fragment]` or `[up-content]` attribute.

  @section Instant click

    @param {Array<string>} config.instantSelectors
      An array of CSS selectors matching elements that are [activated on `mousedown`](/up-instant)
      instead of on `click`.

      You can customize this property to follow *all* links on `mousedown` without requiring an `[up-instant]` attribute.
      See [Handling all links and forms](/handling-everything).

      Note that an instant link must also be [followable](/up.link.isFollowable), usually by giving it an
      [`[up-follow]`](/up-follow) attribute or by configuring `up.link.config.followSelectors`.

    @param {Array<string>} config.noInstantSelectors
      Exceptions to `up.link.config.instantSelectors`.

      Matching links will *not* be [followed on `mousedown`](/up-instant), even if they match `up.link.config.instantSelectors`.

      By default Unpoly excludes:

      - Elements with an `[up-instant=false]` attribute.
      - Links that are [not followable](#config.noFollowSelectors).

  @section Preloading

    @param {Array<string>} config.preloadSelectors
      An array of CSS selectors matching links that are [preloaded on hover](/preloading#on-hover).

      You can customize this property to preload *all* links on `mousedown` without requiring an `[up-preload]` attribute.
      See [Handling all links and forms](/handling-everything).

    @param {Array<string>} config.noPreloadSelectors
      Exceptions to `up.link.config.preloadSelectors`.

      Matching links will *not* be [preloaded on hover](/preloading#on-hover), even if they match `up.link.config.preloadSelectors`.

      By default Unpoly excludes:

      - Links with an `[up-preload=false]` attribute.
      - Links that are [not followable](#config.noFollowSelectors).
      - Links with an [unsafe method](/up.link.isSafe).
      - When the link destination [cannot be cached](/up.network.config#config.autoCache).

    @param {number} [config.preloadDelay=90]
      The number of milliseconds to wait before [preloading on hover](/preloading#on-hover).

  @section Interactive elements

    @param {Array<string>} [config.clickableSelectors]
      A list of CSS selectors matching elements that should behave like links or buttons.

      See [Clicking on non-interactive elements](/faux-interactive-elements).

      @experimental

    @param {Array<string>} [config.noClickableSelectors]
      Exceptions to `up.link.config.clickableSelectors`.

      Matching elements will *not* be receive [interactive behavior](/up-follow),
      even if they match `up.link.config.clickableSelectors`.

      @experimental

  @stable
  */
  const config = new up.Config(() => ({
    // (1) We want to follow all elements with an [up-follow] attribute.
    //     This can be an <a up-follow href="/path"> or an <span up-follow up-href="/path">
    // (2) Users expect a link to be followable if it uses a signature attribute
    //     like [up-target] or [up-transition], even without an [up-href] attribute.
    // (3) We sometimes allow <a> links without an [href], e.g. <a up-target=".foo" up-content="html">.
    followSelectors: ['[up-follow]', `a:is(${ATTRS_SUGGESTING_FOLLOW})`],

    // (1) We don't want to follow <a href="#anchor"> links without a path. Instead
    //     we will let the browser change the current location's anchor and up.reveal()
    //     on hashchange to scroll past obstructions.
    // (2) We want to follow links with [href=#] only if they have a local source of HTML
    //     through [up-content], [up-fragment] or [up-document].
    //     Many web developers are used to give JavaScript-handled links an [href="#"]
    //     attribute. Also frameworks like Bootstrap only style links if they have an [href].
    // (3) We don't want to handle <a href="javascript:foo()"> links.
    noFollowSelectors: ['[up-follow=false]', 'a[download]', 'a[target]', 'a[href^="javascript:"]', 'a[href^="mailto:"]', 'a[href^="tel:"]', `a[href^="#"]:not(${ATTRS_WITH_LOCAL_HTML})`, e.crossOriginSelector('href'), e.crossOriginSelector('up-href')],

    instantSelectors: ['[up-instant]'],
    noInstantSelectors: ['[up-instant=false]', '[onclick]'],

    preloadSelectors: ['[up-preload]'],
    noPreloadSelectors: ['[up-preload=false]'],

    // (1) Users can explicitly add A11Y behavior to non-interactive elements with [up-clickable]
    // (2) We have some elements like [up-emit] or [up-accept] which may or may not be interactive elements
    // (3) When a link is followable, is should also be clickable. Even a <span up-follow> or a <a up-content>.
    // (4) Prevent unnecessary compilation of elements that are already interactive (a[href], button).
    clickableSelectors: ['[up-clickable]', '[up-follow]', '[up-emit]', '[up-accept]', '[up-dismiss]', `a:is(${ATTRS_SUGGESTING_FOLLOW})`],
    noClickableSelectors: ['[up-clickable=false]', DEFAULT_INTERACTIVE_ELEMENT],

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
    lastTouchstartTarget = null
    lastMousedownTarget = null
    lastInstantTarget = null
  }

  /*-
  Follows the given link with JavaScript and updates a fragment with the server response.

  By default the layer's [main element](/up-main)
  will be replaced. Attributes like [`[up-target]`](/up-follow#up-target)
  or [`[up-layer]`](/up-follow#up-layer) will be honored.

  Following a link is considered [navigation](/navigation) by default.

  Emits the event `up:link:follow`.

  ## Examples

  Assume we have a link with an [`[up-target]`](/up-follow#up-target) attribute:

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

  @section General
    @param {Element|jQuery|string} link
      The link to follow.

    @param {Object} [options]
      [Render options](/up.render#parameters) that should be used for following the link.

      Unpoly will parse render options from the given link's attributes.
      E.g. the `[up-target]` attribute will be parsed into a `{ target }` option.
      See `[up-follow]` for a list of supported attributes.

      You may pass this additional `options` object to
      [supplement or override](/attributes-and-options#options)
      options parsed from the link attributes.

  @section Targeting
    @mix up.render/targeting

  @section Navigation
    @mix up.render/navigation
      @param [options.navigate=true]

  @section Request
    @mix up.render/request

  @section Local content
    @mix up.render/local-content

  @section Layer
    @mix up.render/layer

  @section History
    @mix up.render/history

  @section Animation
    @mix up.render/motion

  @section Caching
    @mix up.render/caching

  @section Scrolling
    @mix up.render/scrolling

  @section Focus
    @mix up.render/focus

  @section Loading state
    @mix up.render/loading-state

  @section Failed responses
    @mix up.render/failed-responses

  @section Client state
    @mix up.render/client-state

  @section Lifecycle hooks
    @mix up.render/lifecycle-hooks

  @return
    @like up.render

  @stable
  */
  const follow = up.mockable(function(link, options, parserOptions) {
    return up.render(followOptions(link, options, parserOptions))
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
    parser.booleanOrNumber('lateDelay')
    parser.number('timeout')
    parser.booleanOrString('fail')

    return options
  }

  /*-
  Parses the [render](/up.render) options that would be used to
  [follow](/up.follow) the given link, but does not render.

  ## Example

  Given a link with some `[up-...]` attributes:

  ```html
  <a href="/foo" up-target=".content" up-layer="new">...</a>
  ```

  We can parse the link's render options like this:

  ```js
  let link = document.querySelector('a[href="/foo"]')
  let options = up.link.followOptions(link)
  // result: { url: /foo', method: 'GET', target: '.content', layer: 'new', ... }'
  ```

  @function up.link.followOptions
  @param {Element|jQuery|string} link
    The link from which to parse options.
  @param {Object} [options]
    Additional options for following the link.

    Values from this object will override any attributes set on the link element.
    @internal
  @return {Object}
    An object of [render options](/up.render#parameters).
  @stable
  */
  function followOptions(link, options, parserOptions) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    link = up.fragment.get(link)
    options = u.options(options)

    const parser = new up.OptionsParser(link, options, { fail: true, ...parserOptions })

    parser.include(parseRequestOptions)

    // Fragment options
    options.origin ||= link
    parser.boolean('navigate', { default: true })
    parser.string('confirm', { attr: ['up-confirm', 'data-confirm'] })
    parser.string('target')
    parser.booleanOrString('fallback')
    parser.string('match')
    parser.string('document')
    parser.string('fragment')
    parser.string('content')
    parser.boolean('keep', { attr: 'up-use-keep' }) // cannot be [up-keep] because it would affect the link itself
    parser.boolean('hungry', { attr: 'up-use-hungry' }) // cannot be [up-hungry] because it would affect the link itself
    parser.json('data', { attr: 'up-use-data' }) // cannot be [up-data] because it would affect the link itself

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
    parser.booleanOrString('closeAnimation')
    parser.string('closeEasing')
    parser.number('closeDuration')

    // Status effects
    parser.include(up.status.statusOptions)

    // Viewport options
    parser.booleanOrString('focus')
    parser.booleanOrString('focusVisible')
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
    parser.booleanOrString('lang')

    // Motion options
    parser.include(up.motion.motionOptions)

    // This is the event that may be prevented to stop the follow.
    // up.form.submit() changes this to be up:form:submit instead.
    // The guardEvent will also be assigned a { renderOptions } property in up.render()
    options.guardEvent ??= up.event.build('up:link:follow', { log: ['Following link %o', link] })

    return options
  }

  /*-
  This event is [emitted](/up.emit) when a link is [followed](/up.follow) through Unpoly.

  The event is emitted on the `<a>` element that is being followed.

  ## Changing render options

  Listeners may inspect and manipulate [render options](/up.render#parameters) for the coming fragment update.

  The code below will open all form-contained links in an overlay, as to not
  lose the user's form data:

  ```js
  up.on('up:link:follow', function(event, link) {
    if (link.closest('form')) {
      event.renderOptions.layer = 'new modal'
    }
  })
  ```

  When changing render options for a [preloaded link](/preloading), consider making the
  same change for `up:link:preload` so the [preload request](/preloading#preload-request-behavior) sends the same [HTTP headers](/up.protocol).

  In the example above we want to ensure a `X-Up-Mode: modal` header to be sent, so we modify
  both events:

  ```js
  up.on('up:link:follow up:link:preload', function(event, link) {
    if (link.closest('form')) {
      event.renderOptions.layer = 'new modal'
    }
  })
  ```

  @event up:link:follow
  @param {Element} event.target
    The link element that will be followed.
  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the coming fragment update.

    Listeners may inspect and modify these options. It is recommended to
    change render options for `up:link:preload` in the same way.
  @param event.preventDefault()
    Prevents the link from being followed.
  @stable
  */

  /*-
  [Preloads](/preloading) a `GET` link.

  When the link is clicked later, the response will already be [cached](/caching),
  making the interaction feel instant.

  You may use this function to [programmatically populate the cache](/preloading#scripted)
  with pages the user is likely to click or requires
  [accessible while offline](/network-issues#offline-cache).

  [Preloading links](/preloading){:.article-ref}

  @function up.link.preload

  @section General
    @param {string|Element|jQuery} link
      The element or selector whose destination should be preloaded.

    @param {Object} [options]
      [Render options](/up.render#parameters) to apply when preloading this link.

      Most [options for `up.follow()`](/up.follow#parameters) can be used,
      but no elements will be changed while preloading.

  @section Request
    @params {string} [options.url]
      The URL to preload.

      Defaults to the link's `[href]` attribute.

    @param {Object} [options.headers]
      @like up.follow

    @param {boolean} [options.abortable=false]
      @like up.follow

    @param {boolean} [options.background=true]
      @like up.follow

  @return {Promise}
    A promise that will be fulfilled when the request was loaded and cached.

    When the link cannot be preloaded, the promise rejects with an error.
  @stable
  */
  function preload(link, options) {
    // If passed a selector, up.fragment.get() will match in the current layer.
    link = up.fragment.get(link)

    let issue = preloadIssue(link)
    if (issue) {
      return Promise.reject(new up.Error(issue))
    }

    const guardEvent = up.event.build('up:link:preload', { log: ['Preloading link %o', link] })

    return follow(link, {
      abort: false,
      abortable: false,
      background: true,
      cache: true,
      ...options,
      ...up.RenderOptions.NO_INPUT_INTERFERENCE,
      ...up.RenderOptions.NO_PREVIEWS,
      guardEvent,
      preload: true, // hint to up.Change.FromURL to stop execution after sending the request
    })
  }

  function preloadIssue(link) {
    if (!isSafe(link)) {
      return 'Will not preload an unsafe link'
    }
  }

  /*-
  This event is [emitted](/up.emit) before a link is [preloaded](/preloading).

  Listeners may prevent this event to stop the link from being preloaded,
  or [change render options](/up:link:follow#changing-render-options) for the preload request.

  [Preloading links](/preloading){:.article-ref}

  ## Example

  The following would disable preloading on slow 2G connections:

  ```js
  function isSlowConnection() {
    // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
    return navigator.connection && navigator.connection.effectiveType.include('2g')
  }

  up.on('up:link:preload', function(event) {
    if (isSlowConnection()) {
      event.preventDefault()
    }
  })
  ```

  @event up:link:preload
  @param {Element} event.target
    The link element that will be preloaded.
  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the preloading.

    Listeners may inspect or [modify](/up:link:follow#changing-render-options) these options.
  @param event.preventDefault()
    Prevents the link from being preloaded.
  @stable
  */

  /*-
  Returns the HTTP method that Unpoly will be use when [following](/up-follow) the given link.

  Looks at the link's `[up-method]` or `[data-method]` attributes. Defaults to `"get"`.

  @function up.link.followMethod
  @param {Element} link
    The link from which to evaluate the method.
  @param {string} options.method
    A value to override the value parsed from the attribute.
  @return {string}
    The HTTP method.
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
  - `[up-transition]`
  - `[up-preload]`
  - `[up-content]`
  - `[up-fragment]`
  - `[up-document]`

  To make additional elements followable, see `up.link.config.followSelectors`.

  @function up.link.isFollowable
  @param {Element|jQuery|string} link
    The link to test.
  @return {boolean}
    Whether Unpoly will handle the given link.
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
  will receive an `[up-follow]` attribute.

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

  function makeClickable(element) {
    // We default to a button role, except if the element looks link-ish
    let role = element.matches('a, [up-follow]') ? 'link' : 'button'

    // We set some defaults for interactivity and A11y, but preserve any existing attributes set by the user.
    e.setMissingAttrs(element, {
      tabindex: '0',     // Make them part of the natural tab order
      role,              // Make screen readers pronounce "button" or "link"
      'up-clickable': '' // Get pointer pointer from link.css
    })

    element.addEventListener('keydown', function(event) {
      // (1) Buttons are expected to be triggered using the Space or Enter key
      // (2) Links are expected to be triggered using the Enter key
      // (3) We use the element's current role (instead of the `role` variable above)
      //     to honor any custom [role] attribute set by the user.
      if ((event.key === 'Enter') || (element.role === 'button' && event.key === 'Space')) {
        return forkEventAsUpClick(event)
      }
    })
  }

  /*-
  Enables [keyboard interaction and other accessibility behaviors](/faux-interactive-elements#accessibility)
  for non-interactive elements that represent clickable buttons.

  It's up to you make the element appear interactive visually, e.g. by assigning a `.button` class from your design system.

  [Clicking on non-interactive elements](/faux-interactive-elements){:.article-ref}

  ## Example

  Add the `[up-clickable]` attribute to a non-interactive element, like a `<span>`:

  ```html
  <span id="faux-button" up-clickable>Click me</span> <!-- mark-phrase: up-clickable -->
  ```

  To react the element's effect when activated, handle the `up:click` event:

  ```js
  let button = document.querySelector('#faux-button')

  button.addEventListener('up:click', function(event) {
    console.log('Click on faux button!')
  })
  ```

  ## Act on press

  To activate the element on `mousedown` instead of `click`, also set an `[up-instant]` attribute:

    ```html
  <span id="faux-button" up-clickable up-instant>Click me</span> <!-- mark-phrase: up-instant -->
  ```

  ## Unobtrusive use

  To make elements clickable without an explicit `[up-clickable]` attribute, configure `up.link.config.clickableSelectors`:

  ```js
  up.link.config.clickableSelectors.push('.button')
  ```

  Any matching element will now gain [keyboard interaction and other accessibility behaviors](/faux-interactive-elements#accessibility):

  ```html
  <span class="button">I can be used with the keyboard</span>
  ```

  @selector [up-clickable]
  @param [up-instant]
    Whether this element is activated on `mousedown` instead of waiting for `click`.
  @experimental
  */
  up.macro(config.selectorFn('clickableSelectors'), makeClickable)

  // function willJump(link) {
  //   let [linkBase, linkHash] = splitLocation(u.normalizeURL(link))
  //   let verbatimHREF = link.getAttribute('href')
  // }

  function shouldFollowEvent(event, link) {
    // Users may configure up.link.config.followSelectors.push('a')
    // and then opt out individual links with [up-follow=false].
    if (event.defaultPrevented) {
      return false
    }

    // If user clicked on a child link of $link, or in an <input> within an [up-expand][up-href]
    // we want those other elements handle the click.
    const betterTargetSelector = `a, [up-follow], ${up.form.fieldSelector()}`
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
  - It is not emitted if the user clicks with a non-first mouse button.
  - It is not emitted it the user holds a modifier key when clicking.

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
      if (up.event.isModified(event)) {
        return
      }

      // (1) Instant links should not have a `click` event.
      //     This would trigger the browsers default follow-behavior and possibly activate JS libs.
      // (2) A11Y: We also need to check whether the [up-instant] behavior did trigger on mousedown.
      //     Keyboard navigation will not necessarily trigger a mousedown event.
      if (isInstant(element) && lastInstantTarget === element) {
        up.event.halt(event)

      // In case mousedown has created a layer over the click coordinates,
      // Chrome will emit an event with { target: document.body } on click.
      // Ignore that event and only process if we would still hit the
      // expect layers at the click coordinates.
      } else if (up.event.inputDevice === 'key' || up.event.isSyntheticClick(event) || (layer.wasHitByMouseEvent(event) && !didUserDragAway(event))) {
        // Event is a `PointerEvent` with an { pointerType } property.
        // Its values are 'mouse', 'pen', 'touch' or '' (unknown, meaning synthetic or keyboard).
        forkEventAsUpClick(event)
      }

      // In case the user switches input modes.
      lastMousedownTarget = null
      lastInstantTarget = null
    })

    layer.on('touchstart', { passive: true }, function(event, element) {
      // Remember for isLongPressPossible() on mousedown
      lastTouchstartTarget = element
    })

    layer.on('mousedown', function(event, element) {
      // We never handle events for the right mouse button,
      // or when Shift/CTRL/Meta/ALT is pressed
      if (up.event.isModified(event)) {
        return
      }

      // Remember for the didUserDragAway() test on click
      lastMousedownTarget = element

      // (1) Instant links emit up:click on mousedown
      // (2) On touch devices we never act on mousedown as the user may be long-pressing to open the context menu
      if (isInstant(element) && !isLongPressPossible(event)) {
        // Remember that we already emitted an event so we don't do it again on click
        lastInstantTarget = element

        // A11Y: Keyboard navigation will not necessarily trigger a mousedown event.
        // We also don't want to listen to the enter key, since some screen readers
        // use the enter key for something else.
        forkEventAsUpClick(event)
      }

      // (1) Now that we tested isLongPressPossible() we can reset the last touchstart target for the next press
      // (2) Do it here rather than on click because, when long pressing opens the menu, there won't be a click
      lastTouchstartTarget = null
    })
  }

  function isLongPressPossible(mousedownEvent) {
    let mousedownTarget = mousedownEvent.target
    return (lastTouchstartTarget === mousedownTarget) && mousedownTarget.closest('[href]')
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
  A `click` event that honors the `[up-instant]` attribute.

  This event is generally emitted when an element is clicked. However, for elements
  with an `[up-instant]` attribute this event is emitted on `mousedown` instead.

  This is useful to listen to links being activated, without needing to know whether
  a link is `[up-instant]`.

  ## Example

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

  ## Cancellation

  You may cancel an `up:click` event using `event.preventDefault()`.

  Canceling `up:click` on a hyperlink will prevent any Unpoly from [following](/up-follow) that link.

  The underlying `click` or `mousedown` event will also be canceled.

  ## Accessibility

  If the user activates an element using their keyboard, the `up:click` event will be emitted
  when the key is pressed even if the element has an `[up-instant]` attribute.

  ## Only unmodified clicks are considered

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

  You can configure links to use unsafe methods like `POST` or `DELETE` by setting an [`[up-method]`](/up-follow#up-method) attribute.

  @function up.link.isSafe
  @param {Element} link
    The link to test.
  @return {boolean}
    Whether the link will be followed using a safe HTTP method.
  @stable
  */
  function isSafe(link) {
    const method = followMethod(link)
    return up.network.isSafeMethod(method)
  }

  function onLoadCondition(condition, link, callback) {
    switch (condition) {
      case 'insert':
        callback()
        break
      case 'reveal': {
        let margin = e.numberAttr(link, 'up-intersect-margin')
        up.fragment.onFirstIntersect(link, callback, { margin })
        break
      }
      case 'hover':
        new up.LinkFollowIntent(link, callback)
        break
      case 'manual':
        // Wait for explicit call of up.deferred.load().
        break
    }
  }

  /*-
  Loads a [`[up-defer="manual"]`](/up-defer) placeholder.

  [Custom timing for lazy-loaded content](/lazy-loading#scripted){:.article-ref}

  @function up.deferred.load

  @section General
    @param {Element} placeholder
      The `[up-defer]` placeholder to load.

    @param {Object} [options]
      [Render options](/up.render#parameters) that should be used for loading the placeholder.

      Unpoly will parse render options from the given placeholder's attributes.
      You may pass this additional `options` object to [supplement or override](/attributes-and-options#options)
      options parsed from the placeholder attributes. See `[up-follow]` for a list of supported attributes.

      Common options are documented below, but most [options for `up.follow()`](/up.follow#parameters) may be used.

  @section Targeting
    @param {string} [options.target=':origin']
      @like [up-defer]/up-target

  @section Request
    @param [options.url]
      The URL from which to load the deferred content.

      Defaults to the placeholder's [`[up-href]`](/up-defer#up-href) or `[href]` attribute.

      @like up.follow

    @param [options.headers]
      @like up.follow

    @param {boolean} [options.background=false]
      @like [up-defer]/up-background

  @section Caching
    @mix up.render/caching

  @return {up.RenderJob}
    A promise that fulfills with an `up.RenderResult` once the deferred content
    has been loaded and rendered.

  @experimental
  */
  function loadDeferred(link, options) {
    let guardEvent = up.event.build('up:deferred:load', { log: ['Loading deferred %o', link] })

    // These options override up.link.follow() behavior
    let forcedOptions = {
      navigate: false,
      guardEvent,
      ...options,
    }

    // These defaults can be overridden using [up-...] attributes.
    let defaults = {
      target: ':origin',
      cache: 'auto',
      revalidate: 'auto',
      feedback: true,
    }

    return follow(link, forcedOptions, { defaults })
  }

  /*-
  This event is emitted before an `[up-defer]` placeholder loads its deferred content.

  The event can be [prevented](#event.preventDefault) to stop the network request.
  The loading will not be attempted again, but you can use `up.deferred.load()` to manually load afterwards.

  [Lazy loading content](/lazy-loading){:.article-ref}

  @event up:deferred:load
  @param {Element} event.target
    The `[up-defer]` placeholder that is about to load its content.
  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the coming fragment update.

    Listeners may inspect and modify these options.
  @param event.preventDefault()
    Prevents the deferred content from being loaded.
  @experimental
  */

  /*-
  A placeholder for content that is loaded later from another URL.

  By moving expensive but non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments into partials,
  you can paint critical content earlier.

  [Lazy loading content](/lazy-loading){:.article-ref}

  ## Example

  @include defer-example

  @selector [up-defer]

  @params-note
    All modifying attributes for `[up-follow]` may also be used.

  @section Timing
    @param [up-defer='insert']
      When to load and render the deferred content.

      When set to `'insert'` (the default), the deferred content will load immediatedly when
      the `[up-defer]` element is inserted into the DOM.

      When set to `'reveal'`, the deferred content will load when the `[up-defer]` placeholder is scrolled
      into the [viewport](/up-viewport). If the element is already visible when
      inserted, loading will start immediately.  Also see [loading as the placeholder becomes visible](/lazy-loading#on-reveal).

      When set to `'manual'` the deferred content will not load on its own.
      You can control the load timing by calling `up.deferred.load()` from your own JavaScripts.

    @param [up-intersect-margin='0']
      With `[up-defer=reveal]`, this enlarges the viewport by the given number of pixels before
      computing the intersection.

      A positive number will load the deferred content some pixels before it becomes visible.

      A negative number will require the user to scroll some pixels into the element before it is loaded.

      @experimental

  @section Targeting
    @param [up-target=':origin']
      A selector for the fragment to render the content in.

      By default the `[up-defer]` element itself will be replaced with the loaded content.
      For this the element must have a [derivable target selector](/target-derivation).

      You may target one or [multiple](/targeting-fragments#multiple) fragments.
      To target the placeholder itself, you can use `:origin` target instead of spelling out a selector.

  @section Request
    @param [up-href]
      The URL from which to load the deferred content.

      If your `[up-defer]` placeholder is a [standard hyperlink](/lazy-loading#seo), you can use an `[href]` attribute instead.

    @param [up-headers]
      A [relaxed JSON](/relaxed-json) object with additional request headers.

    @param [up-background='false']
      Whether to load the deferred content [in the background](/up.render#options.background).

      Background requests will not show the [global progress bar](/progress-bar).

  @section Caching
    @mix up-follow/caching

  @experimental
  */
  up.attribute('up-defer', { defaultValue: 'insert' }, function(link, condition) {
    let doLoad = (options) => up.error.muteUncriticalRejection(loadDeferred(link, options))
    onLoadCondition(condition, link, doLoad)
  })

  /*-
  [Follows](/up.follow) this link with JavaScript and updates a fragment with the server response.

  Following a link is considered [navigation](/navigation) by default.

  ## Example

  This link will update the fragment `<div class="content">` with the same element
  fetched from `/posts/5`:

  ```html
  <a href="/posts/5" up-follow up-target=".content">Read post</a>
  ```

  If no `[up-target]` attribute is set, the [main target](/up-main) is updated.

  ## Following all links automatically

  You can configure Unpoly to follow *all* links on a page without requiring an `[up-follow]` attribute.

  See [Handling all links and forms](/handling-everything).

  ## Preventing Unpoly from following links

  You can tell Unpoly to ignore clicks on an `[up-follow]` link, causing the link to be non-interactive.
  Use one of the following methods:

  - Prevent the `up:link:follow` event on the link element
  - Prevent the `up:click` event on the link element

  To force a [full page load](/up.network.loadPage) when a followable link is clicked:

  - Set an [`[up-follow=false]`](/attributes-and-options#boolean-attributes) attribute on the link element
  - Prevent the `up:link:follow` event and call `up.network.loadPage(event.renderOptions)`.

  ## Making non-interactive elements act as hyperlinks

  You can set an `[up-follow]` attribute on any non-interactive element to make it behave like a hyperlink:

  ```html
  <span up-follow up-href="/details">Read more</span>
  ```

  See [Acting like a hyperlink](/faux-interactive-elements) for details.

  ## Advanced fragment changes

  Links can update multiple fragments or append content to an existing element.

  See [Fragment placement](/targeting-fragments) for details.

  ## Short notation

  You may omit the `[up-follow]` attribute if the link has one of the following attributes:

  - `[up-target]`
  - `[up-layer]`
  - `[up-transition]`
  - `[up-content]`
  - `[up-fragment]`
  - `[up-document]`

  Such a link will still be followed through Unpoly.

  @selector [up-follow]

  @section Targeting
    @mix up-follow/targeting

  @section Navigation
    @mix up-follow/navigation

  @section Request
    @mix up-follow/request

  @section Local content
    @mix up-follow/local-content

  @section Layer
    @mix up-follow/layer

  @section History
    @mix up-follow/history

  @section Animation
    @mix up-follow/motion

  @section Caching
    @mix up-follow/caching

  @section Scrolling
    @mix up-follow/scrolling

  @section Focus
    @mix up-follow/focus

  @section Loading state
    @mix up-follow/loading-state

  @section Failed responses
    @mix up-follow/failed-responses

  @section Client state
    @mix up-follow/client-state

  @section Lifecycle hooks
    @mix up-follow/lifecycle-hooks

  @stable
  */
  up.on('up:click', config.selectorFn('followSelectors'), function(event, link) {
    if (shouldFollowEvent(event, link)) {
      up.event.halt(event, { log: true })

      // When the user clicks an hyperlink, the browser will focus the link element on `click`.
      // However, for an `[up-instant]` link we will emit `up:click` on `mousedown` and halt the `click` event.
      // Without a `click` event the browser won't focus the link.
      //
      // This also has an unfortunate effect on `input[up-validate]`:
      //
      // - User types into a text field
      // - With focus still on the text field, the user clicks on an `[up-instant]`.
      // - The link is being followed, causing a request for the new fragment.
      // - When the response is received, Unpoly will update the targeted fragment.
      // - This causes the text field (probably being replaced) from losing focus, causing a `change` event,
      //   triggering `[up-validate]` and another server request for the validation.
      // - The link request is probably `{ abort: true }`, but since it happened *before* the
      //   validation request there was nothing to abort.
      // - When the validation response is received, the text field is probably gone, causing error.
      //
      // To preserve behavioral symmetry to standard links, we manually focus the link when it was activated
      // on `mousedown`.
      up.focus(link, { preventScroll: true })

      up.error.muteUncriticalRejection(follow(link))
    }
  })

  /*-
  Activates this link-like element on `mousedown` instead of `click` ("Act on press").

  For links with `[up-follow]` this will save some time that would otherwise be spent
  on waiting for the user to release the mouse button. Since an AJAX request will be triggered right way,
  the interaction will appear faster.

  For [faux-interactive elements](/faux-interactive-elements) setting `[up-instant]` will cause
  the `up:click` event to be emitted on `mousedown` instead of `click`.

  To apply the instant effect without changing your HTML, configure `up.link.config.instantSelectors`.

  ## Example

  ```html
  <a href="/users" up-follow up-instant>User list</a> <!-- mark-phrase: up-instant -->
  ```

  ## Accessibility

  Links or [faux-interactive elements](/faux-interactive-elements) with `[up-instant]`
  can still be activated with the keyboard.

  With `[up-instant]` users can no longer cancel a click by dragging the pressed mouse away from the elements.
  However, for navigation actions this isn't required. E.g. many operation systems switch tabs on `mousedown`
  instead of `click`.

  @selector [up-instant]
  @stable
  */

  /*-
  Enlarges the click area of a descendant link.

  `[up-expand]` honors all the Unppoly attributes in expanded links, like
  [`[up-target]`](/up-follow#up-target), `[up-instant]` or `[up-preload]`.

  ## Example

  ```html
  <div class="notification" up-expand>
    Record was saved!
    <a href="/records">Close</a>
  </div>
  ```

  In the example above, clicking anywhere within `.notification` element
  would [follow](/up.follow) the *Close* link.

  ## Elements with multiple contained links

  If a container contains more than one link, you can set the value of the
  `[up-expand]` attribute to a CSS selector to define which link should be expanded:

  ```html
  <div class="notification" up-expand=".close">
    Record was saved!
    <a class="details" href="/records/5">Details</a>
    <a class="close" href="/records">Close</a>
  </div>
  ```

  ## Limitations

  `[up-expand]` has some limitations for advanced browser users:

  - Users won't be able to right-click the expanded area to open a context menu
  - Users won't be able to `CTRL`+click the expanded area to open a new tab

  To overcome these limitations, consider nesting the entire clickable area in an actual `<a>` tag.
  [It's OK to put block elements inside an anchor tag](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).

  @selector [up-expand]
  @params-note
    All attributes of the descendant link will also be applied to the enlarged
    click area.
  @param [up-expand]
    A CSS selector that defines which containing link should be expanded.

    If omitted, the first link in this element will be expanded.
  @stable
  */
  up.attribute('up-expand', { defaultValue: 'a, [up-href]', macro: true }, function(area, childLinkSelector) {
    let childLink = e.get(area, childLinkSelector)
    if (childLink) {
      e.setMissingAttrs(area, {
        'up-href': e.attr(childLink, 'href'),
        ...e.upAttrs(childLink)
      })

      // This is our current workaround for expanded areas gaining an .up-current class from the contained link.
      e.addClasses(area, e.upClasses(childLink))

      makeFollowable(area)
      // A11y: We could also consider making the area clickable, via makeClickable().
      // However, since the original link is already present within the area,
      // we would not add accessibility benefits. We might also confuse screen readers
      // with a nested link.
    }
  })

  /*-
  [Preloads](/preloading) this link before the user clicks it.
  When the link is clicked, the response will already be [cached](/caching),
  making the interaction feel instant.

  Unpoly will only preload [links with safe methods](/up.link.isSafe). The `[up-preload]` attribute
  has no effect on unsafe links.

  Links with the `[up-preload]` attribute are always [followed by Unpoly](/up-follow) and will not make a full page load.

  [Preloading links](/preloading){:.article-ref}

  ### Example

  ```html
  <a href="/path" up-preload>Hover over me to preload my content</a>
  ```

  @selector [up-preload]
  @params-note
    All modifying attributes for `[up-follow]` may also be used.
  @section Timing
    @param [up-preload='hover']
      When to preload this link.

      When set to `'hover'` (the default), preloading will start when the user hovers
      over this link [for a while](#up-preload-delay). On touch devices preloading will
      begin when the user places her finger on the link. Also see [preloading on hover](/preloading#on-hover).

      When set to `'insert'`, preloading will start immediately when this
      link is inserted into the DOM. Also see [eagerly preloading on insertion](/preloading#on-insert).

      When set to `'reveal'`, preloading will start when the link is scrolled
      into the [viewport](/up-viewport). If the link is already visible when
      inserted, preloading will start immediately.  Also see [preloading when a link becomes visible](/preloading#on-reveal).

      When set to `'false'`, the link will not be preloaded.
      You can still preload this link programmatically using `up.link.preload()`.

    @param [up-preload-delay]
      [`[up-preload="hover"]`](#up-preload), this requires the user to hover
      for the given number of milliseconds before the link is preloaded.

      Defaults to `up.link.config.preloadDelay`.

    @param [up-intersect-margin='0']
      With `[up-preload=reveal]`, this enlarges the viewport by the given number of pixels before
      computing the intersection.

      A positive number will load the deferred content some pixels before it becomes visible.

      A negative number will require the user to scroll some pixels into the element before it is loaded.

      @experimental
  @section Request
    @param href
      The URL to preload.
    @param [up-headers]
      @like [up-follow]
    @param [up-background='true']
      @like [up-follow]
    @param [up-abortable='false']
      @like [up-follow]
  @stable
  */
  up.compiler(config.selectorFn('preloadSelectors'), function(link) {
    if (!isPreloadDisabled(link)) {
      let doPreload = (options) => up.error.muteUncriticalRejection(preload(link, options))
      // We need to map several cases here:
      //
      // (1) <a up-preload>              => 'hover'
      // (2) <a up-preload="">           => 'hover'
      // (3) <a up-preload="true">       => 'hover'
      // (4) <a up-preload="up-preload"> => 'hover'
      // (5) <a up-preload="insert">     => 'insert
      // (6) <a up-preload="false">      => do nothing (already excluded by config.noPreloadSelectors)
      // (7) <a>                         => only do something if we have it in config.preloadSelectors
      let condition = e.booleanOrStringAttr(link, 'up-preload')
      if (condition === true || u.isUndefined(condition)) condition = 'hover'
      onLoadCondition(condition, link, doPreload)
    }
  })

  up.on('up:framework:reset', reset)

  return {
    follow,
    followOptions,
    requestOptions: parseRequestOptions,
    preload,
    makeFollowable,
    isSafe,
    isFollowable,
    shouldFollowEvent,
    convertClicks,
    config,
    loadDeferred,
  }
})()

up.follow = up.link.follow
up.deferred = { load: up.link.loadDeferred }
