import { test } from 'node:test'
import assert from 'node:assert/strict'
import { declarations, probeSource, translateError } from '../../docs/api_probe.mjs'

function docFile(...entries) {
  return entries.join('\n\n-----\n\n') + '\n'
}

function probed(text) {
  return declarations(text).map(({ root, keys }) => [root, ...keys].join(' '))
}

// ---- what we probe -----------------------------------------------------------

const PROBES = {
  'a function': ['@function up.fragment.get', 'Up fragment get'],
  'a top-level function': ['@function up.render', 'Up render'],
  'an instance method': ['@function up.Request#abort', 'Up Request prototype abort'],
  'an instance method on the prototype': ['@function up.Request.prototype.abort', 'Up Request prototype abort'],
  'a property': ['@property up.fragment.config', 'Up fragment config'],
  'an instance property': ['@property up.Request#url', 'Up Request prototype url'],
  'a namespace': ['@namespace up.fragment', 'Up fragment'],
  'a class': ['@class up.Request', 'Up Request'],
  'a constructor': ['@constructor up.Request', 'Up Request'],
  'an event': ['@event up:link:follow', 'UpEventMap up:link:follow'],
}

for (let [kind, [declaration, expected]] of Object.entries(PROBES)) {
  test(`probes ${kind}`, () => {
    assert.deepEqual(probed(`# Title\n\nProse.\n\n${declaration}\n@stable\n`), [expected])
  })
}

test('probes the first declaration of an entry, wherever it stands', () => {
  let entry = '# up.a()\n\n@learn-ref foo\n@param {string} x\n\n@function up.a\n@param {string} x\n@stable'
  assert.deepEqual(declarations(entry), [{ kind: 'function', name: 'up.a', root: 'Up', keys: ['a'], line: 6, column: 11 }])
})

test('names the line of the declaration in the doc file', () => {
  let text = docFile('# up.a()\n\n@function up.a\n@stable', '# up.b\n\nProse.\n\n@property up.b\n@stable')
  assert.deepEqual(declarations(text).map(({ line, column }) => [line, column]), [[3, 11], [12, 11]])
})

// ---- what we skip ------------------------------------------------------------

test('skips internal entries', () => {
  assert.deepEqual(probed('# up.a()\n\n@function up.a\n@internal\n'), [])
})

test('skips what has no type', () => {
  assert.deepEqual(probed(docFile(
    '# [up-follow]\n\n@selector [up-follow]\n@stable',
    '# X-Up-Target\n\n@header X-Up-Target\n@stable',
    '# _up_method\n\n@cookie _up_method\n@stable',
    '# install\n\n@page install',
    '# up.render/targeting\n\n@partial up.render/targeting',
  )), [])
})

test('skips names outside window.up', () => {
  assert.deepEqual(probed('# List\n\n@class List\n@stable\n'), [])
})

test('ignores directives in code blocks', () => {
  assert.deepEqual(probed('# up.a()\n\n```\n@internal\n@function up.b\n```\n\n@function up.a\n@stable\n'), ['Up a'])
})

// ---- the probe file ----------------------------------------------------------

const REQUEST = { kind: 'property', name: 'up.Request#url', root: 'Up', keys: ['Request', 'prototype', 'url'], file: 'src/unpoly/network/request.md', line: 42, column: 11 }
const RENDER = { kind: 'function', name: 'up.render', root: 'Up', keys: ['render'], file: 'src/unpoly/fragment.md', line: 7, column: 11 }
const REQUEST_CLASS = { kind: 'constructor', name: 'up.Request', root: 'Up', keys: ['Request'], file: 'src/unpoly/network/request.md', line: 3, column: 14 }
const EVENT = { kind: 'event', name: "up:it's", root: 'UpEventMap', keys: ["up:it's"], file: 'src/unpoly/event.md', line: 9, column: 8 }

test('writes one probe per line, after a header', () => {
  let { source, headerLines } = probeSource([REQUEST, RENDER, REQUEST_CLASS, EVENT], '../../src')
  let lines = source.split('\n')
  assert.equal(lines[1], "import type { Up } from '../../src/unpoly.js'")
  assert.deepEqual(lines.slice(headerLines), [
    "type P1 = Up['Request']['prototype']['url'] // src/unpoly/network/request.md:42",
    "type P2 = Parameters<Up['render']> // src/unpoly/fragment.md:7",
    "type P3 = ConstructorParameters<Up['Request']> // src/unpoly/network/request.md:3",
    "type P4 = UpEventMap['up:it\\'s'] // src/unpoly/event.md:9",
    '',
  ])
})

// ---- translating errors ------------------------------------------------------

function translate(line, column, rest) {
  let probes = [REQUEST, RENDER, REQUEST_CLASS, EVENT]
  let { headerLines } = probeSource(probes, '../../src')
  return translateError([`tmp/api_probe/core.ts(${headerLines + line},${column}): ${rest}`, '  More.'], probes, headerLines)
}

test('names the key that is missing', () => {
  // `type P1 = Up['Request']['prototype']['url']`: 'url' starts at column 38.
  assert.deepEqual(translate(1, 38, "error TS2339: Property 'url' does not exist on type 'UpRequest'."), [
    "src/unpoly/network/request.md(42,11): error TS2339: Documented as up.Request#url, but `Up['Request']['prototype']` has no `url`.",
  ])
  assert.deepEqual(translate(1, 14, "error TS2339: Property 'Request' does not exist on type 'Up'."), [
    "src/unpoly/network/request.md(42,11): error TS2339: Documented as up.Request#url, but `Up` has no `Request`.",
  ])
  assert.deepEqual(translate(4, 22, "error TS2339: Property 'up:it's' does not exist on type 'UpEventMap'."), [
    "src/unpoly/event.md(9,8): error TS2339: Documented as up:it's, but `UpEventMap` has no `up:it's`.",
  ])
})

test('says when a function or class is not one', () => {
  assert.deepEqual(translate(2, 22, "error TS2344: Type 'number' does not satisfy the constraint '(...args: any) => any'."), [
    "src/unpoly/fragment.md(7,11): error TS2344: Documented as up.render, but `Up['render']` is not a function.",
  ])
  assert.deepEqual(translate(3, 33, "error TS2344: Type 'Foo' does not satisfy the constraint 'abstract new (...args: any) => any'."), [
    "src/unpoly/network/request.md(3,14): error TS2344: Documented as up.Request, but `Up['Request']` is not a class.",
  ])
})

test('passes on any other error, pointed at the doc file', () => {
  assert.deepEqual(translate(1, 11, 'error TS2300: Something else.'), [
    'src/unpoly/network/request.md(42,11): error TS2300: Documented as up.Request#url, but its probe fails: Something else.',
    '  More.',
  ])
})

test('leaves blocks alone that are not about a probe line', () => {
  assert.equal(translate(-1, 1, 'error TS2300: An import.'), undefined)
  assert.equal(translateError(['Some note.'], [REQUEST], 3), undefined)
})
