e = up.element

class up.TargetSolution extends up.Class

  constructor: (@originalSelector, @element) ->

  within: (parentSolution) ->
    { element: @element
      selector: parentSolution.selector + ' ' + @selector
    }

  @getter 'selector', ->
    return @improvedSelector ||= up.fragment.improveTarget(@originalSelector, @element)
