// An ESLint rule for src/unpoly.ts that reports two modules contributing the same key to
// `window.up` (see tooling/lint/api_collisions.mjs). `bin/lint` runs it. The dev watcher only
// lints changed files, so it lints the entry again whenever a module changes (see
// tooling/build/lint.mjs).
import { ApiCollisionCheck } from '../lint/api_collisions.mjs'

// One check per entry, which keeps the keys of every module it read, so linting the entry again
// only parses the modules that changed.
const checks = new Map()

export const noApiCollisions = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow two modules contributing the same key to window.up' },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        let check = checks.get(context.filename)
        if (!check) checks.set(context.filename, check = new ApiCollisionCheck(context.filename))
        for (let { line, column, message } of check.check()) {
          context.report({ loc: { line, column: column - 1 }, message })
        }
      },
    }
  },
}
