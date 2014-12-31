up.navigation = (->

  SELECTOR_NAVIGATION = '[up-navigation]'
  SELECTOR_SECTION = "#{SELECTOR_NAVIGATION} [href], #{SELECTOR_NAVIGATION} [up-follow]"
  CLASS_ACTIVE = 'up-active'
  CLASS_CURRENT = 'up-current'

  highlightCurrentSection = ->
    normalizedLocation = up.util.normalizeUrl(location.href)
    up.util.each $(SELECTOR_SECTION), (section) ->
      $section = $(section)
      # if $section is marked up with up-follow, the actual link might be
      # a child element.
      url = up.link.findUrl($section)
      normalizedDestination = up.util.normalizeUrl(url)
      if normalizedLocation == normalizedDestination
        $section.addClass(CLASS_CURRENT)
      else
        $section.removeClass(CLASS_CURRENT)

  sectionClicked = ($section) ->
    # Make the clicked section the only active section on the page
    $(SELECTOR_SECTION).removeClass(CLASS_ACTIVE)
    $section.addClass(CLASS_ACTIVE)

  console.log("Registering section clicked to up.app.on")
  up.on 'click', SELECTOR_SECTION, (event, $section) ->
    sectionClicked($section)

  up.bus.on 'fragment:ready', ($fragment) ->
    # Make sections inactive everywhere
    $(SELECTOR_SECTION).removeClass(CLASS_ACTIVE)
    highlightCurrentSection()

)()
