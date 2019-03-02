u = up.util
e = up.element

class up.ExtractPlan

  @NOT_APPLICABLE: 'n/a'

  setSource: (element, sourceUrl) ->
    unless sourceUrl is false
      sourceUrl = u.normalizeUrl(sourceUrl) if u.isPresent(sourceUrl)
      element.setAttribute('up-source', sourceUrl)

  updateHistoryAndTitle: (layer, options) ->
    if newUrl = options.history
      up.layer.updateUrl(layer, newUrl)

    if newTitle = options.title
      up.layer.updateTitle(layer, newTitle)

  notApplicable: ->
    throw up.ExtractPlan.NOT_APPLICABLE


class up.ExtractPlan.OpenLayer extends up.ExtractPlan

  constructor: (@options) ->

  preflightLayer: ->
    undefined # it does not exist yet

  preflightTarget: ->
    # The target will always "exist" in the current page, since
    # we're opening a new layer just for that.
    @options.target

  execute: (responseDoc) ->
    newLayerContent = responseDoc.selectForInsertion(@options.target) or @notApplicable()
    @setSource(newLayerContent, @options.source)

    afterAttach = (layer) =>
      up.hello(newLayerContent, @options) # will emit up:fragment:inserted
      up.layer.updateHistory(layer, @options)

    openOptions = u.options(@options, { content: newLayerContent, afterAttach })

    return up.layer.open(openOptions)


class up.ExtractPlan.UpdateLayer extends up.ExtractPlan

  constructor: (@options) ->
    @parseSteps()

  preflightLayer: ->
    @options.layer

  preflightTarget: ->
    @findOld()
    return @targetWithoutPseudoClasses()

  execute: (responseDoc) ->
    @findOld()
    @findNew(responseDoc)
    # Only when we have a match in the required selectors, we
    # append the optional steps for [up-hungry] elements.
    @addHungrySteps(responseDoc)

    promise = Promise.resolve()

    if @options.peel
      promise = promise.then -> up.layer.peel(@options.layer)

    @updateHistoryAndTitle(@options.layer, @options)

    promise.then ->
      swapPromises = @steps.map (step) ->
        # Note that we must copy the options hash instead of changing it in-place, since the
        # async swapElements() is scheduled for the next microtask and we must not change the options
        # for the previous iteration.
        swapOptions = u.merge(@options, step)
        return @swapStep(step, swapOptions)

      return Promise.all(swapPromises)

    everythingThatFragmentDoes()

    return promise

  swapStep: (step, options) ->
    up.puts('Swapping fragment %s', step.selector)

    # When the server responds with an error, or when the request method is not
    # reloadable (not GET), we keep the same source as before.
    if options.source == 'keep'
      options.source = up.fragment.source(step.oldElement)

    # Remember where the element came from in case someone needs to up.reload(newElement) later.
    @setSource(step.newElement, options.source)

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

      throw "support :destroy pseudoClass"

      for child in wrapper.children
        up.hello(child, options) # emits up:fragment:inserted

      # Reveal element that was being prepended/appended.
      # Since we will animate (not morph) it's OK to allow animation of scrolling
      # if options.scrollBehavior is given.
      promise = up.viewport.scrollAfterInsertFragment(wrapper, options)

      # Since we're adding content instead of replacing, we'll only
      # animate newElement instead of morphing between oldElement and newElement
      promise = u.always(promise, up.animate(wrapper, step.transition, options))

      # Remove the wrapper now that is has served it purpose
      promise = promise.then -> e.unwrap(wrapper)

      return promise

    else if keepPlan = @findKeepPlan(step.oldElement, step.newElement, options)
      # Since we're keeping the element that was requested to be swapped,
      # there is nothing left to do here, except notify event listeners.
      up.fragment.emitKept(keepPlan)
      return Promise.resolve()

    else
      # This needs to happen before up.syntax.clean() below.
      # Otherwise we would run destructors for elements we want to keep.
      options.keepPlans = @transferKeepableElements(step.oldElement, step.newElement, options)

      parent = step.oldElement.parentNode

      morphOptions = u.merge options,
        beforeStart: ->
          up.fragment.markAsDestroying(step.oldElement)
        afterInsert: ->
          up.hello(step.newElement, options)
        beforeDetach: ->
          up.syntax.clean(step.oldElement)
        afterDetach: ->
          e.remove(step.oldElement) # clean up jQuery data
          up.fragment.emitDestroyed(fragment.oldElement, parent: parent, log: false)

      return up.morph(step.oldElement, step.newElement, step.transition, morphOptions)

  # Returns a object detailling a keep operation iff the given element is [up-keep] and
  # we can find a matching partner in newElement. Otherwise returns undefined.
  findKeepPlan: (element, newElement, options) ->
    return unless options.keep

    keepable = element
    if partnerSelector = e.booleanOrStringAttr(keepable, 'up-keep')
      u.isString(partnerSelector) or partnerSelector = '&'
      partnerSelector = e.resolveSelector(partnerSelector, keepable)
      if options.descendantsOnly
        partner = e.first(newElement, partnerSelector)
      else
        partner = e.subtree(newElement, partnerSelector)[0]
      if partner && e.matches(partner, '[up-keep]')
        plan =
          oldElement: keepable # the element that should be kept
          newElement: partner # the element that would have replaced it but now does not
          newData: up.syntax.data(partner) # the parsed up-data attribute of the element we will discard

        return plan unless up.fragment.emitKeep(plan).defaultPrevented


  # This will find all [up-keep] descendants in oldElement, overwrite their partner
  # element in newElement and leave a visually identical clone in oldElement for a later transition.
  # Returns an array of keepPlans.
  transferKeepableElements: (oldElement, newElement, options) ->
    keepPlans = []
    if options.keep
      for keepable in oldElement.querySelectorAll('[up-keep]')
        if plan = @findKeepPlan(keepable, newElement, u.merge(options, descendantsOnly: true))
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
    keepPlans


  parseSteps: ->
    resolvedSelector = e.resolveSelector(@options.target, @options.origin)
    disjunction = u.splitValues(resolvedSelector, ',')

    @steps = disjunction.map (target, i) =>
      expressionParts = target.match(/^(.+?)(?:\:(before|after))?$/) or up.fail('Could not parse selector "%s"', target)

      # When extracting multiple selectors, we only want to reveal the first element.
      # So we set the { reveal } option to false for the next iteration.
      doReveal = if i == 0 then @options.reveal else false

      selector = expressionParts[1]
      if selector == 'html'
        # We cannot replace <html> with the current e.replace() implementation.
        selector = 'body'

      return u.merge @options,
        selector: selector
        pseudoClass: expressionParts[2]
        reveal: doReveal

  findOld: ->
    for step in @steps
      step.oldElement = up.layer.firstElement(@options.layer, step.selector) or @notApplicable()
    @resolveOldNesting()

  findNew: (responseDoc) ->
    for step in @steps
      # The responseDoc has no layers. It's always just the page.
      step.newElement = responseDoc.selectForInsertion(step.selector) or @notApplicable()

  addHungrySteps: (responseDoc) ->
    if @options.hungry
      throw "replace with up.fragment.all(..., layer: @options.layer)"
      hungries = up.layer.allElements(@options.layer, up.radio.hungrySelector())
      transition = up.radio.config.hungryTransition ? @options.transition
      for hungry in hungries
        selector = e.toSelector(hungry)
        if newHungry = responseDoc.first(selector)
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
    compressed[0].reveal = @steps[0]

    @steps = compressed

  targetWithoutPseudoClasses: ->
    u.map(@steps, 'selector').join(', ')


class up.ExtractPlan.ResetWorld extends up.ExtractPlan.UpdateLayer

  preflightLayer: ->
    up.layer.root()

  constructor: (options) ->
    options = u.merge(options,
      layer: 'root',
      target: 'body',
      peel: true
      keep: false
      resetScroll: true
    )
    super(options)
