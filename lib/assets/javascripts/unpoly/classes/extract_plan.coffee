u = up.util
e = up.element

up.ExtractPlan =
  NOT_APPLICABLE: 'NA' # a value we can throw and catch


class up.ExtractPlan.UpdateLayer

  constructor: (layer, rawTarget, options) ->

  preflightTarget: ->
    @findOld()

    allStepsHaveOld() or throw up.ExtractPlan.NOT_APPLICABLE

  execute: ->
    everythingThatOldExtractPlanDoes()
    everythingThatFragmentDoes()

class up.ExtractPlan.ReplaceRoot

  constructor: ->

  preflightSelector: ->
    'body'

  execute: (responseDoc) ->
    promise =
      # Don't trigger events. We cannot really allow prevention.
      # Also any { dismissed } handlers might trigger additional requests,
      # which would be pointless since we're resetting the world.
      up.layer.dismissAll(events: false)
    promise.then ->
      up.viewport.root().scrollTop = 0
      e.replace(document.body, responseDoc.first('body'))
      throw "who sets source? should happen before compile"
      throw "who sets title? should happen before compile"
      throw "who sets URL? should happen before compile"
      throw "who compiles the body? should happen after insert"

class up.ExtractPlan.OpenLayer

  constructor: (@flavor, @target) ->

  preflightTarget: ->
    @target

  execute: (responseDoc) ->
    if element = responseDoc.first(@target)
      afterAttach = ->
        compile()
        emitInserted()
      up.layer.open({ @flavor, element, afterAttach })
    else
      throw up.ExtractPlan.NOT_APPLICABLE



#class up.UpdateLayerPlan
#
#  oldExists: ->
#    @findOld()
#    u.every @steps, (step) -> step.oldElement
#
#class up.OpenLayerPlan
#
#
#class up.ReplaceRootPlan
#
#  oldExists: ->
#    true


class up.ExtractPlan

  constructor: (@options) ->
    @parseSteps()

  findOld: ->
    u.each @steps, (step) =>
      step.oldElement = up.fragment.first(step.selector, u.only(@options, 'layer'))

  findNew: ->
    u.each @steps, (step) =>
      # The responseDoc has no layers. It's always just the page.
      step.newElement = @responseDoc.first(step.selector)

  oldExists: ->
    if @options.opener
      true
    else
      @findOld()
      u.every @steps, (step) -> step.oldElement

  newExists: ->
    @findNew()
    u.every @steps, (step) -> step.newElement

  matchExists: ->
    @oldExists() && @newExists()

  resolveNesting: ->
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

    # If we revealed before, we should reveal now
    compressed[0].reveal = @steps[0].reveal
    @steps = compressed

  target: ->
    u.map(@steps, 'target').join(', ')

  parseSteps: ->
    resolvedSelector = e.resolveSelector(@options.target, @options.origin)
    disjunction = resolvedSelector.split(/\ *,\ */)

    @steps = disjunction.map (target, i) =>
      expressionParts = target.match(/^(.+?)(?:\:(before|after))?$/)
      expressionParts or up.fail('Could not parse selector "%s"', target)
      selector = expressionParts[1]
      if selector == 'html'
        # If someone really asked us to replace the <html> root, the best
        # we can do is replace the <body>.
        selector = 'body'

      pseudoClass = expressionParts[2]

      # When extracting multiple selectors, we only want to reveal the first element.
      # So we set the { reveal } option to false for the next iteration.
      doReveal = if i == 0 then @options.reveal else false

      # When extracting multiple selectors, they will all be only the same layer.
      # So we only need to peel once.
      doPeal = if i == 0 then @options.peal else false

      return u.merge @options,
        target: target
        selector: selector
        pseudoClass: pseudoClass
        reveal: doReveal
        peal: doPeal

  prepareForSwapping: ->
    throw "does hier ruft niemand auf?"
    throw "up.fragment macht selbst auch nochmal prepareForInsertion?"
    # Only when we have a match in the required selectors, we
    # append the optional steps for [up-hungry] elements.
    plan.addHungrySteps()
    plan.resolveNesting()

    # Unwrap <noscript> tags
    for step in @steps
      @options.responseDoc.prepareForInsertion(step.newElement)

  addHungrySteps: ->
    if @options.hungry
      throw "only find hungries in the target layer"
      throw "don't find hungries if we are blowing up the page"
      throw "don't add hungries when we have an { opener }"
      hungries = e.all(up.radio.hungrySelector())
      transition = up.radio.config.hungryTransition ? @options.transition
      for hungry in hungries
        selector = e.toSelector(hungry)
        layer = up.layer.forElement(hungry)
        if newHungry = @options.responseDoc.first(selector)
          @steps.push
            selector: selector
            oldElement: hungry
            newElement: newHungry
            transition: transition
            reveal: false # we never auto-reveal a hungry element
            origin: null # don't let the hungry element auto-close a non-sticky modal or popup
            layer: layer # TODO: Do we need this look-up?
