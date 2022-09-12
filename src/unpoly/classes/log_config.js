let enabledKey = 'up.log.enabled'
let enabled = false

try {
  // All supported browsers have sessionStorage, but the property is `null`
  // in private browsing mode in Safari and the default Android webkit browser.
  // See https://makandracards.com/makandra/32865-sessionstorage-per-window-browser-storage
  enabled = !!sessionStorage?.getItem(enabledKey)
} catch {
  // Chrome explodes upon access of window.sessionStorage when
  // user blocks third-party cookies and site data and this page is embedded
  // as an <iframe>. See https://bugs.chromium.org/p/chromium/issues/detail?id=357625
}

up.LogConfig = class LogConfig extends up.Config {

  constructor() {
    super(() => ({
      banner: true,
      format: true,
    }))
  }

  get enabled() {
    return enabled
  }

  set enabled(newEnabled) {
    enabled = newEnabled
    try {
      sessionStorage?.setItem(enabledKey, newEnabled ? '1' : '')
    } catch {
      // If sessionStorage is now available (see above) we only update the local variable `enabled`.
      // This will cause state to be lost on the next reload.
    }
  }

}
