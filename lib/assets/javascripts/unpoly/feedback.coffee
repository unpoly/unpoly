###**
Navigation feedback
===================

The `up.feedback` module adds useful CSS classes to links while they are loading,
or when they point to the current URL. By styling these classes you may
provide instant feedback to user interactions. This improves the perceived speed of your interface.


\#\#\# Example

Let's say we have an `<nav>` element with two links, pointing to `/foo` and `/bar` respectively:

    <nav>
      <a href="/foo" up-follow>Foo</a>
      <a href="/bar" up-follow>Bar</a>
    </nav>

By giving the navigation bar the `[up-nav]` attribute, links pointing to the current browser address are highlighted
as we navigate through the site.

If the current URL is `/foo`, the first link is automatically marked with an [`.up-current`](/a.up-current) class:

    <nav up-nav>
      <a href="/foo" up-follow class="up-current">Foo</a>
      <a href="/bar" up-follow>Bar</a>
    </nav>

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/a.up-active) class while it is waiting
for the server to respond:

    <nav up-nav>
      <a href="/foo" up-follow class="up-current">Foo</a>
      <a href="/bar" up-follow class="up-active">Bar</a>
    </div>

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

    <nav up-nav>
      <a href="/foo" up-follow>Foo</a>
      <a href="/bar" up-follow class="up-current">Bar</a>
    </nav>


@module up.feedback
###
up.feedback = do ->

  u = up.util
  e = up.element

  ###**
  Sets default options for this module.

  @property up.feedback.config
  @param {Array<string>} [config.currentClasses]
    An array of classes to set on [links that point the current location](/a.up-current).
  @param {Array<string>} [config.navSelectors]
    An array of CSS selectors that match [navigation components](/up-nav).
  @stable
  ###
  config = new up.Config ->
    currentClasses: ['up-current']
    navSelectors: ['[up-nav]']

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

  updateFragment = (fragment, options) ->
    if e.closest(fragment, navSelector())
      # If the new fragment is an [up-nav], or if the new fragment is a child of an [up-nav],
      # all links in the new fragment are considered links that we need to update.
      # Note that:
      # - The [up-nav] element might not be part of this update.
      #   It might already be in the DOM, and only a child was updated.
      # - The fragment might be a link itself
      # - We do not need to update sibling links of fragment that have been processed before.
      links = e.subtree(fragment, SELECTOR_LINK)
      updateLinks(links, options)
    else
      updateLinksWithinNavs(fragment, options)

  updateLinksWithinNavs = (fragment, options) ->
    navs = e.subtree(fragment, navSelector())
    links = u.flatMap navs, (nav) -> e.subtree(nav, SELECTOR_LINK)
    updateLinks(links, options)

  updateLinks = (links, options = {}) ->
    return unless links.length

    layer = options.layer || up.layer.get(links[0])

    # A layer might not have a { location } property, e.g. if it was created
    # from local { content }. In this case we do not set .up-current.
    if layerLocation = layer.feedbackLocation
      u.each links, (link) ->
        isCurrent = linkURLs(link).isCurrent(layerLocation)
        # Once we drop IE11 support in 2020 we can call add() with multiple arguments
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
  Links that are currently [loading through Unpoly](/form-up-target)
  are assigned the `up-active` class automatically.
  Style `.up-active` in your CSS to improve the perceived responsiveness
  of your user interface.

  The `up-active` class will be removed when the link is done loading.

  \#\#\# Example

  We have a link:

      <a href="/foo" up-follow>Foo</a>

  The user clicks on the link. While the request is loading,
  the link has the `up-active` class:

      <a href="/foo" up-follow class="up-active">Foo</a>

  Once the link destination has loaded and rendered, the `up-active` class
  is removed and the [`up-current`](/a.up-current) class is added:

      <a href="/foo" up-follow class="up-current">Foo</a>

  @selector a.up-active
  @stable
  ###

  ###**
  Forms that are currently [loading through Unpoly](/a-up-target)
  are assigned the `up-active` class automatically.
  Style `.up-active` in your CSS to improve the perceived responsiveness
  of your user interface.

  The `up-active` class will be removed as soon as the response to the
  form submission has been received.

  \#\#\# Example

  We have a form:

      <form up-target=".foo">
        <button type="submit">Submit</button>
      </form>

  The user clicks on the submit button. While the form is being submitted
  and waiting for the server to respond, the form has the `up-active` class:

      <form up-target=".foo" class="up-active">
        <button type="submit">Submit</button>
      </form>

  Once the link destination has loaded and rendered, the `up-active` class
  is removed.

  @selector form.up-active
  @stable
  ###

  ###**
  Marks the given element as no longer loading, by removing the CSS class [`up-active`](/a.up-active).

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
    return u.always(fn(), -> stop(element))

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

  When a link within an `[up-nav]` element points to the current location, it is assigned the [`.up-current`](/a.up-current) class. When the browser navigates to another location, the class is removed automatically.

  You may also assign `[up-nav]` to an individual link instead of an navigational container.

  If you don't want to manually add this attribute to every navigational element, you can configure selectors to automatically match your navigation components in `up.feedback.config.navs`.


  \#\#\# Example

  Let's take a simple menu with two links. The menu has been marked with the `[up-nav]` attribute:

      <div up-nav>
        <a href="/foo">Foo</a>
        <a href="/bar">Bar</a>
      </div>

  If the browser location changes to `/foo`, the first link is marked as `.up-current`:

      <div up-nav>
        <a href="/foo" class="up-current">Foo</a>
        <a href="/bar">Bar</a>
      </div>

  If the browser location changes to `/bar`, the first link automatically loses its `.up-current` class. Now the second link is marked as `.up-current`:

      <div up-nav>
        <a href="/foo">Foo</a>
        <a href="/bar" class="up-current">Bar</a>
      </div>


  \#\#\# What is considered to be "current"?

  The current location is considered to be either:

  - the URL displayed in the browser window's location bar
  - the source URL of a [modal dialog](/up.modal)
  - the URL of the page behind a [modal dialog](/up.modal)
  - the source URL of a [popup overlay](/up.popup)
  - the URL of the content behind a [popup overlay](/up.popup)

  A link matches the current location (and is marked as `.up-current`) if it matches either:

  - the link's `[href]` attribute
  - the link's `[up-href]` attribute
  - the URL pattern in the link's [`[up-alias]`](/a-up-alias) attribute

  @selector [up-nav]
  @stable
  ###

  ###**
  Links within `[up-nav]` may use the `[up-alias]` attribute to pass an URL pattern for which they
  should also be highlighted as [`.up-current`](a.up-current).

  \#\#\# Examples

  The link below will be highlighted with `.up-current` at both `/profile` and `/profile/edit` locations:

      <nav up-nav>
        <a href="/profile" up-alias="/profile/edit">Profile</a>
      </nav>

  To pass more than one alternative URLs, separate them by a space character:

      <nav up-nav>
        <a href="/profile" up-alias="/profile/new /profile/edit">Profile</a>
      </nav>

  Often you would like to mark a link as `.up-current` whenever the current URL matches a prefix or suffix.
  To do so, include an asterisk (`*`) in the `[up-alias]` attribute. For instance, the first link in the
  below will be highlighted for both `/users` and `/users/123`:

      <nav up-nav>
        <a href="/users" up-alias="/users/*">Users</a>
        <a href="/reports" up-alias="/reports/*">Reports</a>
      </div>

  You may pass multiple patterns separated by a space character:

      <nav up-nav>
        <a href="/users" up-alias="/users/* /profile/*">Users</a>
      </nav>

  @selector a[up-alias]
  @param {string} up-alias
    A space-separated list of alternative URLs or URL patterns.
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
    # since we listed to up:history:pushed and up:layer:location:changed.
    # For this reason we check whether the current location differs from
    # the last processed location.
    if !processedLocation || processedLocation != currentLocation
      layer.feedbackLocation = currentLocation
      updateLinksWithinNavs(layer.element, { layer })

  onHistoryChanged = ->
    frontLayer = up.layer.front

    # We allow Unpoly-unaware code to use the pushState API and change the
    # front layer in the process. See up.Layer.Base#location setter.
    if frontLayer.hasLiveHistory()
      updateLayerIfLocationChanged(frontLayer)

  # Even when the modal or popup does not change history, we consider the URLs of the content it displays.
  up.on 'up:history:pushed up:history:replaced up:history:restored', (event) -> # take 1 arg to prevent data parsing
    onHistoryChanged()

  up.on 'up:fragment:inserted', (event, newFragment) ->
    updateFragment(newFragment, event)

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
