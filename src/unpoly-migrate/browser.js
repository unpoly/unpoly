up.browser.loadPage = function(...args) {
  up.migrate.deprecated('up.browser.loadPage', 'up.network.loadPage')
  return up.network.loadPage(...args)
}
