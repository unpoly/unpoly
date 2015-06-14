###*
Fast interaction feedback
=========================
  
This module marks up link elements with classes indicating that
they are currently loading (class `up-active`) or linking
to the current location (class `up-current`).

This dramatically improves the perceived speed of your user interface
by providing instant feedback for user interactions.

The classes are added and removed automatically whenever
a page fragment is added, changed or destroyed through Up.js.

How Up.js computes the current location
---------------------------------------

From Up's point of view the "current" location is either:
  
- the URL displayed in the browser window's location bar
- the source URL of a currently opened [modal dialog](/up.modal)
- the source URL of a currently opened [popup overlay](/up.popup)

@class up.navigation
###
up.navigation = (->

  u = up.util

  CLASS_ACTIVE = 'up-active'
  CLASS_CURRENT = 'up-current'
  SELECTORS_SECTION = ['a[href]', 'a[up-target]', '[up-follow]', '[up-modal]', '[up-popup]', '[up-href]']
  SELECTOR_SECTION = SELECTORS_SECTION.join(', ')
  SELECTOR_SECTION_INSTANT = ("#{selector}[up-instant]" for selector in SELECTORS_SECTION).join(', ')
  SELECTOR_ACTIVE = ".#{CLASS_ACTIVE}"
  
  normalizeUrl = (url) ->
    if u.isPresent(url)
      u.normalizeUrl(url,
        search: false
        stripTrailingSlash: true
      )
    
  sectionUrls = ($section) ->
    urls = []
    if $link = up.link.resolve($section)
      for attr in ['href', 'up-follow', 'up-href']
        if url = u.presentAttr($link, attr)
          url = normalizeUrl(url)
          urls.push(url)
    urls

  locationChanged = ->
    currentUrls = u.stringSet [
      normalizeUrl(up.browser.url()),
      normalizeUrl(up.modal.source()),
      normalizeUrl(up.popup.source())
    ]
    
    u.each $(SELECTOR_SECTION), (section) ->
      $section = $(section)
      # if $section is marked up with up-follow,
      # the actual link might be a child element.
      urls = sectionUrls($section)
      if currentUrls.includesAny(urls)
        $section.addClass(CLASS_CURRENT)
      else
        $section.removeClass(CLASS_CURRENT)

  sectionClicked = ($section) ->
    unmarkActive()
    $section = enlargeClickArea($section)
    $section.addClass(CLASS_ACTIVE)
    
  enlargeClickArea = ($section) ->
    u.presence($section.parents(SELECTOR_SECTION)) || $section
    
  unmarkActive = ->
    $(SELECTOR_ACTIVE).removeClass(CLASS_ACTIVE)

  up.on 'click', SELECTOR_SECTION, (event, $section) ->
    unless $section.is('[up-instant]')
      sectionClicked($section)
  
  up.on 'mousedown', SELECTOR_SECTION_INSTANT, (event, $section) ->
    if u.isUnmodifiedMouseEvent(event)
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
