u = up.util
e = up.element

###**
Fragment update API
===================
  
The `up.fragment` module exposes a high-level Javascript API to [update](/up.replace) or
[destroy](/up.destroy) page fragments.

Fragments are [compiled](/up.compiler) elements that can be updated from a server URL.
They also exist on a layer (page, modal, popup).

Most of Unpoly's functionality (like [fragment links](/up.link) or [modals](/up.modal))
is built from `up.fragment` functions. You may use them to extend Unpoly from your
[custom Javascript](/up.syntax).

@module up.fragment
###
up.fragment = do ->

  ###**
  Configures defaults for fragment updates.

  @property up.fragment.config

  @param {Array<string>} [config.mainTargets=['[up-main]', 'main', ':layer']]
    An array of CSS selectors matching default render targets.

    When no other render target is given, Unpoly will try to find and replace a main target.

    When [navigating](/navigation) to a main target, Unpoly will automatically
    [reset scroll positions](/scroll-option) and
    [update the browser history](/up.render#options.history).

    This property is aliased as [`up.layer.config.any.mainTargets`](up.layer.config#config.any.mainTargets).

  @param {Array<string|RegExp>} [config.badTargetClasses]
    An array of class names that should be ignored when
    [deriving a target selector from a fragment](/up.fragment.toTarget).

    The class names may also be passed as a regular expression.

  @param {Object} [config.navigateOptions]
    An object of default options to apply when [navigating](/navigation).

  @param {boolean} [config.matchAroundOrigin]
    Whether to match an existing fragment around the triggered link.

    If set to `false` Unpoly will replace the first fragment
    matching the given target selector in the link's [layer](/up.layer).

  @param {Array<string>} [config.autoHistoryTargets]
    When an updated fragments contain an element matching one of the given CSS selectors, history will be updated with `{ history: 'auto' }`.

    By default Unpoly will auto-update history when updating a [main target](#config.mainTargets).

  @param {boolean|string|Function(Element)} [config.autoScroll]
    How to scroll after updating a fragment with `{ scroll: 'auto' }`.

    See [scroll option](/scroll-option) for a list of allowed values.

    The default configuration tries, in this order:

    - If the URL has a `#hash`, scroll to the hash.
    - If updating a [main target](/main), reset scroll positions.

  @param {boolean|string|Function(Element)} [config.autoFocus]
    How to focus when updating a fragment with `{ focus: 'auto' }`.

    See [focus option](/focus-option) for a list of allowed values.

    The default configuration tries, in this order:

    - Focus a `#hash` in the URL.
    - Focus an `[autofocus]` element in the new fragment.
    - If focus was lost with the old fragment, focus the new fragment.
    - If updating a [main target](/main), focus the new fragment.

  @param {boolean} [config.runScripts=false]
    Whether to execute `<script>` tags in updated fragments.

    Scripts will load asynchronously, with no guarantee of execution order.

    If you set this to `true`, mind that the `<body>` element is a default
    [main target](/main). If you are including your global application scripts
    at the end of your `<body>`
    for performance reasons, swapping the `<body>` will re-execute these scripts.
    In that case you must configure a different main target that does not include
    your application scripts.

  @stable
  ###
  config = new up.Config ->
    badTargetClasses: [/^up-/]
    # These defaults will be set to both success and fail options
    # if { navigate: true } is given.
    navigateOptions: {
      focus: 'auto'
      scroll: 'auto'
      solo: true      # preflight
      feedback: true  # preflight
      fallback: true
      history: 'auto'
      peel: true
      cache: 'auto'
    }

    matchAroundOrigin: true

    runScripts: false

    autoHistoryTargets: [':main']

    autoFocus: ['hash', 'autofocus', 'main-if-main', 'target-if-lost']

    autoScroll: ['hash', 'layer-if-main']

  # Users who are not using layers will prefer settings default targets
  # as up.fragment.config.mainTargets instead of up.layer.config.any.mainTargets.
  u.delegate config, 'mainTargets', -> up.layer.config.any

  reset = ->
    config.reset()

  ###**
  Returns the URL the given element was retrieved from.

  If the given element was never directly updated, but part of a larger fragment update,
  the closest known source of an ancestor element is returned.

  \#\#\# Example

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
  ###
  sourceOf = (element, options = {}) ->
    element = getSmart(element, options)
    return e.closestAttr(element, 'up-source')

  ###**
  Returns a timestamp for the last modification of the content in the given element.

  @function up.fragment.time
  @param {Element} element
  @return {string}
  @internal
  ###
  timeOf = (element) ->
    return e.closestAttr(element, 'up-time') || '0'

  ###**
  Sets this element's source URL for [reloading](/up.reload) and [polling](/up-poll)

  When an element is reloaded, Unpoly will make a request from the URL
  that originally brought the element into the DOM. You may use `[up-source]` to
  use another URL instead.

  \#\#\# Example

  Assume an application layout with an unread message counter.
  You use `[up-poll]` to refresh the counter every 30 seconds.

  By default this would make a request to the URL that originally brought the
  counter element into the DOM. To save the server from rendering a lot of
  unused HTML, you may poll from a different URL like so:

      <div class="unread-count" up-poll up-source="/unread-count">
        2 new messages
      </div>

  @selector [up-source]
  @param {String} up-source
    The URL from which to reload this element.
  @stable
  ###

  ###**
  Replaces elements on the current page with matching elements from a server response or HTML string.

  The current and new elements must both match the same CSS selector.
  The selector is either given as `{ target }` option,
  or a [main target](/main) is used as default.

  See the [fragment placement](/fragment-placement) selector for many examples for how you can target content.

  This function has many options to enable scrolling, focus, request cancelation and other side
  effects. These options are all disabled by default and must be opted into one-by-one. To enable
  defaults that a user would expects for navigation (like clicking a link),
  pass [`{ navigate: true }`](#options.navigate) or use `up.navigate()` instead.

  \#\#\# Passing the new fragment

  The new fragment content can be passed as one of the following options:

  - [`{ url }`](#options.url) fetches and renders content from the server
  - [`{ document }`](#options.document) renders content from a given HTML document string or partial document
  - [`{ fragment }`](#options.fragment) renders content from a given HTML string that only contains the new fragment
  - [`{ content }`](#options-content) replaces the targeted fragment's inner HTML with the given HTML string

  \#\#\# Example

  Let's say your current HTML looks like this:

  ```html
  <div class="one">old one</div>
  <div class="two">old two</div>
  ```

  We now replace the second `<div>` by targeting its CSS class:

  ```js
  up.render({ target: '.two', url: '/new' })
  ```

  The server renders a response for `/new`:

  ```html
  <div class="one">new one</div>
  <div class="two">new two</div>
  ```

  Unpoly looks for the selector `.two` in the response and [implants](/up.extract) it into
  the current page. The current page now looks like this:

  ```html
  <div class="one">old one</div>
  <div class="two">new two</div>
  ```

  Note how only `.two` has changed. The update for `.one` was
  discarded, since it didn't match the selector.

  \#\#\# Events

  Unpoly will emit events at various stages of the rendering process:

  - `up:fragment:destroyed`
  - `up:fragment:loaded`
  - `up:fragment:inserted`

  @function up.render

  @param {string|Element|jQuery} [target]
    The CSS selector to update.

    If omitted a [main target](/main) will be rendered.

    You can also pass a DOM element or jQuery element here, in which case a selector
    will be [inferred from the element attributes](/up.fragment.toTarget). The given element
    will also be used as [`{ origin }`](#options.origin) for the fragment update.

    Instead of passing the target as the first argument, you may also pass it as
    a [´{ target }`](#options.target) option..

  @param {string|Element|jQuery} [options.target]
    The CSS selector to update.

    If omitted a [main target](/main) will be rendered.

  @param {string|boolean} [options.fallback=false]
    Specifies behavior if the [target selector](/up.render#options.target) is missing from the current page or the server response.

    If set to a CSS selector string, Unpoly will attempt to replace that selector instead.

    If set to `true` Unpoly will attempt to replace a [main target](/main) instead.

    If set to `false` Unpoly will immediately reject the render promise.

  @param {boolean} [options.navigate=false]
    Whether this fragment update is considered [navigation](/navigation).

  @param {string} [options.url]
    The URL to fetch from the server.

    Instead of making a server request, you may also pass an existing HTML string as
    [`{ document }`](#options.document), [`{ fragment }`](#options.fragment) or
    [`{ content }`](#options.content) option.

  @param {string} [options.method='get']
    The HTTP method to use for the request.

    Common values are `'get'`, `'post'`, `'put'`, `'patch'` and `'delete`'.
    The value is case insensitive.

  @param {Object|FormData|string|Array} [options.params]
    Additional [parameters](/up.Params) that should be sent as the request's
    [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

    When making a `GET` request to a URL with a query string, the given `{ params }` will be added
    to the query parameters.

  @param {Object} [options.headers={}]
    An object with additional request headers.

    Note that Unpoly will by default send a number of custom request headers.
    E.g. the `X-Up-Target` header includes the targeted CSS selector.
    See `up.protocol` and `up.network.config.metaKeys` for details.

  @param {string|Element} [options.fragment]
    A string of HTML comprising *only* the new fragment.

    The `{ target }` selector will be derived from the root element in the given
    HTML:

    ```js
    // This will update .foo
    up.render({ fragment: '<div class=".foo">inner</div>' })
    ```

    If your HTML string contains other fragments that will not be rendered, use
    the [`{ document }`](#options.document) option instead.

    If your HTML string comprises only the new fragment's [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML),
    consider the [`{ content }`](#options.content) option.

  @param {string|Element|Document} [options.document]
    A string of HTML containing the new fragment.

    The string may contain other HTML, but only the element matching the
    `{ target }` selector will be extracted and placed into the page.
    Other elements will be discarded.

    If your HTML string comprises only the new fragment, consider the [`{ fragment }`](#options.fragment)
    option instead. With `{ fragment }` you don't need to pass a `{ target }`, since
    Unpoly can derive it from the root element in the given HTML.

    If your HTML string comprises only the new fragment's [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML),
    consider the [`{ content }`](#options.content) option.

  @param {string} [options.fail='auto']
    How to render a server response with an error code.

    Any HTTP status code other than 2xx is considered an error code.

    See [handling server errors](/server-errors) for details.

  @param {boolean|string} [options.history]
    Whether the browser URL and window title will be updated.

    If set to `true`, the history will always be updated, using the title and URL from
    the server response, or from given `{ title }` and `{ location }` options.

    If set to `'auto'` history will be updated if the `{ target }` matches
    a selector in `up.fragment.config.autoHistoryTargets`. By default this contains all
    [main targets](/main).

    If set to `false`, the history will remain unchanged.

    [Overlays](/up.layer) will only change the browser URL and window title if the overlay
    has [visible history](/up.layer.historyVisible), even with `{ history: true }`.

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

    If you are [prepending or appending content](/fragment-placement#appending-or-prepending-content),
    use the `{ animation }` option instead.

  @param {string} [options.animation]
    The name of an [animation](/up.motion) to reveal a new fragment when
    [prepending or appending content](/fragment-placement#appending-or-prepending-content).

    If you are replacing content (the default), use the `{ transition }` option instead.

  @param {number} [options.duration]
    The duration of the transition or animation (in millisconds).

  @param {string} [options.easing]
    The timing function that accelerates the transition or animation.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of available timing functions.

  @param {boolean} [options.cache]
    Whether to read from and write to the [cache](/up.cache).

    With `{ cache: true }` Unpoly will try to re-use a cached response before connecting
    to the network. If no cached response exists, Unpoly will make a request and cache
    the server response.

    Also see [`up.request({ cache })`](/up.request#options.cache).

  @param {boolean|string} [options.clearCache]
    Whether existing [cache](/up.cache) entries will be cleared with this request.

    By default a non-GET request will clear the entire cache.
    You may also pass a [URL pattern](/url-patterns) to only clear matching requests.

    Also see [`up.request({ clearCache })`](/up.request#options.clearCache) and `up.network.config.clearCache`.

  @param {Element|jQuery} [options.origin]
    The element that triggered the change.

    When multiple elements in the current page match the `{ target }`,
    Unpoly will replace an element in the [origin's vicinity](/fragment-placement).

    The origin's selector will be substituted for `:origin` in a target selector.

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

  @param {boolean} [options.keep=true]
    Whether [`[up-keep]`](/up-keep) elements will be preserved in the updated fragment.

  @param {boolean} [options.hungry=true]
    Whether [`[up-hungry]`](/up-hungry) elements outside the updated fragment will also be updated.

  @param {boolean|string|Element|Function} [options.scroll]
    How to scroll after the new fragment was rendered.

    See [scroll option](/scroll-option) for a list of allowed values.

  @param {boolean} [options.saveScroll=true]
    Whether to save scroll positions before updating the fragment.

    Saved scroll positions can later be restored with [`{ scroll: 'restore' }`](/scroll-option#restoring-scroll-options).

  @param {boolean|string|Element|Function} [options.focus]
    What to focus after the new fragment was rendered.

    See [focus option](/focus-option) for a list of allowed values.

  @param {string} [options.confirm]
    A message the user needs to confirm before fragments are updated.

    The message will be shown as a [native browser prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt).

    If the user does not confirm the render promise will reject and no fragments will be updated.

  @param {boolean|Element} [options.feedback]
    Whether to give the [`{ origin }`](#options.origin) element an `.up-active` class
    while loading and rendering content.

    May also pass an element which should receive the `.up-active` class.

  @param {Function(Event)} [options.onLoaded]
    A callback that will be run when when the server responds with new HTML,
    but before the HTML is rendered.

    The callback argument is a preventable `up:fragment:loaded` event.

  @param {Function()} [options.onFinished]
    A callback that will be run when all animations have concluded and
    elements were removed from the DOM tree.

  @return {Promise<up.RenderResult>}
    A promise that fulfills when the page has been updated.

    If the update is animated, the promise will be resolved *before* the existing element was
    removed from the DOM tree. The old element will be marked with the `.up-destroying` class
    and removed once the animation finishes. To run code after the old element was removed,
    pass an `{ onFinished }` callback.

    The promise will fulfill with an `up.RenderResult` that contains
    references to the updated fragments and layer.

  @stable
  ###
  render = up.mockable (args...) ->
    # Convert thrown errors into rejected promises.
    # Convert non-promise values into a resolved promise.
    return u.asyncify ->
      options = parseTargetAndOptions(args)
      options = up.RenderOptions.preprocess(options)

      up.browser.assertConfirmed(options)

      if guardEvent = u.pluckKey(options, 'guardEvent')
        # Allow guard event handlers to manipulate render options for the default behavior.
        #
        # Note that we have removed { guardEvent } from options to not recursively define
        # guardEvent.renderOptions.guardEvent. This would cause an infinite loop for event
        # listeners that prevent the default and re-render.
        guardEvent.renderOptions = options
        up.event.assertEmitted(guardEvent, { target: options.origin })

      up.RenderOptions.assertContentGiven(options)

      if options.url
        return renderRemoteContent(options)
      else
        return renderLocalContent(options)

  renderRemoteContent = (options) ->
    # Rendering a remote URL is an async operation.
    # We give feedback (.up-active) while the fragment is loading.
    return up.feedback.aroundForOptions options, ->
      return new up.Change.FromURL(options).execute()

  renderLocalContent = (options) ->
    # When we have a given { url }, the { solo } option is honored by up.request().
    # But up.request() is never called when we have local content given as { document },
    # { content } or { fragment }. Hence we abort here.
    up.network.mimicLocalRequest(options)

    # (1) No need to give feedback as local changes are sync.
    # (2) Value will be converted to a fulfilled promise by up.util.asyncify() in render().
    return new up.Change.FromContent(options).execute()

  ###**
  [Navigates](/navigation) to the given URL by updating a major fragment in the current page.

  `up.navigate()` will mimic a click on a vanilla `<a href>` link to satisfy user expectations
  regarding scrolling, focus, request cancelation and [many other side effects](/navigation).

  Instead of calling `up.navigate()` you may also call `up.render({ navigate: true }`) option
  for the same effect.

  @function up.navigate
  @param {string|Element|jQuery} [target]
    The CSS selector to update.

    If omitted a [main target](/main) will be rendered.

    You can also pass a DOM element or jQuery element here, in which case a selector
    will be [inferred from the element attributes](/up.fragment.target). The given element
    will also be set as the `{ origin }` option.

    Instead of passing the target as the first argument, you may also pass it as
    [´{ target }` option](/up.fragment.render#options.target).
  @param {Object} [options]
    See options for `up.render()`.
  @stable
  ###
  navigate = up.mockable (args...) ->
    options = parseTargetAndOptions(args)
    return render(u.merge(options, navigate: true))

  ###**
  This event is [emitted](/up.emit) when the server responds with the HTML, before
  the HTML is used to [change a fragment](/up.render).

  Event listeners may call `event.preventDefault()` on an `up:fragment:loaded` event
  to prevent any changes to the DOM and browser history. This is useful to detect
  an entirely different page layout (like a maintenance page or fatal server error)
  which should be open with a full page load:

      up.on('up:fragment:loaded', (event) => {
        let isMaintenancePage = event.response.getHeader('X-Maintenance')

        if (isMaintenancePage) {
          // Prevent the fragment update and don't update browser history
          event.preventDefault()

          // Make a full page load for the same request.
          event.request.loadPage()
        }
      })

  Instead of preventing the update, listeners may also access the `event.renderOptions` object
  to mutate options to the `up.render()` call that will process the server response.

  @event up:fragment:loaded
  @param event.preventDefault()
    Event listeners may call this method to prevent the fragment change.
  @param {up.Request} event.request
    The original request to the server.
  @param {up.Response} event.response
    The server response.
  @param {Object} event.renderOptions
    Options for the `up.render()` call that will process the server response.
  ###

  ###**
  Elements with an `up-keep` attribute will be persisted during
  [fragment updates](/up.fragment).

  The element you're keeping should have an umambiguous class name, ID or `[up-id]`
  attribute so Unpoly can find its new position within the page update.

  Emits events [`up:fragment:keep`](/up:fragment:keep) and [`up:fragment:kept`](/up:fragment:kept).

  \#\#\# Example

  The following `<audio>` element will be persisted through fragment
  updates as long as the responses contain an element matching `#player`:


  ```html
  <audio id="player" up-keep src="song.mp3"></audio>
  ```

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

      up.compiler('audio', function(element) {
        element.addEventListener('up:fragment:keep', function(event) {
          if element.getAttribute('src') !== event.newElement.getAttribute('src') {
            event.preventDefault()
          }
        })
      })

  If we don't want to solve this on the client, we can achieve the same effect
  on the server. By setting the value of the `up-keep` attribute we can
  define the CSS selector used for matching elements.

      <audio up-keep="audio[src='song.mp3']" src="song.mp3"></audio>

  Now, if a response no longer contains an `<audio src="song.mp3">` tag, the existing
  element will be destroyed and replaced by a fragment from the response.

  @selector [up-keep]
  @param up-on-keep
    Code to run before an existing element is kept during a page update.

    The code may use the variables `event` (see `up:fragment:keep`),
    `this` (the old fragment), `newFragment` and `newData`.
  @stable
  ###

  ###**
  This event is [emitted](/up.emit) before an existing element is [kept](/up-keep) during
  a page update.

  Event listeners can call `event.preventDefault()` on an `up:fragment:keep` event
  to prevent the element from being persisted. If the event is prevented, the element
  will be replaced by a fragment from the response.

  @event up:fragment:keep
  @param event.preventDefault()
    Event listeners may call this method to prevent the element from being preserved.
  @param {Element} event.target
    The fragment that will be kept.
  @param {Element} event.newFragment
    The discarded element.
  @param {Object} event.newData
    The value of the [`up-data`](/up-data) attribute of the discarded element,
    parsed as a JSON object.
  @stable
  ###

  ###**
  This event is [emitted](/up.emit) when an existing element has been [kept](/up-keep)
  during a page update.

  Event listeners can inspect the discarded update through `event.newElement`
  and `event.newData` and then modify the preserved element when necessary.

  @event up:fragment:kept
  @param {Element} event.target
    The fragment that has been kept.
  @param {Element} event.newFragment
    The discarded fragment.
  @param {Object} event.newData
    The value of the [`up-data`](/up-data) attribute of the discarded fragment,
    parsed as a JSON object.
  @stable
  ###

  ###**
  Compiles a page fragment that has been inserted into the DOM
  by external code.

  **As long as you manipulate the DOM using Unpoly, you will never
  need to call this method.** You only need to use `up.hello()` if the
  DOM is manipulated without Unpoly' involvement, e.g. by setting
  the `innerHTML` property or calling jQuery methods like
  `html`, `insertAfter` or `appendTo`:

  ```html
  element = document.createElement('div')
  element.innerHTML = '... HTML that needs to be activated ...'
  up.hello(element)
  ```

  This function emits the [`up:fragment:inserted`](/up:fragment:inserted)
  event.

  @function up.hello
  @param {Element|jQuery} target
  @param {Element|jQuery} [options.origin]
  @return {Element}
    The compiled element
  @stable
  ###
  hello = (element, options = {}) ->
    # If passed a selector, up.fragment.get() will prefer a match on the current layer.
    element = getSmart(element)

    # Callers may pass descriptions of child elements that were [kept](/up-keep)
    # as { options.keepPlans }. For these elements up.hello() emits an event
    # up:fragment:kept instead of up:fragment:inserted.
    #
    # We will also pass an array of kept child elements to up.hello() as { skip }
    # so they won't be compiled a second time.
    keepPlans = options.keepPlans || []
    skip = keepPlans.map (plan) ->
      emitFragmentKept(plan)
      return plan.oldElement

    up.syntax.compile(element, { skip, layer: options.layer })
    emitFragmentInserted(element, options)

    return element

  ###**
  When any page fragment has been [inserted or updated](/up.replace),
  this event is [emitted](/up.emit) on the fragment.

  If you're looking to run code when a new fragment matches
  a selector, use `up.compiler()` instead.

  \#\#\# Example

      up.on('up:fragment:inserted', function(event, fragment) {
        console.log("Looks like we have a new %o!", fragment)
      })

  @event up:fragment:inserted
  @param {Element} event.target
    The fragment that has been inserted or updated.
  @stable
  ###
  emitFragmentInserted = (element, options) ->
    up.emit element, 'up:fragment:inserted',
      log: ['Inserted fragment %o', element]
      origin: options.origin

  emitFragmentKeep = (keepPlan) ->
    log = ['Keeping fragment %o', keepPlan.oldElement]
    callback = e.callbackAttr(keepPlan.oldElement, 'up-on-keep', ['newFragment', 'newData'])
    emitFromKeepPlan(keepPlan, 'up:fragment:keep', { log, callback })

  emitFragmentKept = (keepPlan) ->
    log = ['Kept fragment %o', keepPlan.oldElement]
    emitFromKeepPlan(keepPlan, 'up:fragment:kept', { log })

  emitFromKeepPlan = (keepPlan, eventType, emitDetails) ->
    keepable = keepPlan.oldElement

    event = up.event.build(eventType,
      newFragment: keepPlan.newElement
      newData: keepPlan.newData
    )

    up.emit(keepable, event, emitDetails)

  emitFragmentDestroyed = (fragment, options) ->
    log = options.log ? ['Destroyed fragment %o', fragment]
    parent = options.parent || document
    up.emit(parent, 'up:fragment:destroyed', { fragment, parent, log })

  isDestroying = (element) ->
    !!e.closest(element, '.up-destroying')

  isNotDestroying = (element) ->
    !isDestroying(element)

  ###**
  Returns the first fragment matching the given selector.

  This function differs from `document.querySelector()` and `up.element.get()`:

  - This function only selects elements in the [current layer](/up.layer.current).
    Pass a `{ layer }`option to match elements in other layers.
  - This function ignores elements that are being [destroyed](/up.destroy) or that are being
    removed by a [transition](/up.morph).
  - This function prefers to match elements in the vicinity of a given `{ origin }` element (optional).
  - This function supports non-standard CSS selectors like `:main` and `:has()`.

  If no element matches these conditions, `undefined` is returned.

  \#\#\# Example: Matching a selector in a layer

  To select the first element with the selector `.foo` on the [current layer](/up.layer.current):

      let foo = up.fragment.get('.foo')

  You may also pass a `{ layer }` option to match elements within another layer:

      let foo = up.fragment.get('.foo', { layer: 'any' })

  \#\#\# Example: Matching the descendant of an element

  To only select in the descendants of an element, pass a root element as the first argument:

      let container = up.fragment.get('.container')
      let fooInContainer = up.fragment.get(container, '.foo')

  \#\#\# Example: Matching around an origin element

  When processing a user interaction, it is often helpful to match elements around the link
  that's being clicked or the form field that's being changed. In this case you may pass
  the triggering element as `{ origin }` element.

  Assume the following HTML:

  ```html
  <div class="element"></div>
  <div class="element">
    <a href="..."></a>
  </div>
  ```

  When processing an event for the `<a href"...">` you can pass the link element
  as `{ origin }` to match the closest element in the link's ancestry:

  ```javascript
  let link = event.target
  up.fragment.get('.element') // returns the first .element
  up.fragment.get('.element', { origin: link }) // returns the second .element
  ```

  When the link's does not have an ancestor matching `.element`,
  Unpoly will search the entire layer for `.element`.

  \#\#\# Example: Matching an origin sibling

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

  ```javascript
  let link = event.target
  up.fragment.get('.element .inner') // returns the first .inner
  up.fragment.get('.element .inner', { origin: link }) // returns the second .inner
  ```

  Note that when the link's `.element` container does not have a child `.inner`,
  Unpoly will search the entire layer for `.element .inner`.

  \#\#\# Similar features

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
  @param {string|Element|jQuery} [options.origin]
    An second element or selector that can be referenced as `&` in the first selector.
  @return {Element|undefined}
    The first matching element, or `undefined` if no such element matched.
  @stable
  ###
  getSmart = (args...) ->
    options = u.extractOptions(args)
    selector = args.pop()
    root = args[0]

    if u.isElementish(selector)
      # up.fragment.get(root: Element, element: Element, [options]) should just return element.
      # The given root and options are ignored. We also don't check if it's destroying.
      # We do use e.get() to unwrap a jQuery collection.
      return e.get(selector)

    if root
      # We don't match around { origin } if we're given a root for the search.
      return getDumb(root, selector, options)

    # If we don't have a root element we will use a context-sensitive lookup strategy
    # that tries to match elements in the vicinity of { origin } before going through
    # the entire layer.
    finder = new up.FragmentFinder(
      selector: selector
      origin: options.origin
      layer: options.layer
    )
    return finder.find()

  getDumb = (args...) ->
    return getAll(args...)[0]

  CSS_HAS_SUFFIX_PATTERN = /\:has\(([^\)]+)\)$/

  ###**
  Returns all elements matching the given selector, but
  ignores elements that are being [destroyed](/up.destroy) or that are being
  removed by a [transition](/up.morph).

  By default this function only selects elements in the [current layer](/up.layer.current).
  Pass a `{ layer }`option to match elements in other layers. See `up.layer.get()` for a list
  of supported layer values.

  Returns an empty list if no element matches these conditions.

  \#\#\# Example

  To select all elements with the selector `.foo` on the [current layer](/up.layer.current):

      let foos = up.fragment.all('.foo')

  You may also pass a `{ layer }` option to match elements within another layer:

      let foos = up.fragment.all('.foo', { layer: 'any' })

  To select in the descendants of an element, pass a root element as the first argument:

      var container = up.fragment.get('.container')
      var foosInContainer = up.fragment.all(container, '.foo')

  \#\#\# Similar features

  - The [`.up-destroying`](/up-destroying) class is assigned to elements during their removal animation.
  - The [`up.element.all()`](/up.element.get) function simply returns the all elements matching a selector
    without further filtering.

  @function up.fragment.get

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
    An second element or selector that can be referenced as `&` in the first selector:

        var input = document.querySelector('input.email')
        up.fragment.get('fieldset:has(&)', { origin: input }) // returns the <fieldset> containing input

  @return {Element|undefined}
    The first matching element, or `undefined` if no such element matched.
  @stable
  ###
  getAll = (args...) ->
    options = u.extractOptions(args)
    selector = args.pop()
    root = args[0]

    # (1) up.fragment.all(rootElement, selector) should find selector within
    #     the descendants of rootElement.
    # (2) up.fragment.all(selector) should find selector within the current layer.
    # (3) up.fragment.all(selector, { layer }) should find selector within the given layer(s).
    selector = parseSelector(selector, root, options)
    return selector.descendants(root || document)

  ###**
  Your target selectors may use this pseudo-selector
  to replace an element with an descendant matching the given selector.

  \#\#\# Example

  `up.render('div:has(span)', { url: '...' })`  replaces the first `<div>` elements with at least one `<span>` among its descendants:

  ```html
  <div>
    <span>Will be replaced</span>
  </div>
  <div>
    Will NOT be replaced
  </div>
  ```

  \#\#\# Compatibility

  `:has()` is supported by target selectors like `a[up-target]` and `up.render({ target })`.

  As a [level 4 CSS selector](https://drafts.csswg.org/selectors-4/#relational),
  `:has()` [has yet to be implemented](https://caniuse.com/#feat=css-has)
  in native browser functions like [`document.querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).

  You can also use [`:has()` in jQuery](https://api.jquery.com/has-selector/).

  @selector :has()
  @stable
  ###

  ###**
  Returns a list of the given parent's descendants matching the given selector.
  The list will also include the parent element if it matches the selector itself.

  @function up.fragment.subtree
  @param {Element} parent
    The parent element for the search.
  @param {string} selector
    The CSS selector to match.
  @param {up.Layer|string|Element}
    [options.layer]
  @return {NodeList<Element>|Array<Element>}
    A list of all matching elements.
  @experimental
  ###
  getSubtree = (element, selector, options = {}) ->
    selector = parseSelector(selector, element, options)
    return selector.subtree(element)

  contains = (element, selector) ->
    getSubtree(element, selector).length > 0

  ###**
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
  @experimental
  ###
  closest = (element, selector, options) ->
    element = e.get(element)
    selector = parseSelector(selector, element, options)
    return selector.closest(element)

  ###**
  Destroys the given element or selector.

  All [`up.compiler()`](/up.compiler) destructors, if any, are called.
  The element is then removed from the DOM.

  Emits events [`up:fragment:destroyed`](/up:fragment:destroyed).

  \#\#\# Animating the removal

  You may animate the element's removal by passing an option like `{ animate: 'fade-out' }`.
  Unpoly ships with a number of [predefined animations](/up.animate#named-animations) and
  you may so define [custom animations](/up.animation).

  If the element's removal is animated, the element will remain in the DOM until after the animation
  has completed. While the animation is running the element will be given the `.up-destroying` class.
  The element will also be given the `[aria-hidden]` attribute to remove it from
  the accessibility tree.

  Elements that are about to be destroyed (but still animating) are ignored by all
  functions for fragment lookup:

  - `up.fragment.all()`
  - `up.fragment.get()`
  - `up.fragment.closest()`

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
  ###
  destroy = (args...) ->
    options = parseTargetAndOptions(args)

    if options.element = getSmart(options.target, options)
      new up.Change.DestroyFragment(options).execute()

    return up.migrate.formerlyAsync?('up.destroy()')

  parseTargetAndOptions = (args) ->
    options = u.parseArgIntoOptions(args, 'target')
    if u.isElement(options.target)
      options.origin ||= options.target
    options

  ###**
  Elements are assigned the `.up-destroying` class before they are [destroyed](/up.destroy)
  or while they are being removed by a [transition](/up.morph).

  If the removal is [animated](/up.destroy#animating-the-removal),
  the class is assigned before the animation starts.

  Elements that are about to be destroyed (but still animating) are ignored by all
  functions for fragment lookup:

  - `up.fragment.all()`
  - `up.fragment.get()`
  - `up.fragment.closest()`

  @selector .up-destroying
  @stable
  ###

  markFragmentAsDestroying = (element) ->
    element.classList.add('up-destroying')
    element.setAttribute('aria-hidden', 'true')

  ###**
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
  ###

  ###**
  Replaces the given element with a fresh copy fetched from the server.

  By default, reloading is not considered a [user navigation](/navigation) and e.g. will not update
  the browser location. You may change this with `{ navigate: true }`.

  \#\#\# Example

      up.on('new-mail', function() { up.reload('.inbox') })

  \#\#\# Controlling the URL that is reloaded

  Unpoly remembers [the URL from which a fragment was loaded](/up.fragment.source),
  so you don't usually need to pass a URL when reloading.

  To reload from another URL, pass a `{ url }` option or set an `[up-source]` attribute
  on the element or its ancestors.

  \#\#\# Skipping updates when nothing changed

  TODO: Document [up-time] and X-Up-Reload-From-Time (currently both documented in `X-Up-Reload-From-Time`).

  @function up.reload
  @param {string|Element|jQuery} [target]
    The element that should be reloaded.

    If omitted, an element matching a selector in `up.fragment.config.mainTargets`
    will be reloaded.
  @param {Object} [options]
    See options for `up.render()`.
  @param {string} [options.url]
    The URL from which to reload the fragment.
    This defaults to the URL from which the fragment was originally loaded.
  @param {string} [options.navigate=false]
    Whether the reloading constitutes a [user navigation](/navigation).
  @stable
  ###
  reload = (args...) ->
    options = parseTargetAndOptions(args)
    options.target ||= ':main'
    element = getSmart(options.target, options)
    options.url ?= sourceOf(element)
    options.headers ||= {}
    options.headers[up.protocol.headerize('reloadFromTime')] = timeOf(element)
    return render(options)

  ###**
  Fetches this given URL with JavaScript and [replaces](/up.replace) the
  [current layer](/up.layer.current)'s [main element](/up.fragment.config#config.mainSelectors)
  with a matching fragment from the server response.

  \#\#\# Example

  This would replace the current page with the response for `/users`:

      up.visit('/users')

  @function up.visit
  @param {string} url
    The URL to visit.
  @param {Object} [options]
    See options for `up.render()`.
  @param {up.Layer|string|number} [options.layer='current']
  @stable
  ###
  visit = (url, options) ->
    navigate(u.merge({ url }, options))

  successKey = (key) ->
    return u.unprefixCamelCase(key, 'fail')

  failKey = (key) ->
    unless key.match(/^fail[A-Z]/)
      return u.prefixCamelCase(key, 'fail')

  ###**
  Returns a CSS selector that matches the given element as good as possible.

  To build the selector, the following element properties are used in decreasing
  order of priority:

  - The element's `[up-id]` attribute
  - The element's `[id]` attribute
  - The element's `[name]` attribute
  - The element's `[class]` names, ignoring `up.fragment.config.badTargetClasses`.
  - The element's tag name

  \#\#\# Example

      element = document.createElement('span')
      element.className = 'klass'
      selector = up.fragment.toTarget(element) // returns '.klass'

  @function up.fragment.toTarget
  @param {string|Element|jQuery}
    The element for which to create a selector.
  @stable
  ###
  toTarget = (element) ->
    if u.isString(element)
      return element

    # In case we're called called with a jQuery collection
    element = e.get(element)

    if e.isSingleton(element)
       return e.elementTagName(element)
     else if upId = element.getAttribute("up-id")
       return e.attributeSelector('up-id', upId)
     else if id = element.getAttribute("id")
       return e.idSelector(id)
     else if name = element.getAttribute("name")
       return e.elementTagName(element) + e.attributeSelector('name', name)
     else if goodClasses = u.presence(u.filter(element.classList, isGoodClassForTarget))
      selector = ''
      for klass in goodClasses
        # Escape colons in klass to satisfy querySelector
        klass = klass.replace(/:/, '\\:')
        selector += ".#{klass}"
      return selector
     else
       return e.elementTagName(element)


  ###**
  Sets an unique identifier for this element.

  This identifier is used by `up.fragment.toSelector()`
  to create a CSS selector that matches this element precisely.

  If the element already has other attributes that make a good identifier,
  like a good `[id]` or `[class]` attribute, it is not necessary to
  also set `[up-id]`.

  \#\#\# Example

  Take this element:

      <a href="/">Homepage</a>

  Unpoly cannot generate a good CSS selector for this element:

      up.fragment.toTarget(element)
      // returns 'a'

  We can improve this by assigning an `[up-id]`:

      <a href="/" up-id="link-to-home">Open user 4</a>

  The attribute value is used to create a better selector:

      up.fragment.toTarget(element)
      // returns '[up-id="link-to-home"]'

  @selector [up-id]
  @param up-id
    A string that uniquely identifies this element.
  @stable
  ###

  isGoodClassForTarget = (klass) ->
    matchesPattern = (pattern) ->
      if u.isRegExp(pattern)
        pattern.test(klass)
      else
        pattern == klass
    return !u.some(config.badTargetClasses, matchesPattern)

  resolveOriginReference = (target, options = {}) ->
    origin = options.origin

    return target.replace /&|:origin\b/, (match) ->
      if origin
        return toTarget(origin)
      else
        up.fail('Missing { origin } element to resolve "%s" reference (found in %s)', match, target)

  ###**
  @internal
  ###
  expandTargets = (targets, options = {}) ->
    layer = options.layer
    unless layer == 'new' || (layer instanceof up.Layer)
      up.fail('Must pass an up.Layer as { layer } option, but got %o', layer)

    # Copy the list since targets might be a jQuery collection, and this does not support shift or push.
    targets = u.copy(u.wrapList(targets))

    expanded = []

    while targets.length
      target = targets.shift()

      if target == ':main' || target == true
        mode = if layer == 'new' then options.mode else layer.mode
        targets.unshift(up.layer.mainTargets(mode)...)
      else if target == ':layer'
        # Discard this target for new layers, which don't have a first-swappable-element.
        # Also don't && the layer check into the `else if` condition above, or it will
        # be returned as a verbatim string below.
        unless layer == 'new' || layer.opening
          targets.unshift layer.getFirstSwappableElement()
      else if u.isElementish(target)
        expanded.push toTarget(target)
      else if u.isString(target)
        expanded.push resolveOriginReference(target, options)
      else
        # @buildPlans() might call us with { target: false } or { target: nil }
        # In that case we don't add a plan.

    return u.uniq(expanded)

  parseSelector = (selector, element, options = {}) ->
    filters = []

    unless options.destroying
      filters.push(isNotDestroying)

    # Some up.fragment function center around an element, like closest() or matches().
    options.layer ||= element
    layers = up.layer.getAll(options)
    if options.layer != 'any' && !(element && e.isDetached(element))
      filters.push (match) -> u.some layers, (layer) -> layer.contains(match)

    expandedTargets = up.fragment.expandTargets(selector, u.merge(options, layer: layers[0]))

    expandedTargets = expandedTargets.map (target) ->
      target = target.replace CSS_HAS_SUFFIX_PATTERN, (match, descendantSelector) ->
        filters.push (element) -> element.querySelector(descendantSelector)
        return ''
      return target || '*'

    return new up.Selector(expandedTargets, filters)

  hasAutoHistory = (fragment) ->
    if contains(fragment, config.autoHistoryTargets)
      true
    else
      up.puts('up.render()', "Will not auto-update history because fragment doesn't contain a selector from up.fragment.config.autoHistoryTargets")
      false

  ###**
  A pseudo-selector that matches the layer's main target.

  Main targets are default render targets.
  When no other render target is given, Unpoly will try to find and replace a main target.

  In most app layouts the main target should match the primary content area.
  The default main targets are the HTML5 [`<main>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main) element,
  any element with an `[up-main]` attribute and the current layer's
  [topmost swappable element](/main). You may configure main target selectors
  in `up.fragment.config.mainTargets`.

  \#\#\# Example

  ```js
  up.render(':main', { url: '/page2' })
  ```

  @selector :main
  @experimental
  ###

  ###**
  To make a server request without changing a fragment, use the `:none` selector.

  \#\#\# Example

  ```html
  <a href="/ping" up-target=":none">Ping server</a>
  ```

  @selector :none
  @experimental
  ###

  ###**
  Your target selectors may use this pseudo-selector
  to reference the element that triggered the change.

  The origin element is automatically set to a link that is being [followed](/a-up-follow)
  or form that is being [submitted](/form-up-submit). When updating fragments
  programmatically through `up.render()` you may pass an origin element as an `{ origin }` option.

  Even without using an `:origin` reference, the
  [origin is considered](/fragment-placement#interaction-origin-is-considered)
  when matching fragments in the current page.

  \#\#\# Shorthand

  Instead of `:origin` you may also use the ampersand character (`&`).

  You may be familiar with the ampersand from the [Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)
  CSS preprocessor.

  @selector :origin
  @experimental
  ###

  ###**
  Your target selectors may use this pseudo-selector
  to replace the layer's topmost swappable element.

  The topmost swappable element is the first child of the layer's container element.
  For the [root layer](/up.layer.root) it is the `<body>` element. For an overlay
  it is the target with which the overlay was opened with.

  In canonical usage the topmost swappable element is often a [main element](/main).

  \#\#\# Example

  The following will replace the `<body>` element in the root layer,
  and the topmost swappable element in an overlay:

  ```js
  up.render(':layer', { url: '/page2' })
  ```

  @selector :layer
  @experimental
  ###

  ###**
  Returns whether the given element matches the given CSS selector.

  Other than `up.element.matches()` this function supports non-standard selectors
  like `:main` or `:layer`.

  @function up.fragment.matches
  @param {Element} fragment
  @param {string|Array<string>} selectorOrSelectors
  @param {string|up.Layer} options.layer
    The layer for which to match.

    Pseudo-selectors like `:main` may expand to different selectors
    in different layers.
  @param {string|up.Layer} options.mode
    Required if `{ layer: 'new' }` is passed.
  @return {boolean}
  @experimental
  ###
  matches = (element, selector, options = {}) ->
    element = e.get(element)
    selector = parseSelector(selector, element, options)
    return selector.matches(element)

  up.on 'up:app:boot', ->
    body = document.body
    body.setAttribute('up-source', up.history.location)
    hello(body)

    unless up.browser.canPushState()
      up.warn('Cannot push history changes. Next fragment update will load in a new page.')

  up.on 'up:framework:reset', reset

  u.literal
    config: config
    reload: reload
    destroy: destroy
    render: render
    navigate: navigate
    get: getSmart
    getDumb: getDumb
    all: getAll
    subtree: getSubtree
    contains: contains
    closest: closest
    source: sourceOf
    hello: hello
    visit: visit
    markAsDestroying: markFragmentAsDestroying
    emitInserted: emitFragmentInserted
    emitDestroyed: emitFragmentDestroyed
    emitKeep: emitFragmentKeep
    emitKept: emitFragmentKept
    successKey: successKey,
    failKey: failKey
    expandTargets: expandTargets
    toTarget: toTarget
    matches: matches
    hasAutoHistory: hasAutoHistory

up.replace = up.fragment.replace
up.extract = up.fragment.extract
up.reload = up.fragment.reload
up.destroy = up.fragment.destroy
up.render = up.fragment.render
up.navigate = up.fragment.navigate
up.hello = up.fragment.hello
up.visit = up.fragment.visit

###**
Returns the current [context](/context).

This is aliased as `up.layer.context`.

@property up.context
@param {Object} context
  The context object.

  If no context has been set an empty object is returned.
@experimental
###
u.delegate up, 'context', -> up.layer.current
