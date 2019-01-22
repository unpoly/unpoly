u = up.util
$ = jQuery

afterEach (done) ->
  # If the spec has installed the Jasmine clock, uninstall it so
  # the timeout below will actually happen.
  jasmine.clock().uninstall()

  # Most pending promises will wait for an animation to finish.
  promise = up.motion.finish()

  u.always promise, ->

    # Wait one more frame so pending callbacks have a chance to run.
    # Pending callbacks might change the URL or cause errors that bleed into
    # the next example.
    up.util.task =>
      up.framework.reset()
      up.browser.popCookie(up.protocol.config.methodCookie)

      # Give async reset behavior another frame to play out,
      # then start the next example.
      up.util.task ->
        $('.up-toast').remove()
        done()
