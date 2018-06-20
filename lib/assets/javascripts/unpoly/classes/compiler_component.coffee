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
    $element = $(@element)
    result = @compilerFn.call($element[0], $element, options.data)
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
