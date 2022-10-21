/*-
Navigation feedback
===================

The `up.feedback` module adds useful CSS classes to fragments while they are loading over the network.

By styling these classes you can provide instant feedback to user interactions,
improving the perceived speed of your interface.


### Example

Let's say we have an `<nav>` element with two links, pointing to `/foo` and `/bar` respectively:

```html
<nav>
  <a href="/foo" up-follow>Foo</a>
  <a href="/bar" up-follow>Bar</a>
</nav>
```

By giving the navigation bar the `[up-nav]` attribute, links pointing to the current browser address are highlighted
as we navigate through the site.

While the current URL is `/foo`, the first link is automatically marked with an [`.up-current`](/a.up-current) class.
We also assign an [`[aria-current]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) attribute
to convey the highlighted link to assistive technologies:

```html
<nav up-nav>
  <a href="/foo" up-follow class="up-current" aria-current="page">Foo</a>
  <a href="/bar" up-follow>Bar</a>
</nav>
```

When the user clicks on the `/bar` link, the link will receive the [`.up-active`](/a.up-active) class while it is waiting
for the server to respond. The [targeted](/targeting-fragments) fragment (the `<main>` element) gets the `.up-loading` class:

```
<nav up-nav>
  <a href="/foo" up-follow class="up-current" aria-current="page">Foo</a>
  <a href="/bar" up-follow class="up-active">Bar</a>
</div>

<main class="up-loading">
  Foo content
</main>
```

Once the response is received the [`.up-active`](/a.up-active) and `.up-loading` classes are removed.
Since the new URL is `/bar`, the [`.up-current`](/a.up-current) class has been moved to the "Bar" link.

```html
<nav up-nav>
  <a href="/foo" up-follow>Foo</a>
  <a href="/bar" up-follow class="up-current" aria-current="page">Bar</a>
</nav>

<main>
  Bar content
</main>
```

@see [up-nav]
@see a.up-current
@see a.up-active
@see .up-loading

@module up.feedback
*/
up.feedback = (function() {

  const u = up.util
  const e = up.element

  /*-
  Sets default options for this package.

  @property up.feedback.config

  @param {Array<string>} [config.currentClasses]
    An array of classes to set on [links that point the current location](/a.up-current).

  @param {Array<string>} [config.navSelectors]
    An array of CSS selectors that match [navigation components](/up-nav).

  @stable
  */
  const config = new up.Config(() => ({
    currentClasses: ['up-current'],
    navSelectors: ['[up-nav]', 'nav'],
  }))

  function reset() {
    config.reset()
    up.layer.root.feedbackLocation = null
  }

  const CLASS_ACTIVE = 'up-active'
  const CLASS_LOADING = 'up-loading'
  const SELECTOR_LINK = 'a, [up-href]'

  function navSelector() {
    return config.navSelectors.join(',')
  }

  function normalizeURL(url) {
    if (url) {
      return u.normalizeURL(url, { trailingSlash: false, hash: false })
    }
  }

  function linkURLs(link) {
    // Check if we have computed the URLs before.
    // Computation is sort of expensive (multiplied by number of links),
    // so we cache the results in a link property
    return link.upFeedbackURLs ||= new up.LinkFeedbackURLs(link)
  }

  function updateFragment(fragment) {
    const layerOption = { layer: up.layer.get(fragment) }

    if (up.fragment.closest(fragment, navSelector(), layerOption)) {
      // If the new fragment is an [up-nav], or if the new fragment is a child of an [up-nav],
      // all links in the new fragment are considered links that we need to update.
      //
      // Note that:
      //
      // - The [up-nav] element might not be part of this update.
      //   It might already be in the DOM, and only a child was updated.
      // - The fragment might be a link itself.
      // - We do not need to update sibling links of fragment that have been processed before.
      // - The fragment may be the <body> element which contains all other overlays.
      //   But we only want to update the <body>.
      const links = up.fragment.subtree(fragment, SELECTOR_LINK, layerOption)
      updateLinks(links, layerOption)
    } else {
      updateLinksWithinNavs(fragment, layerOption)
    }
  }

  function updateLinksWithinNavs(fragment, options) {
    const navs = up.fragment.subtree(fragment, navSelector(), options)
    const links = u.flatMap(navs, nav => e.subtree(nav, SELECTOR_LINK))
    updateLinks(links, options)
  }

  function getNormalizedLayerLocation(layer) {
    // Don't re-use layer.feedbackLocation since the current layer returns
    // location.href in case someone changed the history using the pushState API.
    return layer.feedbackLocation || normalizeURL(layer.location)
  }

  function updateLinks(links, options = {}) {
    if (!links.length) { return; }

    const layer = options.layer || up.layer.get(links[0])

    // An overlay might not have a { location } property, e.g. if it was created
    // from local { content }. In this case we do not set .up-current.
    let layerLocation = getNormalizedLayerLocation(layer)
    if (layerLocation) {
      for (let link of links) {
        const isCurrent = linkURLs(link).isCurrent(layerLocation)
        for (let currentClass of config.currentClasses) {
          link.classList.toggle(currentClass, isCurrent)
        }
        e.toggleAttr(link, 'aria-current', 'page', isCurrent)
      }
    }
  }

  /*-
  @function findActivatableArea
  @param {string|Element|jQuery} element
  @internal
  */
  function findActivatableArea(element) {
    // Try to enlarge links that are expanded with [up-expand] on a surrounding container.
    // Note that the expression below is not the same as e.closest(area, SELECTOR_LINK)!
    return e.ancestor(element, SELECTOR_LINK) || element
  }

  /*-
  Links that are being [followed](/a-up-follow)
  are assigned the `.up-active` class while waiting for the server response.

  Consider styling active links in your CSS to improve the perceived responsiveness
  of your user interface:

  ```css
  a.up-active {
    background-color: yellow;
  }
  ```

  The `.up-active` attribute will be removed when the link is done loading.

  ### Example

  We have a link:

  ```html
  <a href="/foo" up-follow>Foo</a>
  ```

  When the user clicks on the link, the link is assigned the `.up-active` class
  while the request is loading:

  ```html
  <a href="/foo" up-follow class="up-active">Foo</a>
  ```

  Once the link destination has loaded and rendered, the `.up-active` class
  is removed and the [`.up-current`](/a.up-current) class is added:

  ```html
  <a href="/foo" up-follow class="up-current" aria-current="page">Foo</a>
  ```

  ### Related

  If you're looking to style the [targeted](/targeting-fragments) fragment, use the `.up-loading` class.

  @selector a.up-active
  @stable
  */

  /*-
  [Targeted fragments](/targeting-fragments) are assigned the `.up-loading` class while waiting for the server response.

  Consider styling loading fragments in your CSS to improve the perceived responsiveness
  of your user interface:

  ```css
  .up-loading {
    opacity: 0.6;
  }
  ```

  The `.up-loading` class will be removed once the fragment was updated.

  ### Example

  We have a fragment that we want to update:

  ```html
  <div class="foo">
    Old content
  </div>
  ```

  We now update the fragment with new content from the server:

  ```js
  up.render('.foo', { url: '/path', feedback: true })
  ```

  While the request is loading, the targeted element has the `.up-loading` class:

  ```html
  <div class="foo up-loading">
    Old content
  </div>
  ```

  Once the response was rendered, the `.up-loading` class is removed:

  ```html
  <div class="foo">
    New content
  </div>
  ```

  ### Related

  If you're looking to style the link that targeted the fragment, use the [`.up-active`](/a.up-active) class.

  @selector .up-loading
  @stable
  */

  /*-
  Forms that are currently [loading through Unpoly](/form-up-submit)
  are assigned the `.up-active` class automatically.
  Style `.up-active` in your CSS to improve the perceived responsiveness
  of your user interface.

  The `.up-active` class will be removed as soon as the response to the
  form submission has been received.

  To block user input while the form is submitting, use the [`[up-disable]`](/form-up-submit#up-disable) attribute.

  ### Example

  We have a form:

  ```html
  <form up-target=".foo">
    <button type="submit">Submit</button>
  </form>
  ```

  The user clicks on the submit button. While the form is being submitted
  and waiting for the server to respond, the form has the `up-active` class:

  ```html
  <form up-target=".foo" class="up-active">
    <button type="submit">Submit</button>
  </form>
  ```

  Once the link destination has loaded and rendered, the `.up-active` class
  is removed.

  ### Related

  If you're looking to style the targeted fragment, use the `.up-loading` class.

  @selector form.up-active
  @stable
  */

  function showAroundRequest(request, options) {
    if (!options.feedback) {
      return
    }

    let clean = (fn) => u.always(request, fn)

    let activeElement = getActiveElementFromRenderOptions(request)
    if (activeElement) {
      clean(e.addTemporaryClass(activeElement, CLASS_ACTIVE))
    }

    for (let targetElement of request.targetElements) {
      clean(e.addTemporaryClass(targetElement, CLASS_LOADING))
    }
  }

  function getActiveElementFromRenderOptions(request) {
    let activeElement = request.origin
    if (activeElement) {
      // If the link area was grown with [up-expand], we highlight the [up-expand] container.
      return findActivatableArea(activeElement)
    }
  }

  /*-
  Marks this element as a navigation component, such as a menu or navigation bar.

  When a link within an `[up-nav]` element points to [its layer's location](/up.layer.location),
  it is assigned the [`.up-current`](/a.up-current) class. When the browser navigates to another location, the class is removed automatically.

  You may also assign `[up-nav]` to an individual link instead of an navigational container.

  If you don't want to manually add this attribute to every navigational element,
  you can configure selectors to automatically match your navigation components in `up.feedback.config.navSelectors`.


  ### Example

  Let's take a simple menu with two links. The menu has been marked with the `[up-nav]` attribute:

  ```html
  <div up-nav>
    <a href="/foo">Foo</a>
    <a href="/bar">Bar</a>
  </div>
  ```

  If the browser location changes to `/foo`, the first link is marked as `.up-current`:

  ```html
  <div up-nav>
    <a href="/foo" class="up-current">Foo</a>
    <a href="/bar">Bar</a>
  </div>
  ```

  If the browser location changes to `/bar`, the first link automatically loses its `.up-current` class. Now the second link is marked as `.up-current`:

  ```html
  <div up-nav>
    <a href="/foo">Foo</a>
    <a href="/bar" class="up-current">Bar</a>
  </div>
  ```


  ### When is a link "current"?

  When no [overlay](/up.layer) is open, the current location is the URL displayed
  in the browser's address bar. When the link in question is placed in an overlay,
  the current location is the location of that overlay, even if that
  overlay doesn't have [visible history](/up.Layer.prototype.history).

  A link matches the current location (and is marked as `.up-current`) if it matches either:

  - the link's `[href]` attribute
  - the link's `[up-href]` attribute
  - the URL pattern in the link's [`[up-alias]`](/a-up-alias) attribute

  Any `#hash` fragments in the link's or current URLs will be ignored.

  @selector [up-nav]
  @stable
  */

  /*-
  Links within `[up-nav]` may use the `[up-alias]` attribute to pass a [URL pattern](/url-patterns) for which they
  should also be highlighted as [`.up-current`](/a.up-current).

  ### Example

  The link below will be highlighted with `.up-current` at both `/profile` and `/profile/edit` locations:

  ```html
  <div up-nav>
    <a href="/profile" up-alias="/profile/edit">Profile</a>
  </div>
  ```

  To pass more than one alternative URLs, use a [URL pattern](/url-patterns).

  @selector a[up-alias]
  @param up-alias
    A [URL pattern](/url-patterns) with alternative URLs.
  @stable
  */

  /*-
  When a link within an `[up-nav]` element points to the current location, it is assigned the `.up-current` class.

  See [`[up-nav]`](/up-nav) for more documentation and examples.

  @selector a.up-current
  @stable
  */

  function updateLayerIfLocationChanged(layer) {
    const processedLocation = layer.feedbackLocation

    const layerLocation = getNormalizedLayerLocation(layer.location)

    // A history change might call this function multiple times,
    // since we listen to both up:location:changed and up:layer:location:changed.
    // We also don't want to unnecessarily reprocess nav links, which is expensive.
    // For this reason we check whether the current location differs from
    // the last processed location.
    if (!processedLocation || (processedLocation !== layerLocation)) {
      layer.feedbackLocation = layerLocation
      updateLinksWithinNavs(layer.element, { layer })
    }
  }

  function onBrowserLocationChanged() {
    const frontLayer = up.layer.front

    // We allow Unpoly-unaware code to use the pushState API and change the
    // front layer in the process. See up.Layer.Base#location setter.
    if (frontLayer.showsLiveHistory()) {
      updateLayerIfLocationChanged(frontLayer)
    }
  }

  // Even when the modal or popup does not change history, we consider the URLs of the content it displays.
  up.on('up:location:changed', (_event) => { // take 1 arg to prevent data parsing
    onBrowserLocationChanged()
  })

  up.on('up:fragment:inserted', (_event, newFragment) => {
    updateFragment(newFragment)
  })

  up.on('up:layer:location:changed', (event) => {
    updateLayerIfLocationChanged(event.layer)
  })

  // The framework is reset between tests
  up.on('up:framework:reset', reset)

  return {
    config,
    showAroundRequest,
    normalizeURL,
  }
})()
