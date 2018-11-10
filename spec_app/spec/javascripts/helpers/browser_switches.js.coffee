u = up.util

window.describeCapability = (capabilities, examples) ->
  capabilities = u.wrapCollection(capabilities)
  allSupported = u.all capabilities, (c) ->
    if fn = up.browser[c]
      fn()
    else
      u.fail("Unknown capability: up.browser.#{c}()")
    up.browser[c]()
  if allSupported
    examples()

window.describeFallback = (capability, examples) ->
  capabilities = u.wrapCollection(capabilities)
  describe "(in a browser without #{capabilities.join(', ')})", ->
    beforeEach ->
      u.each capabilities, (c) ->
        spyOn(up.browser, c).and.returnValue(false)
    examples()
