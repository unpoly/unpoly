function parseBoolean(str) {
  return str === 'true' || str === '1'
}

function parseString(str) {
  return str || ''
}

const PARSERS = {
  'csp': parseBoolean,
  'minify': parseBoolean,
  'es6': parseBoolean,
  'random': parseBoolean,
  'migrate': parseBoolean,
  'console': parseBoolean,
  'ci': parseBoolean,
  'spec': parseString,
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
