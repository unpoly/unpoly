#= require ./change

u = up.util
e = up.element

class up.Change.FromContent extends up.Change

  constructor: (options) ->
    super(options)
    # Remember the layer that was current when the request was made, so changes
    # with `{ layer: 'new' }` will know what to stack on. The current layer might
    # change until the queued layer change is executed.
    #
    # The `{ currentLayer }` option might also be set from `new up.Change.FromURL()`
    # since the current layer might change between request and response.
    @options.currentLayer ?= up.layer.current
    @extractFlavorFromLayerOption()
    @setDefaultLayer()

  ensurePlansBuilt: ->
    @plans or @buildPlans()

  extractFlavorFromLayerOption: ->
    if up.layer.isOverlayFlavor(@options.layer)
      @options.flavor = @options.layer

    # If user passes a { flavor } option without a { layer } option
    # we assume they want to open a new layer.
    if @options.flavor
      @options.layer = 'new'

  setDefaultLayer: ->
    return if @options.layer

    if @options.origin
      # Links update their own layer by default.
      @options.layer = 'origin'
    else
      # If no origin is given, we assume the highest layer.
      @options.layer = 'current'

  toTargetList = (target, props) ->
    list = u.wrapArray(target)
    list = u.filter(list, u.isTruthy) # remove undefined and null
    list = u.map list, (target) => @toTargetObj(target, props)
    list

  toTargetObj = (target, props) ->
    base = u.merge(@options, props)

    if u.isString(target)
      target = { target }
    else if u.isFunction(target)
      target = target(base)

    return u.merge(base, target)

  buildPlans2: ->
    targets = [@options.target]

    if @options.fallback != false
      targets.push(@options.fallback)

      if @options.layer == 'new'
        defaultTargets = up.layer.defaultTargets(@options.flavor)
        targets.push(defaultTargets...)
      else
        for layer in up.layer.lookupAll(@options)
          for defaultTarget in layer.defaultTargets()
            targetObj = @toTargetObj(defaultTarget, { layer })
            targets.push(targetObj)

    targets = u.flatten(targets)
    targets = u.filter(targets, u.isTruthy) # remove undefined and null
    targets = u.map(targets, @toTargetObj)

    @plans = []

    for target in targets
      for layer in up.layer.lookupAll(@options)
        obj = u.merge(target, { layer })
        if layer == 'new'
          @plans.push(new up.Change.OpenLayer(obj))
        else
          @plans.push(new up.Change.UpdateLayer(obj))

  buildPlans3: ->
    @addPlansForTarget(@options.target)

    if @options.fallback != false
      @addPlansForTarget(@options.fallback)

      if @options.layer == 'new'
        @addPlansForTarget(up.layer.defaultTargets(@options.flavor))
      else
        for layer in up.layer.lookupAll(@options)
          @addPlansForTarget(layer.defaultTargets(), { layer })


  addPlansForTarget: (target, props) ->
    for targetObj in @toTargetList(target, props)
      for layer in up.layer.lookupAll(targetObj)
        ChangeImpl = if layer == 'new' then up.Change.OpenLayer else up.Change.UpdateLayer
        @plans.push(new ChangeImpl(u.merge(targetObj, { layer })))

  buildPlans: ->
    @plans = []

    if @options.layer == 'new'
      layerDefaultTargets = up.layer.defaultTargets(@options.flavor)
      @eachTargetCandidatePlan layerDefaultTargets, {}, (plan) =>
        # We cannot open a <body> in a new layer
        unless up.fragment.targetsBody(plan.target)
          @plans.push(new up.Change.OpenLayer(plan))

    else
      for layer in up.layer.lookupAll(@options)
        @eachTargetCandidatePlan layer.defaultTargets(), { layer }, (plan) =>
          @plans.push(new up.Change.UpdateLayer(plan))

    if @options.fallback != false && up.fragment.config.resetWorld
      @plans.push(new up.Change.ResetWorld())

  firstDefaultTarget: ->
    if @options.layer == 'new'
      up.layer.defaultTargets(@options.flavor)[0]
    else
      up.layer.lookupOne(@options).defaultTargets()

  eachTargetCandidatePlan: (layerDefaultTargets, planOptions, fn) ->
    for target, i in @buildTargetCandidates(layerDefaultTargets)
      target = e.resolveSelector(target, @options.origin)
      plan = u.merge(@options, planOptions, { target })
      fn(plan)

  buildTargetCandidates: (layerDefaultTargets) ->
    targetCandidates = [@options.target]
    if @options.fallback != false
      targetCandidates.push(@options.fallback, layerDefaultTargets)
    # Remove list items that are undefined, null or true
    return u.uniq(u.filter(u.flatten(targetCandidates), u.isString))

  execute: ->
    @buildResponseDoc()

    if @options.saveScroll
      up.viewport.saveScroll()

    shouldExtractTitle = not (@options.title is false || u.isString(@options.title))
    if shouldExtractTitle && (title = @options.responseDoc.title())
      @options.title = title

    return @seekPlan
      attempt: (plan) -> plan.execute()
      debug: true
      noneApplicable: => @postflightTargetNotApplicable()

  buildResponseDoc: ->
    docOptions = u.copy(@options)
    # ResponseDoc allows to pass innerHTML as { content }, but then it also
    # requires a { target }. If no { target } is given we use the first plan's target.
    if docOptions.content && !docOptions.target
      docOptions.target = @firstDefaultTarget()
    @options.responseDoc = new up.ResponseDoc(docOptions)

  preflightLayer: ->
    @seekPlan
      attempt: (plan) -> plan.preflightLayer()
      noneApplicable: => @preflightTargetNotApplicable()

  preflightTarget: ->
    @seekPlan
      attempt: (plan) -> plan.preflightTarget()
      noneApplicable: => @preflightTargetNotApplicable()

  preflightTargetNotApplicable: ->
    if @plans.length
      up.fail("Could not find target in current page (tried selectors %o)", @planTargets())
    else
      up.fail('No target given for change')

  postflightTargetNotApplicable: ->
    if @options.inspectResponse
      toastOpts = { label: 'Open response', callback: @options.inspectResponse }

    if @plans.length
      up.fail(["Could not find matching targets in current page and server response (tried selectors %o)", @planTargets()], toastOpts)
    else
      up.fail('No target given for change', toastOpts)

  planTargets: ->
    return u.map(@plans, 'target')

  seekPlan: (opts) ->
    @ensurePlansBuilt()
    unprintedMessages = []

    console.error("Seeking plan in %o", @plans)

    for plan in @plans
      try
        return opts.attempt(plan)
      catch error
        if error.name == 'up.NotApplicable'
          message = error.message
          if opts.debug
            up.log.debug(message)
          else
            unprintedMessages.push(message)
        else
          # Re-throw any unexpected type of error
          throw error

    # If we're about to explode with a fatal error we print everything
    # we have tried so far, regardless of `opts.debug`.
    unprintedMessages.forEach(up.log.debug)

    return opts.noneApplicable?()
