u = up.util

window.fixtureLayers = (stackPlans) ->
  [rootPlan, overlayPlans...] = stackPlans

  fixture(rootPlan.target, u.omit(rootPlan, ['target']))

  promise = Promise.resolve()

  overlayPlans.forEach (overlayPlan) ->
    promise = promise.then ->
      up.layer.open(overlayPlan)

  return promise
