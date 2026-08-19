// Wrapping markup into a document. The HTML lives in layout.ejs next door, not in a
// template literal in here, so it stays highlighted and its diffs stay readable.

import path from 'node:path'
import { renderView } from './view.mjs'

const LAYOUT = path.join(path.dirname(import.meta.filename), 'layout.ejs')

// A full document already? Then it is the document, handed back untouched. This is what
// lets a page own its own <head> — an [up-boot=manual] check, a CSP <meta>, a deliberately
// broken script order — without a second mechanism for saying so. Anything a reader would
// predict: you wrote a document, you get your document.
const isDocument = (html) => /^\s*(<!doctype|<html)/i.test(html)

export function layout(body, { title = 'Unpoly scratch' } = {}) {
  if (isDocument(body)) return body
  return renderView(LAYOUT, { body, title })
}
