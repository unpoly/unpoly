import { test } from 'node:test'
import assert from 'node:assert/strict'
import { combinations } from '../../build/boot_bundles.mjs'
import { CONFIGS } from '../../build/bundles.mjs'

test('combinations() loads each unpoly bundle alone, and with each optional bundle of the same minification', () => {
  let bundles = [
    { entry: 'src/unpoly.ts', out: 'unpoly.js', min: false },
    { entry: 'src/unpoly.ts', out: 'unpoly.min.js', min: true },
    { entry: 'src/unpoly-migrate.ts', out: 'unpoly-migrate.js', min: false },
    { entry: 'src/unpoly-migrate.ts', out: 'unpoly-migrate.min.js', min: true },
  ]
  assert.deepEqual(combinations(bundles), [
    ['unpoly.js'],
    ['unpoly.js', 'unpoly-migrate.js'],
    ['unpoly.min.js'],
    ['unpoly.min.js', 'unpoly-migrate.min.js'],
  ])
})

test('combinations() covers every production bundle', () => {
  let loaded = new Set(combinations().flat())
  assert.deepEqual([...loaded].sort(), CONFIGS.production.bundles.map((bundle) => bundle.out).sort())
})
