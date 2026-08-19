// Rendering a page's markup. EJS, because the server already speaks it (tooling/runner
// renders runner.ejs) and because plain HTML cannot echo a request parameter — which is
// most of what a scratch page wants to do.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ejs from 'ejs'
import { PAGES_DIR } from '../pages.mjs'

// Renders one .ejs file. Read per call, never cached: you are editing these.
export function renderView(file, locals = {}) {
  // `filename` is what makes EJS report an error as `pages/form.ejs:12` rather than
  // `ejs:1`, which is the difference between a fixed typo and a lost afternoon.
  return ejs.render(readFileSync(file, 'utf8'), locals, { filename: file })
}

// What a handler page calls: `view('form')` renders `pages/form.ejs`. Naming the page reads
// better than handing over a module URL, and it makes rendering *another* page's markup the
// same call rather than a special case.
export function view(name, locals = {}, dir = PAGES_DIR) {
  const file = path.join(dir, `${name}.ejs`)
  // Named explicitly, because a typo in view('from') would otherwise surface as a bare
  // ENOENT with no hint that a page name was meant.
  if (!existsSync(file)) throw new Error(`No such view: ${path.relative(process.cwd(), file)}`)
  return renderView(file, locals)
}
