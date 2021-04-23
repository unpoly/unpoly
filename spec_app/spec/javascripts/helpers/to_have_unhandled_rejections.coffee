UNHANDLED_REJECTIONS = []

beforeAll ->
  # IE11 does not support this event.
  window.REJECTION_EVENTS_SUPPORTED = ("onunhandledrejection" of window)

  window.addEventListener 'unhandledrejection', (event) ->
    UNHANDLED_REJECTIONS.push(event)

beforeEach ->
  UNHANDLED_REJECTIONS = []

  jasmine.addMatchers
    toHaveUnhandledRejections: (util, customEqualityTesters) ->
      compare: (actual) ->
        # It doesn't really matter what's in actual.
        # A good way to call this is e.g. `expect(window).not.toHaveUnhandledRejections()`
        pass: UNHANDLED_REJECTIONS.length > 0
