u = up.util
e = up.element

up.migrate.postCompile = (elements, compiler) ->
  # up.compiler() has a legacy { keep } option that will automatically
  # set [up-keep] on the elements it compiles
  if keepValue = compiler.keep
    up.migrate.warn('The { keep: true } option for up.compiler() has been removed. Have the compiler set [up-keep] attribute instead.')
    value = if u.isString(keepValue) then keepValue else ''
    for element in elements
      element.setAttribute('up-keep', value)

up.migrate.targetMacro = (queryAttr, fixedResultAttrs, callback) ->
  up.macro "[#{queryAttr}]", (link) ->
    resultAttrs = u.copy(fixedResultAttrs)
    if optionalTarget = link.getAttribute(queryAttr)
      resultAttrs['up-target'] = optionalTarget
    else
      resultAttrs['up-follow'] = ''
    e.setMissingAttrs(link, resultAttrs)
    link.removeAttribute(queryAttr)
    callback?()
