/*-
Status effects
==============

Unpoly can apply temporary status effects to your page as the user navigates through your site.

For example, you can show arbitrary [loading state](/loading-state) while waiting for the server,
implement [optimistic rendering](/optimistic-rendering) or highlight current links in [navigation bars](/navigation-bars).

@see navigation-bars
@see loading-state
@see feedback-classes
@see placeholders
@see previews
@see optimistic-rendering

@see [up-nav]
@see .up-current
@see .up-active
@see .up-loading
@see [up-placeholder]
@see [up-preview]

@module up.status
*/
up.status = (function() {

  const u = up.util
  const e = up.element

  /*-
  Sets default options for this package.

  @property up.status.config

  @param {Array<string>} [config.currentClasses=['up-current']]
    An array of classes to set on [links that point the current location](/up-current).

  @param {Array<string>} [config.activeClasses=['up-active']]
    An array of classes to set on [activated links or form elements](/up-active).

  @param {Array<string>} [config.loadingClasses=['up-loading']]
    An array of classes to on [loading fragments](/up-loading).

  @param {Array<string>} [config.navSelectors=['[up-nav]', 'nav']]
    An array of CSS selectors that match [navigational containers](/navigation-bars).

  @param {Array<string>} [config.noNavSelectors=['[up-nav=false]']]
    Exceptions to `up.status.config.navSelectors`.

  @stable
  */
  const config = new up.Config(() => ({
    currentClasses: ['up-current'],
    activeClasses: ['up-active'],
    loadingClasses: ['up-loading'],
    navSelectors: ['[up-nav]', 'nav'],
    noNavSelectors: ['[up-nav=false]'],
  }))

  let namedPreviewFns = new up.Registry('preview')

  /*-
  Registers a named [preview](/previews) function.

  Preview function are applied using the `[up-preview]` attribute or [`{ preview }`](/up.render#options.preview) option.
  See [Previews](/previews) for an overview.

  ## Example

  This preview sets a temporary `[app-loading=true]` attribute on the targeted fragment:

  ```js
  up.preview('loading-attr', function(preview) {
    preview.setAttrs({ 'app-loading': true })
  })
  ```

  The `preview` argument is an `up.Preview` instance that offers many utilities to make temporary changes.
  For example, you can use it to insert or move elements, add classes or set attributes.

  We can use the `loading-attr` preview in any link or form by setting an `[up-preview]` attribute:

  ```html
  <a href="/edit" up-follow up-preview="loading-attr">Edit page</a> <!-- mark-phrase "up-preview" -->
  ```

  ## Accepting parameters {#parameters}

  Preview functions can accept an options object as a second argument.
  This is useful to define multiple variations of a preview effect.

  For example, the following preview accepts a `{ size }` option to show a spinner of varying size:

  ```js
  up.preview('spinner', function(preview, { width = 50 }) {
    let spinner = up.element.createFromSelector('img', { src: 'spinner.gif', width })
    preview.insert(preview.fragment, spinner)
  })
  ```

  From HTML you can append the options to the `[up-preview]` argument, after the preview name:

  ```html
  <a href="/edit" up-follow up-preview="spinner { size: 100 }">Edit page</a> <!-- mark-phrase "{ size: 100 }" -->
  ```

  @function up.preview
  @param {string} name
    The name of the preview.
  @param {Function(up.Preview, Object)} callback
    The function that applies the temporary page mutation.

    Any [preview parameters](#parameters) will be passed as a second argument.
  @stable
  */

  function reset() {
    up.layer.root.feedbackLocation = null
  }

  const SELECTOR_LINK = 'a, [up-href]'

  function linkCurrentURLs(link) {
    // Check if we have computed the URLs before.
    // Computation is sort of expensive (multiplied by number of links),
    // so we cache the results in a link property
    return link.upCurrentURLs ||= new up.LinkCurrentURLs(link)
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
      const isCurrent = linkCurrentURLs(link).isCurrent(layerLocation)
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
  While rendering, the `.up-active` class is added to the [origin](/origin) element that triggered the change.

  The class remains set while the request is loading.
  It is removed when the request [ends](/up.Request.prototype.ended) for any reason.

  See [Feedback classes](/feedback-classes) for details and examples.

  > [tip]
  > If you're looking to style the [targeted](/targeting-fragments) fragment, see `.up-loading`.

  @selector .up-active
  @stable
  */

  /*-
  While rendering, all [targeted fragments](/targeting-fragments) are assigned the `.up-loading` class.

  The class remains set while the request is loading.
  It is removed when the request [ends](/up.Request.prototype.ended) for any reason.

  See [Feedback classes](/feedback-classes) for details and examples.

  > [tip]
  > If you're looking to style the [origin](/origin) that targeted the fragment, see `.up-active`.

  @selector .up-loading
  @stable
  */

  function runPreviews(request, renderOptions) {
    let { bindLayer } = request
    let focusCapsule = up.FocusCapsule.preserve(bindLayer)
    let applyPreviews = () => doRunPreviews(request, renderOptions)
    let revertPreviews = bindLayer.asCurrent(applyPreviews)
    focusCapsule?.autoVoid()
    return () => {
      bindLayer.asCurrent(revertPreviews)
      focusCapsule?.restore(bindLayer, { preventScroll: true })
    }
  }

  function doRunPreviews(request, renderOptions) {
    let { fragment, fragments, origin } = request
    let cleaner = u.cleaner()
    let previewForFragment = (fragment) => new up.Preview({ fragment, request, renderOptions, cleaner })

    // Some preview effects only run once per render pass.
    // The { fragment } for these previews will be the first fragment,
    // or null if there is no first fragment (when opening a layer).
    let singlePreview = previewForFragment(fragment)
    singlePreview.run(resolvePreviewFns(renderOptions.preview))
    singlePreview.run(getPlaceholderPreviewFn(renderOptions.placeholder))
    singlePreview.run(getFeedbackClassesPreviewFn(renderOptions.feedback, fragments))
    singlePreview.run(up.form.getDisablePreviewFn(renderOptions.disable, origin))

    // Other fragment effects run once per targeted fragment.
    // This is useful for batched validations, where we may update multiple fragments,
    // but each with individual preview effects.
    for (let fragment of fragments) {
      let eachPreview = previewForFragment(fragment)
      eachPreview.run(e.matchSelectorMap(renderOptions.previewMap, fragment))
      eachPreview.run(e.matchSelectorMap(renderOptions.placeholderMap, fragment).flatMap(getPlaceholderPreviewFn))
    }

    return cleaner.clean
  }

  /*-
  Links or forms can name a [preview function](/previews) that is called while
  loading content from the server.

  When the user interacts with a link or form, its preview function is invoked immediately.
  The function will usually [mutate the DOM](/previews#basic-mutations) to signal that the app is working,
  or to provide clues for how the page will ultimately look.
  For example, if the user is deleting an item from a list, the preview
  function could hide that item visually.

  See [Previews](/previews) for details and examples.

  ## Usage

  To refer to a preview function, set its name as an `[up-preview]` attribute:

  ```html
  <a href="/edit" up-follow up-preview="spinner">Edit page</a> <!-- mark-phrase "spinner" -->
  ```

  To [call multiple previews](/previews#multiple), separate their names with a comma:

  ```html
  <a href="/edit" up-follow up-preview="spinner, dim-page">Edit page</a> <!-- mark-phrase "spinner, dim-page" -->
  ```

  [Preview options](#parameters) can be appended after each preview name, encoded as [Relaxed JSON](/relaxed-json):

  ```html
  <a href="/edit"
     up-follow
     up-preview="spinner { size: 20 }, dim-page { animation: 'pulse' }"> <!-- mark-phrase "spinner { size: 20 }, dim-page { animation: 'pulse' }" -->
    Edit page
  </a>
  ```

  @selector [up-preview]

  @param up-preview
    The name of a preview function defined with `up.preview()`.

    To call multiple previews, separate names with a comma.

  @stable
  */

  /*-
  Links or forms can define a [placeholder](/placeholders) that will be shown within the targeted
  fragment while loading content from the server.

  All other children of the targeted fragment will be hidden while
  the request is in flight.  When the requests [ends](/up.Request.prototype.ended) for any reason,
  the placeholder will be removed and the original fragment children will be un-hidden.

  When [targeting multiple fragments](/targeting-fragments#multiple),
  the placeholder will be shown in the first fragment.

  ## Example

  This link will show the message *"Loading…"* within `#target` while its request is loading:

  ```html
  <a href="/path" up-target="#target" up-placeholder="<p>Loading…</p>">Show story</a> <!-- mark-phrase "<p>Loading…</p>" -->

  <div id="#target">
    Old content
  </div>
  ```

  See [Placeholders](/placeholders) for details and elaborate examples.

  @selector [up-placeholder]
  @param up-placeholder
    The HTML string for the placeholder.

    You can also [use a template](/placeholders#from-template)
    by setting this attribute to a CSS selector matching
    a `<template>` or `<script>` element.
  @experimental
  */

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
      return resolvePreviewString(value)
    } else if (u.isArray(value)) {
      return value.flatMap(resolvePreviewFns)
    } else {
      return []
    }
  }

  function resolvePreviewString(str) {
    return u.map(u.parseScalarJSONPairs(str), ([name, parsedOptions]) => {
      let previewFn = namedPreviewFns.get(name)

      return function(preview, runOptions) {
        up.puts('[up-preview]', 'Showing preview %o', name)
        return previewFn(preview, parsedOptions || runOptions)
      }
    })
  }

  function getActiveElements({ origin, activeElements }) {
    activeElements ||= u.wrapList(origin)
    // If the link area was grown with [up-expand], we highlight the [up-expand] container.
    return activeElements.map(findActivatableArea)
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
    parser.string('preview')
    parser.booleanOrString('revalidatePreview')
    parser.string('placeholder')
    return options
  }

  /*-
  Marks this element as a [navigational container](/navigation-bars), such as a menu or navigation bar.

  When a link within an `[up-nav]` element points to [its layer's location](/up.layer.location),
  it is assigned the `.up-current` class. When the browser navigates to another location, the class is removed automatically.

  See [Navigation bars](/navigation-bars) for details and examples.

  ### Example

  Let's look at a simple menu with two links:

  ```html
  <div up-nav> <!-- mark-phrase "up-nav" -->
    <a href="/foo">Foo</a>
    <a href="/bar">Bar</a>
  </div>
  ```

  When the browser location changes to `/foo`, the first link is marked as `.up-current`:

  ```html
  <div up-nav>
    <a href="/foo" class="up-current">Foo</a> <!-- mark-phrase "up-current" -->
    <a href="/bar">Bar</a>
  </div>
  ```

  When the browser location changes to `/bar`, the first link loses its `.up-current` class.
  Now the second link is marked as `.up-current`:

  ```html
  <div up-nav>
    <a href="/foo">Foo</a>
    <a href="/bar" class="up-current">Bar</a> <!-- mark-phrase "up-current" -->
  </div>
  ```

  @selector [up-nav]
  @stable
  */

  /*-
  Links within [navigational container](/navigation-bars)
  may use the `[up-alias]` attribute to alternative URLs for which they
  should also be highlighted as `.up-current`.

  See [Highlighting links for multiple URLs](/navigation-bars#aliases) for more documentation.

  ### Example

  The link below will be highlighted with `.up-current` at both `/profile` and `/profile/edit` locations:

  ```html
  <nav>
    <a href="/profile" up-alias="/profile/edit">Profile</a>
  </nav>
  ```

  To configure multiple alternative URLs, use a [URL pattern](/url-patterns).

  @selector [up-alias]
  @param up-alias
    A [URL pattern](/url-patterns) with alternative URLs.
  @stable
  */

  /*-
  When a link within a [navigational container](/navigation-bars) points to the current location, it is assigned the `.up-current` class.

  See [Navigation bars](/navigation-bars) for more documentation and examples.

  ### Example

  @include nav-example

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
    preview: namedPreviewFns.put,
    resolvePreviewFns,
    runPreviews,
    statusOptions,
  }
})()

up.preview = up.status.preview
