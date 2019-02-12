u = up.util

class up.ExtractCascade

  BODY_TARGET_PATTERN = /(^|\s|,)(body|html)(,|\s|$)/i

  constructor: (options) ->
    @options = u.options(options)
    @options.target = e.resolveSelector(@options.target, @options.origin)
    @options.hungry ?= true
    @options.historyMethod ?= 'push'
    @options.keep ?= true
    @options.layer ?= @defaultLayer()

    throw "should @options.peel be a default? or only for user-clicks?"

    @buildPlans()

  defaultLayer: ->
    if @options.flavor
      'new'
    else if @options.origin
      'origin'
    else
      'current'

  buildPlans: ->
    @plans = []
    @buildTargetCandidates()

    if @options.layer == 'new'
      @addTargetCandidatePlans(up.ExtractPlan.OpenLayer)
    else
      for layer in up.layer.resolve(@options.layer)
        @addTargetCandidatePlans(up.ExtractPlan.UpdateLayer, { layer })

    # Make sure we always succeed
    @plans.push(new ExtractPlan.SwapBody(@options))

  addTargetCandidatePlans: (PlanClass, planOptions) ->
    for targetCandidate, i in @targetCandidates
      # Since the last plan is always SwapBody, we don't need to
      # add other plans that would also swap the body.
      continue if @targetsBody(targetCandidate)

      candidateOptions = u.options(planOptions, @options)
      candidateOptions.target = targetCandidate

      if i > 0
        # If we're using a fallback (any candidate that's not the first),
        # the original transition might no longer be appropriate.
        candidateOptions.transition = up.fragment.config.fallbackTransition ? @options.transition

      @plans.push(new PlanClass(candidateOptions))

  targetsBody: (target) ->
    BODY_TARGET_PATTERN.test(target)

  buildTargetCandidates: ->
    @targetCandidates = [@target, @options.fallback, up.fragment.config.fallbacks]
    @targetCandidates = u.flatten(@targetCandidates)
    # Remove undefined, null and false from the list
    @targetCandidates = u.filter(@targetCandidates, u.isTruthy)
    @targetCandidates = u.uniq(@targetCandidates)

    if @options.fallback == false
      # Use the first defined candidate, but not `selector` since that
      # might be an undefined options.failTarget
      @targetCandidates = [@targetCandidates[0]]

  execute: ->
    @seekPlan
      attempt: (plan) -> plan.execute()
      noneApplicable: => @executeNotApplicable()

  executeNotApplicable: ->
    if @options.inspectResponse
      inspectAction = { label: 'Open response', callback: @options.inspectResponse }
    up.fail("Could not match #{@options.humanizedTarget} in current page and response", action: inspectAction)

  preflightTarget: ->
    @seekPlan
      attempt: (plan) -> plan.preflightTarget()
      noneApplicable: => @preflightTargetNotApplicable()

  preflightTargetNotApplicable: ->
    up.fail("Could not find #{@options.humanizedTarget} in current page")

  seekPlan: (opts) ->
    for plan, index in @plans
      try
        opts.attempt(plan)
      catch e
        if e == up.ExtractPlan.NOT_APPLICABLE
          if index < @plans.length - 1
            # Retry with next plan
          else
            # No next plan to try
            opts.noneApplicable()
        else
          # Any other exception is re-thrown
          throw e
