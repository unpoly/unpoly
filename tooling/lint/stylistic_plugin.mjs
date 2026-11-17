// The four rules we use from @stylistic/eslint-plugin, as a plugin of their own. Oxlint takes
// ~0.1 s longer to load the whole plugin with its ~100 rules, which the dev watcher would pay
// with every round (see tooling/build/lint.mjs). `.oxlintrc.json` loads this under the name
// `@stylistic`, so the rules keep their names. To turn on another @stylistic rule, add it here.
import stylistic from '@stylistic/eslint-plugin'

const RULES = ['arrow-parens', 'object-curly-spacing', 'semi', 'space-before-function-paren']

export default {
  meta: { name: '@stylistic' },
  rules: Object.fromEntries(RULES.map((name) => [name, stylistic.rules[name]])),
}
