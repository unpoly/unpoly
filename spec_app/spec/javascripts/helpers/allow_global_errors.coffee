u = up.util

window.allowGlobalErrors = ->

  beforeEach ->
    # Even though a crashing listener will not actually crash the event dispatching process,
    # it will still dispatch an ErrorEvent to window.onerror (which is good behavior).
    # However, Jasmine also observes window.onerror and fails the spec, so we need to disable
    # this behavior for this purpose.
    @oldGlobalErrorHandler = window.onerror
    @globalErrorHandler = jasmine.createSpy('spy on window.onerror')
    window.onerror = @globalErrorHandler

  afterEach ->
    window.onerror = @oldGlobalErrorHandler
