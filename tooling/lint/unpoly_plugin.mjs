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

export default {
  meta: { name: 'unpoly' },
  rules: {
    'declare-class-fields': declareClassFields,
    'no-octal': noOctal,
  },
}
