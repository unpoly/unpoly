###**
Navigation feedback
===================

The `up.feedback` module adds useful CSS classes to links while they are loading,
or when they point to the current URL. By styling these classes you may
provide instant feedback to user interactions. This improves the perceived speed of your interface.


\#\#\# Example

Let's say we have an navigation bar with two links, pointing to `/foo` and `/bar` respectively:

    <div up-nav>
      <a href="/foo" up-follow>Foo</a>
      <a href="/bar" up-follow>Bar</a>
    </div>

If the current URL is `/foo`, the first link is automatically marked with an [`.up-current`](/a.up-current) class:

    <div up-nav>
      <a href="/foo" up-follow class="up-current">Foo</a>
      <a href="/bar" up-follow>Bar</a>
    </div>

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/a.up-active) class while it is waiting
for the server to respond:

    <div up-nav>
      <a href="/foo" up-follow class="up-current">Foo</a>
      <a href="/bar" up-follow class="up-active">Bar</a>
    </div>

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

    <div up-nav>
      <a href="/foo" up-follow>Foo</a>
      <a href="/bar" up-follow class="up-current">Bar</a>
    </div>


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
  @param {Array<string>} [config.navs]
    An array of CSS selectors that match [navigation components](/up-nav).
  @stable
  ###
  config = new up.Config ->
    currentClasses: ['up-current']
    navs: ['[up-nav]']

  reset = ->
    config.reset()

  CLASS_ACTIVE = 'up-active'
  SELECTOR_LINK = 'a, [up-href]'

  navSelector = ->
    config.navs.join(',')

  normalizeURL = (url) ->
    if url
      u.normalizeURL(url, stripTrailingSlash: true)

  linkURLs = (link) ->
    # Check if we have computed the URLs before.
    # Computation is sort of expensive (multiplied by number of links),
    # so we cache the results in a link property
    return link.upFeedbackURLs ||= new up.LinkFeedbackURLs(link, normalizeURL)

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
    console.debug("updateLinksWithinNavs(%o, %o)", fragment, options)
    navs = e.subtree(fragment, navSelector())
    links = u.flatMap navs, (nav) -> e.subtree(nav, SELECTOR_LINK)
    updateLinks(links, options)

  updateLinks = (links, options = {}) ->
    return unless links.length

    layer = options.layer || up.layer.of(links[0])
    if layerLocation = layer.feedbackLocation
      u.each links, (link) ->
        isCurrent = linkURLs(link).isCurrent(layerLocation)
        # Once we drop IE11 support in 2020 we can call add() with multiple arguments
        for currentClass in config.currentClasses
          e.toggleClass(link, currentClass, isCurrent)

  ###**
  @function findActivatableArea
  @param {string|Element|jQuery} elementOrSelector
  @internal
  ###
  findActivatableArea = (element) ->
    element = e.get(element)
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

  @method up.feedback.start
  @param {Element|jQuery|string} element
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
  @param {Element|jQuery|string} element
    The link or form that has finished loading.
  @internal
  ###
  stop = (element) ->
    findActivatableArea(element).classList.remove(CLASS_ACTIVE)

  around = (element, fn) ->
    start(element)
    fnPromise = fn()
    # Don't reassign the result of result of always() --
    # this would hide rejections.
    u.always(fnPromise, -> stop(element))
    return fnPromise

  aroundForOptions = (options, fn) ->
    if feedbackOpt = options.feedback
      if u.isBoolean(feedbackOpt)
        element = options.origin
      else
        element = up.fragment.first(feedbackOpt)

    if element
      return around(element, fn)
    else
      return fn()


  ###**
  Marks this element as a navigation component, such as a menu or navigation bar.

  When a link within an `[up-nav]` element points to the current location, it is assigned the `.up-current` class. When the browser navigates to another location, the class is removed automatically.

  You may also assign `[up-nav]` to an individual link instead of an navigational container.

  If you don't want to manually add this attribute to every navigational element, you can configure selectors to automatically match your navigation components in [`up.feedback.config.navs`](/up.feedback.config#config.navs).


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

  - the link's `href` attribute
  - the link's `up-href` attribute
  - a space-separated list of URLs in the link's `up-alias` attribute

  \#\#\# Matching URL by pattern

  You can mark a link as `.up-current` whenever the current URL matches a prefix or suffix.
  To do so, include an asterisk (`*`) in the `up-alias` attribute.

  For instance, the following `[up-nav]` link is highlighted for both `/reports` and `/reports/123`:

      <a up-nav href="/reports" up-alias="/reports/*">Reports</a>

  @selector [up-nav]
  @stable
  ###

  ###**
  When a link within an `[up-nav]` element points to the current location, it is assigned the `.up-current` class.

  See [`[up-nav]`](/up-nav) for more documentation and examples.

  @selector [up-nav] a.up-current
  @stable
  ###

  updateLayerIfLocationChanged = (layer) ->
    console.debug("updateLayerIfLocationChanged(%o)", layer)
    previousLocation = layer.feedbackLocation
    newLocation = normalizeURL(layer.location)
    if !previousLocation || previousLocation != newLocation
      layer.feedbackLocation = newLocation
      updateLinksWithinNavs(layer.element, { layer })
    console.debug("updateLayerIfLocationChanged(%o) done", layer)

  onHistoryChanged = ->
    leafLayer = up.layer.leaf
    # We allow Unpoly-unaware code to use the pushState API and change the
    # leaf layer in the process.
    if leafLayer.hasLiveHistory()
      updateLayerIfLocationChanged(leafLayer)

  # Even when the modal or popup does not change history, we consider the URLs of the content it displays.
  up.on 'up:history:pushed up:history:replaced up:history:restored', (event) -> # take 1 arg to prevent data parsing
    onHistoryChanged()

  up.on 'up:fragment:inserted', (event, newFragment) ->
    updateFragment(newFragment, event)

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  config: config
  start: start
  stop: stop
  around: around
  aroundForOptions: aroundForOptions
  updateLayer: updateLayerIfLocationChanged

up.legacy.renamedModule 'navigation', 'feedback'
