u = up.util

class up.ExtractPlan

  constructor: (selector, options) ->
    @reveal = options.reveal
    @origin = options.origin
    @selector = up.dom.resolveSelector(selector, @origin)
    @transition = options.transition
    @response = options.response
    @oldLayer = options.layer
    @parseSteps()

  findOld: =>
    u.each @steps, (step) =>
      step.$old = up.dom.first(step.selector, layer: @oldLayer)

  findNew: =>
    u.each @steps, (step) =>
      # The response has no layers. It's always just the page.
      step.$new = @response.first(step.selector)

  oldExists: =>
    @findOld()
    u.all @steps, (step) -> step.$old

  newExists: =>
    @findNew()
    u.all @steps, (step) -> step.$new

  matchExists: =>
    @oldExists() && @newExists()

  ###*
  Example:

      parseSelector('foo, bar:before', transition: 'cross-fade')

      [
        { selector: 'foo', pseudoClass: undefined, transition: 'cross-fade' },
        { selector: 'bar', pseudoClass: 'before', transition: 'cross-fade' }
      ]
  ###
  parseSteps: =>
    comma = /\ *,\ */

    @steps = []

    disjunction = @selector.split(comma)

    u.each disjunction, (literal, i) =>
      literalParts = literal.match(/^(.+?)(?:\:(before|after))?$/)
      literalParts or up.fail('Could not parse selector literal "%s"', literal)
      selector = literalParts[1]
      if selector == 'html'
        # If someone really asked us to replace the <html> root, the best
        # we can do is replace the <body>.
        selector = 'body'

      pseudoClass = literalParts[2]

      # When extracting multiple selectors, we only want to reveal the first element.
      # So we set the { reveal } option to false for the next iteration.
      doReveal = if i == 0 then @reveal else false

      @steps.push
        selector: selector
        pseudoClass: pseudoClass
        transition: @transition
        origin: @origin
        reveal: doReveal
