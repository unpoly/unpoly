u = up.util

up.ContextOption = do ->

  # The most complex case we need to handle is:
  #
  # 1. The current layer has a context { parentKey: '...' }.
  # 2. User opens a layer that both inherits and adds:
  #        up.layer.open({ ..., context: { scope: 'inherit', initialKey: '...' }})
  # 3. The server adds yet another object:
  #        Up-Context: {"serverKey": "..."}
  #
  # We now expect a new layer to have context { parentKey, initialKey, serverKey }
  # that is composed like this:
  #
  # 1. Inherit from the parent layer (using Object.create())
  # 2. Assign { initialKey: "..." }
  # 3. Assign { serverKey: "..." }
  buildContextForNewLayer = (parentLayer, option) ->
    option = normalize(option)
    scope = u.pluckKey(option, 'scope')
    if scope == 'share'
      object = parentLayer.context
    else if scope == 'inherit'
      object = Object.create(parentLayer.context)
    else
      object = {}

    u.assign(object, option)

  # We allow the shortcuts { context: 'inherit' } or { context: 'share' }.
  # But since we will need to merge in additional updates it is simpler for us
  # to get them in the form { context: 'share' }.
  normalize = (option) ->
    if option == 'share' || option == 'inherit'
      return { scope: option}
    else
      return option || {}

  merge = (option, newStep) ->
    return u.merge(normalize(option), newStep)

  return {
    buildContextForNewLayer
    merge
  }
