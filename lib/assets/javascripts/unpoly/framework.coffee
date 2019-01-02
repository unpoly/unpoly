###**
@class up.framework
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
  @experimental
  ###
  emitReset = ->
    up.emit('up:framework:reset', log: 'Resetting framework')

  ###**
  This event is [emitted](/up.emit) when Unpoly is [reset](/up.framework.reset) during unit tests.

  @event up:framework:reset
  @experimental
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
      up.emit('up:framework:boot', log: 'Booting framework')
      up.emit('up:framework:booted', log: 'Framework booted')
      isBooting = false

      u.nextFrame ->
        # At this point all user-provided compilers have been registered.
        u.whenReady().then ->
          # The following event will cause Unpoly to compile the <body>
          up.emit('up:app:boot', log: 'Booting user application')
          up.emit('up:app:booted', log: 'User application booted')
    else
      console.log?("Unpoly doesn't support this browser. Framework was not booted.")

  ###**
  This event is [emitted](/up.emit) when Unpoly [starts to boot](/up.framework.boot).

  @event up:framework:boot
  @internal
  ###

  reset: emitReset
  boot: boot
  isBooting: -> isBooting
