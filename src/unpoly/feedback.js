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

  @param {Array<string>} [config.activeClasses=['up-active']]
    An array of classes to set on [activated links or form elements](/up-active).

  @param {Array<string>} [config.loadingClasses=['up-loading']]
    An array of classes to on [loading fragments](/up-loading).

  @param {Array<string>} [config.navSelectors=['[up-nav]', 'nav']]
    An array of CSS selectors that match [navigational containers](/up-nav).

    Links within navigational containers are assigned `.up-current` if they point to the current URL.

  @param {Array<string>} [config.noNavSelectors=['[up-nav=false]']]
    Exceptions to `up.feedback.config.navSelectors`.

  @stable
  */
  const config = new up.Config(() => ({
    currentClasses: ['up-current'],
    activeClasses: ['up-active'],
    loadingClasses: ['up-loading'],
    navSelectors: ['[up-nav]', 'nav'],
    noNavSelectors: ['[up-nav=false]'],
  }))

  function reset() {
    up.layer.root.feedbackLocation = null
    namedPreviewFns = u.pickBy(namedPreviewFns, 'isDefault')
  }

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
  While rendering [with navigation feedback](/up.feedback#enabling-navigation-feedback),
  the `.up-active` class is added to the [origin](/origin) element that triggered the change.

  The `.up-active` class is removed once the new content has been loaded and rendered.

  To set additional classes on activated elements, configure `up.feedback.config.activeClasses`.

  ### Example: Active link

  We have a link:

  ```html
  <a href="/foo" up-follow>Foo</a>
  ```

  When the user clicks on the link, the link is assigned the `.up-active` class
  while the request is loading:

  ```html
  <a href="/foo" up-follow class="up-active">Foo</a> <!-- mark-phrase "up-active" -->
  ```

  Once the link destination has loaded and rendered, the `.up-active` class
  is removed and the `.up-current` class is added:

  ```html
  <a href="/foo" up-follow class="up-current" aria-current="page">Foo</a>
  ```

  > [NOTE]
  > Links do *not* need an `[up-nav]` container to get the `.up-active` class while loading.

  ### Example: Active form

  We have a form:

  ```html
  <form action="/action" up-submit>
    <input type="text" name="email">
    <button type="submit">Submit</button>
  </form>
  ```

  When the user clicks the submit button, both the button and the form are marked as `.up-active`
  while the form is submitting:

  ```html
  <form action="/action" up-submit class="up-active"> <!-- mark-phrase "up-active" -->
    <input type="text" name="email">
    <button type="submit" class="up-active">Submit</button> <!-- mark-phrase "up-active" -->
  </form>
  ```

  When the user submits by pressing `Return` inside the focused text field, that text field
  is marked as `.up-active` in addition to the form and its default submit button:

  ```html
  <form action="/action" up-submit class="up-active"> <!-- mark-phrase "up-active" -->
    <input type="text" name="email" class="up-active"> <!-- mark-phrase "up-active" -->
    <button type="submit">Submit</button> <!-- mark-phrase "up-active" -->
  </form>
  ```

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

  To set additional classes on loading fragments, configure `up.feedback.config.loadingClasses`.

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

  function runPreviews(request, renderOptions) {
    let { fragment, fragments, origin } = request
    let cleaner = u.cleaner()

    // Some preview effects only run once per render pass.
    // The { fragment } for these previews will be the first fragment,
    // or null if there is no first fragment (when opening a layer).
    let singlePreview = new up.Preview({ fragment, request, renderOptions, cleaner })
    singlePreview.run(resolvePreviewFns(renderOptions.preview))
    singlePreview.run(getPlaceholderPreviewFn(renderOptions.placeholder))
    singlePreview.run(getFeedbackClassesPreviewFn(renderOptions.feedback, fragments))
    singlePreview.run(up.form.getDisablePreviewFn(renderOptions.disable, origin))

    // Other fragment effects run once per targeted fragment.
    // This is useful for batched validations, where we may update multiple fragments,
    // but each with individual preview effects.
    for (let fragment of fragments) {
      let eachPreview = new up.Preview({ fragment, request, renderOptions, cleaner })
      eachPreview.run(e.matchSelectorMap(renderOptions.previewMap, fragment))
      eachPreview.run(e.matchSelectorMap(renderOptions.placeholderMap, fragment).flatMap(getPlaceholderPreviewFn))
    }

    return cleaner.clean
  }

  function getPlaceholderPreviewFn(placeholder) {
    if (!placeholder) return

    return function(preview) {
      preview.showPlaceholder(placeholder)
    }
  }

  function resolvePreviewFns(value) {
    if (u.isFunction(value)) {
      return [value]
    } else if (u.isString(value)) {
      return u.parseTokens(value).map(getNamedPreviewFn)
    } else if (u.isArray(value)) {
      return value.flatMap(resolvePreviewFns)
    } else {
      return []
    }
  }

  function getNamedPreviewFn(name) {
    return namedPreviewFns[name] || up.fail('Unknown preview "%s"', name)
  }

  function getActiveElements({ origin, activeElements }) {
    activeElements ||= u.wrapList(origin)
    // If the link area was grown with [up-expand], we highlight the [up-expand] container.
    return activeElements.map(findActivatableArea)
  }

  function registerPreview(name, previewFn) {
    previewFn.isDefault = up.framework.evaling
    namedPreviewFns[name] = function(preview) {
      up.puts('[up-preview]', 'Showing preview %o', name)
      return previewFn(preview)
    }
  }

  function getFeedbackClassesPreviewFn(feedbackOption, fragments) {
    if (!feedbackOption) return

    return function(preview) {
      preview.addClassBatch(getActiveElements(preview.renderOptions), config.activeClasses)
      preview.addClassBatch(fragments, config.loadingClasses)
    }
  }

  function statusOptions(element, options, parserOptions) {
    options = u.options(options)
    const parser = new up.OptionsParser(element, options, parserOptions)
    parser.booleanOrString('disable')
    parser.boolean('feedback')
    parser.booleanOrInvocationOrString('preview', { mainKey: 'preview' })
    parser.booleanOrInvocationOrString('placeholder', { mainKey: 'preview' })
    return options
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

  To set additional classes on current links, configure `up.feedback.config.currentClasses`.

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
    resolvePreviewFns,
    runPreviews,
    statusOptions,
  }
})()

up.preview = up.feedback.preview
