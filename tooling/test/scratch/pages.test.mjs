import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { listPages, resolvePage } from '../../scratch/pages.mjs'

// A throwaway pages/ holding exactly `names`.
function pagesDir(names = []) {
  const dir = mkdtempSync(path.join(tmpdir(), 'unpoly-scratch-'))
  for (const name of names) writeFileSync(path.join(dir, name), '')
  return dir
}

test('a lone .ejs is a page', () => {
  const dir = pagesDir(['overlay.ejs'])
  assert.deepEqual(resolvePage('overlay', dir), {
    name: 'overlay', url: '/overlay', handler: null, view: path.join(dir, 'overlay.ejs'),
  })
})

test('a lone .mjs is a page', () => {
  const dir = pagesDir(['redirect.mjs'])
  const page = resolvePage('redirect', dir)
  assert.equal(page.handler, path.join(dir, 'redirect.mjs'))
  assert.equal(page.view, null)
})

test('both files are one page, and the handler is offered alongside its view', () => {
  const dir = pagesDir(['form.mjs', 'form.ejs'])
  const page = resolvePage('form', dir)
  assert.ok(page.handler && page.view, 'both files should be reported')
})

test('an unknown name is not a page', () => {
  assert.equal(resolvePage('nope', pagesDir(['form.ejs'])), null)
})

test('a name is letters, digits and dashes — which is also the traversal guard', () => {
  // Without this, `/../../etc/passwd` reaches existsSync() and then express.
  const dir = pagesDir(['form.ejs'])
  for (const name of ['../form', '../../etc/passwd', 'form.ejs', '', 'a/b', '-leading']) {
    assert.equal(resolvePage(name, dir), null, `${name} must not resolve`)
  }
})

test('the listing is sorted, deduplicated by name, and ignores other files', () => {
  const dir = pagesDir(['form.mjs', 'form.ejs', 'overlay.ejs', 'README.md', 'notes.txt'])
  assert.deepEqual(listPages(dir).map((page) => page.url), ['/form', '/overlay'])
})
