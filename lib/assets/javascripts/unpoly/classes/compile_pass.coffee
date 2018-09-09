#= require ./record

u = up.util

# New features here:
# - Array of destructors is deprecated
# - Batch compilers get an array of data
# - Batch compilers cannot return destructors
class up.CompilePass

  constructor: (@$root, @compilers, options = {}) ->
    @root = @$root[0]

    # Exclude all elements that are descendants of the subtrees we want to keep.
    # The exclusion process is very expensive (in one case compiling 100 slements
    # took 1.5s because of this). That's why we only do it if (1) $skipSubtrees
    # was given and (2) there is an [up-keep] element in $root.
    @$skipSubtrees = $(options.skip)
    unless @$skipSubtrees.length && @root.querySelector('[up-keep]')
      @$skipSubtrees = undefined

  compile: ->
    up.log.group "Compiling fragment %o", @root, =>
      for compiler in @compilers
        @runCompiler(compiler)

  runCompiler: (compiler) ->
    $matches = @$select(compiler.selector)
    return unless $matches.length

    up.log.group ("Compiling '%s' on %d element(s)" unless compiler.isSystem), compiler.selector, $matches.length, =>
      if compiler.batch
        @compileBatch(compiler, $matches)
      else
        for match in $matches
          @compileOneElement(compiler, $(match))

      # up.compiler() has a legacy { keep } option that will automatically
      # set [up-keep] on the elements it compiles
      if keepValue = compiler.keep
        value = if u.isString(keepValue) then keepValue else ''
        $matches.attr('up-keep', value)

  compileOneElement: (compiler, $element) ->
    compileArgs = [$element]
    # Do not retrieve and parse [up-data] unless the compiler function
    # expects a second argument. Note that we must pass data for an argument
    # count of 0, since then the function might take varargs.
    unless compiler.length == 1
      data = up.syntax.data($element)
      compileArgs.push(data)

    result = compiler.apply($element[0], compileArgs)

    if destructor = @normalizeDestructor(result)
      up.syntax.destructor($element, destructor)

  compileBatch: (compiler, $elements) ->
    compileArgs = [$elements]
    # Do not retrieve and parse [up-data] unless the compiler function
    # expects a second argument. Note that we must pass data for an argument
    # count of 0, since then the function might take varargs.
    unless compiler.length == 1
      dataList = u.map($elements, up.syntax.data)
      compileArgs.push(dataList)

    result = compiler.apply($elements.get(), compileArgs)

    if @normalizeDestructor(result)
      up.fail('Compilers with { batch: true } cannot return destructors')

  normalizeDestructor: (result) ->
    if u.isFunction(result)
      result
    else if u.isArray(result) && u.all(result, u.isFunction)
      up.warn('up.compiler(): Returning an array of destructor functions is deprecated. Return a single function instead.')
      u.sequence(result...)

  $select: (selector) ->
    if u.isFunction(selector)
      selector = selector()

    $matches = u.selectInSubtree(@$root, selector)

    # Assign @$skipSubtrees to a local variable because jQuery#filter needs `this`.
    if $skipSubtrees = @$skipSubtrees
      $matches = $matches.filter ->
        $match = $(this)
        $match.closest($skipSubtrees).length == 0

    $matches
