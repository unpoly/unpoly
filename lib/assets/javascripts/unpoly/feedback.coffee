###**
Navigation feedback
===================

Unpoly automatically adds CSS classes to links while they are
currently loading ([`.up-active`](/a.up-active)) or
pointing to the current location ([`.up-current`](/a.up-current)).

By styling these classes with CSS you can provide instant feedback to user interactions.
This improves the perceived speed of your interface.

\#\#\# Example

Let's say we have an navigation bar with two links, pointing to `/foo` and `/bar` respectively:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow>Bar</a>

If the current URL is `/foo`, the first link is automatically marked with an [`up-current`](/a.up-current) class:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow>Bar</a>

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/a.up-active) class while it is waiting
for the server to respond:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow class="up-active">Bar</a>

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow class="up-current">Bar</a>


@class up.feedback
###
up.feedback = (($) ->

  u = up.util

  ###**
  Sets default options for this module.

  @property up.feedback.config
  @param {Array<string>} [config.currentClasses]
    An array of classes to set on [links that point the current location](/a.up-current).
  @stable
  ###
  config = u.config
    currentClasses: ['up-current']
    navs: ['[up-nav]']

  previousUrlSet = undefined
  currentUrlSet = undefined

  reset = ->
    config.reset()
    previousUrlSet = undefined
    currentUrlSet = undefined

  CLASS_ACTIVE = 'up-active'
  SELECTOR_LINK = 'a, [up-href]'

  navSelector = ->
    config.navs.join(',')

  normalizeUrl = (url) ->
    if u.isPresent(url)
      u.normalizeUrl(url, stripTrailingSlash: true)

  NORMALIZED_SECTION_URLS_KEY = 'up-normalized-urls'

  sectionUrls = ($section) ->
    # Check if we have computed the URLs before.
    # Computation is sort of expensive (multiplied by number of links),
    # so we cache the results in a data attribute.
    unless urls = $section.data(NORMALIZED_SECTION_URLS_KEY)
      urls = buildSectionUrls($section)
      $section.data(NORMALIZED_SECTION_URLS_KEY, urls)
    urls

  buildSectionUrls = ($section) ->
    urls = []

    # A link with an unsafe method will never be higlighted with .up-current,
    # so we cache an empty array.
    if up.link.isSafe($section)
      for attr in ['href', 'up-href', 'up-alias']
        if value = u.presentAttr($section, attr)
          # Allow to include multiple space-separated URLs in [up-alias]
          for url in value.split(/\s+/)
            unless url == '#'
              url = normalizeUrl(url)
              urls.push(url)
    urls

  buildCurrentUrlSet = ->
    urls = [
      up.browser.url(),      # The URL displayed in the address bar
      up.modal.url(),        # Even when a modal does not change the address bar, we consider the URL of its content
      up.modal.coveredUrl(), # The URL of the page behind the modal
      up.popup.url(),        # Even when a popup does not change the address bar, we consider the URL of its content
      up.popup.coveredUrl()  # The URL of the page behind the popup
    ]
    new up.UrlSet(urls, { normalizeUrl })

  updateAllNavigationSectionsIfLocationChanged = ->
    previousUrlSet = currentUrlSet
    currentUrlSet = buildCurrentUrlSet()
    unless currentUrlSet.isEqual(previousUrlSet)
      updateAllNavigationSections($('body'))

  updateAllNavigationSections = ($root) ->
    $navs = u.selectInSubtree($root, navSelector())
    $sections = u.selectInSubtree($navs, SELECTOR_LINK)
    updateCurrentClassForLinks($sections)

  updateNavigationSectionsInNewFragment = ($fragment) ->
    if $fragment.closest(navSelector()).length
      # If the new fragment is an [up-nav], or if the new fragment is a child of an [up-nav],
      # all links in the new fragment are considered sections that we need to update.
      # Note that:
      # - The [up-nav] element might not be part of this update.
      #   It might already be in the DOM, and only a child was updated.
      # - The $fragment might be a link itself
      # - We do not need to update sibling links of $fragment that have been processed before.
      $sections = u.selectInSubtree($fragment, SELECTOR_LINK)
      updateCurrentClassForLinks($sections)
    else
      updateAllNavigationSections($fragment)

  updateCurrentClassForLinks = ($links) ->
    currentUrlSet ||= buildCurrentUrlSet()
    u.each $links, (link) ->
      $link = $(link)
      urls = sectionUrls($link)

      # We use Element#classList to manipulate classes instead of jQuery's
      # addClass and removeClass. Since we are in an inner loop, we want to
      # be as fast as we can.
      classList = link.classList
      if currentUrlSet.matchesAny(urls)
        for klass in config.currentClasses
          console.debug("!!! adding klass %o from %o", klass, config.currentClasses)
          # Once we drop IE11 support in 2020 we can call add() with multiple arguments
          classList.add(klass)
      else
        for klass in config.currentClasses
          console.debug("!!! removing klass %o from %o", klass, config.currentClasses)
          # Once we drop IE11 support in 2020 we can call add() with multiple arguments
          classList.remove(klass)

  ###**
  @function findActivatableArea
  @param {string|Element|jQuery} elementOrSelector
  @internal
  ###
  findActivatableArea = (elementOrSelector) ->
    $area = $(elementOrSelector)
    if $area.is(SELECTOR_LINK)
      # Try to enlarge links that are expanded with [up-expand] on a surrounding container.
      $area = u.presence($area.parent(SELECTOR_LINK)) || $area
    $area

  ###**
  Marks the given element as currently loading, by assigning the CSS class [`up-active`](/a.up-active).

  This happens automatically when following links or submitting forms through the Unpoly API.
  Use this function if you make custom network calls from your own JavaScript code.

  If the given element is a link within an [expanded click area](/up-expand),
  the class will be assigned to the expanded area.

  \#\#\# Example

      var $button = $('button');
      $button.on('click', function() {
        up.feedback.start($button, function() {
          // the .up-active class will be removed when this promise resolves:
          return up.request(...);
        });
      });

  @method up.feedback.start
  @param {Element|jQuery|string} elementOrSelector
    The element to mark as active
  @param {Object} [options.preload]
    If set to `false`, the element will not be marked as loading.
  @param {Function} [action]
    An optional function to run while the element is marked as loading.
    The function must return a promise.
    Once the promise resolves, the element will be [marked as no longer loading](/up.feedback.stop).
  @internal
  ###
  start = (args...) ->
    elementOrSelector = args.shift()
    action = args.pop()
    options = u.options(args[0])
    $element = findActivatableArea(elementOrSelector)
    unless options.preload
      $element.addClass(CLASS_ACTIVE)
    if action
      promise = action()
      if u.isPromise(promise)
        u.always promise, -> stop($element)
      else
        up.warn('Expected block to return a promise, but got %o', promise)
      promise

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
  @param {jQuery} event.$element
    The link or form that has finished loading.
  @internal
  ###
  stop = (elementOrSelector) ->
    $element = findActivatableArea(elementOrSelector)
    $element.removeClass(CLASS_ACTIVE)

  ###**
  Links that point to the current location are assigned
  the `up-current` class automatically.

  The use case for this is navigation bars:

      <nav>
        <a href="/foo">Foo</a>
        <a href="/bar">Bar</a>
      </nav>

  If the browser location changes to `/foo`, the markup changes to this:

      <nav>
        <a href="/foo" class="up-current">Foo</a>
        <a href="/bar">Bar</a>
      </nav>

  \#\#\# What's considered to be "current"?

  The current location is considered to be either:

  - the URL displayed in the browser window's location bar
  - the source URL of a currently opened [modal dialog](/up.modal)
  - the source URL of a currently opened [popup overlay](/up.popup)

  A link matches the current location (and is marked as `.up-current`) if it matches either:

  - the link's `href` attribute
  - the link's [`up-href`](#turn-any-element-into-a-link) attribute
  - a space-separated list of URLs in the link's `up-alias` attribute

  \#\#\# Matching URL by prefix

  You can mark a link as `.up-current` whenever the current URL matches a prefix.
  To do so, end the `up-alias` attribute in an asterisk (`*`).

  For instance, the following link is highlighted for both `/reports` and `/reports/123`:

      <a href="/reports" up-alias="/reports/*">Reports</a>

  @selector a.up-current
  @stable
  ###

  # Even when the modal or popup does not change history, we consider the URLs of the content it displays.
  up.on 'up:history:pushed up:history:replaced up:history:restored up:modal:opened up:modal:closed up:popup:opened up:popup:closed', (event) ->
    updateAllNavigationSectionsIfLocationChanged()

  up.on 'up:fragment:inserted', (event, $newFragment) ->
    updateNavigationSectionsInNewFragment($newFragment)

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  config: config
  start: start
  stop: stop

)(jQuery)

up.renamedModule 'navigation', 'feedback'
