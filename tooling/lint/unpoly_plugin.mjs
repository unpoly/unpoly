// Unpoly's own lint rules, as an Oxlint JS plugin (Oxlint runs ESLint-style rules in JavaScript).
// `.oxlintrc.json` turns them on.

// A class field that only states a type must be `declare`d. Without `declare` the compiled
// class would define the property (as undefined), and only in builds whose target uses define
// semantics for class fields. See docs/contributing/code-style.md.
const declareClassFields = {
  meta: {
    type: 'problem',
    docs: { description: 'Require `declare` on a TypeScript class field without initializer' },
    schema: [],
  },
  create(context) {
    if (!context.filename.endsWith('.ts')) return {}
    return {
      'PropertyDefinition[declare!=true][value=null]'(node) {
        context.report({ node, message: 'Declare a class field without initializer with `declare`, e.g. `declare left: number`.' })
      },
    }
  },
}

// ESLint parsed every file as a module, where a legacy octal literal (`010`) or escape (`'\07'`)
// is a syntax error. Oxlint parses a .js file without import or export (like most specs) as a
// script, which allows both, and has no rule for them. Our build bundles these files as modules,
// though.
const noOctal = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow legacy octal literals and escapes, like in a module' },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'number' && /^0[0-9]/.test(node.raw)) {
          context.report({ node, message: 'Octal literals are not allowed in modules. Use the syntax `0o10`.' })
        } else if (typeof node.value === 'string' && LEGACY_OCTAL_ESCAPE.test(node.raw)) {
          context.report({ node, message: 'Octal escape sequences are not allowed in modules. Use `\\x07` or `\\u0007`.' })
        }
      },
    }
  },
}

// A backslash that is not itself escaped, followed by 1-7, or by 0 and another digit. `\0`
// alone is the null character, and `\8` and `\9` are no-nonoctal-decimal-escape's.
const LEGACY_OCTAL_ESCAPE = /(?<!\\)(?:\\\\)*\\(?:[1-7]|0[0-9])/

// A namespace alias (`import * as u`, `import type * as t`) may only be used to reach a member
// by name: `u.map()` as a value, `u.List<T>` as a type. esbuild then references the member
// directly. Any other use of the alias (passing it, spreading it, `u[key]`, `typeof u`,
// `export { u }`) makes esbuild build the module's namespace object, an object with every
// export of the module (2.4 KB for util). A local binding of the same name (`catch (e)`) would
// make `e.member` mean something else in its scope, so the alias may not be shadowed either.
// Types are erased, so `typeof u` or any use of an `import type` alias costs nothing. We report
// them anyway, so values and types follow the same rule. See docs/contributing/code-organization.md.
const namespaceAliases = {
  meta: {
    type: 'problem',
    docs: { description: 'Only use a namespace import as `alias.member`, and never shadow it' },
    schema: [],
  },
  create(context) {
    return {
      'Program:exit'(program) {
        let { sourceCode } = context
        let aliases = new Map()
        for (let statement of program.body) {
          if (statement.type !== 'ImportDeclaration') continue
          for (let specifier of statement.specifiers) {
            if (specifier.type !== 'ImportNamespaceSpecifier') continue
            aliases.set(specifier.local.name, {
              variable: sourceCode.getDeclaredVariables(specifier)[0],
              typeOnly: statement.importKind === 'type',
            })
          }
        }
        if (!aliases.size) return

        for (let [name, { variable, typeOnly }] of aliases) {
          for (let reference of variable.references) {
            let { identifier } = reference
            if (!isMemberAccess(identifier)) {
              let reason = (typeOnly || isTypePosition(identifier))
                ? 'Types follow the same rule as values.'
                : 'Any other use makes esbuild build an object with every export of the module.'
              context.report({
                node: identifier,
                message: `Only use the namespace import \`${name}\` to access a member by name, like \`${name}.member\`. ${reason}`,
              })
            }
          }
        }

        // A class declaration has a variable in its own scope too, so we report by name node.
        let shadowing = new Set()
        for (let scope of sourceCode.scopeManager.scopes) {
          for (let variable of scope.variables) {
            let alias = aliases.get(variable.name)?.variable
            // A variable without definitions is a global from TypeScript's libs, like `event`,
            // which the import shadows, not the other way round.
            if (alias && alias !== variable && variable.defs.length) shadowing.add(variable.defs[0].name)
          }
        }
        for (let node of shadowing) {
          context.report({ node, message: `\`${node.name}\` shadows the namespace import \`${node.name}\`. Choose another name.` })
        }
      },
    }
  },
}

function isMemberAccess(identifier) {
  let { parent } = identifier
  switch (parent.type) {
    case 'MemberExpression':
      // esbuild builds the namespace object for `u?.map` (but not for `u.map?.()`).
      return parent.object === identifier && !parent.computed && !parent.optional
    case 'TSQualifiedName':
      return parent.left === identifier
    default:
      return false
  }
}

// `typeof u` in a type annotation. (`u.List` is a member access, so it never gets here.)
function isTypePosition(identifier) {
  return identifier.parent.type === 'TSTypeQuery'
}

export default {
  meta: { name: 'unpoly' },
  rules: {
    'declare-class-fields': declareClassFields,
    'namespace-aliases': namespaceAliases,
    'no-octal': noOctal,
  },
}
