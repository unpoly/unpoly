up.mockable = function(originalFn) {
  if (window.jasmine) {
    let name = originalFn.name
    let obj = { [name]: originalFn }
    let mockableFn = function() {
      return obj[name].apply(this, arguments)
    }
    mockableFn.mock = () => spyOn(obj, name) // eslint-disable-line no-undef
    return mockableFn
  } else {
    return originalFn
  }
}
