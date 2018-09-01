#= require ./record

u = up.util

class up.CompileRun

  constructor: (@$root, @componentClasses, @options = {}) ->
    @root = @$root[0]

  compile: ->
    @$skipSubtrees = $(@options.skip)

    @datas = @options.datas || {}

    # Match elements with argument { data } once before all components
    # and hash them in a Map. Otherwise we would have to check #matches()
    # on all compiled elements for all components.
    @dataByElement = new Map()
    for selector, elementData of @elementDataBySelector
      for element in u.selectInSubtree(@$root, selector)
        # The same element might be targeted with two different selectors
        if existingData = @dataByElement.get(element)
          elementData = u.merge(existingData, elementData)
        @dataByElement.set(element, elementData)

    @results = []

    up.log.group "Compiling fragment %o", @root, =>
      for componentClass in @componentClasses
        @instantiateComponents(componentClass)

    for result in @results
      result.finalize()

  instantiateComponents: (componentClass) ->
    matches = @select(componentClass.selector)
    return unless matches.length

    up.log.group ("Compiling '%s' on %d element(s)" unless componentClass.isSystem), componentClass.selector, matches.length, =>
      batches = if componentClass.batch then [matches] else matches
      # Returns the raw results of our compile run
      for batch in batches
        compileOptions = new up.CompileOptions(batch, fetchData: @dataForElement, fetchValue: @valueForElement)
        # In case the component class has a constructor, we call it with the input.
        component = new componentClass(batch)
        # We don't force components classes to have a constructor that simple stores
        # the given input. So we set it on the instance directly.
        component.input = batch
        component.compile(compileOptions)

        if result = up.CompileResult.consider(batch, component)
          @results.push(result)

        if keepValue = componentClass.keep
          value = if u.isString(keepValue) then keepValue else ''
          $(batch).attr('up-keep', value)

  dataForElement: (element) =>
    serverData = up.syntax.serverData(element)
    optionsData = @dataByElement.get(element)
    u.merge(serverData, optionsData)

  valueForElement: (element) =>
    up.syntax.serverValue(element)

  select: (selector) ->
    if u.isFunction(selector)
      selector = selector()

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
