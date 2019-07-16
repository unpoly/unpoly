#= require ./addition

u = up.util
e = up.element

class up.Change.UpdateLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    @layer = options.layer
    @originalTarget = options.target
    @peel = options.peel
    @reveal = options.reveal
    @location = options.location
    @hungry = options.hungry
    @transition = options.transition
    @parseSteps()

  preflightLayer: ->
    # Make sure this plan is applicable before returning a layer
    @findOld()
    return @layer

  preflightTarget: ->
    # Make sure this plan is applicable before returning a target
    @findOld()
    return @compressedTarget()

  execute: ->
    @findOld()
    @findNew()
    # Only when we have a match in the required selectors, we
    # append the optional steps for [up-hungry] elements.
    @addHungrySteps()

    # If we cannot push state on the root layer, a full page load will fix this.
    if @location && !up.browser.canPushState() && @layer.isRoot()
      up.browser.loadPage(@options)
      return u.unresolvablePromise()

    unless @layer.isOpen()
      @notApplicable('Could not update %o: Target layer was closed', @originalTarget)

    promise = Promise.resolve()

    promise = promise.then =>
      if @peel
        @layer.peel()
        # Don't wait for peeling to finish
      @layer.updateHistory(@options)
      # swapPromises = layer.asCurrent(=> @steps.map(@swapStep))
      swapPromises = @steps.map(@swapStep)
      return Promise.all(swapPromises)

    promise = promise.then =>
      @handleLayerChangeRequests()
      # don't delay `promise` until layer change requests have finished closing
      return undefined

    return promise

  swapStep: (step) =>
    up.puts('Swapping fragment %s', step.selector)

    # When the server responds with an error, or when the request method is not
    # reloadable (not GET), we keep the same source as before.
    if step.source == 'keep'
      step.source = up.fragment.source(step.oldElement)

    # Remember where the element came from in case someone needs to up.reload(newElement) later.
    up.fragment.setSource(step.newElement, step.source)

    if step.pseudoClass
      # We're either appending or prepending. No keepable elements must be honored.

      # Text nodes are wrapped in a .up-insertion container so we can
      # animate them and measure their position/size for scrolling.
      # This is not possible for container-less text nodes.
      wrapper = e.createFromSelector('.up-insertion')
      while childNode = step.newElement.firstChild
        wrapper.appendChild(childNode)

      # Note that since we're prepending/appending instead of replacing,
      # newElement will not actually be inserted into the DOM, only its children.
      if step.pseudoClass == 'before'
        step.oldElement.insertAdjacentElement('afterbegin', wrapper)
      else
        step.oldElement.insertAdjacentElement('beforeend', wrapper)

      for child in wrapper.children
        # Compile the new content and emit up:fragment:inserted.
        # @responseDoc.activateElement(child, { layer: @layer, keep: step.keep })
        @responseDoc.activateElement(child, step)

      # Reveal element that was being prepended/appended.
      # Since we will animate (not morph) it's OK to allow animation of scrolling
      # if options.scrollBehavior is given.
      promise = up.viewport.scrollAfterInsertFragment(wrapper, step)

      # Since we're adding content instead of replacing, we'll only
      # animate newElement instead of morphing between oldElement and newElement
      promise = u.always(promise, up.animate(wrapper, step.transition, step))

      # Remove the wrapper now that is has served it purpose
      promise = promise.then -> e.unwrap(wrapper)

      return promise

    else if keepPlan = @findKeepPlan(step)
      # Since we're keeping the element that was requested to be swapped,
      # there is nothing left to do here, except notify event listeners.
      up.fragment.emitKept(keepPlan)
      return Promise.resolve()

    else
      # This needs to happen before up.syntax.clean() below.
      # Otherwise we would run destructors for elements we want to keep.
      @transferKeepableElements(step)

      parent = step.oldElement.parentNode

      morphOptions = u.merge step,
        beforeStart: ->
          up.fragment.markAsDestroying(step.oldElement)
        afterInsert: =>
          @responseDoc.activateElement(step.newElement, step)
          # Make sure that we didn't lose the .up-overlays container
          # while replacing <body> or <html>
          if up.fragment.targetsBody(step.selector)
            up.layer.attachOverlayContainer()
        beforeDetach: ->
          up.syntax.clean(step.oldElement)
        afterDetach: ->
          e.remove(step.oldElement) # clean up jQuery data
          up.fragment.emitDestroyed(step.oldElement, parent: parent, log: false)

      return up.morph(step.oldElement, step.newElement, step.transition, morphOptions)

  # Returns a object detailling a keep operation iff the given element is [up-keep] and
  # we can find a matching partner in newElement. Otherwise returns undefined.
  #
  # @param {Element} options.oldElement
  # @param {Element} options.newElement
  # @param {boolean} options.keep
  # @param {boolean} options.descendantsOnly
  #
  findKeepPlan: (options) ->
    return unless options.keep

    keepable = options.oldElement
    if partnerSelector = e.booleanOrStringAttr(keepable, 'up-keep')
      u.isString(partnerSelector) or partnerSelector = '&'
      partnerSelector = e.resolveSelector(partnerSelector, keepable)
      if options.descendantsOnly
        partner = e.first(options.newElement, partnerSelector)
      else
        partner = e.subtree(options.newElement, partnerSelector)[0]
      if partner && e.matches(partner, '[up-keep]')
        plan =
          oldElement: keepable # the element that should be kept
          newElement: partner # the element that would have replaced it but now does not
          newData: up.syntax.data(partner) # the parsed up-data attribute of the element we will discard

        return plan unless up.fragment.emitKeep(plan).defaultPrevented

  # This will find all [up-keep] descendants in oldElement, overwrite their partner
  # element in newElement and leave a visually identical clone in oldElement for a later transition.
  # Returns an array of keepPlans.
  transferKeepableElements: (step) ->
    keepPlans = []
    if step.keep
      for keepable in step.oldElement.querySelectorAll('[up-keep]')
        if plan = @findKeepPlan(u.merge(step, oldElement: keepable, descendantsOnly: true))
          # plan.oldElement is now keepable

          # Replace keepable with its clone so it looks good in a transition between
          # oldElement and newElement. Note that keepable will still point to the same element
          # after the replacement, which is now detached.
          keepableClone = keepable.cloneNode(true)
          e.replace(keepable, keepableClone)

          # Since we're going to swap the entire oldElement and newElement containers afterwards,
          # replace the matching element with keepable so it will eventually return to the DOM.
          e.replace(plan.newElement, keepable)
          keepPlans.push(plan)

    step.keepPlans = keepPlans

  parseSteps: ->
    # resolveSelector was already called by up.Change.FromContent
    disjunction = u.splitValues(@originalTarget, ',')

    @steps = disjunction.map (target, i) =>
      expressionParts = target.match(/^(.+?)(?:\:(before|after))?$/) or
        up.fail('Could not parse selector "%s"', target)

      # When extracting multiple selectors, we only want to reveal the first element.
      # So we set the { reveal } option to false for the next iteration.
      doReveal = if i == 0 then @reveal else false

      selector = expressionParts[1]
      if selector == 'html'
        # We cannot replace <html> with the current e.replace() implementation.
        selector = 'body'

      return u.merge @options,
        selector: selector
        pseudoClass: expressionParts[2]
        reveal: doReveal

  findOld: ->
    return if @foundOld
    for step in @steps
      # Try to find fragments matchin step.selector within step.layer
      step.oldElement = up.fragment.first(step.selector, step) or @notApplicable()
    @resolveOldNesting()
    @foundOld = true

  findNew: ->
    return if @foundNew
    for step in @steps
      # The responseDoc has no layers.
      step.newElement = @responseDoc.first(step.selector) or @notApplicable()
    @foundNew = true

  addHungrySteps: ->
    if @hungry
      # Find all [up-hungry] fragments within @layer
      hungries = up.fragment.all(up.radio.hungrySelector(), @options)
      transition = up.radio.config.hungryTransition ? @transition
      for hungry in hungries
        selector = e.toSelector(hungry)
        if newHungry = @responseDoc.first(selector)
          @steps.push
            selector: selector
            oldElement: hungry
            newElement: newHungry
            transition: transition
            reveal: false # we never auto-reveal a hungry element

  resolveOldNesting: ->
    return if @steps.length < 2

    compressed = u.copy(@steps)

    # When two replacements target the same element, we would process
    # the same content twice. We never want that, so we only keep the first step.
    compressed = u.uniqBy(compressed, (step) -> step.oldElement)

    compressed = u.filter compressed, (candidateStep, candidateIndex) =>
      u.every compressed, (rivalStep, rivalIndex) =>
        if rivalIndex == candidateIndex
          true
        else
          candidateElement = candidateStep.oldElement
          rivalElement = rivalStep.oldElement
          rivalStep.pseudoClass || !rivalElement.contains(candidateElement)

    # If we revealed before, we should do so now
    compressed[0].reveal = @steps[0].reveal

    @steps = compressed

  compressedTarget: ->
    serializeStep = (step) -> u.compact([step.selector, step.pseudoClass]).join(':')
    return u.map(@steps, serializeStep).join(', ')
