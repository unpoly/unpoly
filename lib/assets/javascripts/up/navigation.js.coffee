up.navigation = (->

  CLASS_ACTIVE = 'up-active'
  CLASS_CURRENT = 'up-current'
  SELECTOR_SECTION = 'a[href], a[up-target], [up-follow], [up-modal], [up-popup]'
  SELECTOR_ACTIVE = ".#{CLASS_ACTIVE}"

  locationChanged = ->
    unmarkActive()
    windowLocation = up.util.normalizeUrl(location.href, search: false)
    modalLocation = up.modal.source()
    popupLocation = up.popup.source()
    
    up.util.each $(SELECTOR_SECTION), (section) ->
      $section = $(section)
      # if $section is marked up with up-follow,
      # the actual link might be a child element.
      url = up.link.resolveUrl($section)
      url = up.util.normalizeUrl(url, search: false)
      if url == windowLocation || url == modalLocation || url == popupLocation
        $section.addClass(CLASS_CURRENT)
      else
        $section.removeClass(CLASS_CURRENT)

  sectionClicked = ($section) ->
    unmarkActive()
    $section = enlargeClickArea($section)
    $section.addClass(CLASS_ACTIVE)
    
  enlargeClickArea = ($section) ->
    up.util.presence($section.parents(SELECTOR_SECTION)) || $section
    
  unmarkActive = ->
    $(SELECTOR_ACTIVE).removeClass(CLASS_ACTIVE)

  up.on 'click', SELECTOR_SECTION, (event, $section) ->
    sectionClicked($section)

  up.bus.on 'fragment:ready', locationChanged
  up.bus.on 'fragment:destroy', locationChanged

)()
