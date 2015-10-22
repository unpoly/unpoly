if up.browser.isSupported()
  up.bus.emit('up:framework:boot')
  up.bus.emit('up:framework:booted')
