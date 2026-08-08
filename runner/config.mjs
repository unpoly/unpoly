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
  'csp': (value) => parseEnumString(value, ['none', 'nonce-only', 'strict-dynamic'], 'none'),
  // Whether we use minified sources.
  'minify': (value) => parseBoolean(value, false),
  // Whether we use the ES6 build for legacy browsers.
  'es6': (value) => parseBoolean(value, false),
  // Whether scripts run in random order.
  'random': (value) => parseBoolean(value, false),
  // Whether we load unpoly-migrate.js.
  'migrate': (value) => parseBoolean(value, false),
  // (terminal only) Which type of browser to remote-control
  'browser' : (value) => parseEnumString(value, ['chrome', 'firefox'], 'chrome'),
  // (terminal only) Whether the remote-controlled browser is hidden (true) or visible (false)
  'headless': (value) => parseBoolean(value, true),
  // (terminal only) Whether to print the detailed failure report (browser log +
  // HTML state). Read by the runner only; the browser ignores it.
  'verbose': (value) => parseBoolean(value, false),
}

// Collects the raw (unparsed) string values for known settings from an env-like
// object, reading each as its UPPERCASE name. Shared by fromProcessEnv/fromArgv.
function envToRaw(env) {
  let raw = {}
  for (let key in PARSERS) {
    let value = env[key.toUpperCase()]
    if (value !== undefined) raw[key] = value
  }
  return raw
}

export class Config {

  constructor(object) {
    this._object = object // for serialization
    Object.assign(this, object) // for direct access
  }

  // Note: intentionally not named toJSON() — that hook must return a serializable
  // value, but we return the already-encoded string (injected into runner.ejs).
  toJSONString() {
    return JSON.stringify(this._object)
  }

  // The settings that differ from their defaults, as a plain object (used to build
  // the runner URL — see runner/terminal/urls.mjs).
  toParams() {
    let defaults = this.constructor.fromObject({})
    return Object.fromEntries(
      Object.entries(this._object).filter(([key, val]) => val !== defaults[key])
    )
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

  // Which built files the runner page should load, given es6/minify.
  // (specs are never minified.)
  distFilenames() {
    let es = this.es6 ? '.es6' : ''
    let min = this.minify ? '.min' : ''
    return {
      unpoly: `unpoly${es}${min}.js`,
      specs: `specs${es}.js`,
      migrate: `unpoly-migrate${min}.js`,
      jasmine: `jasmine.js`,
    }
  }

  static fromObject(object, overrides = {}) {
    let obj = {}
    for (let key in PARSERS) {
      obj[key] = PARSERS[key](object[key])
    }
    return new this({ ...obj, ...overrides })
  }

  static fromExpressQuery(query, overrides = {}) {
    return this.fromObject(query, overrides)
  }

  static fromProcessEnv(env, overrides = {}) {
    return this.fromObject(envToRaw(env), overrides)
  }

  // Reads config from CLI args (--key=value, or bare --flag => "true"), falling
  // back to env vars, falling back to defaults. Precedence: CLI > env > default.
  // Unknown --flags throw, to catch typos.
  static fromArgv(argv, env = {}, overrides = {}) {
    let raw = envToRaw(env)
    for (let token of argv) {
      let match = /^--([^=]+)(?:=(.*))?$/.exec(token)
      if (!match) continue
      let key = match[1]
      if (!(key in PARSERS)) {
        throw new Error(`Unknown option: --${key}`)
      }
      raw[key] = match[2] ?? 'true'
    }
    return this.fromObject(raw, overrides)
  }

}
