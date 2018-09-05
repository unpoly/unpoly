###**
Converts  compiler functions to the new component interface.

@class up.CompilerComponent
###
class up.CompilerComponent

  @buildClass: (compilerFn) ->
    class extends @
      constructor: (@element) ->
        super(@element, compilerFn)

  constructor: (@element, @compilerFn) ->

  compile: (options) ->
    # Compilers still take jQuery collections instead of native DOM elements.
    $element = $(@element)

    args = [$element]

    # Do not retrieve and parse [up-data] unless the compiler function
    # expects a second argument. Note that we must pass data for an argument
    # count of 0, since then the function might take varargs.
    expectedArgCount = @compilerFn.length
    unless expectedArgCount == 1
      args.push(options.data)

    result = @compilerFn.apply(@element, args)
    # If the compiler function returned an object with known actions
    # like #clean() or #value(), these actions are copied to this component.
    if result = @normalizeResult(result)
      u.assign(@, result)

  normalizeResult: (result) ->
    if u.isFunction(result)
      { clean: result }
    else if u.isObject(result) && (result.data || result.clean || result.value)
      result
    else if u.isArray(result) && u.all(result, u.isFunction)
      { clean: u.sequence(result...) }
