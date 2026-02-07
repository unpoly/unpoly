const u = up.util

const NONCE_PATTERN = /'nonce-([^']+)'/g

function findNonces(cspPart) {
  let matches = cspPart.matchAll(NONCE_PATTERN)
  return u.map(matches, '1')
}

up.CSPInfo = class CSPInfo {

  constructor(declaration = '', nonces = []) {
    this.declaration = declaration
    this.nonces = nonces
  }

  isStrictDynamic() {
    return this.declaration.includes("'strict-dynamic'")
  }

  isUnsafeEval() {
    return this.declaration.includes("'unsafe-eval'")
  }

  static fromHeader(cspHeader) {
    let results = {}

    if (cspHeader) {
      let declarations = cspHeader.split(/\s*;\s*/)
      for (let declaration of declarations) {
        let directive = declaration.match(/^(script|default)-src\s/)?.[1]
        if (directive) {
          results[directive] = [declaration, findNonces(declaration)]
        }
      }
    }

    let bestResult = results.script || results.default
    if (bestResult) {
      return new this(...bestResult)
    } else {
      return this.none()
    }
  }

  static none() {
    return new this()
  }

}
