const u = up.util
const $ = jQuery

window.describeFallback = function(capabilities, examples) {
  capabilities = u.wrapList(capabilities)
  describe(`(in a browser without ${capabilities.join(', ')})`, function() {
    beforeEach(function() {
      u.each(capabilities, (c) => up.browser[c].mock().and.returnValue(false))
    })
    return examples()
  })
}
