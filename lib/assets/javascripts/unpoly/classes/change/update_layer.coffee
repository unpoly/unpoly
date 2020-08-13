#= require ./addition

u = up.util
e = up.element

class up.Change.UpdateLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    @layer = options.layer
    # Plan#target is required by FromContent#firstDefaultTarget
    @target = options.target
    @origin = options.origin
    @layerScanner = options.layerScanner
    @placement = options.placement

  requestAttributes: ->
    @matchPreflight()

    return {
      layer: @layer
      mode: @layer.mode
      context: @layer.context
      target: @bestPreflightSelector(),
    }

  bestPreflightSelector: ->
    @matchPreflight()

    u.map(@steps, 'selector').join(', ')

  toString: ->
    "Update \"#{@target}\" in #{@layer}"

  execute: (@responseDoc) ->
    # For each step, find a step.alternative that matches in both the current page
    # and the response document.
    @matchPostflight()

    up.puts('up.render()', "Updating \"#{@target}\" in #{@layer}")

    # Make sure only the first step will have scroll-related options.
    @setScrollAndFocusOptions()

    if @options.peel
      @layer.peel()
      # Layer#peel() will manipulate the stack sync.
      # We don't wait for the peeling animation to finish.

    # If either the server or the up.render() caller has provided a new
    # { context } object, we set the layer's context to that object.
    @layer.updateContext(u.pick(@options, ['context']))

    # Change history before compilation, so new fragments see the new location.
    @layer.updateHistory(u.pick(@options, ['history', 'location', 'title'])) # layer location changed event soll hier nicht mehr fliegen

    # The server may trigger multiple signals that may cause the layer to close:
    #
    # - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    # - Event an event with X-Up-Events, to which a listener may close the layer
    # - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    #   will close the layer.
    #
    # Note that @handleLayerChangeRequests() also calls @abortWhenLayerClosed()
    # if any of these options cause the layer to close.
    @handleLayerChangeRequests()

    swapPromises = @steps.map(@executeStep)

    Promise.all(swapPromises).then =>
      @abortWhenLayerClosed()
      @onRemoved()
      @onAppeared()

    return Promise.resolve()

  executeStep: (step) =>
    # When the server responds with an error, or when the request method is not
    # reloadable (not GET), we keep the same source as before.
    if step.source == 'keep'
      step.source = up.fragment.source(step.oldElement)

    # Remember where the element came from in case someone needs to up.reload(newElement) later.
    up.fragment.setSource(step.newElement, step.source)

    switch step.placement
      when 'swap'
        if keepPlan = @findKeepPlan(step)
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
            beforeDetach: =>
              up.syntax.clean(step.oldElement, { @layer })
            afterDetach: =>
              e.remove(step.oldElement) # clean up jQuery data
              up.fragment.emitDestroyed(step.oldElement, parent: parent, log: false)
            scrollNew: =>
              @handleFocus(step.newElement, step)
              @handleScroll(step.newElement, step)

          return up.morph(
            step.oldElement,
            step.newElement,
            step.transition,
            morphOptions
          )

      when 'before', 'after'
        # We're either appending or prepending. No keepable elements must be honored.

        # Text nodes are wrapped in a up-insertion container so we can
        # animate them and measure their position/size for scrolling.
        # This is not possible for container-less text nodes.
        wrapper = e.createFromSelector('up-insertion')
        while childNode = step.newElement.firstChild
          wrapper.appendChild(childNode)

        # Note that since we're prepending/appending instead of replacing,
        # newElement will not actually be inserted into the DOM, only its children.
        if step.placement == 'before'
          step.oldElement.insertAdjacentElement('afterbegin', wrapper)
        else
          step.oldElement.insertAdjacentElement('beforeend', wrapper)

        for child in wrapper.children
          # Compile the new content and emit up:fragment:inserted.
          @responseDoc.activateElement(child, step)

        @handleFocus(wrapper, step)

        # Reveal element that was being prepended/appended.
        # Since we will animate (not morph) it's OK to allow animation of scrolling
        # if options.scrollBehavior is given.
        promise = @handleScroll(wrapper, step)

        # Since we're adding content instead of replacing, we'll only
        # animate newElement instead of morphing between oldElement and newElement
        promise = promise.then -> up.animate(wrapper, step.transition, step)

        # Remove the wrapper now that is has served it purpose
        promise = promise.then -> e.unwrap(wrapper)

        return promise

      else
        up.fail('Unknown placement: %o', step.placement)

  # Returns a object detailling a keep operation iff the given element is [up-keep] and
  # we can find a matching partner in newElement. Otherwise returns undefined.
  #
  # @param {Element} options.oldElement
  # @param {Element} options.newElement
  # @param {boolean} options.keep
  # @param {boolean} options.descendantsOnly
  findKeepPlan: (options) ->
    return unless options.keep

    keepable = options.oldElement
    if partnerSelector = e.booleanOrStringAttr(keepable, 'up-keep')
      u.isString(partnerSelector) or partnerSelector = '&'
      partnerSelector = e.resolveSelector(partnerSelector, keepable)
      if options.descendantsOnly
        partner = e.get(options.newElement, partnerSelector)
      else
        partner = e.subtree(options.newElement, partnerSelector)[0]
      if partner && e.matches(partner, '[up-keep]')
        plan =
          oldElement: keepable # the element that should be kept
          newElement: partner # the element that would have replaced it but now does not
          newData: up.syntax.data(partner) # the parsed up-data attribute of the element we will discard

        unless up.fragment.emitKeep(plan).defaultPrevented
          return plan

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
    disjunction = u.splitValues(@target, ',')

    @steps = disjunction.map (target, i) =>
      expressionParts = target.match(/^(.+?)(?:\:(before|after|root))?$/) or
        throw up.error.invalidSelector(target)

      # selector = @layerScanner.fixSelector(expressionParts[1])
      selector = expressionParts[1]
      placement = expressionParts[2] || @placement || 'swap'

      solutions = @layerScanner.selectSolutions(selector)

      if placement == 'root'
        # The `root` placement can be modeled as a `swap` of the new element and
        # the first child of the current layer's' root element.
        placement = 'swap'

        for solution in solutions
          solution.element = @layer.getFirstSwappableElement()

      unless solutions.length
        throw @notApplicable()

      # Each step inherits all options of this change.
      return u.merge(@options, { solutions, placement })

  matchPreflight: ->
    return if @matchedPreflight

    # Since parsing steps involves many DOM lookups, we only do it when required.
    @parseSteps()

    originalSteps = @steps
    @steps = []

    for step in originalSteps
      unless @isSwappedByEarlierStep(step)
        if firstSolution = step.solutions[0]
          # We might not swap this element. Once the response is received, @matchPostflight()
          # will go through all alternatives and see which selector matches in *both*
          # the current page and response doc.
          console.log("Calling useSolution() from matchPreflight")
          @useSolution(step, firstSolution)
        else
          throw @notApplicable()

#    # Remove steps when their oldElement is nested inside the oldElement
#    # of another step.
#    @resolveOldNesting()

    @matchedPreflight = true

  useSolution: (step, solution) ->
    console.log("useSolution(%o, %o)", u.copy(step), u.copy(solution))
    step.oldElement = solution.element
    step.selector = solution.selector
    @steps.push(step)

  matchPostflight: ->
    return if @matchedPostflight

    # Since parsing steps involves many DOM lookups, we only do it when required.
    @parseSteps()

    originalSteps = @steps
    @steps = []

    for step in originalSteps
      unless @isSwappedByEarlierStep(step)
        bestSolution = u.find step.solutions, (solution) =>
          # If an element was removed while the request was in flight, this alternative
          # is no longer relevant.
          if e.isDetached(solution.element)
            return false

          # The responseDoc has no layers, so we can just select on the entire tree.
          if step.newElement = @responseDoc.select(solution.selector)
            return true

        if bestSolution
          # We will no longer look at other solutions.
          console.log("Calling useSolution() from matchPostflight")
          @useSolution(step, bestSolution)
        else
          throw @notApplicable()

    # Only when we have a match in the required selectors, we
    # append the optional steps for [up-hungry] elements.
    if @options.hungry
      @addHungrySteps()

    console.log("--- targets before collapse: %o", u.map(@steps, 'selector'))

#    # Remove steps when their oldElement is nested inside the oldElement
#    # of another step.
#    @resolveOldNesting()

    console.log("--- targets after collapse: %o", u.map(@steps, 'selector'))

    @matchedPostflight = true

  isSwappedByEarlierStep: (testedStep) ->
    return u.all testedStep.solutions, (testedStepSolution) =>
      return u.some @steps, (existingStep) ->
        willRemoveOldElement = (existingStep.placement == 'swap' || existingStep.placement == 'root')
        if willRemoveOldElement
          return existingStep.oldElement.contains(testedStepSolution.element)
        else
          return existingStep.oldElement == testedStepSolution.element

  addHungrySteps: ->
    # Find all [up-hungry] fragments within @layer
    hungries = up.fragment.all(up.radio.hungrySelector(), { @layer })
    transition = up.radio.config.hungryTransition ? @options.transition
    for oldElement in hungries
      selector = up.fragment.toTarget(oldElement)
      if newElement = @responseDoc.select(selector)
        step = { selector, oldElement, newElement, transition, placement: 'swap' }
        unless @isSwappedByEarlierStep(step)
          @steps.push()

  setScrollAndFocusOptions: ->
    @steps.forEach (step, i) =>
      console.log("setScrollAndFocusOptions for step %o", step)

      # Since up.motion will call @handleScrollAndFocus() after each fragment,
      # make sure that we only touch the scroll position once, for the first step.
      if i > 0
        u.assign step,
          focus: false
          reveal: false
          resetScroll: false
          restoreScroll: false

      # Store the focused element's selector, scroll position and selection range in an up.FocusCapsule
      # for later restoration.
      #
      # Note that unlike the other scroll-related options, we might need to keep in a fragment that
      # is not the first step. However, only a single step can include the focused element, or none.
      if step.placement == 'swap'
        @focusCapsule ?= up.FocusCapsule.preserveWithin(step.oldElement)

  handleFocus: (element, step) ->
    fragmentFocus = new up.FragmentFocus(
      target: element,
      layer: @layer,
      focusCapsule: @focusCapsule,
      autoMeans: ['keep', 'autofocus'],
    )
    fragmentFocus.process(step.focus)

  handleScroll: (element, options) ->
    # Copy options since we will modify the object below.
    options = u.options(options)

    # We process one of multiple scroll-changing options.
    hashOpt = options.hash
    revealOpt = options.reveal
    resetScrollOpt = options.resetScroll
    restoreScrollOpt = options.restoreScroll

    if options.placement == 'swap'
      # If we're scrolling a swapped fragment, don't animate.
      # If we're scrolling a prepended/appended fragment we allow the user to
      # pass { scrollBehavior: 'smooth' }.
      options.scrollBehavior = 'auto'

    if resetScrollOpt
      # If the user has passed { resetScroll: false } we scroll to the top all
      # viewports that are either containing or are contained by element.
      return up.viewport.resetScroll(u.merge(options, around: element))
    else if restoreScrollOpt
      # If the user has passed { restoreScroll } we restore the last known scroll
      # positions for the new URL, for all viewports that are either containing or
      # are contained by element.
      return up.viewport.restoreScroll(u.merge(options, around: element))
    else if hashOpt && revealOpt == true
      # If a { hash } is given, we will reveal the element it refers to.
      # This can be disabled with { reveal: false }.
      return up.viewport.revealHash(hashOpt, options)

    else if revealOpt
      # We allow to pass another element as { reveal } option
      if u.isElementish(revealOpt)
        element = e.get(revealOpt) # unwrap jQuery
      # If the user has passed a CSS selector as { reveal } option, we try to find
      # and reveal a matching element in the layer that we're updating.
      else if u.isString(revealOpt)
        element = up.fragment.get(revealOpt, options)
      else
        # We reveal the given `element` argument.

      # If selectorOrElement was a CSS selector, don't blow up by calling reveal()
      # with an empty jQuery collection. This might happen if a failed form submission
      # reveals the first validation error message, but the error is shown in an
      # unexpected element.
      if element
        return up.reveal(element, options)

    # If we didn't need to scroll above, just return a resolved promise
    # to fulfill this function's signature.
    return Promise.resolve()
