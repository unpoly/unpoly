import * as u from './util.js'
import { newConfig } from './util/config.js'
import { on } from './event.js'
import { mockable } from './mockable.js'

/**
The settings in `up.log.config`, described in its doc comment.
*/
export interface LogConfig {
  enabled: boolean
  banner: boolean
  format: boolean
}

/**
The arguments for a log message: a prefix (usually the event type or function name), a message
with optional substitution marks, and the values for the marks.
@internal
*/
export type LogArgs = [prefix: string, message?: string, ...vars: any[]]

type LogStream = 'log' | 'warn' | 'error'

const enabledKey = 'up.log.enabled'
let enabled = readEnabled()

function readEnabled(): boolean {
  try {
    // All supported browsers have sessionStorage, but the property is `null`
    // in private browsing mode in Safari and the default Android webkit browser.
    // See https://makandracards.com/makandra/32865-sessionstorage-per-window-browser-storage
    return !!sessionStorage?.getItem(enabledKey)
  } catch {
    // Chrome explodes upon access of window.sessionStorage when
    // user blocks third-party cookies and site data and this page is embedded
    // as an <iframe>. See https://bugs.chromium.org/p/chromium/issues/detail?id=357625
    return false
  }
}

export const logConfig = newConfig('up.log.config', (): LogConfig => ({
  // Kept in the session storage, so it survives a reload. A reset keeps it, too.
  get enabled() {
    return enabled
  },
  set enabled(newEnabled) {
    enabled = newEnabled
    try {
      sessionStorage?.setItem(enabledKey, newEnabled ? '1' : '')
    } catch {
      // If sessionStorage is not available (see above) we only update the local variable `enabled`.
      // This will cause state to be lost on the next reload.
    }
  },
  banner: true,
  // Console styles are only useful for humans. A browser controlled by automation software
  // (Selenium, Playwright, Puppeteer) usually feeds the log into a test runner or agent.
  format: !navigator.webdriver,
}))


export const printToStandard = mockable(function printToStandard(...args: LogArgs): void {
  if (logConfig.enabled) {
    printToStream('log', ...args)
  }
})

export const printToWarn = mockable(function printToWarn(...args: LogArgs): void {
  printToStream('warn', ...args)
})

export const printToError = mockable(function printToError(...args: LogArgs): void {
  printToStream('error', ...args)
})

function printToStream(stream: LogStream, prefix: string, message?: string, ...args: any[]): void {
  printToStreamStyled(stream, prefix, '', message, ...args)
}

function printToStreamStyled(stream: LogStream, prefix: string, customStyles: string, message?: string, ...args: any[]): void {
  if (message) {
    if (logConfig.format) {
      console[stream](
        `%c${prefix}%c ${message}`,
        'color: #666666; padding: 1px 3px; border: 1px solid #bbbbbb; border-radius: 2px; font-size: 90%; display: inline-block;' + customStyles,
        '', // reset for message after trace
        ...args
      )
    } else {
      console[stream](`[${prefix}] ${u.sprintf(message, ...args)}`)
    }
  }
}

// With multiple watchers on the same field we only want to print once.
let lastPrintedUserEvent: Event | undefined

export function printUserEvent(event: Event & { originalEvent?: Event }): void {
  if (logConfig.enabled && lastPrintedUserEvent !== event) {
    lastPrintedUserEvent = event
    let originalEvent = event.originalEvent || event
    let color = '#5566cc'
    printToStreamStyled('log', originalEvent.type, `color: white; border-color: ${color}; background-color: ${color}`, 'Interaction on %o', originalEvent.target)
  }
}

function printBanner(): void {
  if (!logConfig.banner) { return }

  // The ASCII art looks broken in code since we need to escape backslashes
  const logo =
    " __ _____  ___  ___  / /_ __\n" +
    `/ // / _ \\/ _ \\/ _ \\/ / // /  ${up.version}\n` +
    "\\___/_//_/ .__/\\___/_/\\_. / \n" +
    "        / /            / /\n\n"

  let text = ""

  if (!up.migrate.loaded) {
    text += "Load unpoly-migrate.js to polyfill deprecated APIs.\n\n"
  }

  if (logConfig.enabled) {
    text += "Call `up.log.disable()` to disable logging for this session."
  } else {
    text += "Call `up.log.enable()` to enable logging for this session."
  }

  const color = 'color: #777777'

  if (logConfig.format) {
    console.log('%c' + logo + '%c' + text, 'font-family: monospace;' + color, color)
  } else {
    console.log(logo + text)
  }
}


export function enable(): void {
  logConfig.enabled = true
}

export function disable(): void {
  logConfig.enabled = false
}

export function install(): void {
  on('up:framework:boot', printBanner)
}

export const api = {
  log: {
    config: logConfig,
    enable,
    disable,
  },
}
