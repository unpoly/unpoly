e = up.element

#class up.TargetSolution extends up.Class
#
#  constructor: (@originalSelector, @element) ->
#
#  within: (parentSolution) ->
#    { element: @element
#      selector: parentSolution.selector + ' ' + @selector
#    }
#
#  @getter 'selector', ->
#    return @improvedSelector ||= up.fragment.improveTarget(@originalSelector, @element)
#
#
class up.TargetSolution extends up.Class

  within: (parentSolution) ->
    return new up.TargetSolution.Final(
      parentSolution.selector + ' ' + @selector,
      @element
    )


class up.TargetSolution.Final extends up.Class

  constructor: (@selector, @element) ->


class up.TargetSolution.Improvable extends up.Class

  constructor: (@originalSelector, @element) ->

  @getter 'selector', ->
    return @improvedSelector ||= up.fragment.improveTarget(@originalSelector, @element)
