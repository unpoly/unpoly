u = up.util
e = up.element

class up.ExtractPlan

  @NOT_APPLICABLE: 'n/a'

  constructor: (@options) ->

  setSource: (element, sourceUrl) ->
    unless sourceUrl is false
      sourceUrl = u.normalizeUrl(sourceUrl) if u.isPresent(sourceUrl)
      element.setAttribute('up-source', sourceUrl)

  updateHistoryAndTitle: (layer, options) ->
    options = u.options(options, historyMethod: 'push')
    if newUrl = options.history
      up.layer.updateUrl(layer, newUrl)

    if newTitle = options.title
      up.layer.updateTitle(layer, newTitle)

  notApplicable: ->
    throw up.ExtractPlan.NOT_APPLICABLE


# Replaces the current <body> with a new body from the response.
class up.ExtractPlan.SwapBody extends up.ExtractPlan

  constructor: (@options) ->

  preflightTarget: ->
    # We always have a <body>, so this plan is always applicable.
    'body'

  execute: (responseDoc) ->
    layer = up.layer.root()
    promise =
      # Don't trigger events. We cannot really allow prevention.
      # Also any { dismissed } handlers might trigger additional requests,
      # which would be pointless since we're resetting the world.
      up.layer.peel(layer)
    promise.then =>
      up.viewport.root().scrollTop = 0
      # Because of the way DOMParser works, the response always has a <body>.
      # If the server response is only some text, DOMParser will wrap it with <body>.
      newBody = responseDoc.selectForInsertion('body')
      @setSource(newBody, @options.source)
      @updateHistoryAndTitle(layer, @options)

      throw "Should we keep up-keep elements in body?"

      oldBody = document.body
      e.replace(oldBody, newBody)
      up.fragment.emitDestroyed(oldBody, u.merge(@options, parent: e.root()))
      up.hello(document.body, @options) # will emit up:fragment:inserted


class up.ExtractPlan.OpenLayer extends up.ExtractPlan

  constructor: (@target, @options) ->

  preflightTarget: ->
    # The target will always "exist" in the current page, since
    # we're opening a new layer just for that.
    @target

  execute: (responseDoc) ->
    newLayerContent = responseDoc.selectForInsertion(@target) or @notApplicable()
    @setSource(newLayerContent, @options.source)

    afterAttach = (layer) =>
      up.hello(newLayerContent, @options) # will emit up:fragment:inserted
      @updateHistoryAndTitle(layer, @options)

    openOptions = u.options(@options, { newLayerContent, afterAttach })
    throw "implement up.layer.open()"
    throw "implement up:layer:* events"
    throw "up.layer.open() must have config default for { flavor }"

    return up.layer.open(openOptions)


class up.ExtractPlan.UpdateLayer extends up.ExtractPlan

  constructor: (@options) ->
    @parseSteps()

  preflightTarget: ->
    @findOld()
    return @targetWithoutPseudoClasses()

  execute: ->
    @findOld()
    @findNew()
    # Only when we have a match in the required selectors, we
    # append the optional steps for [up-hungry] elements.
    @addHungrySteps()

    promise = Promise.resolve()

    if @options.peel
      promise = promise.then -> up.layer.peel(@options.layer)

    promise.then ->
      swapPromises = @steps.map (step) ->
        # Note that we must copy the options hash instead of changing it in-place, since the
        # async swapElements() is scheduled for the next microtask and we must not change the options
        # for the previous iteration.
        swapOptions = u.merge(@options, u.only(step, 'origin', 'reveal'))
        responseDoc.prepareForInsertion(step.newElement)
        return @swapStep(step, swapOptions)

      return Promise.all(swapPromises)

    everythingThatFragmentDoes()

    return promise

  swapStep: (step, options) ->
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

  findKeepPlan: (element, newElement, options) ->
    if options.keep
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

          keepEventArgs =
            target: keepable
            newFragment: partner
            newData: plan.newData
            log: ['Keeping element %o', keepable]

          if up.event.nobodyPrevents('up:fragment:keep', keepEventArgs)
            plan

  # This will find all [up-keep] descendants in oldElement, overwrite their partner
  # element in newElement and leave a visually identical clone in oldElement for a later transition.
  # Returns an array of keepPlans.
  transferKeepableElements: (oldElement, newElement, options) ->
    keepPlans = []
    if options.keep
      for keepable in oldElement.querySelectorAll('[up-keep]')
        if plan = findKeepPlan(keepable, newElement, u.merge(options, descendantsOnly: true))
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
      # When extracting multiple selectors, we only want to reveal the first element.
      # So we set the { reveal } option to false for the next iteration.
      doReveal = if i == 0 then @options.reveal else false

      # When extracting multiple selectors, they will all be only the same layer.
      # So we only need to peel once.
      doPeel = if i == 0 then @options.peel else false

      expressionParts = target.match(/^(.+?)(?:\:(before|after))?$/) or up.fail('Could not parse selector "%s"', target)

      return u.merge @options,
        selector: expressionParts[1]
        pseudoClass: expressionParts[2]
        reveal: doReveal
        peel: doPeel

  findOld: ->
    for step in @steps
      step.oldElement = up.layer.firstElement(@options.layer, step.selector) or @notApplicable()
    @resolveOldNesting()

  findNew: ->
    for step in @steps
      # The responseDoc has no layers. It's always just the page.
      step.newElement = @responseDoc.selectForInsertion(step.selector) or @notApplicable()

  addHungrySteps: ->
    if @options.hungry
      throw "only find hungries in the target layer"
      throw "don't find hungries if we are blowing up the page"
      throw "don't add hungries when we have an { opener }"
      hungries = e.all(up.radio.hungrySelector())
      transition = up.radio.config.hungryTransition ? @options.transition
      for hungry in hungries
        selector = e.toSelector(hungry)
        if newHungry = @options.responseDoc.first(selector)
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
