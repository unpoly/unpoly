u = up.util
$ = jQuery

message = 'Resetting framework for next test'

logResetting = ->
  console.debug("%c#{message}", 'color: #2244aa')

afterEach ->
  # Wait 1 more frame for async errors to (correctly) fail the test.
  await wait()

  # Ignore errors while the framework is being reset.
  await jasmine.spyOnGlobalErrorsAsync (globalErrorSpy) ->
    logResetting()

    # If the spec has installed the Jasmine clock, uninstall it so
    # the timeout below will actually happen.
    jasmine.clock().uninstall()

    # Abort all requests so any cancel handlers can run and do async things.
    up.network.abort(reason: message)

    # Most pending promises will wait for an animation to finish.
    up.motion.finish()

    up.browser.popCookie(up.protocol.config.methodCookie)

    # Wait one more frame so pending callbacks have a chance to run.
    # Pending callbacks might change the URL or cause errors that bleed into
    # the next example.
    await wait()

    up.framework.reset()

    # Give async reset behavior another frame to play out,
    # then start the next example.
    await wait()

    # Make some final checks that we have reset successfully
    overlays = document.querySelectorAll('up-modal, up-popup, up-cover, up-drawer')
    if overlays.length > 0
      throw new Error("Overlays survived reset!")

    if document.querySelector('up-progress-bar')
      throw new Error('Progress bar survived reset!')

    # Scroll to the top
    document.scrollingElement.scrollTop = 0

    up.puts('specs', 'Framework was reset')
