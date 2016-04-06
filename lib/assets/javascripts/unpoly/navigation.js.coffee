###*
Navigation bars
===============

Unpoly automatically marks up link elements with classes indicating that
they are currently loading (class `up-active`) or linking
to the current location (class `up-current`).

This dramatically improves the perceived speed of your user interface
by providing instant feedback for user interactions.

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
    if u.isPresent(url)
      u.normalizeUrl(url,
        search: false
        stripTrailingSlash: true
      )
    
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
  @function findClickArea
  @param {String|Element|jQuery} elementOrSelector
  @param {Boolean} options.enlarge
    If `true`, tries to find a containing link that has expanded the link's click area.
    If we find one, we prefer to mark the larger area as active.
  @internal
  ###
  findClickArea = (elementOrSelector, options) ->
    $area = $(elementOrSelector)
    options = u.options(options, enlarge: false)
    if options.enlarge
      u.presence($area.parent(SELECTOR_SECTION)) || $area
    else
      $area

  ###*
  Links that are currently loading are assigned the `up-active`
  class automatically. Style `.up-active` in your CSS to improve the
  perceived responsiveness of your user interface.

  The `up-active` class will be removed as soon as another
  page fragment is added or updated through Unpoly.

  \#\#\#\# Example

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
  markActive = (elementOrSelector, options) ->
    $element = findClickArea(elementOrSelector, options)
    $element.addClass(CLASS_ACTIVE)

  unmarkActive = (elementOrSelector, options) ->
    $element = findClickArea(elementOrSelector, options)
    $element.removeClass(CLASS_ACTIVE)

  withActiveMark = (elementOrSelector, options, block) ->
    $element = $(elementOrSelector)
    markActive($element, options)
    promise = block()
    promise.always ->
      unmarkActive($element, options)
    promise

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

  \#\#\#\# What's considered to be "current"?

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
  defaults: -> u.error('up.navigation.defaults(...) no longer exists. Set values on he up.navigation.config property instead.')
  markActive: markActive
  unmarkActive: unmarkActive
  withActiveMark: withActiveMark

)(jQuery)
