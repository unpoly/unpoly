import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderOutline } from '../terminal/dom_outline.mjs'

test('renders CSS-selector outline with implied div', () => {
  let tree = [{
    tag: 'div', id: 'fixtures', classes: [], attrs: {}, children: [
      { tag: 'div', id: 'target', classes: [], attrs: { 'data-old': '' }, children: [{ text: 'Targeted text' }] },
      { tag: 'div', id: null, classes: ['child'], attrs: {}, children: [] },
    ],
  }]
  assert.equal(renderOutline(tree), [
    '#fixtures',
    '  #target[data-old]',
    '    Targeted text',
    '  .child',
  ].join('\n'))
})

test('keeps tag with no id/class anchor, and non-div tags', () => {
  let tree = [
    { tag: 'div', id: null, classes: [], attrs: { 'data-key': 'value' }, children: [] },
    { tag: 'up-modal', id: null, classes: [], attrs: {}, children: [] },
  ]
  assert.equal(renderOutline(tree), 'div[data-key="value"]\nup-modal')
})

test('attribute values render CSS-style', () => {
  let tree = [{ tag: 'input', id: null, classes: [], attrs: { type: 'text', name: 'email' }, children: [] }]
  assert.equal(renderOutline(tree), 'input[type="text"][name="email"]')
})
