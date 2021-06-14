###**
Navigation feedback
===================

The `up.feedback` module adds useful CSS classes to links while they are loading,
or when they point to the current URL.

By styling these classes you may provide instant feedback to user interactions,
improving the perceived speed of your interface.


\#\#\# Example

Let's say we have an `<nav>` element with two links, pointing to `/foo` and `/bar` respectively:

```html
<nav>
  <a href="/foo" up-follow>Foo</a>
  <a href="/bar" up-follow>Bar</a>
</nav>
```

By giving the navigation bar the `[up-nav]` attribute, links pointing to the current browser address are highlighted
as we navigate through the site.

If the current URL is `/foo`, the first link is automatically marked with an [`.up-current`](/a.up-current) class:

```html
<nav up-nav>
  <a href="/foo" up-follow class="up-current">Foo</a>
  <a href="/bar" up-follow>Bar</a>
</nav>
```

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/a.up-active) class while it is waiting
for the server to respond:

```
<nav up-nav>
  <a href="/foo" up-follow class="up-current">Foo</a>
  <a href="/bar" up-follow class="up-active">Bar</a>
</div>
```

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

```html
<nav up-nav>
  <a href="/foo" up-follow>Foo</a>
  <a href="/bar" up-follow class="up-current">Bar</a>
</nav>
```

@see [up-nav]
@see a.up-current
@see a.up-active

@module up.feedback
###
up.feedback = do ->

  u = up.util
  e = up.element

  ###**
  Sets default options for this package.

  @property up.feedback.config

  @param {Array<string>} [config.currentClasses]
    An array of classes to set on [links that point the current location](/a.up-current).

  @param {Array<string>} [config.navSelectors]
    An array of CSS selectors that match [navigation components](/up-nav).

  @stable
  ###
  config = new up.Config ->
    currentClasses: ['up-current']
    navSelectors: ['[up-nav]', 'nav']

  reset = ->
    config.reset()

  CLASS_ACTIVE = 'up-active'
  SELECTOR_LINK = 'a, [up-href]'

  navSelector = ->
    config.navSelectors.join(',')

  normalizeURL = (url) ->
    if url
      u.normalizeURL(url, stripTrailingSlash: true)

  linkURLs = (link) ->
    # Check if we have computed the URLs before.
    # Computation is sort of expensive (multiplied by number of links),
    # so we cache the results in a link property
    return link.upFeedbackURLs ||= new up.LinkFeedbackURLs(link)

  updateFragment = (fragment) ->
    layerOption = { layer: up.layer.get(fragment) }

    if up.fragment.closest(fragment, navSelector(), layerOption)
      # If the new fragment is an [up-nav], or if the new fragment is a child of an [up-nav],
      # all links in the new fragment are considered links that we need to update.
      #
      # Note that:
      #
      # - The [up-nav] element might not be part of this update.
      #   It might already be in the DOM, and only a child was updated.
      # - The fragment might be a link itself.
      # - We do not need to update sibling links of fragment that have been processed before.
      # - The fragment may be the <body> element which contains all other overlays.
      #   But we only want to update the <body>.
      links = up.fragment.subtree(fragment, SELECTOR_LINK, layerOption)
      updateLinks(links, layerOption)
    else
      updateLinksWithinNavs(fragment, layerOption)

  updateLinksWithinNavs = (fragment, options) ->
    navs = up.fragment.subtree(fragment, navSelector(), options)
    links = u.flatMap navs, (nav) -> e.subtree(nav, SELECTOR_LINK)
    updateLinks(links, options)

  getLayerLocation = (layer) ->
    # We store the last processed location in layer.feedbackLocation,
    # so multiple calls for the same layer won't unnecessarily reprocess links.
    # We update the property on up:layer:location:changed.
    #
    # The { feedbackLocation } property may be nil if:
    # (1) The layer was opened without a location, e.g. if it was created from local HTML.
    # (2) The layer is the root layer and the location was never changed.
    #     The initial page load does not emit an up:layer:location:changed event for
    #     the root layer to be consistent with up:location:changed.
    return layer.feedbackLocation || layer.location

  updateLinks = (links, options = {}) ->
    return unless links.length

    layer = options.layer || up.layer.get(links[0])

    # An overlay might not have a { location } property, e.g. if it was created
    # from local { content }. In this case we do not set .up-current.
    if layerLocation = getLayerLocation(layer)
      u.each links, (link) ->
        isCurrent = linkURLs(link).isCurrent(layerLocation)
        for currentClass in config.currentClasses
          e.toggleClass(link, currentClass, isCurrent)
        e.toggleAttr(link, 'aria-current', 'page', isCurrent)

  ###**
  @function findActivatableArea
  @param {string|Element|jQuery} element
  @internal
  ###
  findActivatableArea = (element) ->
    # Try to enlarge links that are expanded with [up-expand] on a surrounding container.
    # Note that the expression below is not the same as e.closest(area, SELECTOR_LINK)!
    e.ancestor(element, SELECTOR_LINK) || element

  ###**
  Marks the given element as currently loading, by assigning the CSS class [`up-active`](/a.up-active).

  This happens automatically when following links or submitting forms through the Unpoly API.
  Use this function if you make custom network calls from your own JavaScript code.

  If the given element is a link within an [expanded click area](/up-expand),
  the class will be assigned to the expanded area.

  \#\#\# Example

      var button = document.querySelector('button')

      button.addEventListener('click', () => {
        up.feedback.start(button)
        up.request(...).then(() => {
          up.feedback.stop(button)
        })
      })

  @function up.feedback.start
  @param {Element} element
    The element to mark as active
  @internal
  ###
  start = (element) ->
    findActivatableArea(element).classList.add(CLASS_ACTIVE)

  ###**
  Links that are currently [loading through Unpoly](/a-up-follow)
  are assigned the `.up-active` class automatically.

  Style `.up-active` in your CSS to improve the perceived responsiveness
  of your user interface.

  The `.up-active` class will be removed when the link is done loading.

  \#\#\# Example

  We have a link:

  ```html
  <a href="/foo" up-follow>Foo</a>
  ```

  The user clicks on the link. While the request is loading,
  the link has the `up-active` class:

  ```html
  <a href="/foo" up-follow class="up-active">Foo</a>
  ```

  Once the link destination has loaded and rendered, the `.up-active` class
  is removed and the [`.up-current`](/a.up-current) class is added:

  ```html
  <a href="/foo" up-follow class="up-current">Foo</a>
  ```

  @selector a.up-active
  @stable
  ###

  ###**
  Forms that are currently [loading through Unpoly](/form-up-submit)
  are assigned the `.up-active` class automatically.
  Style `.up-active` in your CSS to improve the perceived responsiveness
  of your user interface.

  The `.up-active` class will be removed as soon as the response to the
  form submission has been received.

  \#\#\# Example

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

  @selector form.up-active
  @stable
  ###

  ###**
  Marks the given element as no longer loading, by removing the CSS class [`.up-active`](/a.up-active).

  This happens automatically when network requests initiated by the Unpoly API have completed.
  Use this function if you make custom network calls from your own JavaScript code.

  @function up.feedback.stop
  @param {Element} element
    The link or form that has finished loading.
  @internal
  ###
  stop = (element) ->
    findActivatableArea(element).classList.remove(CLASS_ACTIVE)

  around = (element, fn) ->
    start(element)
    result = fn()
    u.always(result, -> stop(element))
    return result

  aroundForOptions = (options, fn) ->
    if feedbackOpt = options.feedback
      if u.isBoolean(feedbackOpt)
        element = options.origin
      else
        element = feedbackOpt

    if element
      # In case we get passed a selector or jQuery collection as { origin }
      # or { feedback }, unwrap it with up.fragment.get().
      element = up.fragment.get(element)

      return around(element, fn)
    else
      return fn()


  ###**
  Marks this element as a navigation component, such as a menu or navigation bar.

  When a link within an `[up-nav]` element points to [its layer's location](/up.layer.location),
  it is assigned the [`.up-current`](/a.up-current) class. When the browser navigates to another location, the class is removed automatically.

  You may also assign `[up-nav]` to an individual link instead of an navigational container.

  If you don't want to manually add this attribute to every navigational element,
  you can configure selectors to automatically match your navigation components in `up.feedback.config.navs`.


  \#\#\# Example

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


  \#\#\# When is a link "current"?

  When no [overlay](/up.layer) is open, the current location is the URL displayed
  in the browser's address bar. When the link in question is placed in an overlay,
  the current location is the location of that overlay, even if that
  overlay doesn't have [visible history](/up.Layer.prototype.historyVisible).

  A link matches the current location (and is marked as `.up-current`) if it matches either:

  - the link's `[href]` attribute
  - the link's `[up-href]` attribute
  - the URL pattern in the link's [`[up-alias]`](/a-up-alias) attribute

  @selector [up-nav]
  @stable
  ###

  ###**
  Links within `[up-nav]` may use the `[up-alias]` attribute to pass an [URL pattern](/url-patterns) for which they
  should also be highlighted as [`.up-current`](a.up-current).

  \#\#\# Example

  The link below will be highlighted with `.up-current` at both `/profile` and `/profile/edit` locations:

  ```html
  <div up-nav>
    <a href="/profile" up-alias="/profile/edit">Profile</a>
  </div>
  ```

  To pass more than one alternative URLs, use an [URL pattern](/url-patterns).

  @selector a[up-alias]
  @param up-alias
    A [URL pattern](/url-patterns) with alternative URLs.
  @stable
  ###

  ###**
  When a link within an `[up-nav]` element points to the current location, it is assigned the `.up-current` class.

  See [`[up-nav]`](/up-nav) for more documentation and examples.

  @selector a.up-current
  @stable
  ###

  updateLayerIfLocationChanged = (layer) ->
    processedLocation = layer.feedbackLocation

    currentLocation = normalizeURL(layer.location)

    # A history change might call this function multiple times,
    # since we listen to both up:location:changed and up:layer:location:changed.
    # For this reason we check whether the current location differs from
    # the last processed location.
    if !processedLocation || processedLocation != currentLocation
      layer.feedbackLocation = currentLocation
      updateLinksWithinNavs(layer.element, { layer })

  onBrowserLocationChanged = ->
    frontLayer = up.layer.front

    # We allow Unpoly-unaware code to use the pushState API and change the
    # front layer in the process. See up.Layer.Base#location setter.
    if frontLayer.showsLiveHistory()
      updateLayerIfLocationChanged(frontLayer)

  # Even when the modal or popup does not change history, we consider the URLs of the content it displays.
  up.on 'up:location:changed', (_event) -> # take 1 arg to prevent data parsing
    onBrowserLocationChanged()

  up.on 'up:fragment:inserted', (_event, newFragment) ->
    updateFragment(newFragment)

  up.on 'up:layer:location:changed', (event) ->
    updateLayerIfLocationChanged(event.layer)

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  config: config
  start: start
  stop: stop
  around: around
  aroundForOptions: aroundForOptions
  normalizeURL: normalizeURL
