#= require ./addition

u = up.util
e = up.element

class up.Change.UpdateLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    @layer = options.layer
    @target = options.target
    @origin = options.origin
    @placement = options.placement
    @context = options.context
    @parseSteps()

  preflightProps: ->
    # This will throw up.error.notApplicable() if { target } cannot
    # be found in { layer }.
    @matchPreflight()

    return {
      layer: @layer
      mode: @layer.mode
      context: u.merge(@layer.context, @context)
      target: @bestPreflightSelector(),
    }

  bestPreflightSelector: ->
    @matchPreflight()

    u.map(@steps, 'selector').join(', ') || ':none'

  toString: ->
    "Update \"#{@target}\" in #{@layer}"

  execute: (@responseDoc) ->
    # For each step, find a step.alternative that matches in both the current page
    # and the response document.
    @matchPostflight()

    up.puts('up.render()', "Updating \"#{@target}\" in #{@layer}")

    @options.title = @improveHistoryValue(@options.title, @responseDoc.getTitle())

    # Make sure only the first step will have scroll-related options.
    @setScrollAndFocusOptions()

    if @options.saveScroll
      up.viewport.saveScroll({ @layer })

    if @options.peel
      @layer.peel()
      # Layer#peel() will manipulate the stack sync.
      # We don't wait for the peeling animation to finish.

    u.assign(@layer.context, @context)

    # Change history before compilation, so new fragments see the new location.
    @layer.updateHistory(u.pick(@options, ['history', 'location', 'title'])) # layer location changed event soll hier nicht mehr fliegen

    # The server may trigger multiple signals that may cause the layer to close:
    #
    # - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    # - Event an event with X-Up-Events, to which a listener may close the layer
    # - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    #   will close the layer.
    #
    # Note that @handleLayerChangeRequests() also throws an up.error.aborted
    # if any of these options cause the layer to close.
    @handleLayerChangeRequests()

    swapPromises = @steps.map(@executeStep)

    Promise.all(swapPromises).then =>
      @abortWhenLayerClosed()

      # Run callback for callers that need to know when animations are done.
      @onFinished()

    # Don't wait for animations to finish.
    return Promise.resolve()

  executeStep: (step) =>
    # Remember where the element came from to support up.reload(element).
    @setSource(step)

    switch step.placement
      when 'swap'
        if keepPlan = @findKeepPlan(step)
          # Since we're keeping the element that was requested to be swapped,
          # there is nothing left to do here, except notify event listeners.
          up.fragment.emitKept(keepPlan)

          @handleFocus(step.oldElement, step)
          return @handleScroll(step.oldElement, step)

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
            afterDetach: ->
              e.remove(step.oldElement) # clean up jQuery data
              up.fragment.emitDestroyed(step.oldElement, parent: parent, log: false)
            scrollNew: =>
              @handleFocus(step.newElement, step)
              # up.morph() expects { scrollNew } to return a promise.
              return @handleScroll(step.newElement, step)

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
    # Going back in history uses keep: false
    return unless options.keep

    { oldElement, newElement } = options

    # We support these attribute forms:
    #
    # - up-keep             => match element itself
    # - up-keep="true"      => match element itself
    # - up-keep="false"     => don't keep
    # - up-keep=".selector" => match .selector
    if partnerSelector = e.booleanOrStringAttr(oldElement, 'up-keep')
      if partnerSelector == true
        partnerSelector = '&'

      lookupOpts = { layer: @layer, origin: oldElement }

      if options.descendantsOnly
        partner = up.fragment.get(newElement, partnerSelector, lookupOpts)
      else
        partner = up.fragment.subtree(newElement, partnerSelector, lookupOpts)[0]

      if partner && e.matches(partner, '[up-keep]')
        plan =
          oldElement: oldElement # the element that should be kept
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
    @steps = []

    # resolveSelector was already called by up.Change.FromContent
    for simpleTarget in u.splitValues(@target, ',')
      unless simpleTarget == ':none'
        expressionParts = simpleTarget.match(/^(.+?)(?:\:(before|after))?$/) or
          throw up.error.invalidSelector(simpleTarget)

        # Each step inherits all options of this change.
        step = u.merge(@options,
          selector: expressionParts[1]
          placement: expressionParts[2] || @placement || 'swap'
        )

        @steps.push(step)

  matchPreflight: ->
    return if @matchedPreflight

    for step in @steps
      # Try to find fragments matching step.selector within step.layer.
      # Note that step.oldElement might already have been set by @parseSteps().
      step.oldElement ||= up.fragment.get(step.selector, step) or
        throw @notApplicable("Could not find element \"#{@target}\" in current page")

    @resolveOldNesting()

    @matchedPreflight = true

  matchPostflight: ->
    return if @matchedPostflight

    @matchPreflight()

    for step in @steps
      # The responseDoc has no layers.
      step.newElement = @responseDoc.select(step.selector) or
        throw @notApplicable("Could not find element \"#{@target}\" in server response")

    # Only when we have a match in the required selectors, we
    # append the optional steps for [up-hungry] elements.
    if @options.hungry
      @addHungrySteps()

#    # Remove steps when their oldElement is nested inside the oldElement
#    # of another step.
    @resolveOldNesting()

    @matchedPostflight = true

  addHungrySteps: ->
    # Find all [up-hungry] fragments within @layer
    hungries = up.fragment.all(up.radio.hungrySelector(), @options)
    for oldElement in hungries
      selector = up.fragment.toTarget(oldElement)
      if newElement = @responseDoc.select(selector)
        transition = e.booleanOrStringAttr(oldElement, 'transition')
        @steps.push({ selector, oldElement, newElement, transition, placement: 'swap' })

  containedByRivalStep: (steps, candidateStep) ->
    return u.some steps, (rivalStep) ->
      rivalStep != candidateStep &&
        rivalStep.placement == 'swap' &&
        rivalStep.oldElement.contains(candidateStep.oldElement)

  resolveOldNesting: ->
    compressed = u.uniqBy(@steps, 'oldElement')
    compressed = u.reject compressed, (step) => @containedByRivalStep(compressed, step)
    @steps = compressed

  setScrollAndFocusOptions: ->
    @steps.forEach (step, i) =>
      # Since up.motion will call @handleScrollAndFocus() after each fragment,
      # and we only have a single scroll position and focus, only scroll/focus  for the first step.
      if i > 0
        step.scroll = false
        step.focus = false

      if step.placement == 'swap'
        # We cannot animate scrolling when we're morphing between two elements.
        step.scrollBehavior = 'auto'

        # Store the focused element's selector, scroll position and selection range in an up.FocusCapsule
        # for later restoration.
        #
        # We might need to preserve focus in a fragment that is not the first step.
        # However, only a single step can include the focused element, or none.
        @focusCapsule ?= up.FocusCapsule.preserveWithin(step.oldElement)

  handleFocus: (fragment, step) ->
    fragmentFocus = new up.FragmentFocus(
      focus: step.focus,
      fragment: fragment,
      layer: @layer,
      focusCapsule: @focusCapsule,
      autoMeans: ['keep', 'autofocus-if-enabled'],
    )
    fragmentFocus.process()

  handleScroll: (fragment, step) ->
    options = u.merge(step, { fragment, autoMeans: ['hash', 'layer-if-main'] })
    scrolling = new up.FragmentScrolling(options)
    return scrolling.process()
