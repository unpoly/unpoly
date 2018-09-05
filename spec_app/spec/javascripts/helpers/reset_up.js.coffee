afterEach (done) ->
  # If the spec has installed the Jasmine clock, uninstall it so
  # the timeout below will actually happen.
  jasmine.clock().uninstall()

  # Wait one more frame so pending callbacks have a chance to run.
  # Pending callbacks might change the URL or cause errors that bleed into
  # the next example.

  up.util.nextFrame =>
    up.reset()
    up.cookies.remove(up.protocol.config.methodCookie)

    # Give async reset behavior another frame to play out,
    # then start the next example.
    up.util.nextFrame ->
      $('.up-toast').remove()
      done()
