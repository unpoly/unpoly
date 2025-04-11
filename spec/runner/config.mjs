function parseBoolean(str, defaultValue = undefined) {
  if (str === 'true' || str === '1') {
    return true
  } else if (str === 'false' || str === '0') {
    return false
  } else {
    return defaultValue
  }
}

function parseString(str, defaultValue = undefined) {
  return str ?? defaultValue
}

function parseEnumString(str, knownValues, defaultValue = undefined) {
  if (knownValues.includes(str)) {
    return str
  } else {
    return defaultValue
  }
}

const PARSERS = {
  // The title of an example or example group to focus on
  'spec': (value) => parseString(value, ''),
  // Whether to deliver the test runner with a strict script-src CSP.
  'csp': (value) => parseEnumString(value, ['none', 'nonce', 'strict-dynamic'], 'none'),
  // Whether we use minified sources.
  'minify': (value) => parseBoolean(value, false),
  // Whether we use the ES6 build for legacy browsers.
  'es6': (value) => parseBoolean(value, false),
  // Whether scripts run in random order.
  'random': (value) => parseBoolean(value, false),
  // Whether we load unpoly-migrate.js.
  'migrate': (value) => parseBoolean(value, false),
  // Whether the runner is called from a terminal. This activates extra logging to communicate with Puppeteer.
  'terminal': (value) => parseBoolean(value, false),
  // (Terminal only) Whether the remote-controlled browser is hidden (true) or visible (false)
  'headless': (value) => parseBoolean(value, true),
  // (Terminal only) Which type of browser to remote-control
  'browser' : (value) => parseEnumString(value, ['chrome', 'firefox'], 'chrome'),
  // (Terminal only) Whether the test runner should print out example names as they are running.
  'verbose' : (value) => parseBoolean(value, false),
}

export class Config {

  constructor(object) {
    this._object = object // for serialization
    Object.assign(this, object) // for direct access
  }

  toJSON() {
    return JSON.stringify(this._object)
  }

  toQueryString() {
    let defaults = this.constructor.fromObject({})

    let objectWithoutDefaults = Object.fromEntries(
      Object.entries(this._object).filter(([key, val]) => val !== defaults[key])
    )

    return new URLSearchParams(objectWithoutDefaults).toString()
  }

  toCSPHeader() {
    switch (this.csp) {
      case 'none': {
        return undefined
      }
      case 'nonce-only': {
        return [
          "default-src 'self'",
          "script-src 'nonce-specs-nonce'",
          "style-src-elem 'self' 'nonce-specs-nonce'",
          "style-src-attr 'unsafe-inline'",
          "img-src 'self' 'nonce-specs-nonce' data:",
        ].join('; ')
      }
      case 'strict-dynamic': {
        return [
          "default-src 'self'",
          "script-src 'nonce-specs-nonce' 'strict-dynamic'",
          "style-src-elem 'self' 'nonce-specs-nonce'",
          "style-src-attr 'unsafe-inline'",
          "img-src 'self' 'nonce-specs-nonce' data:",
        ].join('; ')
      }
      default: {
        throw new Error('Unknown csp config: ' + this.csp)
      }
    }
  }

  static fromObject(object, overrides = {}) {
    let obj = {}
    for (let key in PARSERS) {
      let parse = PARSERS[key]
      let value = object[key]
      obj[key] = parse(value)
    }
    return new this({ ...obj, ...overrides })
  }

  static fromExpressQuery(query, overrides = {}) {
    return this.fromObject(query, overrides)
  }

  static fromProcessEnv(env, overrides = {}) {
    let obj = {}
    for (let key in PARSERS) {
      let parse = PARSERS[key]
      let value = env[key.toUpperCase()]
      obj[key] = parse(value)
    }
    return new this({ ...obj, ...overrides })
  }

}
