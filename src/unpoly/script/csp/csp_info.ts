import * as u from '../../util.js'

const NONCE_PATTERN = /'nonce-([^']+)'/g

function findNonces(cspPart: string): string[] {
  let matches = cspPart.matchAll(NONCE_PATTERN)
  return u.map(matches, '1')
}

export class CSPInfo {
  declare declaration: string
  declare nonces: string[]

  constructor(declaration = '', nonces: string[] = []) {
    this.declaration = declaration
    this.nonces = nonces
  }

  isStrictDynamic(): boolean {
    return this.declaration.includes("'strict-dynamic'")
  }

  isUnsafeEval(): boolean {
    return this.declaration.includes("'unsafe-eval'")
  }

  static fromHeader(cspHeader: string | null | undefined): CSPInfo {
    let results: Record<string, [declaration: string, nonces: string[]]> = {}

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

  static none(): CSPInfo {
    return new this()
  }

}
