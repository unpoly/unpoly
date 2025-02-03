const u = up.util
const e = up.element

window.makeLayers = function(stackPlans) {

  if (u.isNumber(stackPlans)) {
    const count = stackPlans
    stackPlans = []
    for (let i = 0; i < count; i++) {
      stackPlans.push({})
    }
  }

  stackPlans.forEach(function(stackPlan, i) {
    if (stackPlan.fragment) {
      // Derive a target that we can use to create the root layer fixture below.
      stackPlan.target ||= up.fragment.toTarget(e.createFromHTML(stackPlan.fragment))
    }

    stackPlan.target ??= '.element'

    if (!stackPlan.content && !stackPlan.fragment && !stackPlan.document && !stackPlan.url) {
      stackPlan.content = `text ${i}`
    }

    if (i === 0) {
      stackPlan.layer = 'root'
    } else {
      stackPlan.layer = 'new'
      stackPlan.openAnimation = false
      stackPlan.closeAnimation = false
    }
  })

  // Make sure the root layer has an element to change
  fixture(stackPlans[0].target)

  stackPlans.forEach(function(stackPlan) {
    up.navigate(stackPlan)
  })

  return up.layer.stack
}
