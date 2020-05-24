u = up.util

window.fixtureLayers = (stackPlans) ->

  if u.isNumber(stackPlans)
    count = stackPlans
    stackPlans = u.map [1..count], -> {}

  stackPlans.forEach (stackPlan, i) ->
    stackPlan.target ||= '.element'
    if !stackPlan.content && !stackPlan.html && !stackPlan.url
      stackPlan.content = "text #{i}"

  [rootPlan, overlayPlans...] = stackPlans

  fixture(rootPlan.target, u.omit(rootPlan, ['target']))

  promise = Promise.resolve()

  overlayPlans.forEach (overlayPlan) ->
    promise = promise.then ->
      openOpts = u.merge(overlayPlan, openAnimation: false, closeAnimation: false)
      up.layer.open(openOpts)

  return promise
