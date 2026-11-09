import { Config } from '../util/config.js'

const enabledKey = 'up.log.enabled'
let enabled = false

/**
The settings in `up.log.config` that the blueprint holds, described in the doc comment of `up.log.config`.
The `enabled` setting is an accessor of `LogConfig` instead, since it is kept in the session storage.
*/
export interface LogSettings {
  banner: boolean
  format: boolean
}

export class LogConfig extends Config<LogSettings> {

  constructor() {
    super('up.log.config', (): LogSettings => ({
      banner: true,
      // Console styles are only useful for humans. A browser controlled by automation software
      // (Selenium, Playwright, Puppeteer) usually feeds the log into a test runner or agent.
      format: !navigator.webdriver,
    }))

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
  }

  get enabled(): boolean {
    return enabled
  }

  set enabled(newEnabled: boolean) {
    enabled = newEnabled
    try {
      sessionStorage?.setItem(enabledKey, newEnabled ? '1' : '')
    } catch {
      // If sessionStorage is now available (see above) we only update the local variable `enabled`.
      // This will cause state to be lost on the next reload.
    }
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  LogConfig,
}
