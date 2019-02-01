u = up.util

class up.ExtractCascade

  constructor: (selectorOrElement, options) ->
    @options = u.options(options, humanizedTarget: 'selector', layer: 'origin')
    @options.transition ?= @options.animation
    @options.hungry ?= true

    @targetCandidates = @buildSelectorCandidates(selectorOrElement)

    @plans = []

    originLayer = options.origin && up.layer.forElement(options.origin)
    layerOpt = options.layer ? originLayer ? 'current'

    if layerOpt instanceof up.Layer
      @addCandidatePlans(layer: layerOpt)
    else if layerOpt == 'new'
      unless options.dialog
        throw new Error("{ layer: 'new' } requires a { dialog } option"
        # Dialog options we want to ship with: "window", "full", "drawer", "popup"
      throw "TODO. How does this work? Will I require { provideTarget }? How does the dialog flavor know that the element is ready and the frame can be unveiled?"

    else if layerOpt == 'root'
      @addCandidatePlans(layer: up.layer.root())

    else if layerOpt == 'origin'
      @addCandidatePlans(layer: originLayer)

    else if layerOpt == 'current'
      @addCandidatePlans(layer: up.layer.current())

    else if layerOpt == 'parent'
      @addCandidatePlans(layer: up.layer.parent(originLayer))

    else if layerOpt == 'ancestors'
      @addCandidatePlansForLayers(up.layer.ancestors(originLayer))

    else if layerOpt == 'closest'
      @addCandidatePlansForLayers([originLayer, up.layer.ancestors(originLayer)])

    else if layerOpt == 'any'
      @addCandidatePlansForLayers(up.layer.all())

    # Make sure we always succeed
    @addPlan(target: document.body, layer: up.layer.root(), resetAll: true)


  addCandidatePlansForLayers: (layers) ->
    for layer in layers
      @addCandidatePlans(layer: layer)

  addCandidatePlans: (planOptions) ->
    u.each @targetCandidates, (targetCandidate, i) ->
      planOptions = u.copy(planOptions)
      planOptions.target = targetCandidate

      if i > 0
        # If we're using a fallback (any candidate that's not the first),
        # the original transition might no longer be appropriate.
        planOptions.transition = up.fragment.config.fallbackTransition ? @options.transition

      @addPlan(planOptions)

  addPlan: (planOptions) ->
    planOptions = u.merge(@options, planOptions)
    @plans.push new up.ExtractPlan(planOptions)

  buildSelectorCandidates: (selector) ->
    candidates = [selector, @options.fallback, up.fragment.config.fallbacks]
    candidates = u.flatten(candidates)
    # Remove undefined, null and false from the list
    candidates = u.filter(candidates, u.isTruthy)
    candidates = u.uniq(candidates)

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
    u.find @plans, (plan) -> plan[checker]()

  bestPreflightSelector: =>
    if @options.provideTarget
      # We know that the target will be created right before swapping,
      # so just assume the first plan will work.
      plan = @plans[0]
    else
      plan = @oldPlan()

    if plan
      plan.resolveNesting()
      plan.selector()
    else
      @oldPlanNotFound()

  bestMatchingSteps: =>
    if plan = @matchingPlan()
      # Only when we have a match in the required selectors, we
      # append the optional steps for [up-hungry] elements.
      plan.addHungrySteps()
      plan.resolveNesting()
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
      if @options.inspectResponse
        inspectAction = { label: 'Open response', callback: @options.inspectResponse }
      up.fail(["#{message} (tried %o)", @selectorCandidates], action: inspectAction)

  oldPlanNotFound: =>
    layerProse = @options.layer
    layerProse = 'page, modal or popup' if layerProse == 'auto'
    up.fail("Could not find #{@options.humanizedTarget} in current #{layerProse} (tried %o)", @selectorCandidates)
