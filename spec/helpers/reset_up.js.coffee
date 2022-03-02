u = up.util
$ = jQuery

message = 'Resetting framework for next test'

logResetting = ->
  if up.browser.canFormatLog()
    console.debug("%c#{message}%c", 'color: #2244aa', '')
  else
    console.debug("[#{message}]")

afterEach (done) ->
  # If the spec has installed the Jasmine clock, uninstall it so
  # the timeout below will actually happen.
  jasmine.clock().uninstall()

  # Abort all requests so any cancel handlers can run and do async things.
  up.network.abort(reason: message)

  # Most pending promises will wait for an animation to finish.
  whenMotionsDone = up.motion.finish()

  u.always whenMotionsDone, ->

    # Wait one more frame so pending callbacks have a chance to run.
    # Pending callbacks might change the URL or cause errors that bleed into
    # the next example.
    up.util.task =>
      logResetting()

      up.framework.reset()

      up.browser.popCookie(up.protocol.config.methodCookie)

      # Give async reset behavior another frame to play out,
      # then start the next example.
      up.util.task ->
        overlays = document.querySelectorAll('up-modal, up-popup, up-cover, up-drawer')
        if overlays.length > 0
          console.error("Overlays survived reset!", overlays)

        if document.querySelector('up-progress-bar')
          console.error('Progress bar survived reset!')

        up.puts("Framework was reset")
        done()
