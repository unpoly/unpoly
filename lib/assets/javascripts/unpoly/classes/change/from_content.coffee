#= require ./change

u = up.util
e = up.element

class up.Change.FromContent extends up.Change

  constructor: (options) ->
    # Don't extract too many options here, since they will be mutated by Change.FromURL
    # once the response is received.
    up.layer.normalizeOptions(options)
    @layers = up.layer.getAll(options)
    @target = options.target
    super(options)

  ensurePlansBuilt: ->
    @plans or @buildPlans()

  buildPlans: ->
    @plans = []

    # When we're swapping elements in origin's layer, we can be choose a fallback
    # replacement zone close to the origin instead of looking up a selector in the
    # entire layer (where it might match unrelated elements).
    if @options.origin
      @options.originLayer = up.layer.get(@options.origin)

    # (1) We seek @options.target in all matching layers
    @expandIntoPlans(@layers, @target)

    return if @options.fallback == false

    # (2) In case fallback is a selector or array of selectors, we seek the fallback
    # in all matching layers. If fallback is true or undefined, this won't add plans.
    @expandIntoPlans(@layers,  @options.fallback)

    # (3) We try to update the closest zone around the origin. If no origin is
    # given, this will update the layer's main selectors.
    @expandIntoPlans(@layers, ':closest-zone')

    # (4) In case nothing from the above matches, we close all layers and swap the
    # body. The assumption is that the server has returned an unexpected response like
    # an error message or a login screen (if a session expired) and we want to display
    # this rather than fail the update.
    @expandIntoPlans([up.layer.root], up.fragment.config.resetTargets, { peel: true })

  defaultTargets: (layer) ->
    if layer == 'new'
      return up.layer.defaultTargets(@options.mode)
    else
      return layer.defaultTargets()

  expandIntoPlans: (layers, target, variantProps) ->
    for layer in layers
      for target in u.wrapList(target)
        if u.isElementish(target)
          target = e.toSelector(target)
        else if u.isString(target)
          target = e.resolveSelector(target, @options.origin)

          # We cannot reason about zones when there is no known origin from which to climb up,
          # or when we are not updating origin's layer, or when we are opening a new layer.
          if layer =! @options.originLayer()
            target = target.replace(/\b\:(closest-)?zone\b/, ':main')
        else
          # @buildPlans() might call us with { target: false } or { target: nil }
          # In that case we don't add a plan.
          continue

        # Any plans we add will inherit all properties from @options
        props = u.merge(@options, { target, layer }, variantProps)

        if layer == 'new'
          change = new up.Change.OpenLayer(props)
          @plans.push(change)
        else
          change = new up.Change.UpdateLayer(props)
          @plans.push(change)

  #        # Only for existing overlays we open will also attempt to place a new element as the
  #        # new first child of the layer's root element. This mirrors the behavior that we get when
  #        # opening a layer: The new element does not need to match anything in the current document.
  #        if props.resetOverlay && props.layer.isOverlay?()
  #          change = new up.Change.UpdateLayer(u.merge(props, placement: 'root'))
  #          @plans.push(change)

  firstDefaultTarget: ->
    if firstLayer = @layers[0]
      @defaultTargets(firstLayer)[0]

  execute: ->
    @buildResponseDoc()

    if @options.saveScroll
      up.viewport.saveScroll()

    # In up.Change.FromURL we already set an X-Up-Title header as options.title.
    # Now that we process an HTML document
    shouldExtractTitle = not (@options.title is false || u.isString(@options.title))
    if shouldExtractTitle && (title = @options.responseDoc.title())
      @options.title = title

    return @seekPlan
      attempt: (plan) -> plan.execute()
      noneApplicable: => @postflightTargetNotApplicable()

  buildResponseDoc: ->
    docOptions = u.pick(@options, ['target', 'content', 'fragment', 'document', 'html'])
    up.legacy.fixKey(docOptions, 'html', 'document')

    # ResponseDoc allows to pass innerHTML as { content: 'html }, or { content: undefined }
    # (meaning empty), but then it also requires a { target } to create a matching wrapper.
    # If no { target } is given we use the first plan's main target.
    docOptions.defaultTarget = @firstDefaultTarget()

    @options.responseDoc = new up.ResponseDoc(docOptions)

    if docOptions.fragment
      # ResponseDoc allows to pass innerHTML as { fragment }, but then it also
      # requires a { target }. We use a target that matches the parsed { fragment }.
      @target ||= @options.responseDoc.rootSelector()

  # Returns information about the change that is most likely before the request was dispatched.
  # This might change postflight if the response does not contain the desired target.
  requestAttributes: (opts = {}) ->
    @seekPlan
      attempt: (plan) -> plan.requestAttributes()
      noneApplicable: =>
        opts.optional or @preflightTargetNotApplicable(opts)

  preflightTargetNotApplicable: ->
    if @plans.length
      up.fail("Could not find target in current page (tried selectors %o)", @planTargets())
    else
      @emptyPlans()

  postflightTargetNotApplicable: ->
    if @options.inspectResponse
      toastOpts = { action: { label: 'Open response', callback: @options.inspectResponse } }

    if @plans.length
      up.fail(["Could not find matching targets in current page and server response (tried selectors %o)", @planTargets()], toastOpts)
    else
      @emptyPlans(toastOpts)

  emptyPlans: (toastOpts) ->
    if @layers.length
      up.fail(['No target for change %o', @options], toastOpts)
    else
      # This can happen e.g. if the user tries to replace { layer: 'parent' },
      # but there is no parent layer.
      up.fail(["Layer %o does not exist", @options.layer], toastOpts)

  planTargets: ->
    return u.uniq(u.map(@plans, 'target'))

  seekPlan: (opts) ->
    @ensurePlansBuilt()
    unprintedMessages = []

    for plan in @plans
      try
        return opts.attempt(plan)
      catch error
        if up.error.notApplicable.is(error)
          unprintedMessages.push(error.message)
        else
          # Re-throw any unexpected type of error
          throw error

    # If we're about to explode with a fatal error we print everything that we tried.
    unprintedMessages.forEach (message) -> up.puts('up.render()', message)

    return opts.noneApplicable?()
