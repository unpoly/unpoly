import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { layout } from '../../scratch/helpers/layout.mjs'
import { renderView, view } from '../../scratch/helpers/view.mjs'

test('a fragment is wrapped into a document that loads the build', () => {
  const html = layout('<p>hello</p>', { title: 'scratchy' })
  assert.match(html, /^<!DOCTYPE html>/)
  assert.match(html, /<title>scratchy<\/title>/)
  assert.match(html, /\/dist\/unpoly\.js/)
  assert.match(html, /\/assets\/scratch\.js/)
  assert.match(html, /<p>hello<\/p>/)
})

test('the layout gives <main> for [up-follow] to replace', () => {
  // up.fragment.config.mainTargets includes `main`, which is why the navigation pages
  // need no [up-target] of their own.
  assert.match(layout('<p>hi</p>'), /<main>/)
})

test('markup that is already a document is served untouched', () => {
  // How a page owns its own <head> — an [up-boot=manual] check, a CSP <meta>, a
  // deliberately broken script order — with no second mechanism for saying so.
  const doc = '<!DOCTYPE html>\n<html><head></head><body>mine</body></html>'
  assert.equal(layout(doc), doc)
  assert.equal(layout('  <html>bare</html>'), '  <html>bare</html>')
  assert.equal(layout('<!doctype html><html>lowercase</html>'), '<!doctype html><html>lowercase</html>')
})

test('a view renders with locals, so a page can echo the request', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'unpoly-scratch-'))
  const file = path.join(dir, 'echo.ejs')
  writeFileSync(file, '<p>You said <%= req.query.q %></p>')
  assert.match(renderView(file, { req: { query: { q: 'hello' } } }), /You said hello/)
})

test('view(name) renders that page\'s .ejs', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'unpoly-scratch-'))
  writeFileSync(path.join(dir, 'form.ejs'), '<p>the form</p>')
  writeFileSync(path.join(dir, 'other.ejs'), '<p>other</p>')
  assert.match(view('form', {}, dir), /the form/)
  // Rendering another page's markup is the same call, not a special case.
  assert.match(view('other', {}, dir), /other/)
})

test('a misnamed view says so, rather than raising a bare ENOENT', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'unpoly-scratch-'))
  writeFileSync(path.join(dir, 'form.ejs'), '<p>the form</p>')
  assert.throws(() => view('from', {}, dir), /No such view: .*from\.ejs/)
})

test('a template error names the file and line, not `ejs:1`', () => {
  // Without EJS's `filename` option every template error reads as ejs:1, which is the
  // difference between a fixed typo and a lost afternoon.
  const dir = mkdtempSync(path.join(tmpdir(), 'unpoly-scratch-'))
  const file = path.join(dir, 'broken.ejs')
  writeFileSync(file, '<p>fine</p>\n<p><%= nope.missing %></p>\n')
  assert.throws(() => renderView(file, {}), (error) => {
    assert.match(String(error.message), /broken\.ejs/)
    return true
  })
})
