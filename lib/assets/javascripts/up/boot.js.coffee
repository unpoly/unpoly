if up.browser.isSupported()
  up.bus.emit('framework:ready')
  $(document).on 'ready', -> up.bus.emit('app:ready')
