window.describeCapability = (capability, examples) ->
  if up.browser[capability]()
    examples()

window.describeFallback = (capability, examples) ->
  describe "in a browser without #{capability}", ->
    beforeEach ->
      spyOn(up.browser, capability).and.returnValue(false)
    examples()
