###**
@module up.framework
###

up.framework = do ->

  u = up.util

  isBooting = true

  ###**
  Resets Unpoly to the state when it was booted.
  All custom event handlers, animations, etc. that have been registered
  will be discarded.

  Emits event [`up:framework:reset`](/up:framework:reset).

  @function up.framework.reset
  @internal
  ###
  emitReset = ->
    up.emit('up:framework:reset', log: 'Resetting framework')

  ###**
  This event is [emitted](/up.emit) when Unpoly is [reset](/up.framework.reset) during unit tests.

  @event up:framework:reset
  @internal
  ###

  ###**
  Boots the Unpoly framework.

  **This is called automatically** by including the Unpoly JavaScript files.

  Unpoly will not boot if the current browser is [not supported](/up.browser.isSupported).
  This leaves you with a classic server-side application on legacy browsers.

  @function up.boot
  @internal
  ###
  boot = ->
    if up.browser.isSupported()
      # This is called synchronously after all Unpoly modules have been parsed
      # and executed. User code hasn't been executed yet. Use this moment to
      # tell everyone to snapshot
      up.emit('up:framework:booted', log: 'Framework booted')
      isBooting = false

      # From here on, all event handlers (both Unpoly's and user code) should be able
      # to work with the DOM, so wait for the DOM to be ready.
      up.event.onReady ->
        # By now all non-sync <script> tags have been loaded and called, including
        # those after us. All user-provided compilers, event handlers, etc. have
        # been registered.
        #
        # The following event will cause Unpoly to compile the <body>.
        up.emit('up:app:boot', log: 'Booting user application')
        up.emit('up:app:booted', log: 'User application booted')
    else
      console.log?("Unpoly doesn't support this browser. Framework was not booted.")

  reset: emitReset
  boot: boot
  isBooting: -> isBooting
