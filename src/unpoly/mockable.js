up.mockable = function(originalFn) {
  let spy
  const mockableFn = function() {
    return (spy || originalFn).apply(null, arguments)
  }
  mockableFn.mock = () => spy = jasmine.createSpy('mockable', originalFn)
  document.addEventListener('up:framework:reset', () => spy = null)
  return mockableFn
}
