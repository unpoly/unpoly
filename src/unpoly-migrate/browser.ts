type RequestOptions = import('../unpoly/network.js').RequestOptions

/**
The type of `up.browser`, whose functions moved to other namespaces.
*/
interface BrowserApi {
  loadPage(options: RequestOptions): void
  isSupported(): boolean
}

declare module '../unpoly.js' {
  interface Up {
    browser: BrowserApi
  }
}

// Core no longer publishes up.browser, which only held internal functions.
// We fill an empty object, since an object literal with both functions would cost more bytes.
up.browser = {} as BrowserApi

up.browser.loadPage = function(...args) {
  up.migrate.deprecated('up.browser.loadPage()', 'up.network.loadPage()')
  return up.network.loadPage(...args)
}

up.browser.isSupported = function(...args) {
  up.migrate.deprecated('up.browser.isSupported()', 'up.framework.isSupported()')
  return up.framework.isSupported(...args)
}
