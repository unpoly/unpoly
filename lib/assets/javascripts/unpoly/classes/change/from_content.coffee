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
    # since the current layer might change before the response is received.
    @options.currentLayer ?= up.layer.current
    @options.hungry ?= true
    @options.keep ?= true
    @options.saveScroll ?= true
    @options.peel ?= true
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

    # Make sure we always succeed
    if up.layer.config.resetWorld
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
    targetCandidates = [@options.target, @options.fallback, layerDefaultTargets]
    # Remove undefined, null and { fallback: false } from the list
    targetCandidates = u.flatten(targetCandidates)
    targetCandidates = u.filter(targetCandidates, u.isTruthy)
    targetCandidates = u.uniq(targetCandidates)

    if @options.fallback == false || @options.content
      # Use the first defined candidate, but not @options.target (which might be missing)
      targetCandidates = [targetCandidates[0]]

    targetCandidates

  execute: ->
    @buildResponseDoc()

    if @options.saveScroll
      up.viewport.saveScroll()

    shouldExtractTitle = not (@options.title is false || u.isString(@options.title))
    if shouldExtractTitle && (title = @options.responseDoc.title())
      @options.title = title

    return @seekPlan
      attempt: (plan) -> plan.execute()
      noneApplicable: => @executeNotApplicable()

  executeNotApplicable: ->
    if @options.inspectResponse
      inspectAction = { label: 'Open response', callback: @options.inspectResponse }
    up.fail(["Could not match target in current page and response"], action: inspectAction)

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
      attempt: (plan) ->
        plan.preflightTarget()
      noneApplicable: => @preflightTargetNotApplicable()

  preflightTargetNotApplicable: ->
    up.fail("Could not find target in current page")

  seekPlan: (opts) ->
    @ensurePlansBuilt()
    for plan, index in @plans
      try
        return opts.attempt(plan)
      catch error
        if error == up.Change.NOT_APPLICABLE
          if index < @plans.length - 1
            # Retry with next plan
          else
            # No next plan to try
            return opts.noneApplicable()
        else
          # Any other exception is re-thrown
          throw error
