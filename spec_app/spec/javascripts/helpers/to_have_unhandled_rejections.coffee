UNHANDLED_REJECTIONS = []
# In Firefox promise events are disabled by default.
# We need to enable them in about:config.
window.REJECTION_EVENTS_SUPPORTED = ("onunhandledrejection" in window)

beforeAll ->
  window.addEventListener 'unhandledrejection', (event) ->
    UNHANDLED_REJECTIONS.push(event)

beforeEach ->
  UNHANDLED_REJECTIONS = []

  jasmine.addMatchers
    toHaveUnhandledRejections: (util, customEqualityTesters) ->
      compare: (actual) ->
        # It doesn't really matter what's in actual.
        # A good way to call this is e.g. `expect(window).not.toHaveUnhandledRejections()
        pass: UNHANDLED_REJECTIONS.length > 0
