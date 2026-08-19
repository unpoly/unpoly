// Resolving a URL to the files behind it, and listing what exists. Kept apart from
// server.mjs because it is the part worth unit-testing without HTTP.
//
// One flat directory, deliberately: its listing *is* the index, and every page sits at the
// same depth, so `import { layout } from '../helpers/layout.mjs'` is the identical line in
// all of them. Nesting would make that line depend on where the page lives, which matters
// because most pages are written by copying a neighbour.

import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

export const PAGES_DIR = path.join(path.dirname(import.meta.filename), 'pages')

// Also the guard against `..` and absolute paths reaching the filesystem: a name is
// letters, digits and dashes, and nothing else can name a page.
const NAME = /^[a-z0-9][a-z0-9-]*$/i

// A page is one URL and the up-to-two files behind it: `form.mjs` (an Express handler) and
// `form.ejs` (its markup). Either alone is a page; together, the handler wins and renders
// the view itself.
export function resolvePage(name, dir = PAGES_DIR) {
  if (!NAME.test(name || '')) return null

  const handler = path.join(dir, `${name}.mjs`)
  const view = path.join(dir, `${name}.ejs`)
  const hasHandler = existsSync(handler)
  const hasView = existsSync(view)
  if (!hasHandler && !hasView) return null

  return {
    name,
    url: `/${name}`,
    handler: hasHandler ? handler : null,
    view: hasView ? view : null,
  }
}

export function listPages(dir = PAGES_DIR) {
  const names = new Set()
  for (const entry of readdirSync(dir)) {
    const match = /^(.+)\.(mjs|ejs)$/.exec(entry)
    if (match && NAME.test(match[1])) names.add(match[1])
  }
  return [...names].sort().map((name) => resolvePage(name, dir))
}
