// An ESLint rule for src/unpoly.ts. The entry copies every module's `api` onto `window.up`,
// so when two modules contribute the same top-level key, the later one silently replaces the
// earlier one (a second `fragment: { … }` would replace the whole up.fragment namespace).
// This rule reads the `api` object literal of each module in the entry's `apis` array and
// reports keys that more than one module contributes. It costs no bytes in the bundle.
// `bin/lint` runs it. The dev watcher only lints changed files, so it lints the entry again
// whenever a module changes (see tooling/build/lint.mjs).
import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@typescript-eslint/typescript-estree'

// Imports name a module with a `.js` extension, also when the module is written in TypeScript
// (TypeScript maps `./x.js` to `./x.ts`).
function resolveModuleFile(file) {
  if (!fs.existsSync(file) && file.endsWith('.js')) {
    let tsFile = file.replace(/\.js$/, '.ts')
    if (fs.existsSync(tsFile)) return tsFile
  }
  return file
}

// Returns a Set of keys, or a string that says why the keys can't be read.
function readApiKeys(file) {
  let code
  try {
    code = fs.readFileSync(resolveModuleFile(file), 'utf8')
  } catch (error) {
    return `Cannot read ${path.basename(file)}: ${error.message}`
  }
  // namespace.js.erb embeds Ruby, but only inside string literals.
  code = code.replace(/<%[\s\S]*?%>/g, '')

  let ast
  try {
    ast = parse(code)
  } catch (error) {
    return `Cannot parse ${path.basename(file)}: ${error.message}`
  }

  let invalid = 'Cannot read the keys of this api. Expected a module whose `export const api` is an object literal without spreads or computed keys.'
  for (let statement of ast.body) {
    let declarations = statement.type === 'ExportNamedDeclaration' && statement.declaration?.declarations
    let api = declarations && declarations.find((declaration) => declaration.id.name === 'api')
    if (!api) continue
    let init = api.init
    // `{ … } as Type` or `{ … } satisfies Type`
    while (init?.type === 'TSAsExpression' || init?.type === 'TSSatisfiesExpression') init = init.expression
    if (init?.type !== 'ObjectExpression') return invalid
    // A Set, because a getter and a setter (`up.context`) are two properties with one key.
    let keys = new Set()
    for (let property of init.properties) {
      if (property.type !== 'Property' || property.computed) return invalid
      keys.add(property.key.name ?? String(property.key.value))
    }
    return keys
  }
  return invalid
}

export const noApiCollisions = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow two modules contributing the same key to window.up' },
    schema: [],
  },
  create(context) {
    let moduleFiles = new Map()

    return {
      ImportDeclaration(node) {
        for (let specifier of node.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            moduleFiles.set(specifier.local.name, path.resolve(path.dirname(context.filename), node.source.value))
          }
        }
      },

      'VariableDeclarator[id.name="apis"] > ArrayExpression'(node) {
        let ownerOfKey = new Map()
        for (let element of node.elements) {
          let file = element.type === 'MemberExpression' && moduleFiles.get(element.object.name)
          let keys = file ? readApiKeys(file) : 'Cannot find the module of this api. Expected `<namespace import>.api`.'
          if (typeof keys === 'string') {
            context.report({ node: element, message: keys })
            continue
          }
          for (let key of keys) {
            let owner = ownerOfKey.get(key)
            if (owner) {
              context.report({ node: element, message: `up.${key} is contributed by both ${owner} and ${element.object.name}. The later api would replace the earlier one.` })
            } else {
              ownerOfKey.set(key, element.object.name)
            }
          }
        }
      },
    }
  },
}
