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
      # All event handlers, even up:framework:* should be able to work with
      # the DOM, so wait for the DOM to be ready.
      up.event.onReady ->
        up.emit('up:framework:boot', log: 'Booting framework')
        up.emit('up:framework:booted', log: 'Framework booted')
        isBooting = false

        # All <script>s loaded by the document are executed in sequence.
        # Unpoly is usually loaded before user code, so we will wait for one
        # more frame until user-provided compilers, handlers, etc. have been
        # registered.
        u.task ->
          # At this point all user-provided compilers have been registered.
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
