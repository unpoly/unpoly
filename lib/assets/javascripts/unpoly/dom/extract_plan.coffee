u = up.util

class up.dom.ExtractPlan

  constructor: (selector, options) ->
    @origin = options.origin
    @selector = up.dom.resolveSelector(selector, options.origin)
    @transition = options.transition || options.animation || 'none'
    @response = options.response
    @oldLayer = options.layer
    @steps = @parseSteps()

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
    if u.isString(@transition)
      transitions = @transition.split(comma)
    else
      transitions = [@transition]

    comma = /\ *,\ */

    disjunction = @selector.split(comma)

    u.map disjunction, (literal, i) ->
      literalParts = literal.match(/^(.+?)(?:\:(before|after))?$/)
      literalParts or up.fail('Could not parse selector literal "%s"', literal)
      selector = literalParts[1]
      if selector == 'html'
        # If someone really asked us to replace the <html> root, the best
        # we can do is replace the <body>.
        selector = 'body'

      pseudoClass = literalParts[2]
      transition = transitions[i] || u.last(transitions)

      selector: selector
      pseudoClass: pseudoClass
      transition: transition
