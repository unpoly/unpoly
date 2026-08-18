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
  // (terminal only) A spec file, optionally `:line`, whose group is turned into a `spec`
  // filter — so you can run what you are looking at without retyping its title.
  'file': (value) => parseString(value, ''),
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
  // Whether Jasmine stops a spec at its first failed expectation (rather than
  // continuing and piling up consequential failures). On by default; a spec
  // helper applies it to Jasmine, so it affects the browser runner too.
  'stopOnFailure': (value) => parseBoolean(value, true),
}

// Collects the raw (unparsed) string values for known settings from an env-like
// object, reading each as its UPPERCASE name. Used by fromArgv, so CLI beats env.
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
  //
  // `<` is escaped because this lands inside a <script> block, where JSON.stringify's
  // quoting is not enough: a ?spec= containing "</script>" would otherwise close the
  // block and let the rest of the query run as markup.
  toJSONString() {
    return JSON.stringify(this._object).replace(/</g, '\\u003c')
  }

  // The settings that change what the *browser* loads or runs, as opposed to how the
  // terminal drives it. These are what a debug link must carry to reproduce a failure.
  toPageParams() {
    const pageKeys = ['csp', 'es6', 'minify', 'migrate', 'random']
    return Object.fromEntries(
      Object.entries(this.toParams()).filter(([key]) => pageKeys.includes(key))
    )
  }

  // The settings that differ from their defaults, as a plain object (used to build
  // the runner URL — see tooling/runner/terminal/urls.mjs).
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

  static fromObject(object) {
    let obj = {}
    for (let key in PARSERS) {
      obj[key] = PARSERS[key](object[key])
    }
    return new this(obj)
  }

  // Reads config from CLI args (--key=value, or bare --flag => "true"), falling
  // back to env vars, falling back to defaults. Precedence: CLI > env > default.
  // Unknown --flags throw, to catch typos.
  static fromArgv(argv, env = {}) {
    let raw = envToRaw(env)
    for (let token of argv) {
      let match = /^--([^=]+)(?:=(.*))?$/.exec(token)
      // A bare word is a mistake, not a filter: `bin/test up.form` silently ran the
      // whole suite, which is the opposite of what anyone typing that intends.
      if (!match) {
        throw new Error(`Unexpected argument: ${token}. Did you mean --spec="${token}"?`)
      }
      // Accept kebab-case flags for camelCase keys (--stop-on-failure -> stopOnFailure).
      let key = match[1].replace(/-([a-z])/g, (_, char) => char.toUpperCase())
      if (!(key in PARSERS)) {
        throw new Error(`Unknown option: --${match[1]}`)
      }
      raw[key] = match[2] ?? 'true'
    }
    return this.fromObject(raw)
  }

}
