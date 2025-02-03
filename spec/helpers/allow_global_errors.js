const u = up.util

window.allowGlobalErrors = () => {
  beforeEach(function() {
    // Even though a crashing listener will not actually crash the event dispatching process,
    // it will still dispatch an ErrorEvent to window.onerror (which is good behavior).
    // However, Jasmine also observes window.onerror and fails the spec, so we need to disable
    // this behavior for this purpose.
    this.oldGlobalErrorHandler = window.onerror
    this.globalErrorHandler = jasmine.createSpy('spy on window.onerror')
    window.onerror = this.globalErrorHandler
  })
}

afterEach(function() {
  if (this.oldGlobalErrorHandler) {
    window.onerror = this.oldGlobalErrorHandler
    this.oldGlobalErrorHandler = undefined
    this.globalErrorHandler = undefined
  }
})
