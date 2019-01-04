u = up.util
$ = jQuery

window.describeCapability = (capabilities, examples) ->
  capabilities = u.wrapList(capabilities)
  allSupported = u.every capabilities, (c) ->
    if fn = up.browser[c]
      fn()
    else
      u.fail("Unknown capability: up.browser.#{c}()")
    up.browser[c]()
  if allSupported
    examples()

window.describeFallback = (capabilities, examples) ->
  capabilities = u.wrapList(capabilities)
  describe "(in a browser without #{capabilities.join(', ')})", ->
    beforeEach ->
      u.each capabilities, (c) ->
        spyOn(up.browser, c).and.returnValue(false)
    examples()
