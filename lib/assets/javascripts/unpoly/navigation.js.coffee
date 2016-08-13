###*
Navigation bars
===============

Unpoly automatically adds CSS classes to links while they are
currently loading ([`.up-active`](/up-active)) or
pointing to the current location ([`.up-current`](/up-current)).

By styling these classes with CSS you can provide instant feedback to user interactions.
This improves the perceived speed of your interface.

\#\#\# Example

Let's say we have an navigation bar with two links, pointing to `/foo` and `/bar` respectively:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow>Bar</a>

If the current URL is `/foo`, the first link is automatically marked with an [`up-current`](/up-current) class:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow>Bar</a>

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/up-active) class while it is waiting
for the server to respond:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow class="up-active">Bar</a>

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow class="up-current">Bar</a>


@class up.navigation
###
up.navigation = (($) ->

  u = up.util

  ###*
  Sets default options for this module.

  @property up.navigation.config
  @param {Number} [config.currentClasses]
    An array of classes to set on [links that point the current location](/up-current).
  @stable
  ###
  config = u.config
    currentClasses: ['up-current']

  reset = ->
    config.reset()

  currentClass = ->
    classes = config.currentClasses
    classes = classes.concat(['up-current'])
    classes = u.uniq(classes)
    classes.join(' ')

  CLASS_ACTIVE = 'up-active'
  SELECTOR_SECTION = 'a, [up-href]'

  normalizeUrl = (url) ->
    u.normalizeUrl(url) if u.isPresent(url)

  sectionUrls = ($section) ->
    urls = []
    for attr in ['href', 'up-href', 'up-alias']
      if value = u.presentAttr($section, attr)
        values = if attr == 'up-alias' then value.split(' ') else [value]
        for url in values
          unless url == '#'
            url = normalizeUrl(url)
            urls.push(url)
    urls

  urlSet = (urls) ->
    urls = u.compact(urls)

    matches = (testUrl) ->
      if testUrl.substr(-1) == '*'
        doesMatchPrefix(testUrl.slice(0, -1))
      else
        doesMatchFully(testUrl)

    doesMatchFully = (testUrl) ->
      u.contains(urls, testUrl)

    doesMatchPrefix = (prefix) ->
      u.detect urls, (url) ->
        url.indexOf(prefix) == 0

    matchesAny = (testUrls) ->
      u.detect(testUrls, matches)

    matchesAny: matchesAny

  locationChanged = ->
    currentUrls = urlSet([
      normalizeUrl(up.browser.url()),
      normalizeUrl(up.modal.url()),
      normalizeUrl(up.modal.coveredUrl()),
      normalizeUrl(up.popup.url()),
      normalizeUrl(up.popup.coveredUrl())
    ])

    klass = currentClass()

    u.each $(SELECTOR_SECTION), (section) ->
      $section = $(section)
      # if $section is marked up with up-follow,
      # the actual link might be a child element.
      urls = sectionUrls($section)

      if currentUrls.matchesAny(urls)
        $section.addClass(klass)
      else if $section.hasClass(klass) && $section.closest('.up-destroying').length == 0
        $section.removeClass(klass)

  ###*
  @function findActionableArea
  @param {String|Element|jQuery} elementOrSelector
  @internal
  ###
  findActionableArea = (elementOrSelector) ->
    $area = $(elementOrSelector)
    if $area.is(SELECTOR_SECTION)
      # Try to enlarge links that are expanded with [up-expand] on a surrounding container.
      $area = u.presence($area.parent(SELECTOR_SECTION)) || $area
    $area

  ###*
  Marks the given element as currently loading, by assigning the CSS class [`up-active`](/up-active).

  This happens automatically when following links or submitting forms through the Unpoly API.
  Use this function if you make custom network calls from your own Javascript code.

  If the given element is a link within an [expanded click area](/up-expand),
  the class will be assigned to the expanded area.

  Emits the [`up:navigate`](/up:navigate) event.

  \#\#\# Example

      var $button = $('button');
      $button.on('click', function() {
        up.navigation.start($button);
        up.ajax(...).always(function() {
          up.navigation.stop($button);
        });
      });

  Or shorter:

      var $button = $('button');
      $button.on('click', function() {
        up.navigation.start($button, function() {
          up.ajax(...);
        });
      });

  @method up.navigation.start
  @param {Element|jQuery|String} elementOrSelector
    The element to mark as active
  @param {Function} [action]
    An optional function to run while the element is marked as loading.
    The function must return a promise.
    Once the promise resolves, the element will be [marked as no longer loading](/up.navigation.stop).
  @internal
  ###
  start = (elementOrSelector, action) ->
    $element = findActionableArea(elementOrSelector)
    up.emit('up:navigate', $element: $element, message: ['Navigating via %o', $element.get(0)])
    $element.addClass(CLASS_ACTIVE)
    if action
      promise = action()
      if u.isPromise(promise)
        promise.always -> stop($element)
      else
        up.warn('Expected block to return a promise, but got %o', promise)
      promise

  ###*
  Links that are currently loading are assigned the `up-active`
  class automatically. Style `.up-active` in your CSS to improve the
  perceived responsiveness of your user interface.

  The `up-active` class will be removed as soon as another
  page fragment is added or updated through Unpoly.

  \#\#\# Example

  We have a link:

      <a href="/foo" up-follow>Foo</a>

  The user clicks on the link. While the request is loading,
  the link has the `up-active` class:

      <a href="/foo" up-follow class="up-active">Foo</a>

  Once the link destination has loaded and rendered, the `up-active` class
  is removed and the [`up-current`](/up-current) class is added:

      <a href="/foo" up-follow class="up-current">Foo</a>

  @selector .up-active
  @stable
  ###

  ###*
  This event is emitted when a link or form is starting to load.

  @event up:navigate
  @param {jQuery} event.$element
    The link or form that is starting to load.
  @experimental
  ###

  ###*
  Marks the given element as no longer loading, by removing the CSS class [`up-active`](/up-active).

  This happens automatically when network requests initiated by the Unpoly API have completed.
  Use this function if you make custom network calls from your own Javascript code.

  Emits the [`up:navigated`](/up:navigated) event.

  @function up.navigation.stop
  @param {jQuery} event.$element
    The link or form that has finished loading.
  @internal
  ###
  stop = (elementOrSelector) ->
    $element = findActionableArea(elementOrSelector)
    up.emit('up:navigated', $element: $element, message: false)
    $element.removeClass(CLASS_ACTIVE)

  ###*
  This event is emitted when a link or form is [has finished loading](/up.navigation.stop).

  @event up:navigated
  @internal
  ###

  ###*
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

  \#\#\#\# Matching URL by prefix

  You can mark a link as `.up-current` whenever the current URL matches a prefix.
  To do so, end the `up-alias` attribute in an asterisk (`*`).

  For instance, the following link is highlighted for both `/reports` and `/reports/123`:

      <a href="/reports" up-alias="/reports/*">Reports</a>

  @selector .up-current
  @stable
  ###
  up.on 'up:fragment:inserted', ->
    # When a fragment is inserted it might either have brought a location change
    # with it, or it might have opened a modal / popup which we consider
    # to be secondary location sources (the primary being the browser's
    # location bar).
    locationChanged()

  up.on 'up:fragment:destroyed', (event, $fragment) ->
    # If the destroyed fragment is a modal or popup container
    # this changes which URLs we consider currents.
    # Also modals and popups restore their previous history
    # once they close.
    if $fragment.is('.up-modal, .up-popup')
      locationChanged()

  # The framework is reset between tests
  up.on 'up:framework:reset', reset

  config: config
  defaults: -> up.fail('up.navigation.defaults(...) no longer exists. Set values on he up.navigation.config property instead.')
  start: start
  stop: stop

)(jQuery)
