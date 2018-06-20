#= require ./record

u = up.util

class up.CompileRun

  constructor: (@$root, @componentClasses, @options = {}) ->
    @root = @$root[0]

  compile: ->
    @$skipSubtrees = $(@options.skip)

    data = @options.data || {}
    @elementDataBySelector = data.elements || {}
    @globalData = u.except(data, 'elements')

    # Match elements with argument { data } once before all components
    # and hash them in a Map. Otherwise we would have to check #matches()
    # on all compiled elements for all components.
    @elementDataByElement = new Map()
    for selector, elementData of @elementDataBySelector
      for element in u.selectInSubtree(@$root, selector)
        # The same element might be targeted with two different selectors
        if existingData = @elementDataByElement.get(element)
          elementData = u.merge(existingData, elementData)
        @elementDataByElement.set(element, elementData)

    @results = []

    up.log.group "Compiling fragment %o", @root, =>
      for componentClass in @componentClasses
        @instantiateComponents(componentClass)

    for result in @results
      result.finalize()

  @instantiateComponents: (componentClass) ->
    matches = @select(componentClass.selector)
    return unless matches.length

    up.log.group ("Compiling '%s' on %d element(s)" unless componentClass.isSystem), componentClass.selector, $matches.length, =>
      batches = if componentClass.batch then [matches] else matches
      # Returns the raw results of our compile run
      for batch in batches
        compileOptions = new CompileOptions(element, fetchData: dataForElement, value: up.syntax.value)
        component = new componentClass(batch)
        component.compile(compileOptions)

        if result = up.CompileResult.consider(element, component)
          @results.push(result)

        if compiler.keep
          value = if u.isString(compiler.keep) then compiler.keep else ''
          $batch.attr('up-keep', value)

  dataForElement: (element) =>
    domData = up.syntax.data(element)
    restoredData = @elementDataByElement.get(element)
    u.merge(@globalData, domData, restoredData)

  select: (selector) ->
    $matches = u.selectInSubtree(@$root, selector)

    # Exclude all elements that are descendants of the subtrees we want to keep.
    # Te exclusion process is very expensive (in one case compiling 100 slements
    # took 1.5s because of this). That's why we only do it if (1) $skipSubtrees
    # was given and (2) there is an [up-keep] element in $root.
    if @$skipSubtrees.length && @root.querySelector('[up-keep]')
      $matches = $matches.filter ->
        $match = $(this)
        u.all $skipSubtrees, (skipSubtree) ->
          $match.closest(skipSubtree).length == 0

    $matches.get()
