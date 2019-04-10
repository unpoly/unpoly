#= require ./namespace

u = up.util

class up.Change.FromContent

  constructor: (options) ->
    @options = u.options(options)
    @options.target = e.resolveSelector(@options.target, @options.origin)
    @options.hungry ?= true
    @options.keep ?= true
    @options.saveScroll ?= true
    @options.peel ?= true
    @options.layer ?= @defaultLayerOption()

    @buildPlans()

  defaultLayerOption: ->
    if @options.flavor
      # Allow users to omit [up-layer=new] if they provide [up-dialog]
      'new'
    else if @options.origin
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
          @plans.push(new up.ExtractPlan.OpenLayer(plan))

    else
      for layer in up.layer.lookupAll(@options.layer)
        @eachTargetCandidatePlan layer.defaultTargets(), { layer }, (plan) =>
          # Since the last plan is always SwapBody, we don't need to
          # add other plans that would also swap the body.
          continue if up.fragment.targetsBody(plan.target)

          @plans.push(new up.ExtractPlan.UpdateLayer(plan))

    # Make sure we always succeed
    @plans.push(new ExtractPlan.ResetWorld(@options))

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
    if @options.saveScroll
      up.viewport.saveScroll()

    shouldExtractTitle = not (@options.title is false || u.isString(@options.title))
    if shouldExtractTitle && responseTitle = @responseDoc.title()
      @options.title = responseTitle

    # options.target ?= fallbacks(options.flavor)

    @buildResponseDoc()

    @seekPlan
      attempt: (plan) -> plan.execute()
      noneApplicable: => @executeNotApplicable()

  executeNotApplicable: ->
    if @options.inspectResponse
      inspectAction = { label: 'Open response', callback: @options.inspectResponse }
    up.fail("Could not match target in current page and response", action: inspectAction)

  buildResponseDoc: ->
    @responseDoc = new up.ResponseDoc(@options)

  preflightTarget: ->
    @seekPlan
      attempt: (plan) -> plan.preflightTarget()
      noneApplicable: => @preflightTargetNotApplicable()

  preflightTargetNotApplicable: ->
    up.fail("Could not find target in current page")

  seekPlan: (opts) ->
    for plan, index in @plans
      try
        opts.attempt(plan)
      catch e
        if e == up.Change.Plan.NOT_APPLICABLE
          if index < @plans.length - 1
            # Retry with next plan
          else
            # No next plan to try
            opts.noneApplicable()
        else
          # Any other exception is re-thrown
          throw e
