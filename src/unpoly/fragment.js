require('./fragment.sass')

const u = up.util
const e = up.element

/*-
Fragment API
===========

The `up.fragment` module offers a high-level JavaScript API to work with DOM elements.

A fragment is an element with some additional properties that are useful in the context of
a server-rendered web application:

- Fragments are [identified by a CSS selector](/target-derivation), like a `.class` or `#id`.
- Fragments are usually updated by a [link](/a-up-follow) for [form](/form-up-submit) that targets their selector.
  When the server renders HTML with a matching element, the fragment is swapped with a new version.
- As fragments enter the page they are automatically [compiled](/up.compiler) to activate [JavaScript behavior](/up.script).
- Fragment changes may be [animated](/up.motion).
- Fragments are placed on a [layer](/up.layer) that is isolated from other layers.
  Unpoly features will only see or change fragments from the [current layer](/up.layer.current)
  unless you [explicitly target another layer](/layer-option).
- Fragments [know the URL from where they were loaded](/up.fragment.source).
  They can be [reloaded](/up.reload) or [polled periodically](/up-poll).

For low-level DOM utilities that complement the browser's native API, see `up.element`.

@see navigation
@see render-content
@see render-hooks
@see skipping-rendering
@see target-derivation

@see up.render
@see up.navigate
@see up.destroy
@see up.reload
@see up.fragment.get

@module up.fragment
*/
up.fragment = (function() {

  function upTagName(element) {
    let tagName = e.tagName(element)
    if (tagName.startsWith('up-')) {
      return tagName
    }
  }

  /*-
  Configures defaults for fragment updates.

  @property up.fragment.config

  @param {Array<string>} [config.mainTargets=['[up-main]', 'main', ':layer']]
    An array of CSS selectors matching default [render targets](/targeting-fragments).

    When no explicit target is given, Unpoly will update the first selector matching both
    the current page and the server response.

    When [navigating](/navigation) to a main target, Unpoly will automatically
    [reset scroll positions](/scrolling#automatic-scrolling-logic) and
    [update the browser history](/updating-history).

    This property is aliased as [`up.layer.config.any.mainTargets`](/up.layer.config#config.any.mainTargets).

    Also see [targeting the main element](/targeting-fragments#targeting-the-main-element).

  @param {Array<string|Function<Element>: string|undefined>} [config.targetDerivers]
    An array of [target derivation patterns](/target-derivation#derivation-patterns)
    used to [guess a target selector](/target-derivation) for an element.

    For instance, a pattern pattern `'a[href]'` is applicable to all `<a href="...">` elements.
    It produces a target like `a[href="/users"]`.

    If your deriver can't be expressed in a pattern string, you may also add a function that
    accepts an `Element` and returns a target selector, if applicable. If the function
    is not applicable it may return `undefined`. In that case the next pattern will be tried.

  @param {Array<string|RegExp>} [config.badTargetClasses]
    An array of class names that should be ignored when
    [deriving a target selector from a fragment](/target-derivation).

    The class names may also be passed as a regular expression.

  @param {boolean} [config.verifyDerivedTarget=true]
    Whether [derived targets](/target-derivation) must match the element to be applicable.

    When verification is disabled, the first applicable [derivation pattern](/target-derivation#derivation-patterns)
    will be used, even if the produced target would match another element on the page.

    Also see [Derived target verification](/target-derivation#derived-target-verification).

  @param {Object} [config.navigateOptions]
    An object of default options to apply when [navigating](/navigation).

  @param {boolean} [config.matchAroundOrigin]
    Whether to match an existing fragment around the triggered link.

    If set to `false` Unpoly will replace the first fragment
    matching the given target selector in the link's [layer](/up.layer).

  @param {Array<string>} [config.autoHistoryTargets]
    When an updated fragments contain an element matching one of the given [target selectors](/targeting-fragments),
    history will be updated with `{ history: 'auto' }`.

    By default Unpoly will auto-update history when updating a [main target](#config.mainTargets).

  @param {boolean|string|Function(Element)} [config.autoScroll]
    How to scroll after updating a fragment with `{ scroll: 'auto' }`.

    See [Scrolling](/scrolling) for a list of allowed values.

    The default configuration tries, in this order:

    - If the URL has a `#hash`, scroll to the hash.
    - If updating a [main target](/up-main), reset scroll positions.

  @param {boolean|string|Function(Element)} [config.autoFocus]
    How to focus when updating a fragment with `{ focus: 'auto' }`.

    See [Controlling focus](/focus) for a list of allowed values.

    The default configuration tries the following strategies, in this order:

    - Focus a `#hash` in the URL.
    - Focus an `[autofocus]` element in the new fragment.
    - If updating a [main target](/up-main), focus the new fragment.
    - If focus was lost with the old fragment, re-focus a [similar](/target-derivation) element.
    - If focus was lost with the old fragment, focus the new fragment.

  @param {boolean} [config.runScripts=true]
    Whether to execute `<script>` tags in updated fragments.

    Scripts will load asynchronously, with no guarantee of execution order.

    Note that the `<body>` element is a default
    [main target](/main. If you are including your global application scripts
    at the end of your `<body>` for performance reasons, swapping the `<body>` will re-execute
    these scripts. In that case you can [configure a different main target](/up.fragment.config#config.mainTargets)
    or [move your scripts to the `<head>` with a `[defer]` attribute](https://makandracards.com/makandra/504104-you-should-probably-load-your-javascript-with-script-defer),
    which is even better for performance.

  @param {boolean|Function(up.Response): boolean} [config.autoRevalidate]
    Whether to reload a fragment after it was rendered from a cached response with `{ revalidate: 'auto' }`.

    By default Unpoly verifies cached responses that are older than `up.fragment.config.expireAge`:

    ```js
    up.fragment.config.autoRevalidate = (response) => response.expired
    ```

    You can exempt server paths from being auto-revalidated like this:

    ```js
    up.fragment.config.autoRevalidate = (response) => response.expired && response.url != '/dashboard'
    ```

  @param {Function(Object): boolean} [config.skipResponse]
    When to finishes a render pass without changes,
    usually to [not re-insert identical content](/skipping-rendering).

    The configured function accepts an object with the same properties
    as an `up:fragment:loaded` event.

    By default Unpoly skips the following responses:

    - Responses without text in their body.
      Such responses occur when a [conditional request](/conditional-requests)
      in answered with HTTP status `304 Not Modified` or `204 No Content`.
    - When [revalidating](/caching#revalidation), if the expired response and fresh response
      have the exact same text.

    You may also skip responses by calling `event.skip()` on an `up:fragment:loaded` event.

    @experimental

  @stable
  */
  const config = new up.Config(() => ({
    badTargetClasses: [/^up-/],

    targetDerivers: [
      '[up-id]',
      '[id]',
      'html',
      'head',
      'body',
      'main',
      '[up-main]',
      upTagName,
      'link[rel][type]',
      'link[rel=preload][href]',
      'link[rel=preconnect][href]',
      'link[rel=prefetch][href]',
      'link[rel]',
      'meta[property]',
      '*[name]',
      'form[action]',
      'a[href]',
      '[class]',
      'form',
    ],

    verifyDerivedTarget: true,

    // These defaults will be set to both success and fail options
    // if { navigate: true } is given.
    navigateOptions: {
      cache: 'auto',
      revalidate: 'auto',
      feedback: true,
      fallback: true,
      focus: 'auto',
      scroll: 'auto',
      history: 'auto',
      peel: true,
    },

    matchAroundOrigin: true,
    runScripts: true,
    autoHistoryTargets: [':main'],
    autoFocus: ['hash', 'autofocus', 'main-if-main', 'keep', 'target-if-lost'],
    autoScroll: ['hash', 'layer-if-main'],
    autoRevalidate: (response) => response.expired,
    skipResponse: defaultSkipResponse
  }))

  // Users who are not using layers will prefer settings default targets
  // as up.fragment.config.mainTargets instead of up.layer.config.any.mainTargets.
  u.delegate(config, ['mainTargets'], () => up.layer.config.any)

  function reset() {
    config.reset()
  }

  function defaultSkipResponse({ response, expiredResponse }) {
    return !response.text || response.text === expiredResponse?.text
  }

  /*-
  Returns the URL the given element was retrieved from.

  If the given element was never directly updated, but part of a larger fragment update,
  the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) known source of an ancestor element is returned.

  ### Example

  In the HTML below, the element `#one` was loaded from the URL `/foo`:

  ```html
  <div id="one" up-source"/foo">
  <div id="two">...</div>
  </div>
  ```

  We can now ask for the source of an element:

  ```javascript
  up.fragment.source('#two') // returns '/foo'
  ```

  @function up.fragment.source
  @param {Element|string} element
    The element or CSS selector for which to look up the source URL.
  @return {string|undefined}
  @stable
  */
  function sourceOf(element, options = {}) {
    element = getSmart(element, options)
    return e.closestAttr(element, 'up-source')
  }

  /*-
  Returns the last modification time of the content in the given element.

  The last modification time corresponds to the `Last-Modified` header in the response that
  rendered the fragment. Alternatively the `[up-time]` attribute of the element or an ancestor is used.

  When the fragment is reloaded,
  its modification time is sent as an `If-Modified-Since` request header. The server may check the header and decide to [skip rendering](/skipping-rendering).
  See [Conditional requests](/conditional-requests) for a full example.

  @function up.fragment.time
  @param {Element} element
  @return {Date|undefined}
    The fragment's last modification time.

    Return `undefined` if the fragment was rendered without a modification time.
  @experimental
  */
  function timeOf(element) {
    let value = e.closestAttr(element, 'up-time')
    if (value && value !== 'false') {
      // We support both Unix timestamps (e.g. "1445412480")
      // and RFC 1123 times (e.g. "Wed, 21 Oct 2015 07:28:00 GMT").
      if (/^\d+$/.test(value)) {
       value = Number(value) * 1000
      }
      return new Date(value)
    }
  }

  /*-
  Sets the time when the fragment's underlying data was last changed.

  When the fragment is reloaded,
  its known modification time is sent as an `If-Modified-Since` request header.
  The server may check the header and decide to [skip rendering](/skipping-rendering).
  See [Conditional requests](/conditional-requests) for a full example.

  ### How `[up-etag]` attributes are set

  Unpoly will automatically set an `[up-time]` attribute when a fragment was rendered
  from a response with a `Last-Modified` header. When a fragment was rendered without such a header,
  Unpoly will set `[up-time=false]` to indicate that its modification time is unknown.

  A large response may contain multiple fragments that are later reloaded individually
  and should each have their own modification time. In this case the server may also also render multiple
  fragments with each their own `[up-time]` attribute.
  See [Individual versions per fragment](/conditional-requests#fragment-versions) for an example.

  @selector [up-time]
  @param {string} up-time
    The time when the element's underlying data was last changed.

    The value can either be a Unix timestamp (e.g. `"1445412480"`)
    or an [RFC 1123](https://www.rfc-editor.org/rfc/rfc1123) time (e.g. `Wed, 21 Oct 2015 07:28:00 GMT`).

    You can also set the value to `"false"` to prevent a `If-Modified-Since` request header
    when reloading this fragment.
  @experimental
  */

  /*-
  Returns the [ETag](https://en.wikipedia.org/wiki/HTTP_ETag) of the content in the given element.

  The ETag corresponds to the [`ETag` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
  in the response that rendered the fragment. Alternatively the `[up-etag]` attribute of the element
  or an ancestor is used.

  When the fragment is reloaded,
  its ETag is sent as an `If-None-Match` request header. The server may check the header and decide to [skip rendering](/skipping-rendering).
  See [Conditional requests](/conditional-requests) for a full example.

  @function up.fragment.etag
  @param {Element} element
  @return {string|undefined}
    The fragment's ETag.

    Return `undefined` if the fragment was rendered without an ETag.
  @experimental
  */
  function etagOf(element) {
    let value = e.closestAttr(element, 'up-etag')
    if (value && value !== 'false') {
      return value
    }
  }

  /*-
  Sets an [ETag](https://en.wikipedia.org/wiki/HTTP_ETag) for the fragment's underlying data.

  ETags can be used to skip unnecessary rendering of unchanged content.\
  See [Conditional requests](/conditional-requests) for a full example.

  ### How `[up-etag]` attributes are set

  Unpoly will automatically set an `[up-etag]` attribute when a fragment was rendered
  from a response with a `ETag` header. When a fragment was rendered without such a header,
  Unpoly will set `[up-etag=false]` to indicate that its ETag is unknown.

  A large response may contain multiple fragments that are later reloaded individually
  and should each have their own ETag. In this case the server may also also render multiple
  fragments with each their own `[up-etag]` attribute.
  See [Individual versions per fragment](/conditional-requests#fragment-versions) for an example.

  @selector [up-etag]
  @param {string} up-etag
    An ETag for the element's underlying data.

    You can also set the value to `"false"` to prevent a `If-None-Match` request header
    when reloading this fragment.
  @experimental
  */

  /*-
  Sets this element's source URL for [reloading](/up.reload) and [polling](/up-poll)

  When an element is reloaded, Unpoly will make a request from the URL
  that originally brought the element into the DOM. You may use `[up-source]` to
  use another URL instead.

  ### Example

  Assume an application layout with an unread message counter.
  You use `[up-poll]` to refresh the counter every 30 seconds.

  By default this would make a request to the URL that originally brought the
  counter element into the DOM. To save the server from rendering a lot of
  unused HTML, you may poll from a different URL like so:

  ```html
  <div class="unread-count" up-poll up-source="/unread-count">
    2 new messages
  </div>
  ```

  @selector [up-source]
  @param {string} up-source
    The URL from which to reload this element.
  @stable
  */

  /*-
  Replaces elements on the current page with matching elements from a server response or HTML string.

  ### Choosing which fragment to update

  The current and new elements must both match the same [target selector](/targeting-fragments).
  The selector is either given as `{ target }` option,
  or a [main target](/up-main) is used as default.

  Let's say your current HTML looks like this:

  ```html
  <div class="one">old one</div>
  <div class="two">old two</div>
  ```

  We now replace the second `<div>` by [targeting](/targeting-fragments) its CSS class:

  ```js
  up.render({ target: '.two', url: '/new' })
  ```

  The server renders a response for `/new`:

  ```html
  <div class="one">new one</div>
  <div class="two">new two</div>
  ```

  Unpoly looks for the selector `.two` in the response and places it
  the current page. The current page now looks like this:

  ```html
  <div class="one">old one</div>
  <div class="two">new two</div>
  ```

  Note how only `.two` has changed. The update for `.one` was
  discarded, since it didn't match the selector.

  See [targeting fragments](/targeting-fragments) for many examples for how you can target content.

  ### Passing the new fragment

  The new fragment content can be passed as one of the following options:

  @include render-content-table

  See [providing content to render](/render-content) for more details and examples.

  ### Enabling side effects

  This function has many options to enable scrolling, focus, request cancelation and other side
  effects. These options are all disabled by default and must be opted into one-by-one.

  To enable defaults that a user would expects for navigation (like clicking a link),
  pass [`{ navigate: true }`](#options.navigate) or use `up.navigate()` instead.

  ### Hooking into the render process

  Your code may hook into specific stages of the rendering process. This allows you to modify the rendered result or handle error cases.

  See [render hooks](/render-hooks) for details.

  ### Concurrency

  Unfinished requests [targeting](/targeting-fragments) the updated fragment or its descendants are [aborted](/aborting-requests).
  You may control this behavior using the [`{ abort }`](#options.abort) option.

  ### Events

  Unpoly will emit events at various stages of the rendering process:

  - `up:fragment:destroyed`
  - `up:fragment:loaded`
  - `up:fragment:inserted`

  @function up.render

  @param {string|Element|jQuery|Array<string>} [target]
    The [target selector](/targeting-fragments) to update.

    If omitted a [main target](/up-main) will be rendered.

    You may also pass a DOM element or jQuery element here, in which case a selector
    will be [derived](/target-derivation).
    The given element will also be used as [`{ origin }`](#options.origin) for the fragment update.

    You may also pass an array of selector alternatives. The first selector
    matching in both old and new content will be used.

    Instead of passing the target as the first argument, you may also pass it as
    a [´{ target }`](#options.target) option..

  @param {string|Element|jQuery|Array<string>} [options.target]
    The [target selector](/targeting-fragments) to update.

    See documentation for the [`target`](#target) parameter.

  @param {string|boolean} [options.fallback=false]
    Specifies behavior if the [target selector](/targeting-fragments) is missing from the current page or the server response.

    If set to a CSS selector string, Unpoly will attempt to replace that selector instead.

    If set to `true` Unpoly will attempt to replace a [main target](/up-main) instead.

    If set to `false` Unpoly will immediately reject the render promise.

    Also see [Dealing with missing targets](/targeting-fragments#dealing-with-missing-targets).

  @param {boolean} [options.navigate=false]
    Whether this fragment update is considered [navigation](/navigation).

  @param {string} [options.url]
    The URL to fetch from the server.

    See [loading content from a URL](/render-content#url).

    Instead of making a server request, you may also render an [existing string of HTML](/render-content#local).

  @param {string} [options.method='get']
    The HTTP method to use for the request.

    Common values are `'get'`, `'post'`, `'put'`, `'patch'` and `'delete`'.
    The value is case insensitive.

  @param {Object|up.Params|FormData|string|Array} [options.params]
    Additional [parameters](/up.Params) that should be sent as the request's
    [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

    When making a `GET` request to a URL with a query string, the given `{ params }` will be added
    to the query parameters.

  @param {Object} [options.headers={}]
    An object with additional request headers.

    Unpoly will by default send a number of custom request headers.
    E.g. the `X-Up-Target` header includes the [targeted](/targeting-fragments) CSS selector.
    See `up.protocol` for details.

  @param {string|Element} [options.content]
    The new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
    for the targeted fragment.

    See [Updating an element's inner HTML from a string](/render-content#content).

  @param {string|Element} [options.fragment]
    A string of HTML comprising only the new fragment's [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML).

    When passing `{ fragment }` you can omit the `{ target }` option.
    The target will be [derived](/target-derivation) from the root element in the given HTML.

    See [Rendering a string that only contains the fragment](/render-content#fragment).

  @param {string|Element|Document} [options.document]
    A string of HTML containing the targeted fragment.

    See [Extracting an element's outer HTML from a larger HTML string](/render-content#document).

  @param {up.Response} [options.response]
    An `up.Response` object that contains the targeted fragments in its [text](/up.Response.prototype.text).

    See [Rendering an up.Response object](/render-content#response).

  @param {boolean|Function(up.Response): boolean} [options.fail]
    Whether the server response should be considered failed.

    By [default](/up.network.config#config.fail) any HTTP status code other than 2xx or 304 is considered an error code.

    For failed responses Unpoly will use options prefixed with `fail`, e.g. `{ failTarget }`.
    See [handling server errors](/failed-responses) for details.

  @param {boolean|string} [options.history]
    Whether the browser URL, window title and meta elements will be [updated](/updating-history).

    If set to `true`, the history will always be updated, using history
    the server response, or from given `{ title }` and `{ location }` options.

    If set to `'auto'` history will be updated if the `{ target }` matches
    a selector in `up.fragment.config.autoHistoryTargets`. By default this contains all
    [main targets](/main).

    If set to `false`, the history will remain unchanged.

    @see updating-history

  @param {string} [options.title]
    An explicit document title to use after rendering.

    By default the title is extracted from the response's `<title>` tag.
    You may also pass `{ title: false }` to explicitly prevent the title from being updated.

    Note that the browser's window title will only be updated it you also
    pass a [`{ history }`](#options.history) option.

  @param {string} [options.location]
    An explicit URL to use after rendering.

    By default Unpoly will use the `{ url }` or the final URL after the server redirected.
    You may also pass `{ location: false }` to explicitly prevent the URL from being updated.

    Note that the browser's URL will only be updated it you also
    pass a [`{ history }`](#options.history) option.

  @param {string} [options.transition]
    The name of an [transition](/up.motion) to morph between the old and few fragment.

    If you are [prepending or appending content](/targeting-fragments#appending-or-prepending-content),
    use the `{ animation }` option instead.

  @param {string} [options.animation]
    The name of an [animation](/up.motion) to reveal a new fragment when
    [prepending or appending content](/targeting-fragments#appending-or-prepending-content).

    If you are replacing content (the default), use the `{ transition }` option instead.

  @param {number} [options.duration]
    The duration of the transition or animation (in millisconds).

  @param {string} [options.easing]
    The timing function that accelerates the transition or animation.

    See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    for a list of available timing functions.

  @param {boolean} [options.cache]
    Whether to read from and write to the [cache](/caching).

    With `{ cache: true }` Unpoly will try to re-use a cached response before connecting
    to the network. To prevent display of stale content, cached responses are
    [reloaded once rendered](#options.revalidate).
    If no cached response exists, Unpoly will make a request and cache
    the server response.

    With `{ cache: 'auto' }` Unpoly will use the cache only if `up.network.config.autoCache`
    returns `true` for the request.

    With `{ cache: false }` Unpoly will always make a network request.

  @param {boolean} [options.revalidate]
    Whether to reload the targeted fragment after it was rendered from a cached response.

    With `{ revalidate: 'auto' }` Unpoly will revalidate if the `up.fragment.config.autoRevalidate(response)`
    returns `true`. By default this configuration will return true for
    [expired](/up.fragment.config#config.autoRevalidate) responses.

    With `{ revalidate: true }` Unpoly will always revalidate cached content, regardless
    of its age.

    With `{ revalidate: false }` Unpoly will never revalidate cached content.

  @param {boolean|string} [options.expireCache]
    Whether existing [cache](/caching) entries will be [expired](/caching#expiration) with this request.

    Defaults to the result of `up.network.config.expireCache`, which
    defaults to `true` for [unsafe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) requests.

    To only expire some requests, pass an [URL pattern](/url-patterns) that matches requests to uncache.
    You may also pass a function that accepts an existing `up.Request` and returns a boolean value.

  @param {boolean|string} [options.evictCache]
    Whether existing [cache](/caching) entries will be [evicted](/caching#eviction) with this request.

    Defaults to the result of `up.network.config.evictCache`, which
    defaults to `false`.

    To only evict some requests, pass an [URL pattern](/url-patterns) that matches requests to uncache.
    You may also pass a function that accepts an existing `up.Request` and returns a boolean value.

  @param {boolean|string|Function(request): boolean} [options.abort='target']
    Whether to abort existing requests before rendering.

    See [aborting requests](/aborting-requests) for details and a list of options.

  @param {boolean} [options.abortable=true]
    Whether this request may be aborted by other requests [targeting](/targeting-fragments)
    the same fragments or layer.

    See [aborting requests](/aborting-requests) for details.

  @param {boolean} [options.background=false]
    Whether this request will load in the background.

    Background requests deprioritized over foreground requests.
    Background requests also won't emit `up:network:late` events and won't trigger
    the [progress bar](/loading-indicators#progress-bar).

  @param {number} [options.badResponseTime]
    The number of milliseconds after which this request can cause
    an `up:network:late` event and show the [progress bar](/loading-indicators#progress-bar).

    Defaults to `up.network.config.badResponseTime`.

    @experimental

  @param {number} [options.timeout]
    The number of milliseconds after which this request fails with a timeout.

    Defaults to `up.network.config.timeout`.

  @param {Element|jQuery} [options.origin]
    The element that triggered the change.

    When multiple elements in the current page match the `{ target }`,
    Unpoly will replace an element in the [origin's proximity](/targeting-fragments#resolving-ambiguous-selectors).

    The origin's selector will be substituted for `:origin` in a [target selector](/targeting-fragments).

  @param {string|up.Layer|Element} [options.layer='origin current']
    The [layer](/up.layer) in which to match and render the fragment.

    See [layer option](/layer-option) for a list of allowed values.

    To [open the fragment in a new overlay](/opening-overlays), pass `{ layer: 'new' }`.
    In this case options for `up.layer.open()` may also be used.

  @param {boolean} [options.peel]
    Whether to close overlays obstructing the updated layer when the fragment is updated.

    This is only relevant when updating a layer that is not the [frontmost layer](/up.layer.front).

  @param {Object} [options.context]
    An object that will be merged into the [context](/context) of the current layer once the fragment is rendered.

  @param {boolean|string|Element|Function} [options.scroll]
    How to scroll after the new fragment was rendered.

    See [scrolling](/scrolling) for a list of allowed values.

  @param {string} [options.scrollBehavior='instant']
    Whether to [animate the scroll motion](/scroll-tuning#animating-the-scroll-motion)
    when [prepending or appending](/targeting-fragments#appending-or-prepending-content) content.

  @param {number} [options.revealSnap]
    When to [snap to the top](/scroll-tuning#snapping-to-the-screen-edge)
    when scrolling to an element near the top edge of the viewport's scroll buffer.

  @param {number} [options.revealTop]
    When to [move a revealed element to the top](/scroll-tuning#moving-revealed-elements-to-the-top)
    when scrolling to an element.

  @param {string} [options.revealPadding]
    How much [space to leave to the closest viewport edge](/scroll-tuning#revealing-with-padding)
    when scrolling to an element.

  @param {string} [options.revealMax]
    How many pixel lines of [high element to reveal](/scroll-tuning#revealing-with-padding) when scrolling to an element.

  @param {boolean} [options.saveScroll=true]
    Whether to [save scroll positions](/up.viewport.saveScroll) before updating the fragment.

    Saved scroll positions can later be restored with [`{ scroll: 'restore' }`](/scrolling#restoring-scroll-positions).

  @param {boolean|string|Element|Function} [options.focus]
    What to focus after the new fragment was rendered.

    See [Controlling focus](/focus) for a list of allowed values.

  @param {boolean} [options.saveFocus=true]
    Whether to [save focus-related state](/up.viewport.saveFocus) before updating the fragment.

    Saved focus state can later be restored with [`{ focus: 'restore' }`](/focus#restoring-focus).

  @param {string} [options.confirm]
    A message the user needs to confirm before fragments are updated.

    The message will be shown as a [native browser prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt).

    If the user does not confirm the render promise will reject and no fragments will be updated.

  @param {boolean|Element} [options.feedback]
    Whether to give the [`{ origin }`](#options.origin) element an `.up-active` class
    and the targeted element an `.up-loading` class
    while loading content.

    See [navigation feedback](/up.feedback).

  @param {Object} [options.data]
    Overrides properties from the new fragment's `[up-data]`
    with the given [data object](/data).

  @param {Function(Event)} [options.onLoaded]
    A callback that will be run when the server responds with new HTML,
    but before the HTML is rendered.

    The callback argument is a preventable `up:fragment:loaded` event.

  @param {Function(up.RenderResult)} [options.onRendered]
    A function to call when Unpoly has updated fragments.

    This callback may be called zero, one or two times:

    - When the server rendered an [empty response](/skipping-rendering#rendering-nothing), no fragments are updated. `{ onRendered }` is not called.
    - When the server rendered a matching fragment, it will be updated on the page. `{ onRendered }` is called with the [result](/up.RenderResult).
    - When [revalidation](/caching#revalidation) renders a second time, `{ onRendered }` is called again with the final result.

    Also see [Running code after rendering](/render-hooks#running-code-after-rendering).

  @param {Function(up.RenderResult)} [options.onFinished]
    A function to call when no further DOM changes will be caused by this render pass.

    In particular:

    - [Animations](/up.motion) have concluded and [transitioned](https://unpoly.com/a-up-transition) elements were removed from the DOM tree.
    - A [cached response](#options.cache) was [revalidated with the server](/caching#revalidation).
      If the server has responded with new content, this content has also been rendered.

    The callback argument is the last `up.RenderResult` that updated a fragment.
    If [revalidation](/caching#revalidation) re-rendered the fragment, it is the result from the
    second render pass. If no revalidation was performed, or if revalidation yielded an [empty response](/caching#when-nothing-changed),
    it is the result from the initial render pass.

    Also see [Awaiting postprocessing](/render-hooks#awaiting-postprocessing).

  @param {Function(Event)} [options.onOffline]
    A callback that will be run when the fragment could not be loaded
    due to a [disconnect or timeout](/network-issues).

    The callback argument is a preventable `up:fragment:offline` event.

  @param {Function(Error)} [options.onError]
    A callback that will be run when any error is thrown during the rendering process.

    The callback is also called when the render pass fails due to [network issues](/network-issues),
    or [aborts](/aborting-requests).

    Also see [Handling errors](/render-hooks#handling-errors).

  @param {boolean} [options.useKeep=true]
    Whether [`[up-keep]`](/up-keep) elements will be preserved in the updated fragment.

    @experimental

  @param {boolean} [options.useHungry=true]
    Whether [`[up-hungry]`](/up-hungry) elements outside the updated fragment will also be updated.

    @experimental

  @return {up.RenderJob}
    A promise that fulfills with an `up.RenderResult` once the page has been updated.

    If the update is animated, the promise will be resolved *before* the existing element was
    removed from the DOM tree. The old element will be marked with the `.up-destroying` class
    and removed once the animation finishes. To run code after the old element was removed,
    pass an `{ onFinished }` callback.

  @stable
  */
  const render = up.mockable((...args) => {
    let options = parseTargetAndOptions(args)
    return new up.RenderJob(options)
  })

  /*-
  [Navigates](/navigation) to the given URL by updating a major fragment in the current page.

  `up.navigate()` will mimic a click on a vanilla `<a href>` link to satisfy user expectations
  regarding scrolling, focus, request cancelation and [many other side effects](/navigation).
  To update a fragment without side effects, use `up.render()`.

  Instead of calling `up.navigate()` you may also call `up.render({ navigate: true })`.

  @function up.navigate
  @param {string|Element|jQuery} [target]
    The [target selector](/targeting-fragments) to update.

    If omitted a [main target](/main) will be rendered.

    You can also pass a DOM element or jQuery element here, in which case a selector
    will be [derived from the element attributes](/target-derivation). The given element
    will also be set as the `{ origin }` option.

    Instead of passing the target as the first argument, you may also pass it as
    [´{ target }` option](/up.render#options.target).
  @param {string} [options.url]
    The URL to navigate to.
  @param {Object} [options]
    See options for `up.render()`.
  @return {up.RenderJob}
    A promise that fulfills with an `up.RenderResult` once the page has been updated.

    For details, see return value for `up.render()`.
  @stable
  */
  const navigate = up.mockable((...args) => {
    const options = parseTargetAndOptions(args)
    return render({...options, navigate: true})
  })

  /*-
  This event is [emitted](/up.emit) after the server response was loaded, but before
  the HTML is used to [change a fragment](/up.render).

  This gives you a chance to inspect the response or DOM state right before a fragment would be inserted.
  You may then choose to [abort](#event.preventDefault) or [skip](#event.skip) the render pass
  to do something else instead.

  The event is emitted on the targeted layer.

  ### Example: Making a full page load instead

  Event listeners may call `event.preventDefault()` on an `up:fragment:loaded` event
  to prevent any changes to the DOM and browser history.

  This is useful to detect an entirely different page layout
  (like a maintenance page or fatal server error)
  which should be open with a full page load:

  ```js
  up.on('up:fragment:loaded', (event) => {
    let isMaintenancePage = event.response.header('X-Maintenance')

    if (isMaintenancePage) {
      // Prevent the fragment update and don't update browser history
      event.preventDefault() // mark-line

      // Make a full page load for the same request.
      event.request.loadPage() // mark-line
    }
  })
  ```

  ### Example: Changing render options

  Instead of preventing the update, listeners may also access the `event.renderOptions` object
  to mutate options to the `up.render()` call that will process the server response:

  ```js
  up.on('up:fragment:loaded', async function(event) {
    // If we see an X-Course-Completed header, render the main target
    if (event.response.headers['X-Course-Completed']) {
      event.renderOptions.target = ':main' // mark-line
    }
  })
  ```

  ### Example: Do something else, then retry

  You may retry a prevented fragment update later, by calling `up.render(event.renderOptions)`:

  ```js
  up.on('up:fragment:loaded', async function(event) {
    // When we couldn't access a page since we're signed out, the server sends a header
    if (event.response.header('X-Session-Missing')) {
      // Don't render the error message
      event.preventDefault() // mark-line

      // Sign in using a modal overlay
      await up.layer.ask('/sign_in', { acceptEvent: 'app:session:created' })

      // Now that we're signed in, retry the original request
      up.render(event.renderOptions) // mark-line
    }
  })
  ```

  ### Example: Discarding a revalidation response

  When rendering [cached](/caching) content that is too old, Unpoly automatically reloads the fragment
  to ensure that the user never sees expired content. This process is called [cache revalidation](/caching#revalidation).

  To prevent the insertion of [revalidated](/caching#revalidation) content *after* the
  server responded you may prevent the `up:fragment:loaded` event with an `{ revalidating: true }` property.

  The following would skip rendering a validation response if it has the same `X-Version` header as
  the original, stale response:

  ```js
  up.on('up:fragment:loaded', function(event) {
    if (event.revalidating) {
      let newVersion = event.response.header('X-Version')
      let oldVersion = event.expiredResponse.header('X-Version')
      if (newVersion === oldVersion) {
        event.skip()
      }
    }
  })
  ```

  Also see [skipping unnecessary rendering](/skipping-rendering).

  @event up:fragment:loaded

  @param event.preventDefault()
    Aborts this render pass without changes.

    Programmatic callers will reject with an `up.AbortError`.

  @param event.skip()
    Finishes this render pass without changes,
    usually to [not re-insert identical content](/skipping-rendering).

    Programmatic callers will fulfill with an [empty](/up.RenderResult.prototype.none) `up.RenderResult`.

    To configure global rules for responses that should be skipped, you may
    also use `up.fragment.config.skipResponse` instead of registering an `up:fragment:oaded` listener.

    @experimental

  @param {up.Request} event.request
    The original request to the server.

  @param {up.Response} event.response
    The response received from the server.

  @param {boolean} event.revalidating
     Whether the response contains fresh content for the purpose [cache revalidation](/caching#revalidation).
     @experimental

  @param {up.Response|undefined} event.expiredResponse
     When [revalidating](/caching#revalidation), this property is set to the expired content
     that is being reloaded to ensure that the user never sees stale content.

     You may compare the `{ response }` and `{ expiredResponse }` properties to prevent
     [re-insertion of identical content](/skipping-rendering).

     Also see `up.fragment.config.skipResponse`.

     @experimental

  @param {Element|undefined} event.origin
    The link, input or form element that caused the fragment update.

    If no origin element is known, this property is left `undefined`.

  @param {Object} event.renderOptions
    Options for the `up.render()` call that will process the server response.

  @stable
  */

  /*-
  This event is emitted when the device loses its network connection while [rendering](/up.render) content.

  Listeners may decide how to handle the connection loss. E.g. you may choose to display an error, or to offer a button that retries the failed request.
  See [handling connection loss](/network-issues#disconnects) for more details and examples.

  The event is emitted on the targeted layer.

  @event up:fragment:offline

  @param {up.Request} event.request
    The original request to the server.

  @param {Object} event.renderOptions
    Options for the `up.render()` call that has caused the failed request.

  @param {Function(Object): Promise<up.RenderResult>} event.retry()
    Retry the render pass with the same options.

    You may pass an object to override individual properties from the original render options.

    Retrying causes a second render pass with its own async `up.RenderResult`.
    The promise from the original render pass has already been rejected when `up:fragment:offline` is emitted.

  @param {Element} [event.origin]
    The link or form element that caused the fragment update.

  @experimental
  */

  /*-
  Elements with an `[up-keep]` attribute will be persisted during
  [fragment updates](/up.fragment).

  Common use cases for `[up-keep]` include:

  - Elements that are expensive to [initialize](/up.compiler).
  - Media elements (`<video>`, `<audio>`) that should retain their playback state during updates.
  - Other elements with client-side state that is difficult to express in a URL or [data object](/data).

  The element must have a [derivable target selector](/target-derivation)
  so Unpoly can find its position within new content.

  Emits the [`up:fragment:keep`](/up:fragment:keep) event.

  ### Example

  A common use case is to preserve the playback state of media elements:

  ```html
  <article>
    <p>Content</p>
    <audio id="player" up-keep src="song.mp3"></audio>
  </article>
  ```

  When [targeting](/targeting-fragments) the `<article>` fragment, the `<audio>` element and
  its playback state will be the same before and after the update. All other elements (like the `<p>`)
  will be updated with new content.

  ### Controlling if an element will be kept

  Unpoly will **only** keep an existing element if:

  - The existing element has an `[up-keep]` attribute
  - The response contains an element matching the [derived target](/target-derivation) of the existing element
  - The matching element has *no* `[up-keep=false]` attribute
  - The [`up:fragment:keep`](/up:fragment:keep) event that is [emitted](/up.emit) on the existing element
    is not prevented.
  - The [`up:fragment:keep`](/up:fragment:keep) event that is passed to an [`[up-on-keep]`](#up-on-keep)
    callback on the existing element is not prevented.

  Let's say we want only keep an `<audio up-keep>` element as long as it plays
  the same song (as identified by the tag's `src` attribute).

  On the client we can achieve this by listening to an `up:keep:fragment` event
  and preventing it if the `src` attribute of the old and new element differ:

  ```js
  up.on('up:fragment:keep', 'audio', function(event) {
    if (element.getAttribute('src') !== event.newElement.getAttribute('src')) {
      event.preventDefault()
    }
  })
  ```

  ### Updating data for kept elements

  Even when keeping elements, you may reconcile its [data object](/data) with the data
  from the new element that was discarded.

  Let's say you want to display a map within an element. The center of the map
  is encoded using an `[up-data]` attribute:

  ```html
  <div id='map' up-keep up-data='{ "lat": 50.86, "lng": 7.40 }'></div>
  ```

  We can initialize the map using a [compiler](/up.compiler) like this:

  ```js
  up.compiler('#map', function(element, data) {
    var map = new google.maps.Map(element)
    map.setCenter(data)
  })
  ```

  While we want to preserve the map during page loads, we *do* want to pick up
  a new center coordinate when the containing fragment is updated. We can do so by
  listening to an `up:fragment:keep` event and observing `event.newData`:

  ```js
  up.compiler('#map', function(element, data) {
    var map = new google.maps.Map(element)
    map.setCenter(data)

    map.addEventListener('up:fragment:keep', function(event) { // mark-line
      map.setCenter(event.newData) // mark-line
    }) // mark-line
  })
  ```

  > [TIP]
  > Instead of keeping an element and update its data you may also
  > [preserve an element's data through reloads](/data#preserving-data-through-reloads).

  ### Limitations

  - The `[up-keep]` attribute is only supported for elements within the `<body>`.
  - If an `<audio up-keep>` or `<video up-keep>` element is a *direct* child of the `<body>`,
    it will lose its playback state during a fragment update. To preserve its playback
    state, insert a container element between the `<body>` and the media element.


  @selector [up-keep]
  @param [up-on-keep]
    Code to run before an existing element is kept during a page update.

    The code may use the variables `event` (see `up:fragment:keep`),
    `this` (the old fragment), `newFragment` and `newData`.

    Calling `event.preventDefault()` will prevent the element from being kept.
    It will then be swapped with `newFragment`.
  @stable
  */

  /*-
  This event is [emitted](/up.emit) before an existing element is [kept](/up-keep) during
  a page update.

  Event listeners can call `event.preventDefault()` on an `up:fragment:keep` event
  to prevent the element from being persisted. If the event is prevented, the element
  will be replaced with a fragment from the response.

  ### Example

  The following would only keep an `<audio up-keep>` element as long as it plays
  the same song (as identified by the tag's `src` attribute):

  ```js
  up.on('up:fragment:keep', 'audio', function(event) {
    if (element.getAttribute('src') !== event.newElement.getAttribute('src')) {
      event.preventDefault()
    }
  })
  ```

  > [TIP]
  > You may also define an `up:fragment:keep` listener in HTML using an [`[up-on-keep]`](/up-keep#up-on-keep) attribute.

  @event up:fragment:keep
  @param event.preventDefault()
    Prevents the fragment from being kept.

    The fragment will be replaced with `event.newFragment`.
  @param {Element} event.target
    The fragment that will be kept.
  @param {Element} event.newFragment
    The discarded element.
  @param {Object} event.newData
    The [data](/data) attached to the discarded element.
  @stable
  */


  /*-
  When any page fragment has been [inserted or updated](/up.replace),
  this event is [emitted](/up.emit) on the fragment.

  If you're looking to run code when a new fragment matches
  a selector, use `up.compiler()` instead.

  ### Example

  ```js
  up.on('up:fragment:inserted', function(event, fragment) {
    console.log("Looks like we have a new %o!", fragment)
  })
  ```

  @event up:fragment:inserted
  @param {Element} event.target
    The fragment that has been inserted or updated.
  @stable
  */
  function emitFragmentInserted(element) {
    return up.emit(element, 'up:fragment:inserted', {
      log: ['Inserted fragment %o', element],
    })
  }

  function emitFragmentKeep(keepPlan) {
    let { oldElement, newElement: newFragment, newData, renderOptions } = keepPlan
    const log = ['Keeping fragment %o', oldElement]
    const callback = e.callbackAttr(oldElement, 'up-on-keep', { exposedKeys: ['newFragment', 'newData'] })
    return up.emit(oldElement, 'up:fragment:keep', { newFragment, newData, renderOptions, log, callback })
  }

  function emitFragmentDestroyed(fragment, options) {
    const log = options.log ?? ['Destroyed fragment %o', fragment]
    const parent = options.parent || document
    return up.emit(parent, 'up:fragment:destroyed', {fragment, parent, log})
  }

  function isNotDestroying(element) {
    return !element.closest('.up-destroying')
  }

  /*-
  Returns whether the given fragment is both connected and not currently in a destroy animation.

  @function up.fragment.isAlive
  @param {Element} fragment
  @internal
  */
  function isAlive(fragment) {
    return fragment.isConnected && isNotDestroying(fragment)
  }

  /*-
  Returns the first fragment matching the given CSS selector.

  This function differs from `document.querySelector()` and `up.element.get()`:

  - This function only selects elements in the [current layer](/up.layer.current).
    Pass a `{ layer }`option to match elements in other layers.
  - This function ignores elements that are being [destroyed](/up.destroy) or that are being
    removed by a [transition](/up.morph).
  - This function prefers to match elements in the vicinity of a given `{ origin }` element (optional).
  - This function supports non-standard CSS selectors like `:main` and `:has()`.

  If no element matches these conditions, `undefined` is returned.

  ### Example: Matching a selector in a layer

  To select the first element with the selector `.foo` on the [current layer](/up.layer.current):

  ```js
  let foo = up.fragment.get('.foo')
  ```

  You may also pass a `{ layer }` option to match elements within another layer:

  ```js
  let foo = up.fragment.get('.foo', { layer: 'any' })
  ```

  ### Example: Matching the descendant of an element

  To only select in the descendants of an element, pass a root element as the first argument:

  ```js
  let container = up.fragment.get('.container')
  let fooInContainer = up.fragment.get(container, '.foo')
  ```

  ### Example: Matching around an origin element

  When processing a user interaction, it is often helpful to match elements around the link
  that's being clicked or the form field that's being changed. In this case you may pass
  the triggering element as `{ origin }` element.

  Assume the following HTML:

  ```html
  <div class="element">
  </div>
  <div class="element">
    <a href="..."></a>
  </div>
  ```

  When processing an event for the `<a href"...">` you can pass the link element
  as `{ origin }` to match the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
  element in the link's ancestry:

  ```js
  let link = event.target
  up.fragment.get('.element') // returns the first .element
  up.fragment.get('.element', { origin: link }) // returns the second .element
  ```

  When the link's does not have an ancestor matching `.element`,
  Unpoly will search the entire layer for `.element`.

  ### Example: Matching an origin sibling

  When processing a user interaction, it is often helpful to match elements
  within the same container as the the link that's being clicked or the form field that's
  being changed.

  Assume the following HTML:

  ```html
  <div class="element" id="one">
    <div class="inner"></div>
  </div>
  <div class="element" id="two">
    <a href="..."></a>
    <div class="inner"></div>
  </div>
  ```

  When processing an event for the `<a href"...">` you can pass the link element
  as `{ origin }` to match within the link's container:

  ```js
  let link = event.target
  up.fragment.get('.element .inner') // returns the first .inner
  up.fragment.get('.element .inner', { origin: link }) // returns the second .inner
  ```

  Only when the link's `.element` container does not have a child `.inner`,
  Unpoly will search the entire layer for `.element .inner`.

  ### Similar features

  - The [`.up-destroying`](/up-destroying) class is assigned to elements during their removal animation.
  - The [`up.element.get()`](/up.element.get) function simply returns the first element matching a selector
  without filtering by layer or destruction state.

  @function up.fragment.get
  @param {Element|jQuery} [root=document]
    The root element for the search. Only the root's children will be matched.

    May be omitted to search through all elements in the `document`.
  @param {string} selector
    The selector to match.
  @param {string} [options.layer='current']
    The layer in which to select elements.

    See `up.layer.get()` for a list of supported layer values.

    If a root element was passed as first argument, this option is ignored and the
    root element's layer is searched.
  @param {Element|jQuery} [options.origin]
    The origin element that triggered this fragment lookup, e.g. a button that was clicked.

    Unpoly will prefer to match fragments in the [vicinity](/targeting-fragments#resolving-ambiguous-selectors)
    of the origin element.

    The `selector` argument may refer to the origin as `:origin`.
  @return {Element|undefined}
    The first matching element, or `undefined` if no such element matched.
  @stable
  */
  function getSmart(...args) {
    const options = u.extractOptions(args)
    const selector = args.pop()
    const root = args[0]

    if (u.isElementish(selector)) {
      // up.fragment.get(root: Element, element: Element, [options]) should just return element.
      // The given root and options are ignored. We also don't check if it's destroying.
      // We do use e.get() to unwrap a jQuery collection.
      return e.get(selector)
    }

    if (root) {
      // We don't match around { origin } if we're given a root for the search.
      return getDumb(root, selector, options)
    }

    // If we don't have a root element we will use a context-sensitive lookup strategy
    // that tries to match elements in the vicinity of { origin } before going through
    // the entire layer.
    return new up.FragmentFinder({
      selector,
      origin: options.origin,
      layer: options.layer
    }).find()
  }

  function getDumb(...args) {
    return getAll(...args)[0]
  }

  const CSS_HAS_SUFFIX_PATTERN = /:has\(([^)]+)\)$/

  /*-
  Returns all elements matching the given CSS selector, but
  ignores elements that are being [destroyed](/up.destroy) or that are being
  removed by a [transition](/up.morph).

  By default this function only selects elements in the [current layer](/up.layer.current).
  Pass a `{ layer }`option to match elements in other layers. See `up.layer.get()` for a list
  of supported layer values.

  Returns an empty list if no element matches these conditions.

  ### Example

  To select all elements with the selector `.foo` on the [current layer](/up.layer.current):

  ```js
  let foos = up.fragment.all('.foo')
  ```

  You may also pass a `{ layer }` option to match elements within another layer:

  ```js
  let foos = up.fragment.all('.foo', { layer: 'any' })
  ```

  To select in the descendants of an element, pass a root element as the first argument:

  ```js
  var container = up.fragment.get('.container')
  var foosInContainer = up.fragment.all(container, '.foo')
  ```

  ### Similar features

  - The [`.up-destroying`](/up-destroying) class is assigned to elements during their removal animation.
  - The [`up.element.all()`](/up.element.all) function simply returns the all elements matching a selector
    without further filtering.

  @function up.fragment.all

  @param {Element|jQuery} [root=document]
    The root element for the search. Only the root's children will be matched.

    May be omitted to search through all elements in the given [layer](#options.layer).

  @param {string} selector
    The selector to match.

  @param {string} [options.layer='current']
    The layer in which to select elements.

    See `up.layer.get()` for a list of supported layer values.

    If a root element was passed as first argument, this option is ignored and the
    root element's layer is searched.

  @param {string|Element|jQuery} [options.origin]
    The origin element that triggered this fragment lookup, e.g. a button that was clicked.

    Unpoly will prefer to match fragments in the [vicinity](/targeting-fragments#resolving-ambiguous-selectors)
    of the origin element.

    The `selector` argument may refer to the origin as `:origin`.

  @return {Element|undefined}
    The first matching element, or `undefined` if no such element matched.
  @stable
  */
  function getAll(...args) {
    const options = u.extractOptions(args)
    let selectorString = args.pop()
    const root = args[0]

    // (0) up.fragment.all(element) or up.fragment.all(element, element) should return an array of that element.
    if (u.isElement(selectorString)) {
      return [selectorString]
    }

    // (1) up.fragment.all(list) or up.fragment.all(element, list) should return the list unchanged
    if (u.isList(selectorString)) {
      return selectorString
    }

    // (2) up.fragment.all(rootElement, selector) should find selector within
    //     the descendants of rootElement.
    // (3) up.fragment.all(selector) should find selector within the current layer.
    // (4) up.fragment.all(selector, { layer }) should find selector within the given layer(s).
    let selector = buildSelector(selectorString, root, options)
    return selector.descendants(root || document)
  }

  /*-
  Your [target selectors](/targeting-fragments) may use this pseudo-selector
  to replace an element with an descendant matching the given selector.

  ### Example

  `up.render('div:has(span)', { url: '...' })`  replaces the first `<div>` elements with at least one `<span>` among its descendants:

  ```html
  <div>
    <span>Will be replaced</span>
  </div>
  <div>
    Will NOT be replaced
  </div>
  ```

  ### Compatibility

  As a [level 4 CSS selector](https://drafts.csswg.org/selectors-4/#relational),
  `:has()` is [currrently being implemented](https://caniuse.com/#feat=css-has)
  in native browser functions like [`document.querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).

  Unpoly polyfills `:has()` so you can use it in [target selectors](/targeting-fragments) in all [supported browsers](/up.framework.isSupported).

  @selector :has()
  @stable
  */

  /*-
  Marks a target selector as optional.

  If a `:maybe` selector is not found in the current page or the server response,
  Unpoly will skip rendering the fragment instead of throwing an error.

  When [updating multiple fragments](/targeting-fragments#updating-multiple-fragments)
  you may combine required and optional selectors in a single target string.

  ### Example

  This link will update the fragments `.content` (required) and `.details` (optional):

  ```html
  <a href="/card/5" up-target=".content, .details:maybe">...</a>
  ```

  Only the fragment `.content` is required to match. If `.details` is missing
  in the current page or the server response, Unpoly will only update `.content`
  without an error.

  @selector :maybe
  @stable
  */

  /*-
  Returns a list of the given parent's descendants matching the given selector.
  The list will also include the parent element if it matches the selector itself.

  @function up.fragment.subtree
  @param {Element} parent
    The parent element for the search.
  @param {string} selector
    The CSS selector to match.
  @param {up.Layer|string|Element} [options.layer = 'current]
    The layer in whicht to match.
  @return {NodeList<Element>|Array<Element>}
    A list of all matching elements.
  @experimental
  */
  function getSubtree(element, selector, options = {}) {
    selector = buildSelector(selector, element, options)
    return selector.subtree(element)
  }

  /*-
  Returns whether the given `root` matches or contains the given selector or element.

  @param {Element} element
  @param {string} selector
  @function up.fragment.contains
  @internal
  */
  function contains(root, selectorOrElement) {
    if (u.isElement(selectorOrElement)) {
      return e.contains(root, selectorOrElement) && up.layer.get(root).contains(selectorOrElement)
    } else {
      return getSubtree(root, selectorOrElement).length > 0
    }
  }

  /*-
  Returns the first element that matches the selector by testing the element itself
  and traversing up through ancestors in element's layers.

  `up.fragment.closest()` will only match elements in the same [layer](/up.layer) as
  the given element. To match ancestors regardless of layers, use `up.element.closest()`.

  @function up.fragment.closest
  @param {Element} element
    The element on which to start the search.
  @param {string} selector
    The CSS selector to match.
  @return {Element|null|undefined} element
    The matching element.

    Returns `null` or `undefined` if no element matches in the same layer.
  @stable
  */
  function closest(element, selector, options) {
    element = e.get(element)
    selector = buildSelector(selector, element, options)
    return selector.closest(element)
  }

  /*-
  Destroys the given element or selector.

  All [`up.compiler()`](/up.compiler) destructors, if any, are called.
  The element is then removed from the DOM.

  Unfinished requests targeting the destroyed fragment or its descendants are [aborted](/aborting-requests).

  Emits events [`up:fragment:destroyed`](/up:fragment:destroyed).

  ### Animating the removal

  You may animate the element's removal by passing an option like `{ animate: 'fade-out' }`.
  Unpoly ships with a number of [predefined animations](/up.animate#named-animations) and
  you may so define [custom animations](/up.animation).

  If the element's removal is animated, the element will remain in the DOM until after the animation
  has completed. While the animation is running the element will be given the `.up-destroying` class.
  The element will also be given the `[aria-hidden]` attribute to remove it from
  the accessibility tree.

  Elements that are about to be destroyed (but still animating) are ignored by all
  functions that lookup fragments, like `up.fragment.all()`, `up.fragment.get()` or `up.fragment.closest()`.

  @function up.destroy
  @param {string|Element|jQuery} target
  @param {string|Function(element, options): Promise} [options.animation='none']
    The animation to use before the element is removed from the DOM.
  @param {number} [options.duration]
    The duration of the animation. See [`up.animate()`](/up.animate).
  @param {string} [options.easing]
    The timing function that controls the animation's acceleration. See [`up.animate()`](/up.animate).
  @param {Function} [options.onFinished]
    A callback that is run when any animations are finished and the element was removed from the DOM.
  @return undefined
  @stable
  */
  function destroy(...args) {
    const options = parseTargetAndOptions(args)

    if (options.element = getSmart(options.target, options)) {
      new up.Change.DestroyFragment(options).execute()
    }

    return up.migrate.formerlyAsync?.('up.destroy()')
  }

  function parseTargetAndOptions(args) {
    const options = u.parseArgIntoOptions(args, 'target')
    if (u.isElement(options.target)) {
      options.origin ||= options.target
    }
    return options
  }

  /*-
  Elements are assigned the `.up-destroying` class before they are [destroyed](/up.destroy)
  or while they are being removed by a [transition](/up.morph).

  If the removal is [animated](/up.destroy#animating-the-removal),
  the class is assigned before the animation starts.

  ### Destroying elements are ignored

  Elements that are being destroyed (but still animating) are ignored by all
  functions for fragment lookup:

  - `up.fragment.all()`
  - `up.fragment.get()`
  - `up.fragment.closest()`

  Note that the low-level DOM helpers in `up.element` will *not* ignore elements that are being destroyed.

  ### Accessibility

  While an element's destruction is animating, the element is also assigned an
  [`[aria-hidden]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden) attribute.
  This hides the element from the browser's accessibility API.

  @selector .up-destroying
  @stable
  */

  function markFragmentAsDestroying(element) {
    element.classList.add('up-destroying')
    element.setAttribute('aria-hidden', 'true')
  }

  /*-
  This event is [emitted](/up.emit) after a page fragment was [destroyed](/up.destroy) and removed from the DOM.

  If the destruction is animated, this event is emitted after the animation has ended.

  The event is emitted on the parent element of the fragment that was removed.

  @event up:fragment:destroyed
  @param {Element} event.fragment
    The detached element that has been removed from the DOM.
  @param {Element} event.parent
    The former parent element of the fragment that has now been detached from the DOM.
  @param {Element} event.target
    The former parent element of the fragment that has now been detached from the DOM.
  @stable
  */

  /*-
  Replaces the given element with a fresh copy fetched from the server.

  By default, reloading is not considered a [user navigation](/navigation) and e.g. will not update
  the browser location. You may change this with `{ navigate: true }`.

  ### Example

  ```js
  let { fragment } = await up.reload('.inbox')
  console.log("New .inbox element: ", fragment)
  ```

  ### Controlling the URL that is reloaded

  Unpoly remembers [the URL from which a fragment was loaded](/up.fragment.source),
  so you don't usually need to pass a URL when reloading.

  To reload from another URL, pass a `{ url }` option or set an `[up-source]` attribute
  on the element being reloaded or its ancestors.

  ### Skipping updates when nothing changed

  Your server-side app is not required to re-render a request if there are no changes to the cached content.

  By supporting [conditional HTTP requests](/conditional-requests) you can quickly produce an empty response for unchanged content.

  @function up.reload

  @param {string|Element|Array<Element>|jQuery} [target]
    The element that should be reloaded.

    If omitted, an element matching a selector in `up.fragment.config.mainTargets` will be reloaded.

    When an `Element` object is passed, a target selector will be [derived](/target-derivation).

  @param {Object} [options]
    See options for `up.render()`.

  @param {string} [options.url]
    The URL from which to reload the fragment.
    This defaults to the URL from which the fragment was originally loaded.

  @param {Object} [options.data]
    Overrides properties from the new fragment's `[up-data]`
    with the given [data object](/data).

  @param {boolean} [options.keepData]
    [Preserve](/data#preserving-data-through-reloads) the reloaded fragment's [data object](/data).

    Properties from the new fragment's `[up-data]`  are overridden with the old fragment's `[up-data]`.

  @param {string} [options.navigate=false]
    Whether the reloading constitutes a [user navigation](/navigation).

  @return {up.RenderJob}
    A promise that fulfills with an `up.RenderResult` once the fragment
    has been reloaded and rendered.

  @stable
  */
  function reload(...args) {
    const options = parseTargetAndOptions(args)
    options.target ||= ':main'
    const element = getSmart(options.target, options)
    options.url ||= sourceOf(element)
    options.headers = u.merge(options.headers, conditionalHeaders(element))
    if (options.keepData || e.booleanAttr(element, 'up-keep-data')) {
      options.data = up.data(element)
    }
    up.migrate.postprocessReloadOptions?.(options)
    return render(options)
  }

  function conditionalHeaders(element) {
    let headers = {}
    let time = timeOf(element)
    if (time) {
      headers['If-Modified-Since'] = time.toUTCString()
    }
    let etag = etagOf(element)
    if (etag) {
      headers['If-None-Match'] = etag
    }
    return headers
  }

  /*-
  Fetches this given URL with JavaScript and [replaces](/up.replace) the
  [current layer](/up.layer.current)'s [main element](/up.fragment.config#config.mainTargets)
  with a matching fragment from the server response.

  ### Example

  This would replace the current page with the response for `/users`:

  ```js
  up.visit('/users')
  ```

  @function up.visit

  @param {string} url
    The URL to visit.

  @param {Object} [options]
    See options for `up.render()`.

  @return {up.RenderJob}
    A promise that fulfills with an `up.RenderResult`
    once the destination was loaded and rendered.

  @stable
  */
  function visit(url, options) {
    return navigate({...options, url})
  }

  const KEY_PATTERN = /^(onFail|on|fail)?(.+)$/

  function successKey(key) {
    let match = KEY_PATTERN.exec(key)
    if (match) {
      let [_, prefix, suffix] = match

      switch (prefix) {
        case 'onFail':
          return 'on' + u.upperCaseFirst(suffix)
        case 'fail':
          return u.lowerCaseFirst(suffix)
      }

      // Return undefined for prefixes "on" and undefined
    }
  }

  function failKey(key) {
    let match = KEY_PATTERN.exec(key)
    if (match) {
      let [_, prefix, suffix] = match

      switch (prefix) {
        case 'on':
          return 'onFail' + u.upperCaseFirst(suffix)
        case undefined:
          return 'fail' + u.upperCaseFirst(suffix)
      }

      // Return undefined for prefixes "onFail" and "fail"
    }
  }

  /*-
  [Derives a CSS selector](/target-derivation) that matches the given element as good as possible.

  If no target can be derived and [verified](/target-derivation#derived-target-verification), an error `up.CannotTarget` is thrown.

  ### Example

  ```js
  element = up.element.createFromHTML('<span class="klass">...</span>')
  selector = up.fragment.toTarget(element) // returns '.klass'
  ```

  @function up.fragment.toTarget
  @param {Element|string} element
    The element for which to create a selector.

    When a string is given, it is returned unchanged.
  @param {Element} [options.origin]
    The origin used to [resolve an ambiguous selector](/targeting-fragments#resolving-ambiguous-selectors)
    during [target verification](/target-derivation#derived-target-verification).
  @stable
  */
  function toTarget(element, options) {
    return u.presence(element, u.isString) || tryToTarget(element, options) || cannotTarget(element)
  }

  /*-
  Returns whether Unpoly can [derive a target selector](/target-derivation) for the given element.

  @function up.fragment.isTargetable
  @param {Element} element
  @return {boolean}
  @experimental
  */
  function isTargetable(element) {
    return !!tryToTarget(element)
  }

  function untargetableMessage(element) {
    return `Cannot derive good target selector from a <${e.tagName(element)}> element without identifying attributes. Try setting an [id] or configure up.fragment.config.targetDerivers.`
  }

  function cannotTarget(element) {
    throw new up.CannotTarget(untargetableMessage(element))
  }

  function tryToTarget(element, options) {
    return u.findResult(config.targetDerivers, function(deriver) {
      let target = deriveTarget(element, deriver)

      if (target && isGoodTarget(target, element, options)) {
        return target
      }
    })
  }

  function deriveTarget(element, deriver) {
    if (u.isFunction(deriver)) {
      return deriver(element)
    } else if (element.matches(deriver)) {
      try {
        // Now that we know that a deriver is applicable to our element, we're using
        // the element's tag name and attribute to form a more specific target.
        // E.g. a deriver '[up-id]' should result in a target '[up-id="messages"]'.
        return deriveTargetFromPattern(element, deriver)
      } catch (e) {
        if (e instanceof up.CannotParse) {
          // This error can be thrown for two reasons:
          // (1) up.element.parseSelector() cannot parse the given string
          // (2) up.element.parseSelector() parses a selector with a depth > 1.
          return deriver
        } else {
          throw e
        }
      }
    }
  }

  function deriveTargetFromPattern(element, deriver) {
    // Now that we know that a deriver is applicable to our element, we're using
    // the element's tag name and attribute to form a more specific target.
    // E.g. a deriver '[up-id]' should result in a target '[up-id="messages"]'.

    let { includePath, excludeRaw } = up.element.parseSelector(deriver)

    if (includePath.length !== 1) {
      // It's not straightforward to improve a descendant selector like '.foo .bar' or '.foo > .bar'.
      // It's also not common to see such selectors configured in config.targetDerivers.
      // Hence we just return the matching deriver.
      throw new up.CannotParse(deriver)
    }

    let { tagName, id, classNames, attributes } = includePath[0]
    let result = ''

    if (tagName === '*') {
      // In a deriver '*' means to include the actual tag name in the target-
      result += e.tagName(element)
    } else if (tagName) {
      // If a deriver contains an actual tag name like 'main' it becomes
      // part of the target selector.
      result += tagName
    }

    for (let className of classNames) {
      result += e.classSelector(className)
    }

    if (id) {
      result += e.idSelector(id)
    }

    for (let attributeName in attributes) {
      // If a deriver contains an attribute value (e.g. '[rel=canonical]') we use that for the target.
      // If the deriver has a value-less attribute (e.g. '[rel]') we use the actual attribute value from the element.
      let attributeValue = attributes[attributeName] || element.getAttribute(attributeName)

      if (attributeName === 'id') {
        // We allow a deriver '[id]' to apply to all elements with an ID.
        // However, we want to use an ID selector ('#foo') instead of an attribute selector ('[id=foo]').
        result += e.idSelector(attributeValue)
      } else if (attributeName === 'class') {
        // We allow a deriver '[class]' to apply to all elements with a class.
        // However, we want to (1) filter class against config.badTargetClasses and
        // (2) use an class selector ('.foo') instead of an attribute selector ('[class=foo]').
        for (let goodClass of goodClassesForTarget(element)) {
          result += e.classSelector(goodClass)
        }
      } else {
        result += e.attrSelector(attributeName, attributeValue)
      }
    }

    if (excludeRaw) {
      result += excludeRaw
    }

    return result
  }

  function isGoodTarget(target, element, options = {}) {
    return !element.isConnected || !config.verifyDerivedTarget || up.fragment.get(target, { layer: element, ...options }) === element
  }

  /*-
  Sets an unique identifier for this element.

  This identifier is used in [target derivation](/target-derivation)
  to create a CSS selector that matches this element precisely.

  If the element already has [other attributes that make a good identifier](/target-derivation#derivation-patterns),
  like a good `[id]` or `[class]` attribute, it is not necessary to also set `[up-id]`.

  ### Example

  Take this element:

  ```html
  <a href="/">Homepage</a>
  ```

  Unpoly cannot generate a good CSS selector for this element:

  ```js
  up.fragment.toTarget(element)
  // throws error: up.CannotTarget
  ```

  We can improve this by assigning an `[up-id]`:

  ```html
  <a href="/" up-id="link-to-home">Open user 4</a>
  ```

  The attribute value is used to create a better selector:

  ```js
  up.fragment.toTarget(element)
  // returns '[up-id="link-to-home"]'
  ```

  @selector [up-id]
  @param up-id
    A string that uniquely identifies this element.
  @stable
  */

  function matchesPattern(pattern, str) {
    if (u.isRegExp(pattern)) {
      return pattern.test(str)
    } else {
      return pattern === str
    }
  }

  function goodClassesForTarget(element) {
    let isGood = (klass) => !u.some(config.badTargetClasses, (badTargetClass) => matchesPattern(badTargetClass, klass))
    return u.filter(element.classList, isGood)
  }

  function modernResolveOrigin(target, { origin } = {}) {
    return target.replace(/:origin\b/, function(match) {
      if (origin) {
        return toTarget(origin)
      } else {
        up.fail('Missing { origin } element to resolve "%s" reference (found in %s)', match, target)
      }
    })
  }

  function resolveOrigin(...args) {
    return (up.migrate.resolveOrigin || modernResolveOrigin)(...args)
  }

  function expandTargets(targets, options = {}) {
    const { layer } = options
    if (layer !== 'new' && !(layer instanceof up.Layer)) {
      up.fail('Must pass an up.Layer as { layer } option, but got %o', layer)
    }

    // Copy the list since targets might be a jQuery collection, and this does not support shift or push.
    targets = u.copy(u.wrapList(targets))

    const expanded = []

    while (targets.length) {
      const target = targets.shift()

      if (target === ':main' || target === true) {
        // const mode = layer === 'new' ? options.mode : layer.mode

        let mode

        if (layer === 'new') {
          mode = options.mode || up.fail('Must pass a { mode } option together with { layer: "new" }')
        } else {
          mode = layer.mode
        }

        targets.unshift(...up.layer.mainTargets(mode))
      } else if (target === ':layer') {
        // Discard this target for new layers, which don't have a first-swappable-element.
        // Also don't && the layer check into the `else if` condition above, or it will
        // be returned as a verbatim string below.
        if (layer !== 'new' && !layer.opening) {
          targets.unshift(layer.getFirstSwappableElement())
        }
      } else if (u.isElementish(target)) {
        expanded.push(toTarget(target, options))
      } else if (u.isString(target)) {
        expanded.push(resolveOrigin(target, options))
      } else {
        // @buildPlans() might call us with { target: false } or { target: nil }
        // In that case we don't add a plan.
      }
    }

    return u.uniq(expanded)
  }

  function buildSelector(selector, elementOrDocument, options = {}) {
    const filters = []

    if (!options.destroying) {
      filters.push(isNotDestroying)
    }

    // If we're given an element that is detached *or* from another document
    // (think up.ResponseDoc) we are not filtering by element layer.
    let matchingInExternalDocument = elementOrDocument && !document.contains(elementOrDocument)

    let expandTargetLayer

    if (matchingInExternalDocument || options.layer === 'any') {
      expandTargetLayer = up.layer.root
    } else {
      // Some up.fragment function center around an element, like closest() or matches().
      options.layer ??= u.presence(elementOrDocument, u.isElement)
      const layers = up.layer.getAll(options)
      filters.push(match => u.some(layers, layer => layer.contains(match)))
      expandTargetLayer = layers[0]
    }

    let expandedTargets = up.fragment.expandTargets(selector, {...options, layer: expandTargetLayer})

    expandedTargets = expandedTargets.map(function (target) {
      target = target.replace(CSS_HAS_SUFFIX_PATTERN, function (match, descendantSelector) {
        filters.push(element => element.querySelector(descendantSelector))
        return ''
      })
      return target || '*'
    })

    return new up.Selector(expandedTargets, filters)
  }

  function splitTarget(target) {
    return u.parseTokens(target, { separator: 'comma' })
  }

  function parseTargetSteps(target, options = {}) {
    let defaultPlacement = options.defaultPlacement || 'swap'

    let steps = []
    let simpleSelectors = splitTarget(target)

    for (let selector of simpleSelectors) {
      if (selector === ':none') continue

      let placement = defaultPlacement
      let maybe = false

      selector = selector.replace(/\b::?(before|after)\b/, (_match, customPlacement) => {
        placement = customPlacement
        return ''
      })

      selector = selector.replace(/\b:maybe\b/, () => {
        maybe = true
        return ''
      })

      // Each step inherits all options of this change.
      const step = {
        ...options,
        selector,
        placement,
        maybe,
        originalRenderOptions: options,
      }

      steps.push(step)
    }

    return steps
  }

  function hasAutoHistory(fragment) {
    if (contains(fragment, config.autoHistoryTargets)) {
      return true
    } else {
      up.puts('up.render()', "Will not auto-update history because fragment doesn't contain a selector from up.fragment.config.autoHistoryTargets")
      return false
    }
  }

  /*-
  A pseudo-selector that matches the layer's main [target](/targeting-fragments).

  Main targets are default render targets.
  When no other render target is given, Unpoly will try to find and replace a main target.

  In most app layouts the main target should match the primary content area.
  The default main targets are:

  - any element with an `[up-main]` attribute
  - the HTML5 [`<main>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main) element
  - the current layer's [topmost swappable element](/layer)

  You may configure main target selectors in `up.fragment.config.mainTargets`.

  Also see [targeting the main element](/targeting-fragments#targeting-the-main-element).

  ### Example

  ```js
  up.render(':main', { url: '/page2' })
  ```

  @selector :main
  @stable
  */

  /*-
  Marks this element as the dominant content element of your application layout.

  Unpoly will update a main element when no more specific render target is given.

  ### Example

  Many links simply replace the dominant content element in your application layout.

  Unpoly lets you mark this elements as a default target using the `[up-main]` attribute:

  ```html
  <body>
    <div class="layout">
      <div class="layout--side">
        ...
      </div>
      <div class="layout--content" up-main>
       ...
      </div>
    </div>
  </body>
  ```

  Once a main target is configured, you no longer need `[up-target]` in a link.\
  Use `[up-follow]` and the `[up-main]` element will be replaced:

  ```html
  <a href="/foo" up-follow>...</a>
  ```

  If you want to update something more specific, you can still use `[up-target]`:

  ```html
  <a href="/foo" up-target=".profile">...</a>
  ```

  ### Overlays can use different main targets

  Overlays often use a different default selector, e.g. to exclude a navigation bar.

  To define a different main target for an overlay, set the [layer mode](/layer-terminology) as the
  value of the `[up-main]` attribute:

  ```html
  <body>
    <div class="layout" up-main="root">
      <div class="layout--side">
        ...
      </div>
      <div class="layout--content" up-main="modal">
        ...
      </div>
    </div>
  </body>
  ```

  ### Using existing elements as main targets

  Instead of the `[up-main]` attribute you may also use the standard [`<main>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main) element.

  You may also configure an existing selector in `up.fragment.config.mainTargets`:

  ```js
  up.fragment.config.mainTargets.push('.layout--content')
  ```

  You may configure layer-specific targets in `up.layer.config`:

  ```js
  up.layer.config.popup.mainTargets.push('.menu')              // for popup overlays
  up.layer.config.drawer.mainTargets.push('.menu')             // for drawer overlays
  up.layer.config.overlay.mainTargets.push('.layout--content') // for all overlay modes
  ```

  @selector [up-main]
  @param [up-main]
  A space-separated list of [layer modes](/layer-terminology) for which to use this main target.

  Omit the attribute value to define a main target for *all* layer modes.

  To use a different main target for all overlays (but not the root layer), set `[up-main=overlay]`.
  @stable
  */

  /*-
  To make a server request without changing a fragment, use the `:none` [target](/targeting-fragments).

  > [NOTE]
  > Even with a target other than `:none`, the server can still decide to [skip the render pass](/skipping-rendering#rendering-nothing).

  ### Example

  ```html
  <a href="/ping" up-target=":none">Ping server</a>
  ```

  @selector :none
  @stable
  */

  /*-
  Your [target selectors](/targeting-fragments) may use this pseudo-selector
  to reference the origin element that triggered the change.

  The `:origin` placeholder will be replaced with a target [derived](/target-derivation)
  from the origin element.

  ### Default origins

  The origin element is automatically set for many actions, for example:

  @include default-origins

  ### Example

  Below we see two links that will each update the `<div>` next to them.
  This requires a rather verbose `[up-target]` attribute:

  ```html
  <a href="/tasks/1" up-target="a[href='/tasks/1'] + div">Show task 1</a> <!-- mark-phrase "a[href='/tasks/1'] + div" -->
  <div>Task 1 will appear here</div

  <a href="/tasks/2" up-target="a[href='/tasks/2'] + div">Show task 2</a> <!-- mark-phrase "a[href='/tasks/2'] + div" -->
  <div>Task 2 will appear here</div
  ```

  We can simplify the `[up-target]` by referencing the followed link by `:origin`:

  ```html
  <a href="/tasks/1" up-target=":origin + div">Show task 1</a> <!-- mark-phrase ":origin + div" -->
  <div>Task 1 will appear here</div

  <a href="/tasks/2" up-target=":origin + div">Show task 2</a> <!-- mark-phrase ":origin + div" -->
  <div>Task 2 will appear here</div
  ```

  ### Setting the origin programmatically

  When updating fragments programmatically through functions like `up.render()`
  you may pass an origin element as an `{ origin }` option:

  ```js
  element.addEventListener('click', function(event) {
    up.render('.preview', { origin: element })
  })
  ```

  You do not need to pass an `{ origin }` for functions that already have a
  natural origin:

  ```js
  up.follow(link) // link will be set as { origin }
  ```

  > [TIP]
  > Ensuring an origin is set may improve the precision of fragment lookup, even if
  > a [target selector](/targeting-fragments) doesn't contain an `:origin` reference.
  > In the example above, Unpoly would prefer to match `.preview` in the
  > [vicinity](/targeting-fragments#resolving-ambiguous-selectors) of the origin.
  > If no origin is known, Unpoly will always match the first `.preview` in the
  > current [layer](/up.layer).

  @selector :origin
  @stable
  */

  /*-
  Your [target selectors](/targeting-fragments) may use this pseudo-selector
  to replace the layer's topmost swappable element.

  The topmost swappable element is the first child of the layer's container element.
  For the [root layer](/up.layer.root) it is the `<body>` element. For an overlay
  it is the target with which the overlay was opened with.

  In canonical usage the topmost swappable element is often a [main element](/up-main).

  ### Example

  The following will replace the `<body>` element in the root layer,
  and the topmost swappable element in an overlay:

  ```js
  up.render(':layer', { url: '/page2' })
  ```

  @selector :layer
  @experimental
  */

  /*-
  Returns whether the given element matches the given CSS selector or other element.

  Other than [`Element#matches()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/matches)
  this function supports non-standard selectors like `:main` or `:layer`.

  Instead of a selector you may also pass a second element. In that case
  the function returns whether both elements match the same [derived target](/target-derivation).

  ### Examples

  ```js
  let element = document.querySelector('div[up-main]')
  up.fragment.matches(element, 'div') // => true
  up.fragment.matches(element, 'span') // => false
  up.fragment.matches(element, ':main') // => true
  up.fragment.matches(element, element) // => true
  ```

  @function up.fragment.matches
  @param {Element} fragment
  @param {string|Element} selector
    The selector or element to match.

    When an element is passed, returns whether `element` matches
    the [target derived](/target-derivation) from `selector`.
  @param {string|up.Layer} [options.layer]
    The layer for which to match.

    Pseudo-selectors like `:main` may expand to different selectors
    in different layers.
  @param {string|up.Layer} [options.mode]
    Required if `{ layer: 'new' }` is passed.
  @return {boolean}
  @experimental
  */
  function matches(element, selector, options = {}) {
    element = e.get(element)
    if (u.isElement(selector)) {
      let target = tryToTarget(selector)
      return target && element.matches(target)
    } else {
      selector = buildSelector(selector, element, options)
      return selector.matches(element)
    }
  }

  function shouldRevalidate(request, response, options = {}) {
    return request.fromCache && u.evalAutoOption(options.revalidate, config.autoRevalidate, response)
  }

  function targetForSteps(steps) {
    let requiredSteps = u.reject(steps, 'maybe')
    let selectors = u.map(requiredSteps, 'selector')
    return selectors.join(', ') || ':none'
  }

  function isContainedByRivalStep(steps, candidateStep) {
    return u.some(steps, function(rivalStep) {
      return (rivalStep !== candidateStep) &&
        ((rivalStep.placement === 'swap') || (rivalStep.placement === 'content')) &&
        rivalStep.oldElement.contains(candidateStep.oldElement)
    })
  }

  function compressNestedSteps(steps) {
    let compressed = u.uniqBy(steps, 'oldElement')
    compressed = u.reject(compressed, step => isContainedByRivalStep(compressed, step))
    return compressed
  }

  /*-
  [Aborts requests](/aborting-requests) targeting a fragment or layer.

  Always emits the event `up:fragment:aborted`, regardless of whether there were requests to abort.
  If a request was aborted, the event `up:request:aborted` will also be emitted.

  There is also a low-level `up.network.abort()` function, which aborts requests
  matching arbitrary conditions.

  ### Aborting requests targeting a fragment

  To abort pending requests [targeting](/targeting-fragments) an element or its descendants,
  pass a reference or CSS selector for that element:

  ```js
  up.fragment.abort(element)
  up.fragment.abort('.foo')
  ```

  You may also pass an `{ origin }` or `{ layer }` option to help look up the selector.

  ### Aborting requests targeting a layer

  To abort all requests targeting elements on a given layer,
  pass a [`{ layer }` option](/layer-option):

  ```js
  up.fragment.abort({ layer: 'root' })
  ```

  ### Aborting all requests

  This would abort requests targeting any elements on any layer:

  ```js
  up.fragment.abort({ layer: 'any' })
  ```

  @function up.fragment.abort
  @param {string|Element|List<Element>} [element]
    The element for which requests should be aborted.

    May be omitted with `{ layer }` option.
  @param {string|up.Layer} [options.layer]
    The [layer](/layer-option) for which requests should be aborted.

    May be omitted with `element` argument.
  @param {Element} [options.origin]
    The element causing requests to be aborted.

    This is used to look up an `element` selector or `{ layer }` name.
  @param {string} [options.reason]
    The reason for aborting requests.

    The promise by an aborted `up.request()` will reject with this reason.

    If omitted a default message will describe the abort conditions.
  @param {up.Request} [options.except]
    A request that should not be aborted, even if it matches
    the conditions above.

    @experimental
  @experimental
  */
  function abort(...args) {
    let options = parseTargetAndOptions(args)

    // The function that checks whether a given function will be aborted.
    let testFn

    // The reason will be logged with the up:request:abort event when we actually abort an event.
    // It should be a string, not an array that goes through sprintf().
    let { reason, newLayer } = options

    // At the end we're going to emit up:fragment:aborted on these elements.
    // Other async code observing these elements can then chose to abort itself.
    let elements

    // An element can be passed as first argument (public API) or as { target } option.
    // There's also an internal API that { target } can be an array of elements.
    // This is used by up.RenderJob.
    if (options.target) {
      // If we're given an element or selector, we abort all requests
      // targeting that subtree.
      elements = getAll(options.target, options)
      testFn = (request) => request.isPartOfSubtree(elements)
      reason ||= 'Aborting requests within fragment'
    } else {
      // If we're not given an element or selector, we abort all layers
      // matching the { layer } option. If no { layer } option is given,
      // all requests in the current layer are aborted.
      //
      // This behavior is slightly inconsistent with that of other up.fragment
      // functions, which operate on the main element if no other target is given.
      // However, when we navigate on a layer, we want to abort *all* requests on
      // that layer, even requests with a target outside of main, e.g. a nav bar.
      let layers = up.layer.getAll(options)
      elements = u.map(layers, 'element')
      testFn = (request) => u.contains(layers, request.layer)
      reason ||= 'Aborting requests within ' + layers.join(', ')
    }

    let testFnWithAbortable = (request) => request.abortable && testFn(request)
    up.network.abort(testFnWithAbortable, { ...options, reason })

    // We *always* emit an `up:fragment:aborted` event, even when there is no
    // request being aborted. This event serves for *any* async code that may want
    // to abort itself, e.g. timers waiting for a delay.
    for (let element of elements) {
      // Some effort has invested to log about aborting only when necessary:
      //
      // (1) We don't log on up:fragment:aborted. This event is emitted with *every*
      //     fragment update, whether or not we're actually aborting requests. Logging
      //     with every update would make the log noisy and confusing.
      // (2) When we *do* abort a request, up:request:aborted is emitted and logged.
      //     This is done in up.Request#setAbortedState().
      // (3) When up.fragment.abort() is called via up.render({ abort }) we also log
      //     a message "Change with { abort } option will abort other requests' before
      //     we abort the first request. This is done via an { logOnce } option that
      //     this function passes on to up.network.abort().
      up.emit(element, 'up:fragment:aborted', { newLayer, log: false })
    }
  }

  /*-
  This event is emitted when requests for an element were [aborted](/aborting-requests).

  This event is emitted on the element for which requests were aborted.
  If requests for entire layer were aborted, this event is emitted the
  [layer's outmost element](/up.Layer.prototype.element).

  To simplify working with this event, the function `up.fragment.onAborted()` is also provided.

  > [note]
  > This event will *not* be emitted by the low-level `up.network.abort()` function.

  ### Example

  This would run code when an element or its descendants were aborted:

  ```js
  up.on(element, 'up:fragment:aborted', function(event) {
    // element or its descendants were aborted
  })
  ```

  A more common use case is to run code when an element *or one of its ancestors*
  were aborted:

    ```js
  // Listen to all up:fragment:aborted events in case an ancestor
  let off = up.on('up:fragment:aborted', function(event) {
     if (event.target.contains(element)) {
        // element or its ancestors were aborted
     }
  })
  // Because we're registering a global event listener, we should
  // clean up when `element` is destroyed.
  up.destructor(element, off)
  ```

  > [tip]
  > To simplify observing an element and its ancestors for aborted requests,
  > the function `up.fragment.onAborted()` is provided.

  @event up:fragment:aborted
  @param {Element} event.target
    The element for which requests were aborted.
  @param {boolean} event.newLayer
    Whether the fragment was aborted by a [new overlay opening](/opening-overlays).

    @experimental
  @experimental
  */

  /*-
  Runs a callback when the given element *or its ancestors* were [aborted](/aborting-requests).

  This utility function simplifies consumption of the `up:fragment:aborted` event.

  ### Example

  Let's say we want to [reload](/up.reload) an element after 10 seconds.
  If requests for that element were [aborted](/aborting-requests) before the
  10 seconds are over, we no no longer want to reload:

  ```js
  let timeout = setTimeout(() => up.reload(element), 10000)
  up.fragment.onAborted(element, () => clearTimeout(timeout))
  ```

  @function up.fragment.onAborted
  @param {Element} element
  @param {Function(event)} callback
    The callback to run.

    It will be called with an `up:fragment:aborted` argument.
  @return {Function}
    A function that unsubscribes the callback.
  @experimental
  */
  function onAborted(fragment, ...args) {
    let callback = u.extractCallback(args)
    let options = u.extractOptions(args)
    let guard = (event) => event.target.contains(fragment) || (options.around && fragment.contains(event.target))
    let unsubscribe = up.on('up:fragment:aborted', { guard }, callback)
    // Since we're binding to an element that is an ancestor of the fragment,
    // we need to unregister the event listener when the form is removed.
    up.destructor(fragment, unsubscribe)
    return unsubscribe
  }

  up.on('up:framework:boot', function() {
    const { documentElement } = document
    documentElement.setAttribute('up-source', u.normalizeURL(location.href, { hash: false }))
    up.hello(documentElement)

    if (!up.browser.canPushState()) {
      return up.warn('Cannot push history changes. Next fragment update will load in a new page.')
    }
  })

  up.on('up:framework:reset', reset)

  return {
    config,
    reload,
    destroy,
    render,
    navigate,
    get: getSmart,
    getDumb,
    all: getAll,
    subtree: getSubtree,
    contains,
    closest,
    source: sourceOf,
    visit,
    markAsDestroying: markFragmentAsDestroying,
    emitInserted: emitFragmentInserted,
    emitDestroyed: emitFragmentDestroyed,
    emitKeep: emitFragmentKeep,
    successKey,
    failKey,
    expandTargets,
    resolveOrigin,
    toTarget,
    tryToTarget,
    isTargetable,
    matches,
    hasAutoHistory,
    time: timeOf,
    etag: etagOf,
    shouldRevalidate,
    abort,
    onAborted,
    splitTarget,
    parseTargetSteps,
    isAlive,
    targetForSteps,
    compressNestedSteps,
    // timer: scheduleTimer
  }
})()

up.reload = up.fragment.reload
up.destroy = up.fragment.destroy
up.render = up.fragment.render
up.navigate = up.fragment.navigate
up.visit = up.fragment.visit

/*-
Returns the current [context](/context).

This is aliased as `up.layer.context`.

@property up.context
@param {Object} context
  The context object.

  If no context has been set an empty object is returned.
@experimental
*/
u.delegate(up, ['context'], () => up.layer.current)
