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

While the current URL is `/foo`, the first link is automatically marked with an `.up-current` class.
We also assign an [`[aria-current]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) attribute
to convey the highlighted link to assistive technologies:

```html
<nav up-nav>
  <a href="/foo" up-follow class="up-current" aria-current="page">Foo</a>
  <a href="/bar" up-follow>Bar</a>
</nav>
```

When the user clicks on the `/bar` link, the link will receive the `.up-active` class while it is waiting
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

Once the response is received the `.up-active` and `.up-loading` classes are removed.
Since the new URL is `/bar`, the `.up-current` class has been moved to the "Bar" link.

```html
<nav up-nav>
  <a href="/foo" up-follow>Foo</a>
  <a href="/bar" up-follow class="up-current" aria-current="page">Bar</a>
</nav>

<main>
  Bar content
</main>
```

### Enabling navigation feedback

Navigation feedback is enabled per default when [navigating](/navigation).

When rendering without navigation, you may enable feedback by setting an
[`[up-feedback]`](/up-follow#up-feedback) attribute or by passing a
[`{ feedback }`](/up.render#options.feedback) option:

```js
up.render('.preview', { url: '/preview', feedback: true })
```

When watching fields you may [show navigation feedback](/watch-options#showing-feedback-while-working)
while an async callback is running.


@see [up-nav]
@see .up-current
@see .up-active
@see .up-loading

@module up.feedback
*/
up.feedback = (function() {

  const u = up.util
  const e = up.element

  let namedPreviewFns = {}

  /*-
  Sets default options for this package.

  @property up.feedback.config

  @param {Array<string>} [config.currentClasses=['up-current']]
    An array of classes to set on [links that point the current location](/up-current).

  @param {Array<string>} [config.navSelectors=['[up-nav]', 'nav']]
    An array of CSS selectors that match [navigational containers](/up-nav).

    Links within navigational containers are assigned `.up-current` if they point to the current URL.

  @param {Array<string>} [config.noNavSelectors=['[up-nav=false]']]
    Exceptions to `up.feedback.config.navSelectors`.

  @stable
  */
  const config = new up.Config(() => ({
    currentClasses: ['up-current'],
    navSelectors: ['[up-nav]', 'nav'],
    noNavSelectors: ['[up-nav=false]'],
  }))

  function reset() {
    up.layer.root.feedbackLocation = null
    namedPreviewFns = u.pickBy(namedPreviewFns, 'isDefault')
  }

  const CLASS_ACTIVE = 'up-active'
  const CLASS_LOADING = 'up-loading'
  const SELECTOR_LINK = 'a, [up-href]'

  function linkURLs(link) {
    // Check if we have computed the URLs before.
    // Computation is sort of expensive (multiplied by number of links),
    // so we cache the results in a link property
    return link.upFeedbackURLs ||= new up.LinkFeedbackURLs(link)
  }

  /*-
  Forces the toggling of `.up-current` classes for the given fragment.

  @function updateFragment
  @param {Element} fragment
  @internal
  */
  function updateFragment(fragment, { layer } = {}) {
    layer ||= up.layer.get(fragment)

    // An overlay might not have a { location } property, e.g. if it was created
    // from local { content }. In this case we remove .up-current from all links.
    let layerLocation = getMatchableLayerLocation(layer)

    // We need to match both an `a[href]` within an `[up-nav]` *and* and `a[href][up-nav]
    // This should return a selector like `:is([up-nav], nav):not([up-nav=false]) :is(a, [up-href]), :is([up-nav], nav):not([up-nav=false]):is(a, [up-href])`
    const navSelector = config.selector('navSelectors')
    const navLinkSelector = `${navSelector} :is(${SELECTOR_LINK}), ${navSelector}:is(${SELECTOR_LINK})`

    // The fragment may be the <body> element which contains all other overlays.
    // But we only want to update the <body>. Hence the { layer } option.
    const links = up.fragment.all(navLinkSelector, { layer })

    for (let link of links) {
      const isCurrent = linkURLs(link).isCurrent(layerLocation)
      for (let currentClass of config.currentClasses) {
        link.classList.toggle(currentClass, isCurrent)
      }
      e.setAttrPresence(link, 'aria-current', 'page', isCurrent)
    }
  }

  function getMatchableLayerLocation(layer) {
    // Don't re-use layer.feedbackLocation since the current layer returns
    // location.href in case someone changed the history using the pushState API.
    return layer.feedbackLocation || u.matchableURL(layer.location)
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
  While rendering [with navigation feedback](/up.feedback#enabling-navigation-feedback), the `.up-active` class is added to the [origin](/origin)
  element that triggered the change.

  The `.up-active` class is removed once the new content has been loaded and rendered.

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
  is removed and the `.up-current` class is added:

  ```html
  <a href="/foo" up-follow class="up-current" aria-current="page">Foo</a>
  ```

  > [NOTE]
  > Links do *not* need an `[up-nav]` container to get the `.up-active` class while loading.

  ### Default origins

  The origin element is set automatically for many actions, for example:

  @include default-origins

  When rendering from JavaScript, you may set the origin by passing an
  [`{ origin }`](/origin#setting-the-origin-programmatically) option.

  ### Styling active elements

  To improve the perceived responsiveness of your user interface,
  consider highlighting active links and submit buttons in your CSS:

  ```css
  .up-active:is(a, [up-follow], input[type=submit], button[type=submit], button:not([type])) {
    outline: 2px solid blue;
  }
  ```

  If you're looking to style the [targeted](/targeting-fragments) fragment, use the `.up-loading` class
  instead.

  @selector .up-active
  @stable
  */

  /*-
  While rendering [with navigation feedback](/up.feedback#enabling-navigation-feedback),
  [targeted fragments](/targeting-fragments) are assigned the `.up-loading` class.

  The `.up-loading` class is removed once the fragment was updated.

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

  ### Styling targeted fragments

  To improve the perceived responsiveness
  of your user interface, consider styling loading fragments in your CSS:

  ```css
  .up-loading {
    opacity: 0.6;
  }
  ```

  If you're looking to style the link that targeted the fragment, use the
  `.up-active` class instead.

  @selector .up-loading
  @stable
  */

  // function showAroundRequest(request, renderOptions) {
  //   let preview = new up.Preview({ request, renderOptions: u.copy(renderOptions) })
  //   let previewFns = getPreviewFns(renderOptions)
  //   for (let previewFn of previewFns) {
  //     preview.run(previewFn)
  //   }
  //   u.always(request, () => preview.revert())
  // }

  function showPreviews(previews, request, renderOptions) {
    let preview = new up.Preview({ request, renderOptions: u.copy(renderOptions) })
    for (let nameOrFn of u.compact(previews)) {
      preview.run(nameOrFn)
    }
    return () => preview.revert()
  }

  up.on('up:fragment:load', function({ previews, renderOptions: { feedback, preview } }) {
    // Turn { feedback } option into a named preview
    if (feedback) {
      previews.push(classesFeedbackFn)
    }

    if (preview) {
      // Parse { preview } option into one or more preview names or functions
      let previewTokens = u.parseTokens(preview)
      previews.push(...previewTokens)
    }
  })

  // function getPreviewFns(renderOptions) {
  //   let fns = []
  //
  //   if (renderOptions.feedback) {
  //     fns.push(getPreviewFn('classes'))
  //   }
  //
  //   let previewTokens = u.parseTokens(renderOptions.preview)
  //   let previewFns = previewTokens.map(getPreviewFn)
  //   fns.push(...previewFns)
  //
  //   return fns
  // }

  function getPreviewFn(value) {
    return u.presence(value, u.isFunction) || namedPreviewFns[value] || up.fail('Unknown preview "%s"', value)
  }

  function getActiveElement(origin) {
    if (origin) {
      // If the link area was grown with [up-expand], we highlight the [up-expand] container.
      return findActivatableArea(origin)
    }
  }

  function registerPreview(name, previewFn) {
    previewFn.isDefault = up.framework.evaling
    namedPreviewFns[name] = previewFn
  }

  function classesFeedbackFn(preview) {
    let activeElement = getActiveElement(preview.origin)
    if (activeElement) {
      preview.addClass(activeElement, CLASS_ACTIVE)
    }

    for (let fragment of preview.fragments) {
      preview.addClass(fragment, CLASS_LOADING)
    }
  }

  /*-
  Marks this element as a navigation component, such as a menu or navigation bar.

  When a link within an `[up-nav]` element points to [its layer's location](/up.layer.location),
  it is assigned the `.up-current` class. When the browser navigates to another location, the class is removed automatically.

  ### Example

  Let's take a simple menu with two links. The menu has been marked with the `[up-nav]` attribute:

  ```html
  <div up-nav> <!-- mark-phrase "up-nav" -->
    <a href="/foo">Foo</a>
    <a href="/bar">Bar</a>
  </div>
  ```

  If the browser location changes to `/foo`, the first link is marked as `.up-current`:

  ```html
  <div up-nav>
    <a href="/foo" class="up-current">Foo</a> <!-- mark-phrase "up-current" -->
    <a href="/bar">Bar</a>
  </div>
  ```

  If the browser location changes to `/bar`, the first link automatically loses its `.up-current` class.
  Now the second link is marked as `.up-current`:

  ```html
  <div up-nav>
    <a href="/foo">Foo</a>
    <a href="/bar" class="up-current">Bar</a> <!-- mark-phrase "up-current" -->
  </div>
  ```

  ### Marking navigational containers

  The `[up-nav]` attribute can be assigned to any container that contains links:

  ```html
  <div up-nav> <!-- mark-phrase "up-nav" -->
    <a href="/foo">Foo</a>
    <a href="/bar">Bar</a>
  </div>
  ```

  Standard [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) elements are always
  navigational containers and do not need an `[up-nav]` attribute:

  ```html
  <nav>
    <a href="/foo">Foo</a>
    <a href="/bar">Bar</a>
  </nav>
  ```

  You can configure additional selectors to automatically match your navigation components
  in `up.feedback.config.navSelectors`.

  Matching containers can opt *out* of `.up-current` assignment by setting an `[up-nav=false]` attribute:

  ```html
  <nav up-nav="false">
    <a href="/foo">Foo</a>
    <a href="/bar">Bar</a>
  </nav>
  ```

  You may also assign `[up-nav]` to an individual link instead of an navigational container:

  ```html
  <a href="/foo" up-nav>Foo</a> <!-- mark-phrase "up-nav" -->
  ```


  ### When is a link "current"?

  When no [overlay](/up.layer) is open, the current location is the URL displayed
  in the browser's address bar. When the link in question is placed in an overlay,
  the current location is the [location of that overlay](/up.layer.location), even if that
  overlay doesn't have [visible history](/history-in-overlays).

  A link matches the current location (and is marked as `.up-current`) if it matches either:

  - the link's `[href]` attribute
  - the link's `[up-href]` attribute
  - the URL pattern in the link's `[up-alias]` attribute

  Any `#hash` fragments in the link's or current URLs will be ignored.


  ### Updating `.up-current` classes

  The `.up-current` class is toggled automatically within all content that Unpoly renders.
  For example, when Unpoly [follows a link](/up-follow), [submits a form](/up-submit)
  or [renders from a script](/up.render), any newly inserted hyperlinks will get `.up-current`
  if they point to the current URL.

  To toggle `.up-current` on content that you manually inserted without Unpoly, use `up.hello()`.

  @selector [up-nav]
  @stable
  */

  /*-
  Links within `[up-nav]` may use the `[up-alias]` attribute to pass a [URL pattern](/url-patterns) for which they
  should also be highlighted as `.up-current`.

  ### Example

  The link below will be highlighted with `.up-current` at both `/profile` and `/profile/edit` locations:

  ```html
  <div up-nav>
    <a href="/profile" up-alias="/profile/edit">Profile</a>
  </div>
  ```

  To pass more than one alternative URLs, use a [URL pattern](/url-patterns).

  @selector [up-alias]
  @param up-alias
    A [URL pattern](/url-patterns) with alternative URLs.
  @stable
  */

  /*-
  When a link within an `[up-nav]` element points to the current location, it is assigned the `.up-current` class.

  To set other classes on current links, configure `up.feedback.config.currentClasses`.

  This class is toggled automatically for any HTML that Unpoly renders.
  To set that class on content that you manually inserted without Unpoly, use `up.hello()`.

  See [`[up-nav]`](/up-nav) for more documentation and examples.

  @selector .up-current
  @stable
  */

  function updateLayerIfLocationChanged(layer) {
    const processedLocation = layer.feedbackLocation

    const layerLocation = getMatchableLayerLocation(layer.location)

    // A history change might call this function multiple times,
    // since we listen to both up:location:changed and up:layer:location:changed.
    // We also don't want to unnecessarily reprocess nav links, which is expensive.
    // For this reason we check whether the current location differs from
    // the last processed location.
    if (!processedLocation || (processedLocation !== layerLocation)) {
      layer.feedbackLocation = layerLocation
      updateFragment(layer.element, { layer })
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

  up.on('up:fragment:compile', (_event, newFragment) => {
    updateFragment(newFragment)
  })

  up.on('up:layer:location:changed', (event) => {
    updateLayerIfLocationChanged(event.layer)
  })

  // The framework is reset between tests
  up.on('up:framework:reset', reset)

  return {
    config,
    // showAroundRequest,
    preview: registerPreview,
    getPreviewFn,
    showPreviews,
  }
})()

up.preview = up.feedback.preview
