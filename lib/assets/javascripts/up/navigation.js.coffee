###*
This module marks up link elements with classes indicating that
they are currently loading (class `up-active`) or linking
to the current location (class `up-current`).
  
The current location is either:
  
- the URL displayed in the browser window's location bar
- the source URL of a currently opened {{#crossLink "up.modal"}}modal dialog{{/crossLink}} 
- the source URL of a currently opened {{#crossLink "up.popup"}}popup overlay{{/crossLink}} 
  
@class up.navigation  
###
up.navigation = (->

  CLASS_ACTIVE = 'up-active'
  CLASS_CURRENT = 'up-current'
  SELECTOR_SECTION = 'a[href], a[up-target], [up-follow], [up-modal], [up-popup]'
  SELECTOR_ACTIVE = ".#{CLASS_ACTIVE}"

  locationChanged = ->
    windowLocation = up.util.normalizeUrl(up.browser.url(), search: false)
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

  # When a fragment is ready it might either have brought a location change
  # with it, or it might have opened a modal / popup which we consider
  # to be secondary location sources (the primary being the browser's
  # location bar.
  up.bus.on 'fragment:ready', ->
    unmarkActive()
    # If a new fragment is inserted, it's likely to be the result
    # to the active action. So we can remove the active marker.
    locationChanged()

  up.bus.on 'fragment:destroy', ($fragment) ->
    # If the destroyed fragment is a modal or popup container
    # this changes which URLs we consider currents.
    # Also modals and popups restore their previous history
    # once they close.
    if $fragment.is('.up-modal, .up-popup')
      locationChanged()

)()
