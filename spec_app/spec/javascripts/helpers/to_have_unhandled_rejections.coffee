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

#UnhandledRejectionTracker = do ->
#
#
#
#
#
##beforeEach (done) ->
##  @unhandledRejections = []
##  @trackUnhandledRejections = (event) =>
##    @unhandledRejections.push(event)
##  window.addEventListener('unhandledrejection', @trackUnhandledRejections)
##  done()
##
##afterEach (done) ->
##  hadUnhandledRejections = @unhandledRejections.length > 0
##  @unhandledRejections = []
##  if hadUnhandledRejections
##    done.fail('There were rejected promises without a rejection handler')
##  else
##    done()
