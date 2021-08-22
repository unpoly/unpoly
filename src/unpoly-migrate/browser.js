up.browser.loadPage = function(...args) {
  up.migrate.deprecated('up.browser.loadPage', 'up.network.loadPage')
  return up.network.loadPage(...args)
}

up.browser.isSupported = function(...args) {
  up.migrate.deprecated('up.browser.isSupported', 'up.framework.isSupported')
  return up.framework.isSupported(...args)
}

