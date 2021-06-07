u = up.util

up.migrate.postCompile = (elements, compiler) ->
  # up.compiler() has a legacy { keep } option that will automatically
  # set [up-keep] on the elements it compiles
  if keepValue = compiler.keep
    up.migrate.warn('The { keep: true } option for up.compiler() has been removed. Have the compiler set [up-keep] attribute instead.')
    value = if u.isString(keepValue) then keepValue else ''
    for element in elements
      element.setAttribute('up-keep', value)
