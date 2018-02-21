u = up.util

# Names: Wird nur beim Eintreten des Waypoints in den DOM gesetzt, danach nicht mehr aktualisiert
# URL: Wird nur beim Eintreten des Waypoints in den DOM aktualisiert, danach nicht mehr aktualisiert
# Forms:
#   Wird öfter aktualisiert, aber immer nur innerhalb des waypoint-Elements
#
# scrollTops: Wird nur vor aktualisieren der URL für den aktuellen Waypoint gespeichert


afterPopState = (state) ->



resolveRequestForFollow = ($link, options) ->
  url = u.option(options.url, $link.attr('up-href'), $link.attr('href'))
  backQuery = u.option(options.back, $link.attr('up-back'))
  if backQuery
    if waypoint = waypoints.lookup(backQuery)
      url = waypoint.url

  url

resolveRequestForSubmit = ($form, options) ->



beforeFragmentDestroyed = ($fragment) ->
  waypoints.last()?.updateScrollTops()

  updateDisplayedForms($fragment)

  # now history is updated

updateDisplayedForms = ($root) ->
  $root ||= $('body')
  $displayedWaypoints = u.selectInSubtree($root, '[up-waypoint]')
  waypointsByIndex = u.groupBy $displayedWaypoints, (waypoint) -> $(waypoint).attr('up-waypoint-index')

  for index, waypointGroup of waypointsByIndex
    $waypointGroup = $(waypointGroup)
    if waypoint = waypoints.atIndex(index)
      waypoint.updateFormEntries($waypointGroup)
    else
      # Waypoint has been expunged from cache. We don't restore the waypoint,
      # since (1) we can only create Waypoints when they enter the DOM for the first time
      # and (2) it would disturb the waypoint order that needs to be in sequence.


updateFormEntries = ($root) ->


beforeFragmentInserted = ($allNewFragments, newUrl) ->
  $newWaypointElements = u.selectInSubtree($allNewFragments, '[up-waypoint]')
  if $newWaypointElements.length
    # add this waypoint. even when there are multiple, they will share the same formEntries
    # since they have appeared in the same fragment update

    # So this is fucked up. We might have multiple waypoints, and each
    # waypoint might have multiple names. They form a single waypoint
    # since they have appeared in a single request.
    names = u.flatMap $waypointElements, (wpElement) ->
      value = $(wpElement).attr('up-waypoint')
      u.separatedValues(value, ' ')

    waypoint = waypoints.pushWaypoint(url, names)

    $waypointElements.attr('up-waypoint-index', waypoint.index)

    # brauchen wir das?
    # waypoint.updateFormEntries($newWaypointElements)

  else
    # add anonymous waypoint for URL
    # this waypoint should not save forms


pushWaypoint = (url, names) ->



class up.Waypoint extends up.Record

  updateFromElement: ($waypoint) =>
    @updateUrl()
    @updateScrollTops()
    @updateFormEntries($waypoint)

  isDisplayed: ->
    !!up.first(u.attributeSelector('up-waypoint', @name))

  updateUrl: =>
    @url = up.browser.url()

  updateTime: =>
    @time = new Date()

  updateScrollTops: =>
    throw "wenn element im layer?"
    @scrollTops = up.layout.scrollTops()

  updateFormEntries: ($waypoint) =>
    $forms = u.selectInSubtree($waypoint, 'form:not([up-save-form="false"])')
    entries = u.flatMap $forms, (form) -> $(form).serializeArray()
    @formEntries = entries
