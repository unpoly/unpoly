u = up.util

class up.ExtractCascade

  constructor: (options) ->
    @options = u.options(options)
    @options.hungry ?= true
    @buildTargetCandidates()
    @buildPlans()

  buildPlans: ->
    @plans = []

    @originLayer = options.origin && up.layer.forElement(options.origin)
    @layerOpt = options.layer ? originLayer ? 'current'

    if layerOpt == 'new'
      unless options.dialog
        throw new Error("{ layer: 'new' } requires a { dialog } option")
        # Dialog options we want to ship with: "modal", "full", "drawer", "popup", maybe "tooltip"
      throw "Fail when a selector targets multiple elements for new layer"
      throw "TODO. How does this work? Will I require { provideTarget }? How does the dialog flavor know that the element is ready and the frame can be unveiled?"
      throw "when the new response does not include the target, how can we use the fallback?"

      # opener = up.layer.getOpener(options.dialog)

      opener = (contentElement, options) ->
        dialog = up.layer.buildDialog(name)
        dialog.open(contentElement, options)



      # layer =

      dialogImplementation = dialogRegistry.forName(options.dialog)


    else
      for layer in @findLayerCandidates()
        @addCandidatePlans(layer: layer)

    # Make sure we always succeed
    @addPlan(target: document.body, layer: up.layer.root(), resetAll: true)

  findLayerCandidates: ->
    if @layerOpt instanceof up.Layer
      return [@layerOpt]

    return switch @layerOpt
      when 'root'
        [up.layer.root()]
      when 'origin'
        [@originLayer]
      when 'current'
        [up.layer.current()]
      when 'parent'
        [up.layer.parent(@originLayer)]
      when 'ancestors'
        up.layer.ancestors(@originLayer)
      when 'closest'
        up.layer.selfAndAncestors(@originLayer)
      when 'any'
        up.layer.all()

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

  buildTargetCandidates: ->
    @candidates = [@options.target, @options.fallback, up.fragment.config.fallbacks]
    @candidates = u.flatten(@candidates)
    # Remove undefined, null and false from the list
    @candidates = u.filter(@candidates, u.isTruthy)
    @candidates = u.uniq(@candidates)

    if @options.fallback == false || @options.provideTarget
      # Use the first defined candidate, but not `selector` since that
      # might be an undefined options.failTarget
      @candidates = [@candidates[0]]

  oldPlan: ->
    @detectPlan('oldExists')

  newPlan: ->
    @detectPlan('newExists')

  matchingPlan: ->
    @detectPlan('matchExists')

  detectPlan: (checker) ->
    u.find @plans, (plan) -> plan[checker]()

  bestPreflightTarget: ->
    if @options.provideTarget
      # We know that the target will be created right before swapping,
      # so just assume the first plan will work.
      plan = @plans[0]
    else
      plan = @oldPlan()

    if plan
      plan.resolveNesting()
      plan.target()
    else
      @oldPlanNotFound()

  bestSwapSteps: ->
    if plan = @matchingPlan()
      plan.prepareForSwapping()
      plan.steps
    else
      @matchingPlanNotFound()

  matchingPlanNotFound: ->
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

  oldPlanNotFound: ->
    layerProse = @options.layer
    layerProse = 'page, modal or popup' if layerProse == 'auto'
    up.fail("Could not find #{@options.humanizedTarget} in current #{layerProse} (tried %o)", @selectorCandidates)
