#= require ./record

u = up.util

class up.Compiler extends up.Record

  fields: ->
    [
      'selector',
      'callback',
      'isSystem',
      'priority',
      'batch',
    ]

  defaults: ->
    priority: 0
    isSystem: false
    keep: false

  compileSubtree: ($root, $skipSubtrees, globalData, elementDataByElement) ->
    $matches = @$matches($root, $skipSubtrees)
    @compileElements($matches)

  $matches: ($root, $skipSubtrees) ->
    $matches = u.selectInSubtree($root, @selector)
    # Exclude all elements that are descendants of the subtrees we want to keep.
    # Te exclusion process is very expensive (in one case compiling 100 slements
    # took 1.5s because of this). That's why we only do it if (1) $skipSubtrees
    # was given and (2) there is an [up-keep] element in $root.
    if $skipSubtrees.length && $root.querySelector('[up-keep]')
      $matches = $matches.filter ->
        $match = $(this)
        u.all $skipSubtrees, (skipSubtree) ->
          $match.closest(skipSubtree).length == 0
    $matches

  ###*
  @function up.Compiler#compileElements
  @return
    An array of unprocessed return values of the compiler callback
  ###
  compileElements: ($matches, globalData, elementDataByElement) ->
    jobs = if @batch then [$matches] else $matches
    # Returns the raw results of our compile run
    u.map jobs, (elements) ->
      $elements = $(elements)
      domDataElement = $elements[0]
      domData = up.data(domDataElement)
      restoredData = elementDataByElement.get(domDataElement) || {}
      callData = u.merge(globalData, domData, restoredData)
      @callback($elements, callData)

#    result = @normalizeResult(result)
#
#    throw "normalizen, saven, etc. muss weiter vorne normalisiert und gemerget werden"
#
#    if result.save
#      $elements.addClass('up-savable')
#    if result.destroy
#      $elements.addClass('up-destructible')
#
#  normalizeResult: (result) ->
#    if u.isFunction(result)
#      { destroy: result }
#    else if u.isArray(result) && u.all(result, u.isFunction)
#      { destroy: u.sequence(result...) }
#    else if u.isObject(result) && (result.save || result.destroy)
#      result
#    else
#      {}
