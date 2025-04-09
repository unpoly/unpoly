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
  'csp':      (value) => parseBoolean(value, false),
  'minify':   (value) => parseBoolean(value, false),
  'es6':      (value) => parseBoolean(value, false),
  'random':   (value) => parseBoolean(value, false),
  'migrate':  (value) => parseBoolean(value, false),
  'terminal': (value) => parseBoolean(value, false),
  'headless': (value) => parseBoolean(value, true),
  'browser' : (value) => parseEnumString(value, ['chrome', 'firefox'], 'chrome'),
  'spec':     (value) => parseString(value, ''),
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
    return new URLSearchParams(this._object).toString()
  }

  static fromExpressQuery(query, overrides = {}) {
    let obj = {}
    for (let key in PARSERS) {
      let parse = PARSERS[key]
      let value = query[key]
      obj[key] = parse(value)
    }
    return new this({ ...obj, ...overrides })
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
