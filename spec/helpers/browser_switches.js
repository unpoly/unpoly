const u = up.util
const $ = jQuery

window.describeCapability = function(capabilities, examples) {
  capabilities = u.wrapList(capabilities)
  const allSupported = u.every(capabilities, function(c) {
    let fn
    if ((fn = up.browser[c])) {
      fn()
    } else {
      up.fail(`Unknown capability: up.browser.${c}()`)
    }
    return up.browser[c]()
  })
  if (allSupported) {
    return examples()
  }
}

window.describeFallback = function(capabilities, examples) {
  capabilities = u.wrapList(capabilities)
  describe(`(in a browser without ${capabilities.join(', ')})`, function() {
    beforeEach(function() {
      u.each(capabilities, (c) => spyOn(up.browser, c).and.returnValue(false))
    })
    return examples()
  })
}
