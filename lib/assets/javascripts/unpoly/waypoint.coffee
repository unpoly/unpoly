###**
Waypoints
=========

@class up.waypoint
###
up.waypoint = (($) ->

  u = up.util

  ###**
  Configures behavior for waypoints.

  @property up.waypoint.config
  @param {number} [config.cacheSize=10]
    The maximum number of saved waypoints.

    When additional waypoints are saved, the oldest waypoint will be [forgotten](/up.waypoint.discard).
  @stable
  ###
  config = u.config
    cacheSize: 10

  waypoints = new up.Cache
    size: -> config.cacheSize

  reset = ->
    config.reset()
    waypoints.clear()

  ###**
  DOCUMENT ME

  @function up.waypoint.restore
  @return Promise
  @experimental
  ###
  waypointForRestore = (nameOrNames, options) ->
    options = u.options(options, discard: true)

    if waypoint = first(nameOrNames)
      $origin = $(options.origin)

      discard(waypoint) if options.discard

      # We let the user pass additional { params } and { data } options
      # for this particular waypoint restoration. Values will be merged
      # with the originally saved { params } and { data }.
      context =
        params: options.params || up.syntax.data($origin, 'up-params')
        data: options.data || up.syntax.data($origin)

      # Make a copy of the waypoint so (1) event handlers that modify the
      # event don't change the original and (2) so we can merge in additional
      # { params } and { data } options without changing the original.
      waypoint = waypoint.copyInContext(context)

      restoreEvent =
        message: ["Restoring waypoint %s", waypoint.name]
        waypoint: waypoint
        # Give custom restoration handlers a chance to do something
        # else when we're only preloading.
        preload: options.preload

      if up.bus.nobodyPrevents('up:waypoint:restore', restoreEvent)
        waypoint

  followOptionsForRestore = (nameOrNames, options) ->
    if waypoint = waypointForRestore(nameOrNames, options)
      url: waypoint.restoreURL()
      restoreScroll: waypoint.scrollTops
      after: -> emitRestored(waypoint)

  restore = (nameOrNames, options) ->
    if followOptions = followOptionsForRestore(nameOrNames, options)
      visit(followOptions.url, followOptions)
    else
      Promise.reject(new Error("No saved waypoint named \"#{waypointUrl}\""))

  emitRestored = (waypoint) ->
    up.bus.emit 'up:waypoint:restored',
      message: ["Restored waypoint %s", waypoint.name]
      waypoint: waypoint

  save = (options) ->
    waypoint = capture(options)
    add(waypoint)

    event =
      message: ['Saving waypoint %s', name]
      waypoint: waypoint

    if up.bus.nobodyPrevents('up:waypoint:save', event)
      waypoints.set(name, waypoint)

  capture: ->
    options = u.options(options)

    $origin = $(options.origin)

    name = u.option(options.name, $origin.attr('up-save-waypoint'))

    # The user can pass a { root } if she only wants to serialize forms
    # within a root element.
    root = options.root || $origin.attr('up-root')
    if u.isString(root)
      root = up.dom.resolveSelector(root, { origin: $origin })

    # If an origin link is given but no root, we only save forms from the link's layer.
    defaultLayer = up.dom.layerOf($origin) if !root && u.isPresent($origin)
    formLayer = u.option(options.layer, defaultLayer)
    # Gather params from all forms
    $forms = up.all('form:not([up-save-form="false"])', root: root, layout: formLayer)
    formParams = u.flatMap $forms, (form) -> up.params.fromForm(form, nature: 'array')
    # We want to represent params as a (nested) object for convenient programmatic access
    formParams = up.params.toObject(formParams)
    # Users can pass additional params
    extraParams = u.option(options.params, up.syntax.data($origin, attribute: 'up-params'))
    params = up.params.merge(formParams, extraParams)

    # User can also set a { data } hash for custom restore logic in JavaScript.
    # The { data } hash will not be sent to the server, but will be made available
    # to listeners of up:waypoint events.
    data = options.data || up.syntax.data($origin)

    waypoint = new up.Waypoint
      name: name
      url: up.history.url()
      scrollTops: up.layout.scrollTops()
      data: data
      params: params

  expandNames = (nameOrNames) ->
    if u.isMissing(nameOrNames)
      ['default']
    else if u.isArray(nameOrNames)
      nameOrNames
    else if u.isString(nameOrNames)
      u.splitValues(nameOrNames)

  add: (waypoint) ->
    for name in expandNames(waypoint.name)
      waypoints.set(name, waypoint.copy({ name }))

  first = (names) ->
    all(names)[0]

  all = (names) ->
    if u.isString(names)
      names = u.splitValues(names)
    waypoints.all(names)

  ###**
  DOCUMENT ME

  @function up.waypoint.discard
  @param waypoint {string|Element|jQuery|up.Waypoint} waypoint
  @experimental
  ###
  discard = (nameOrNames) ->
    each all(nameOrNames), (waypoint) ->
      waypoints.remove(waypoint.name)

  saveBeforeFollow = (event) ->
    $link = event.$link
    if name = $link.attr('up-save-waypoint')
      save(name, origin: $link)

  considerRestoreBeforeFollow = (event, options) ->
    $link = event.$link
    if nameOrNames = $link.attr('up-restore-waypoint')
      if followOptions = followOptionsForRestore(nameOrNames, options)
        u.assign options, followOptions

  considerDiscardBeforeFollow = (event) ->
    $link = event.$link
    if nameOrNames = $link.attr('up-discard-waypoint')
      discard(nameOrNames)

  considerRestoreBeforeSubmit = (event) ->

  up.on 'up:link:follow', '[up-save-waypoint]', (event) ->
    # considerDiscardBeforeFollow(event)
    save(origin: event.$link)
    # considerRestoreBeforeFollow(event, discard: true)
#
#  up.on 'up:link:preload', '[up-save-waypoint]', (event) ->
#    considerRestoreBeforeFollow(event, discard: false, preload: true)
#
#  up.on 'up:link:follow', '[up-restore-waypoint]', (event) ->
#    considerRestoreBeforeSubmit(event, discard: true)

  up.on 'up:framework:reset', reset

  config: config
  save: save
  restore: restore
  discard: discard
  first: first
  all: all

)(jQuery)
