# up.link

Features to follow links without a full page load.

Set an `[up-follow]` attribute to let Unpoly handle a link, and an [`[up-target]`](/api/up-follow#up-target) attribute to choose the fragment it updates. The same behavior is available from JavaScript through `up.follow()`, and `up:link:follow` lets your code observe or prevent any link Unpoly follows.

Links feel faster with `[up-instant]`, which follows on `mousedown` instead of `click`, and `[up-preload]`, which fetches the response before the user clicks. An `[up-defer]` placeholder loads its content from another URL after the page has rendered, or when it is scrolled into view.

@learn-ref links

@namespace up.link

-----

# up.link.config

Configures defaults for link handling.

In particular, you can configure Unpoly to handle [all links on the page](/learn/handling-all-links)
without requiring developers to set `[up-...]` attributes.

@property up.link.config

@section Followable links

  @param {Array<string>} config.followSelectors
    An array of CSS selectors matching links that will be [followed through Unpoly](/api/up-follow).

    You can customize this property to automatically follow *all* links on a page without requiring an `[up-follow]` attribute.
    See [Handling all links](/learn/handling-all-links).

  @param {Array<string>} config.noFollowSelectors
    Exceptions to `up.link.config.followSelectors`.

    Matching links will *not* be [followed through Unpoly](/api/up-follow), even if they match `up.link.config.followSelectors`.

    By default Unpoly excludes:

    @include no-follow-reasons

@section Instant click

  @param {Array<string>} config.instantSelectors
    An array of CSS selectors matching elements that are [activated on `mousedown`](/api/up-instant)
    instead of on `click`.

    You can customize this property to follow *all* links on `mousedown` without requiring an `[up-instant]` attribute.
    See [Handling all links](/learn/handling-all-links).

    Note that an instant link must also be [followable](/api/up.link.isFollowable), usually by giving it an
    [`[up-follow]`](/api/up-follow) attribute or by configuring `up.link.config.followSelectors`.

  @param {Array<string>} config.noInstantSelectors
    Exceptions to `up.link.config.instantSelectors`.

    Matching links will *not* be [followed on `mousedown`](/api/up-instant), even if they match `up.link.config.instantSelectors`.

    By default Unpoly excludes:

    - Elements with an `[up-instant=false]` attribute.
    - Links that are [not followable](#config.noFollowSelectors).

@section Preloading

  @param {Array<string>} config.preloadSelectors
    An array of CSS selectors matching links that are [preloaded on hover](/learn/preloading#on-hover).

    You can customize this property to preload *all* links on hover without requiring an `[up-preload]` attribute.
    See [Handling all links](/learn/handling-all-links).

  @param {Array<string>} config.noPreloadSelectors
    Exceptions to `up.link.config.preloadSelectors`.

    Matching links will *not* be [preloaded on hover](/learn/preloading#on-hover), even if they match `up.link.config.preloadSelectors`.

    By default Unpoly excludes:

    - Links with an `[up-preload=false]` attribute.
    - Links that are [not followable](#config.noFollowSelectors).
    - Links with an [unsafe method](/api/up.link.isSafe).
    - When the link destination [cannot be cached](/api/up.network.config#config.autoCache).

  @param {number} [config.preloadDelay=90]
    The number of milliseconds to wait before [preloading on hover](/learn/preloading#on-hover).

@section Interactive elements

  @param {Array<string>} [config.clickableSelectors]
    A list of CSS selectors matching elements that should behave like links or buttons.

    See [[faux-interactive-elements]].

    @experimental

  @param {Array<string>} [config.noClickableSelectors]
    Exceptions to `up.link.config.clickableSelectors`.

    Matching elements will *not* receive [interactive behavior](/api/up-follow),
    even if they match `up.link.config.clickableSelectors`.

    @experimental

@stable

-----

# up.follow()

Follows the given link with JavaScript and updates a fragment with the server response.

By default, the layer's [main fragment](/api/up-main)
will be replaced. Attributes like [`[up-target]`](/api/up-follow#up-target)
or [`[up-layer]`](/api/up-follow#up-layer) will be honored.

Following a link is considered [navigation](/learn/navigation-defaults) by default.

Emits the event `up:link:follow`.

@learn-ref following-links

## Examples

Assume we have a link with an [`[up-target]`](/api/up-follow#up-target) attribute:

```html
<a href="/users" up-target=".main">Users</a>
```

Calling `up.follow()` with this link will replace the page's `.main` fragment
as if the user had clicked on the link:

```js
let link = document.querySelector('a')
up.follow(link)
```

@function up.follow

@section General
  @param {Element|jQuery|string} link
    The link to follow.

  @param {Object} [options]
    [Render options](/api/up.render#parameters) that should be used for following the link.

    Unpoly will parse render options from the given link's attributes.
    E.g. the `[up-target]` attribute will be parsed into a `{ target }` option.
    See `[up-follow]` for a list of supported attributes.

    You may pass this additional `options` object to
    [supplement or override](/learn/attributes-and-options#options)
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

@section Client state
  @mix up.render/client-state

@section Lifecycle hooks
  @mix up.render/lifecycle-hooks

@return
  @like up.render

@stable
@signature

-----

# up.link.followOptions()

Parses the [render](/api/up.render) options that would be used to
[follow](/api/up.follow) the given link, but does not render.

## Example

Given a link with some `[up-...]` attributes:

```html
<a href="/foo" up-target=".content" up-layer="new">...</a>
```

We can parse the link's render options like this:

```js
let link = document.querySelector('a[href="/foo"]')
let options = up.link.followOptions(link)
// result: { url: '/foo', method: 'GET', target: '.content', layer: 'new', ... }
```

@function up.link.followOptions
@param {Element|jQuery|string} link
  The link from which to parse options.
@param {Object} [options]
  Additional options for following the link.

  Values from this object will override any attributes set on the link element.
  @internal
@return {Object}
  An object of [render options](/api/up.render#parameters).
@stable

-----

# up:link:follow

This event is [emitted](/api/up.emit) when a link is [followed](/api/up.follow) through Unpoly.

The event is emitted on the `<a>` element that is being followed.

@learn-ref following-links

## Changing render options

Listeners may inspect and manipulate [render options](/api/up.render#parameters) for the coming fragment update.

The code below will open all form-contained links in an overlay so as not to
lose the user's form data:

```js
up.on('up:link:follow', function(event, link) {
  if (link.closest('form')) {
    event.renderOptions.layer = 'new modal'
  }
})
```

When changing render options for a [preloaded link](/learn/preloading), consider making the
same change for `up:link:preload` so the [preload request](/learn/preloading#preload-request-behavior) sends the same [HTTP headers](/api/up.protocol).

In the example above, we want to ensure an `X-Up-Mode: modal` header is sent, so we modify
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
  An object with [render options](/api/up.render#parameters) for the coming fragment update.

  Listeners may inspect and modify these options. It is recommended that
  render options for `up:link:preload` be changed in the same way.
@param event.preventDefault()
  Prevents the link from being followed.
@stable

-----

# up.link.preload()

[Preloads](/learn/preloading) a `GET` link.

When the link is clicked later, the response will already be [cached](/learn/caching),
making the interaction feel instant.

You may use this function to [programmatically populate the cache](/learn/preloading#scripted)
with pages the user is likely to click or that should be
[accessible while offline](/learn/network-issues#offline-cache).

@learn-ref preloading

@function up.link.preload

@section General
  @param {string|Element|jQuery} link
    The element or selector whose destination should be preloaded.

  @param {Object} [options]
    [Render options](/api/up.render#parameters) to apply when preloading this link.

    Most [options for `up.follow()`](/api/up.follow#parameters) can be used,
    but no elements will be changed while preloading.

@section Request
  @param {string} [options.url]
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

  When [caching is disabled](/learn/caching#disabling-globally), no request is made and the promise fulfills right away.

  When the link cannot be preloaded, the promise rejects with an error.
@stable

-----

# up:link:preload

This event is [emitted](/api/up.emit) before a link is [preloaded](/learn/preloading).

Listeners may prevent this event to stop the link from being preloaded
or [change render options](/api/up:link:follow#changing-render-options) for the preload request.

@learn-ref preloading

## Example

The following would disable preloading on slow 2G connections:

```js
function isSlowConnection() {
  // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation
  return navigator.connection && navigator.connection.effectiveType.includes('2g')
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
  An object with [render options](/api/up.render#parameters) for the preloading.

  Listeners may inspect or [modify](/api/up:link:follow#changing-render-options) these options.
@param event.preventDefault()
  Prevents the link from being preloaded.
@stable

-----

# up.link.followMethod()

Returns the HTTP method that Unpoly will use when [following](/api/up-follow) the given link.

Looks at the link's `[up-method]` or `[data-method]` attributes. Defaults to `"get"`.

@function up.link.followMethod
@param {Element} link
  The link from which to evaluate the method.
@param {string} options.method
  A value to override the value parsed from the attribute.
@return {string}
  The HTTP method.
@internal

-----

# up.link.isFollowable()

Returns whether the given link will be [followed](/api/up.follow) by Unpoly
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

-----

# up.link.makeFollowable()

Makes sure that the given link will be [followed](/api/up.follow)
by Unpoly instead of making a full page load.

If the link is not already [followable](/api/up.link.isFollowable), the link
will receive an `[up-follow]` attribute.

@function up.link.makeFollowable
@param {Element|jQuery|string} link
  The element or selector for the link to make followable.
@experimental

-----

# [up-clickable]

Enables [keyboard interaction and other accessibility behaviors](/learn/faux-interactive-elements#accessibility)
for non-interactive elements that represent clickable buttons.

It's up to you to make the element appear interactive visually, e.g., by assigning a `.button` class from your design system.

@learn-ref faux-interactive-elements

## Example

Add the `[up-clickable]` attribute to a non-interactive element, like a `<span>`:

```html
<span id="faux-button" up-clickable>Click me</span> <!-- mark: up-clickable -->
```

To react to the element's activation, handle the `up:click` event:

```js
let button = document.querySelector('#faux-button')

button.addEventListener('up:click', function(event) {
  console.log('Click on faux button!')
})
```

## Act on press

To activate the element on `mousedown` instead of `click`, also set an `[up-instant]` attribute:

```html
<span id="faux-button" up-clickable up-instant>Click me</span> <!-- mark: up-instant -->
```

## Unobtrusive use

To make elements clickable without an explicit `[up-clickable]` attribute, configure `up.link.config.clickableSelectors`:

```js
up.link.config.clickableSelectors.push('.button')
```

Any matching element will now gain [keyboard interaction and other accessibility behaviors](/learn/faux-interactive-elements#accessibility):

```html
<span class="button">I can be used with the keyboard</span>
```

@selector [up-clickable]
@param [up-instant]
  Whether this element is activated on `mousedown` instead of waiting for `click`.
@experimental

-----

# up.link.convertClicks()

Provide an `up:click` event that improves on standard click
in several ways:

- It is emitted on mousedown for [up-instant] elements
- It is not emitted if the element has disappeared (or was overshadowed)
  between `mousedown` and `click`. This can happen if `mousedown` creates a new element
  that obstructs interaction with this element, or if a `mousedown` handler removes this element.
- It is not emitted if the user clicks with a non-first mouse button.
- It is not emitted if the user holds a modifier key when clicking.

Stopping an `up:click` event will also stop the underlying event.

Also see docs for `up:click`.

@function up.link.convertClicks
@param {up.Layer} layer
@internal

-----

# up:click

A `click` event that honors the `[up-instant]` attribute.

This event is generally emitted when an element is clicked. However, for elements
with an `[up-instant]` attribute, this event is emitted on `mousedown` instead.
If the press lands on an element within that handles its own click, like a checkbox, or another script
prevented the `mousedown` event, `up:click` is emitted on `click` as usual.

This is useful for listening to links being activated without needing to know whether
a link is `[up-instant]`.

@learn-ref faux-interactive-elements

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

Canceling `up:click` on a hyperlink will prevent Unpoly from [following](/api/up-follow) that link.

The underlying `click` or `mousedown` event will also be canceled.

## Accessibility

If the user activates an element using their keyboard, the `up:click` event will be emitted
when the key is pressed even if the element has an `[up-instant]` attribute.

## Only unmodified clicks are considered

To prevent overriding native browser behavior, the `up:click` event is only emitted for unmodified clicks.

In particular, it is not emitted when the user holds `Shift`, `Ctrl`, `Alt` or `Meta` while clicking,
nor when the user clicks with a mouse button other than the primary button.
To make the same check in your own click handler, use `up.event.isModified()`.

@event up:click
@param {Element} event.target
  The clicked element.
@param {Event} event.originalEvent
  The underlying `click` or `mousedown` event.
@param event.preventDefault()
  Prevents this event and also the original `click` or `mousedown` event.
@stable

-----

# up.link.isSafe()

Returns whether the given link has a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
HTTP method like `GET`.

You can configure links to use unsafe methods like `POST` or `DELETE` by setting an [`[up-method]`](/api/up-follow#up-method) attribute.

@function up.link.isSafe
@param {Element} link
  The link to test.
@return {boolean}
  Whether the link will be followed using a safe HTTP method.
@stable

-----

# up.deferred.load()

Loads a [`[up-defer="manual"]`](/api/up-defer) placeholder.

@learn-ref lazy-loading#scripted

@function up.deferred.load

@section General
  @param {Element} placeholder
    The `[up-defer]` placeholder to load.

  @param {Object} [options]
    [Render options](/api/up.render#parameters) that should be used for loading the placeholder.

    Unpoly will parse render options from the given placeholder's attributes.
    You may pass this additional `options` object to [supplement or override](/learn/attributes-and-options#options)
    options parsed from the placeholder attributes. See `[up-follow]` for a list of supported attributes.

    Common options are documented below, but most [options for `up.follow()`](/api/up.follow#parameters) may be used.

@section Targeting
  @param {string} [options.target=':origin']
    @like [up-defer]/up-target

@section Request
  @param [options.url]
    The URL from which to load the deferred content.

    Defaults to the placeholder's [`[up-href]`](/api/up-defer#up-href) or `[href]` attribute.

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

@stable
@signature

-----

# up:deferred:load

This event is emitted before an `[up-defer]` placeholder loads its deferred content.

The event can be [prevented](#event.preventDefault) to stop the network request.
The loading will not be attempted again, but you can use `up.deferred.load()` to load it manually afterwards.

@learn-ref lazy-loading

@event up:deferred:load
@param {Element} event.target
  The `[up-defer]` placeholder that is about to load its content.
@param {Object} event.renderOptions
  An object with [render options](/api/up.render#parameters) for the coming fragment update.

  Listeners may inspect and modify these options.
@param event.preventDefault()
  Prevents the deferred content from being loaded.
@stable
@signature

-----

# [up-defer]

A placeholder for content to be loaded later from another URL.

By moving expensive but non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments into partials,
you can paint critical content earlier.

@learn-ref lazy-loading

## Example

@include defer-example

@selector [up-defer]

@params-note
  All modifying attributes for `[up-follow]` may also be used.

@section Timing
  @param [up-defer='insert']
    When to load and render the deferred content.

    When set to `'insert'` (the default), the deferred content will load immediately when
    the `[up-defer]` element is inserted into the DOM.

    When set to `'reveal'`, the deferred content will load when the `[up-defer]` placeholder is scrolled
    into the [viewport](/api/up-viewport). If the element is already visible when
    inserted, loading will start immediately. Also see [loading as the placeholder becomes visible](/learn/lazy-loading#on-reveal).

    When set to `'manual'`, the deferred content will not load on its own.
    You can control the load timing by calling `up.deferred.load()` from your own JavaScript.

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
    For this the element must have a [derivable target selector](/learn/target-derivation).

    You may target one or [multiple](/learn/targeting-fragments#multiple) fragments.
    To target the placeholder itself, you can use the `:origin` target instead of spelling out a selector.

  @param [up-fail]
    How to handle [error responses](/learn/error-responses).

    By default, a server response with an error code is not rendered,
    and the placeholder keeps its fallback content.

    Set `[up-fail=false]` to render *any* response that contains a matching fragment,
    even with a 4xx or 5xx status code.

  @param [up-fail-target]
    A selector for the fragment to render an [error response](/learn/error-responses) in.

    By default, a server response with an error code is not rendered.

@section Request
  @param [up-href]
    The URL from which to load the deferred content.

    If your `[up-defer]` placeholder is a [standard hyperlink](/learn/lazy-loading#seo), you can use an `[href]` attribute instead.

  @param [up-headers]
    A [relaxed JSON](/api/relaxed-json) object with additional request headers.

  @param [up-background='false']
    Whether to load the deferred content [in the background](/learn/background-requests).

    Background requests will not show the [global progress bar](/learn/progress-bar).

@section Caching
  @mix up-follow/caching

@stable
@signature

-----

# [up-follow]

[Follows](/api/up.follow) this link with JavaScript and updates a fragment with the server response.

Following a link is considered [navigation](/learn/navigation-defaults) by default.

@learn-ref following-links

## Example

This link will update the `<div class="content">` fragment with the same element
fetched from `/posts/5`:

```html
<a href="/posts/5" up-follow up-target=".content">Read post</a>
```

If no `[up-target]` attribute is set, the [main fragment](/api/up-main) is updated.

## Following all links automatically

You can configure Unpoly to follow *all* links on a page without requiring an `[up-follow]` attribute.

See [Handling all links](/learn/handling-all-links).

## Unfollowable links

Even with an `[up-follow]` attribute, some links cannot be handled by Unpoly:

@include no-follow-reasons

Clicking such links will fall back to default browser behavior.

## Preventing Unpoly from following links

You can tell Unpoly to ignore clicks on an `[up-follow]` link, causing the link to be non-interactive.
Use one of the following methods:

- Prevent the `up:link:follow` event on the link element
- Prevent the `up:click` event on the link element

To force a [full page load](/api/up.network.loadPage) when a followable link is clicked:

- Set an [`[up-follow=false]`](/learn/attributes-and-options#boolean-attributes) attribute on the link element
- Prevent the `up:link:follow` event, then call `up.network.loadPage(event.renderOptions)`

## Making non-interactive elements act as hyperlinks

You can set an `[up-follow]` attribute on any non-interactive element to make it behave like a hyperlink:

```html
<span up-follow up-href="/details">Read more</span>
```

See [Acting like a hyperlink](/learn/faux-interactive-elements#acting-like-a-hyperlink) for details.

## Advanced fragment changes

Links can update multiple fragments or append content to an existing element.

See [Fragment placement](/learn/targeting-fragments) for details.

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

@section Client state
  @mix up-follow/client-state

@section Lifecycle hooks
  @mix up-follow/lifecycle-hooks

@stable
@signature

-----

# [up-instant]

Activates this link-like element on `mousedown` instead of `click` ("Act on press").

For links with `[up-follow]`, this will save time that would otherwise be spent
waiting for the user to release the mouse button. Since the request starts right away,
the interaction will appear faster.

For [faux-interactive elements](/learn/faux-interactive-elements), setting `[up-instant]` will cause
the `up:click` event to be emitted on `mousedown` instead of `click`.
A press on a control within the element, or a press whose `mousedown` was prevented, still emits `up:click` on `click`.

To apply the instant effect without changing your HTML, configure `up.link.config.instantSelectors`.

@learn-ref following-links#instant

## Example

```html
<a href="/users" up-follow up-instant>User list</a> <!-- mark: up-instant -->
```

## Accessibility

Links or [faux-interactive elements](/learn/faux-interactive-elements) with `[up-instant]`
can still be activated with the keyboard.

With `[up-instant]`, users can no longer cancel a click by dragging the pressed mouse away from the element.
However, for navigation actions this isn't required. E.g., many operating systems switch tabs on `mousedown`
instead of `click`.

@selector [up-instant]
@stable
@signature

-----

# [up-expand]

Enlarges the click area of a descendant link.
A click anywhere in the area does what a click on its link does.

@learn-ref faux-interactive-elements

When Unpoly follows the link, the area takes over the link's Unpoly attributes, like
[`[up-target]`](/api/up-follow#up-target), `[up-instant]`, or `[up-preload]`.
A click on the area then follows the link itself. Events like `up:link:follow` are emitted on the link,
and the link is the [origin](/learn/targeting-fragments#referring-to-the-origin-element) of the fragment update.

## Example

```html
<div class="notification" up-expand>
  Record was saved!
  <a href="/records" up-follow>Close</a>
</div>
```

In the example above, clicking anywhere within the `.notification` element
would [follow](/api/up.follow) the *Close* link.

A click on another link, a form field, a button, a label or a `<summary>` within the area is left to that element.
To keep the area from following a click on another element, prevent its [`up:click`](/api/up:click) event.

## Multiple contained links

If a container contains more than one link, you can set the value of the
`[up-expand]` attribute to a CSS selector that defines which link should be expanded:

```html
<div class="notification" up-expand="#close"> <!-- mark: #close -->
  Record was saved!
  <a id="details" href="/records/5" up-follow>Details</a>
  <a id="close" href="/records" up-follow>Close</a> <!-- mark: id="close" -->
</div>
```

## Links that Unpoly doesn't follow

When Unpoly doesn't [follow](/api/up.link.isFollowable) the expanded link, a click on the area clicks the link.
The browser then does what the link does. A plain link makes a full page load, a `[download]` link downloads its file,
and a `[target=_blank]` link opens a new tab.

To update a fragment instead, give the link an `[up-follow]` attribute or [follow all links](/learn/handling-all-links).

## Feedback classes

Unpoly assigns the `.up-active` class to clicked links while they are loading.
This class is assigned to both the expanded link and the expanded click area.

Assume this `[up-expand]` container with two contained links:

```html
<div up-expand>
  <a href="/foo" up-follow>Foo</a>
  <a href="/bar" up-follow>Bar</a>
</div>
```

When either the `[up-expand]` container or the first link is clicked, the `.up-active` class
is assigned to both elements:

```html
<div up-expand class="up-active"> <!-- mark: class="up-active" -->
  <a href="/foo" up-follow class="up-active">Foo</a> <!-- mark: class="up-active" -->
  <a href="/bar" up-follow>Bar</a>
</div>
```

When a non-expanded link is clicked, only that link becomes `.up-active`:

```html
<div up-expand>
  <a href="/foo" up-follow>Foo</a> <!-- chip: not active -->
  <a href="/bar" up-follow class="up-active">Bar</a> <!-- mark: class="up-active" -->
</div>
```

## Limitations

`[up-expand]` has some limitations for advanced browser users:

- Users won't be able to right-click the expanded area to open a context menu.
- Users won't be able to `CTRL`+click the expanded area to open a new tab.

To overcome these limitations, consider nesting the entire clickable area in an actual `<a>` tag.
[It's OK to put block elements inside an anchor tag](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).

@selector [up-expand]
@params-note
  When Unpoly follows the expanded link, the enlarged click area takes over the link's Unpoly attributes.
@param [up-expand]
  A CSS selector that defines which containing link should be expanded.

  If omitted, the first link in this element will be expanded.
@stable

-----

# [up-preload]

[Preloads](/learn/preloading) this link before the user clicks it.
When the link is clicked, the response will already be [cached](/learn/caching),
making the interaction feel instant.

Unpoly will only preload [links with safe methods](/api/up.link.isSafe). The `[up-preload]` attribute
has no effect on unsafe links.

Links with an `[up-preload]` attribute are always [followed by Unpoly](/api/up-follow) and will not make a full page load.

@learn-ref preloading

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
    over this link [for a while](#up-preload-delay). On touch devices, preloading will
    begin when the user places their finger on the link. Also see [preloading on hover](/learn/preloading#on-hover).

    When set to `'insert'`, preloading will start immediately when this
    link is inserted into the DOM. Also see [eagerly preloading on insertion](/learn/preloading#on-insert).

    When set to `'reveal'`, preloading will start when the link is scrolled
    into the [viewport](/api/up-viewport). If the link is already visible when
    inserted, preloading will start immediately. Also see [preloading when a link becomes visible](/learn/preloading#on-reveal).

    When set to `'false'`, the link will not be preloaded.
    You can still preload this link programmatically using `up.link.preload()`.

  @param [up-preload-delay]
    With [`[up-preload="hover"]`](#up-preload), this requires the user to hover
    for the given number of milliseconds before the link is preloaded.

    Defaults to `up.link.config.preloadDelay`.

  @param [up-intersect-margin='0']
    With `[up-preload=reveal]`, this enlarges the viewport by the given number of pixels before
    computing the intersection.

    A positive number will preload the link some pixels before it becomes visible.

    A negative number will require the user to scroll some pixels into the link before it is preloaded.

    @experimental
@section Request
  @param href
    The URL to preload.
  @param [up-headers]
    @like [up-follow]
@stable
@signature
