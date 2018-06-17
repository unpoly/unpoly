#= require ./record

u = up.util

class up.CompileRun

  constructor: (@$root, @compilers, @options = {}) ->

  compile: ->
    @$skipSubtrees = $(@options.skip)

    data = @options.data || {}
    @elementDataBySelector = data.elements || {}
    @globalData = u.except(data, 'elements')

    # Match elements with argument { data } once before all compilers
    # and hash them in a Map. Otherwise we would have to check #matches()
    # on all compiled elements for all compilers.
    @elementDataByElement = new Map()
    for selector, elementData of @elementDataBySelector
      for element in u.selectInSubtree(@$root, selector)
        @elementDataByElement.set(element, elementData)

    @resultByElement = new Map()

    up.log.group "Compiling fragment %o", @$root[0], ->
      for compiler in @compilers
        @runCompiler(compiler)

    return @resultByElement

  runCompiler: (compiler) ->
    $matches = @select(compiler.selector)
    return unless $matches.length

    up.log.group ("Compiling '%s' on %d element(s)" unless compiler.isSystem), compiler.selector, $matches.length, =>
      batches = if compiler.batch then [$matches] else $matches
      # Returns the raw results of our compile run
      for batch in batches
        $batch = $(batch)
        callData = @dataForElement($batch[0])
        rawResult = compiler.callback.apply($batch[0], [$batch, callData])
        @mergeResult($batch, rawResult)

  dataForElement: (element) ->
    domData = up.data(element)
    restoredData = @elementDataByElement.get(element)
    u.merge(@globalData, domData, restoredData)

  mergeResult: ($elements, rawResult) ->
    if normalizedResult = @normalizeResult(rawResult)
      for element in $elements
        unless reportedResult = @resultByElement.get(element)
          reportedResult = {}
          @resultByElement.set(element, reportedResult)
        for action, callback of normalizedResult
          reportedResult[action] ||= []
          reportedResult[action].push(callback)

  normalizeResult: (result) ->
    if u.isFunction(result)
      { clean: result }
    else if u.isObject(result) && (result.save || result.clean)
      result
    else if u.isArray(result) && u.all(result, u.isFunction)
      { clean: u.sequence(result...) }
    else
      undefined

  select: (selector) ->
    $matches = u.selectInSubtree(@$root, selector)

    # Exclude all elements that are descendants of the subtrees we want to keep.
    # Te exclusion process is very expensive (in one case compiling 100 slements
    # took 1.5s because of this). That's why we only do it if (1) $skipSubtrees
    # was given and (2) there is an [up-keep] element in $root.
    if @$skipSubtrees.length && @$root.querySelector('[up-keep]')
      $matches = $matches.filter ->
        $match = $(this)
        u.all $skipSubtrees, (skipSubtree) ->
          $match.closest(skipSubtree).length == 0

    $matches
