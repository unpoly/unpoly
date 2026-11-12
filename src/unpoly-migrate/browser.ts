/*-
@namespace up.browser
@internal
*/

declare module '../unpoly.js' {
  interface Up {
    browser: any
  }
}

// Core no longer publishes up.browser, which only held internal functions.
up.browser = {}

up.browser.loadPage = function(...args) {
  up.migrate.deprecated('up.browser.loadPage()', 'up.network.loadPage()')
  return (up.network.loadPage as any)(...args)
}

up.browser.isSupported = function(...args) {
  up.migrate.deprecated('up.browser.isSupported()', 'up.framework.isSupported()')
  return (up.framework.isSupported as any)(...args)
}

