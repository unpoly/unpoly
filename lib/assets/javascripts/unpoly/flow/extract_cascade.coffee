u = up.util

class up.flow.ExtractCascade

  constructor: (selector, options) ->
    @options = u.options(options, humanizedTarget: 'selector', layer: 'auto')
    @candidates = @buildCandidates(selector)
    @plans = u.map @candidates, (candidate, i) =>
      planOptions = u.copy(@options)
      if i > 0
        # If we're using a fallback (any candidate that's not the first),
        # the original transition might no longer be appropriate.
        planOptions.transition = up.flow.config.fallbackTransition
      new up.flow.ExtractPlan(candidate, planOptions)

  buildCandidates: (selector) ->
    candidates = [selector, @options.fallback, up.flow.config.fallbacks]
    candidates = u.flatten(candidates)
    # Remove undefined, null and false from the list
    candidates = u.select candidates, u.isTruthy
    if @options.fallback == false || @options.provideTarget
      # Use the first defined candidate, but not `selector` since that
      # might be an undefined options.failTarget
      candidates = [candidates[0]]
    candidates

  oldPlan: =>
    @detectPlan('oldExists')

  newPlan: =>
    @detectPlan('newExists')

  matchingPlan: =>
    @detectPlan('matchExists')

  detectPlan: (checker) =>
    u.detect @plans, (plan) -> plan[checker]()

  bestPreflightSelector: =>
    if @options.provideTarget
      # We know that the target will be created right before swapping,
      # so just assume the first plan will work.
      @plans[0].selector
    else if plan = @oldPlan()
      plan.selector
    else
      @oldPlanNotFound()

  bestMatchingSteps: =>
    if plan = @matchingPlan()
      plan.steps
    else
      @matchingPlanNotFound()

  matchingPlanNotFound: =>
    # The job of this method is to simply throw an error.
    # However, we will investigate the reasons for the failure
    # so we can provide a more helpful error message.
    if @newPlan()
      @oldPlanNotFound()
    else
      if @oldPlan()
        message = "Could not find #{@options.humanizedTarget} in response"
      else
        message = "Could not match #{@options.humanizedTarget} in current page and response"
      if @response && @options.inspectResponse
        inspectAction = { label: 'Open response', callback: @options.inspectResponse }
      up.fail(["#{message} (tried %o)", @candidates], action: inspectAction)

  oldPlanNotFound: =>
    layerProse = @options.layer
    layerProse = 'page, modal or popup' if layerProse == 'auto'
    up.fail("Could not find #{@options.humanizedTarget} in current #{layerProse} (tried %o)", @candidates)
