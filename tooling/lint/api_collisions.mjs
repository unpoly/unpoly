// A check for src/unpoly.ts. The entry copies every module's `api` onto `window.up`, so when two
// modules contribute the same top-level key, the later one silently replaces the earlier one
// (a second `fragment: { … }` would replace the whole up.fragment namespace). This reads the
// `api` object literal of each module in the entry's `apis` array and reports keys that more than
// one module contributes. It costs no bytes in the bundle.
//
// It is not an Oxlint rule, because it reads other files than the one being linted, which a
// linter that only re-lints changed files can't know. `bin/lint` runs it, and the dev watcher
// runs it with every round (it only parses the modules that changed, in a few milliseconds).
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'acorn'
import esbuild from 'esbuild'
import { SourceMapConsumer } from 'source-map'
import { PROJECT_ROOT } from '../build/build_status.mjs'

export const ENTRY = path.join(PROJECT_ROOT, 'src/unpoly.ts')

const INVALID_API = 'Cannot read the keys of this api. Expected a module whose `export const api` is an object literal without spreads or computed keys.'

export class ApiCollisionCheck {
  #entry
  // Absolute path → { mtimeMs, keys }, so a watcher round only parses the modules that changed.
  #keysCache = new Map()

  constructor(entry = ENTRY) {
    this.#entry = entry
  }

  // Returns a list of problems ({ file, line, column, message }), empty when there are none.
  check() {
    let ast, sourcePosition
    try {
      ({ ast, sourcePosition } = parseModule(this.#entry, fs.readFileSync(this.#entry, 'utf8')))
    } catch (error) {
      // A syntax error in the entry is reported by the build and by Oxlint.
      if (error instanceof SyntaxError) return []
      throw error
    }

    let moduleFiles = new Map()
    let apis = null
    for (let node of ast.body) {
      if (node.type === 'ImportDeclaration') {
        for (let specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            moduleFiles.set(specifier.local.name, path.resolve(path.dirname(this.#entry), node.source.value))
          }
        }
      } else if (node.type === 'VariableDeclaration') {
        apis ??= node.declarations.find((declaration) => declaration.id.name === 'apis')?.init
      }
    }

    let problems = []
    let report = (node, message) => {
      let { line, column } = sourcePosition(node.loc.start)
      problems.push({ file: this.#entry, line, column: column + 1, message })
    }
    if (apis?.type !== 'ArrayExpression') {
      report(ast, 'Cannot find the `apis` array.')
      return problems
    }

    let ownerOfKey = new Map()
    for (let element of apis.elements) {
      let file = element.type === 'MemberExpression' && moduleFiles.get(element.object.name)
      let keys = file ? this.#readApiKeys(file) : 'Cannot find the module of this api. Expected `<namespace import>.api`.'
      if (typeof keys === 'string') {
        report(element, keys)
        continue
      }
      for (let key of keys) {
        let owner = ownerOfKey.get(key)
        if (owner) {
          report(element, `up.${key} is contributed by both ${owner} and ${element.object.name}. The later api would replace the earlier one.`)
        } else {
          ownerOfKey.set(key, element.object.name)
        }
      }
    }
    return problems
  }

  // Returns a Set of keys, or a string that says why the keys can't be read.
  #readApiKeys(file) {
    file = resolveModuleFile(file)
    let mtimeMs
    try {
      mtimeMs = fs.statSync(file).mtimeMs
    } catch (error) {
      return `Cannot read ${path.basename(file)}: ${error.message}`
    }
    let cached = this.#keysCache.get(file)
    if (cached?.mtimeMs !== mtimeMs) {
      cached = { mtimeMs, keys: readApiKeys(file) }
      this.#keysCache.set(file, cached)
    }
    return cached.keys
  }
}

// Formats problems from check() like Oxlint's default output, with paths from the project root.
export function formatProblems(problems) {
  return problems.map(({ file, line, column, message }) => `${path.relative(PROJECT_ROOT, file)}:${line}:${column}: error unpoly(api-collisions): ${message}`).join('\n')
}

// Imports name a module with a `.js` extension, also when the module is written in TypeScript
// (TypeScript maps `./x.js` to `./x.ts`).
function resolveModuleFile(file) {
  if (!fs.existsSync(file) && file.endsWith('.js')) {
    let tsFile = file.replace(/\.js$/, '.ts')
    if (fs.existsSync(tsFile)) return tsFile
  }
  return file
}

function readApiKeys(file) {
  let ast
  try {
    ({ ast } = parseModule(file, fs.readFileSync(file, 'utf8')))
  } catch (error) {
    return `Cannot parse ${path.basename(file)}: ${error.message}`
  }

  for (let statement of ast.body) {
    let declarations = statement.type === 'ExportNamedDeclaration' && statement.declaration?.declarations
    let api = declarations && declarations.find((declaration) => declaration.id.name === 'api')
    if (!api) continue
    if (api.init?.type !== 'ObjectExpression') return INVALID_API
    // A Set, because a getter and a setter (`up.context`) are two properties with one key.
    let keys = new Set()
    for (let property of api.init.properties) {
      if (property.type !== 'Property' || property.computed) return INVALID_API
      keys.add(property.key.name ?? String(property.key.value))
    }
    return keys
  }
  return INVALID_API
}

function parseModule(file, code) {
  // namespace.js.erb embeds Ruby, but only inside string literals.
  code = code.replace(/<%[\s\S]*?%>/g, '')
  // esbuild strips the types (and `as`/`satisfies` around the api). It also drops comments and
  // blank lines, so we map positions back through its source map.
  let map = null
  if (file.endsWith('.ts')) {
    let result = esbuild.transformSync(code, { loader: 'ts', sourcemap: 'external' })
    code = result.code
    map = new SourceMapConsumer(result.map)
  }
  let ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true })
  // `{ line, column }` as acorn counts them (1-based lines, 0-based columns), in the file as written.
  let sourcePosition = (position) => {
    let original = map?.originalPositionFor(position)
    return original?.line ? { line: original.line, column: original.column } : position
  }
  return { ast, sourcePosition }
}
