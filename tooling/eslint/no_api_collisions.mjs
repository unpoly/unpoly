// An ESLint rule for src/unpoly.js. The entry copies every module's `api` onto `window.up`,
// so when two modules contribute the same top-level key, the later one silently replaces the
// earlier one (a second `fragment: { … }` would replace the whole up.fragment namespace).
// This rule reads the `api` object literal of each module in the entry's `apis` array and
// reports keys that more than one module contributes. It costs no bytes in the bundle.
import fs from 'node:fs'
import path from 'node:path'
import * as acorn from 'acorn'

function readApiKeys(file) {
  // namespace.js.erb embeds Ruby, but only inside string literals.
  let code = fs.readFileSync(file, 'utf8').replace(/<%[\s\S]*?%>/g, '')
  let ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })
  for (let statement of ast.body) {
    let declarations = statement.type === 'ExportNamedDeclaration' && statement.declaration?.declarations
    let api = declarations && declarations.find((declaration) => declaration.id.name === 'api')
    if (!api) continue
    if (api.init?.type !== 'ObjectExpression') return null
    // A Set, because a getter and a setter (`up.context`) are two properties with one key.
    let keys = new Set()
    for (let property of api.init.properties) {
      if (property.type !== 'Property' || property.computed) return null
      keys.add(property.key.name ?? String(property.key.value))
    }
    return keys
  }
  return null
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
          let keys = file && readApiKeys(file)
          if (!keys) {
            context.report({ node: element, message: 'Cannot read the keys of this api. Expected a module whose `export const api` is an object literal without spreads or computed keys.' })
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
