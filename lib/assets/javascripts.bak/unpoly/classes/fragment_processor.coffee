u = up.util

class up.FragmentProcessor extends up.Record

  keys: -> [
    'fragment'
    'autoMeans'
    'origin'
    'layer'
  ]

  process: (opt) ->
    # Expose this additional method so subclasses can implement default values.
    return @tryProcess(opt)

  tryProcess: (opt) ->
    if u.isArray(opt)
      return u.find(opt, (opt) => @tryProcess(opt))

    if u.isFunction(opt)
      return @tryProcess(opt(@fragment, @attributes()))

    if u.isElement(opt)
      return @processElement()

    if u.isString(opt)
      if opt == 'auto'
        return @tryProcess(@autoMeans)

      if match = opt.match(/^(.+?)-if-(.+?)$/)
        return @resolveCondition(match[2]) && @process(match[1])

    return @processPrimitive(opt)

  resolveCondition: (condition) ->
    if condition == 'main'
      return up.fragment.contains(@fragment, ':main')

  findSelector: (selector) ->
    lookupOpts = { @layer, @origin }
    # Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    if (match = up.fragment.get(@fragment, selector, lookupOpts) || up.fragment.get(selector, lookupOpts))
      return match
    else
      up.warn('up.render()', 'Could not find an element matching "%s"', selector)
      # Return undefined so { focus: 'auto' } will try the next option from { autoMeans }
      return
