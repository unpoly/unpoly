#= require ./namespace

u = up.util
e = up.element

class up.Change.FromContent

  constructor: (options) ->
    @options = u.options(options)
    # Remember the layer that was current when the request was made, so changes
    # with `{ layer: 'new' }` will know what to stack on. The current layer might
    # change until the queued layer change is executed.
    #
    # The `{ currentLayer }` option might also be set from `new up.Change.FromURL()`
    # since the current layer might change before the response is received.
    @options.currentLayer ?= up.layer.current
    @options.target = e.resolveSelector(@options.target, @options.origin)
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
      @options.layer = 'new'

  setDefaultLayer: ->
    return if @options.layer

    if @options.origin
      # Links update their own layer by default.
      'origin'
    else
      # If no origin is given, we assume the highest layer.
      'current'

  buildPlans: ->
    @plans = []
    if @options.layer == 'new'
      layerDefaultTargets = up.layer.defaultTargets(u.only(@options, 'flavor'))
      @eachTargetCandidatePlan layerDefaultTargets, (plan) =>
        # We cannot open a <body> in a new layer
        unless up.fragment.targetsBody(plan.target)
          @plans.push(new up.Change.OpenLayer(plan))

    else
      for layer in up.layer.lookupAll(@options.layer)
        @eachTargetCandidatePlan layer.defaultTargets(), { layer }, (plan) =>
          # console.debug("UpdateLayer(%o)", plan)
          @plans.push(new up.Change.UpdateLayer(plan))

    # Make sure we always succeed
    @plans.push(new up.Change.ResetWorld(@options))

  eachTargetCandidatePlan: (layerDefaultTargets, planOptions, fn) ->
    for target, i in @buildTargetCandidates(layerDefaultTargets)
      plan = u.merge(@options, planOptions, { target })
      fn(plan)

  buildTargetCandidates: (layerDefaultTargets) ->
    targetCandidates = [@options.target, @options.fallback, layerDefaultTargets]
    # Remove undefined, null and { fallback: false } from the list
    targetCandidates = u.filter(targetCandidates, u.isTruthy)
    targetCandidates = u.flatten(targetCandidates)
    targetCandidates = u.uniq(targetCandidates)

    if @options.fallback == false || @options.content
      # Use the first defined candidate, but not @target (which might be missing)
      targetCandidates = [targetCandidates[0]]

    targetCandidates

  execute: ->
    @buildResponseDoc()

    if @options.saveScroll
      up.viewport.saveScroll()

    shouldExtractTitle = not (@options.title is false || u.isString(@options.title))
    if shouldExtractTitle && responseTitle = @options.responseDoc.title()
      @options.title = responseTitle

    return @seekPlan
      attempt: (plan) -> plan.execute()
      noneApplicable: => @executeNotApplicable()

  executeNotApplicable: ->
    if @options.inspectResponse
      inspectAction = { label: 'Open response', callback: @options.inspectResponse }
    up.asyncFail("Could not match target in current page and response", action: inspectAction)

  buildResponseDoc: ->
    @options.responseDoc = new up.ResponseDoc(@options)

  preflightLayer: ->
    @seekPlan
      attempt: (plan) -> plan.preflightLayer()
      noneApplicable: => @preflightTargetNotApplicable()

  preflightTarget: ->
    @seekPlan
      attempt: (plan) -> plan.preflightTarget()
      noneApplicable: => @preflightTargetNotApplicable()

  preflightTargetNotApplicable: ->
    up.fail("Could not find target in current page")

  seekPlan: (opts) ->
    @ensurePlansBuilt()
    for plan, index in @plans
      try
        return opts.attempt(plan)
      catch e
        if e == up.Change.NOT_APPLICABLE
          if index < @plans.length - 1
            # Retry with next plan
          else
            # No next plan to try
            return opts.noneApplicable()
        else
          # Any other exception is re-thrown
          throw e
