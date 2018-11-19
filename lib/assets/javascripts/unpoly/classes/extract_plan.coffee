u = up.util
e = up.element

class up.ExtractPlan

  constructor: (selector, options) ->
    @reveal = options.reveal
    @origin = options.origin
    @hungry = options.hungry
    @transition = options.transition
    @response = options.response
    @oldLayer = options.layer
    originalSelector = up.dom.resolveSelector(selector, @origin)
    @parseSteps(originalSelector)

  findOld: =>
    u.each @steps, (step) =>
      step.oldElement = e.get up.dom.first(step.selector, layer: @oldLayer) # TODO: Remove e.get()

  findNew: =>
    u.each @steps, (step) =>
      # The response has no layers. It's always just the page.
      step.newElement = @response.first(step.selector)

  oldExists: =>
    @findOld()
    u.all @steps, (step) -> step.oldElement

  newExists: =>
    @findNew()
    u.all @steps, (step) -> step.newElement

  matchExists: =>
    @oldExists() && @newExists()

  addSteps: (steps) =>
    @steps = @steps.concat(steps)
    
  resolveNesting: =>
    return if @steps.length < 2

    compressed = u.copy(@steps)

    # When two replacements target the same element, we would process
    # the same content twice. We never want that, so we only keep the first step.
    compressed = u.uniqBy(compressed, (step) -> step.oldElement)

    compressed = u.select compressed, (candidateStep, candidateIndex) =>
      u.all compressed, (rivalStep, rivalIndex) =>
        if rivalIndex == candidateIndex
          true
        else
          candidateElement = candidateStep.oldElement
          rivalElement = rivalStep.oldElement
          rivalStep.pseudoClass || !$.contains(rivalElement, candidateElement)

    # If we revealed before, we should reveal now
    compressed[0].reveal = @steps[0].reveal
    @steps = compressed

  selector: =>
    u.map(@steps, 'expression').join(', ')

  parseSteps: (originalSelector) =>
    comma = /\ *,\ */

    @steps = []

    disjunction = originalSelector.split(comma)

    u.each disjunction, (expression, i) =>
      expressionParts = expression.match(/^(.+?)(?:\:(before|after))?$/)
      expressionParts or up.fail('Could not parse selector literal "%s"', expression)
      selector = expressionParts[1]
      if selector == 'html'
        # If someone really asked us to replace the <html> root, the best
        # we can do is replace the <body>.
        selector = 'body'

      pseudoClass = expressionParts[2]

      # When extracting multiple selectors, we only want to reveal the first element.
      # So we set the { reveal } option to false for the next iteration.
      doReveal = if i == 0 then @reveal else false

      @steps.push
        expression: expression
        selector: selector
        pseudoClass: pseudoClass
        transition: @transition
        origin: @origin
        reveal: doReveal

  addHungrySteps: =>
    hungrySteps = []
    if @hungry
      hungries = e.all(up.radio.hungrySelector())
      transition = u.option(up.radio.config.hungryTransition, @transition)
      for hungry in hungries
        selector = u.selectorForElement(hungry)
        if newHungry = @response.first(selector)
          hungrySteps.push
            selector: selector
            oldElement: hungry
            newElement: newHungry
            transition: transition
            reveal: false # we never auto-reveal a hungry element
            origin: null # don't let the hungry element auto-close a non-sticky modal or popup

    @addSteps(hungrySteps)

