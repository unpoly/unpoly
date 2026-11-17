// Every bundle we build, and which of them each `bin/build --config=…` produces.
//
// A bundle is a plain description: an entry file, an output file in dist/, a language target,
// whether Terser minifies it, whether it gets its stylesheet, and whether apps can import it (and
// so get a placeholder declaration file, see DECLARATION in esbuild.mjs).
// tooling/build/esbuild.mjs turns one into esbuild options.

// `modern` is what we ship as unpoly.js. `es6` is the legacy build for old browsers.
const TARGETS = { modern: 'es2024', es6: 'es2015' }

function unpoly({ es, min }) {
  return {
    entry: 'src/unpoly.ts',
    out: `unpoly${es === 'es6' ? '.es6' : ''}${min ? '.min' : ''}.js`,
    target: TARGETS[es],
    min,
    // The es6 bundle shares unpoly.css with the modern bundle.
    styles: es !== 'es6',
    // The namespaces are ES modules and were strict under webpack. esbuild hoists them into one
    // function without a directive, so we put one back (see esbuild.mjs).
    strict: true,
    declaration: true,
  }
}

function unpolyMigrate({ min }) {
  return {
    entry: 'src/unpoly-migrate.ts',
    out: `unpoly-migrate${min ? '.min' : ''}.js`,
    // Always ES2015. I don't want multiple versions of this trivial file.
    target: TARGETS.es6,
    min,
    styles: false,
    declaration: true,
  }
}

function unpolyBootstrap({ version, min }) {
  return {
    entry: `src/unpoly-bootstrap${version}.ts`,
    out: `unpoly-bootstrap${version}${min ? '.min' : ''}.js`,
    // Always ES2015. I don't want multiple versions of this trivial file.
    target: TARGETS.es6,
    min,
    styles: true,
    declaration: true,
  }
}

function specs({ es }) {
  return {
    entry: 'spec/specs.js',
    out: `specs${es === 'es6' ? '.es6' : ''}.js`,
    target: TARGETS[es],
    min: false,
    styles: es !== 'es6',
  }
}

function jasmine() {
  return {
    entry: 'spec/jasmine.js',
    out: 'jasmine.js',
    target: TARGETS.es6,
    min: false,
    styles: true,
    // Replaces webpack's ProvidePlugin: jasmine-html and boot*.js expect these as globals.
    inject: ['tooling/build/jasmine_shim.mjs'],
  }
}

const both = (fn, options) => [fn({ ...options, min: false }), fn({ ...options, min: true })]

// What we publish. Every bundle has a source map and names it in a sourceMappingURL comment.
// Apps load the unminified unpoly.js in development (package.json's "main"), and the map shows
// their developers our TypeScript sources.
const production = [
  ...both(unpoly, { es: 'modern' }),
  ...both(unpoly, { es: 'es6' }),
  ...both(unpolyMigrate),
  ...[3, 4, 5].flatMap((version) => both(unpolyBootstrap, { version })),
]

// What the dev watcher keeps current, and what the spec runner loads.
const development = [
  unpoly({ es: 'modern', min: false }),
  unpoly({ es: 'es6', min: false }),
  unpolyMigrate({ min: false }),
  ...[3, 4, 5].map((version) => unpolyBootstrap({ version, min: false })),
  specs({ es: 'modern' }),
  specs({ es: 'es6' }),
  jasmine(),
]

// Every minified bundle the runner page can ask for, for `bin/specs --minify` to build on demand.
// See distFilenames() in tooling/runner/config.mjs. The dev watcher never builds these.
const minified = [
  unpoly({ es: 'modern', min: true }),
  unpoly({ es: 'es6', min: true }),
  unpolyMigrate({ min: true }),
]

// The CI matrix tests both minified unpoly bundles.
const ci = [
  ...development,
  unpoly({ es: 'modern', min: true }),
  unpoly({ es: 'es6', min: true }),
  unpolyMigrate({ min: true }),
]

export const CONFIGS = {
  production: { bundles: production, sourcemap: () => true },
  development: { bundles: development, sourcemap: () => true },
  ci: { bundles: ci, sourcemap: () => true },
  minified: { bundles: minified, sourcemap: () => true },
}
