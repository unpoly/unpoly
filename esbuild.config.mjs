import esbuild from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import { minify as terserMinify } from 'terser'
import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
const DIST = path.resolve(__dirname, 'dist')
const mode = process.argv[2] || 'development'

// ─── Terser options ─────────────────────────────────────────────────────────

// Unpoly's documentation is embedded in source comments and would bloat the output.
// Even in non-minified builds, we strip all comments to reduce file size.
const TERSER_STRIP_COMMENTS = {
  compress: false,
  mangle: false,
  format: { comments: false },
}

// Full minification with the same Terser options previously used via webpack/TerserPlugin.
// https://github.com/terser/terser#compress-options
const TERSER_FULL_MINIFY = {
  compress: {
    passes: 3,
    ecma: 2021,
    keep_classnames: true,
  },
  mangle: {
    keep_classnames: true,
    properties: {
      regex: /^[_#]/,
    },
  },
}

// ─── esbuild plugins ───────────────────────────────────────────────────────

// Replaces webpack's null-loader: silently discards CSS/Sass imports.
// Used for ES6 builds that share source with the modern build but should not emit CSS.
function discardStylesPlugin() {
  return {
    name: 'discard-styles',
    setup(build) {
      build.onResolve({ filter: /\.(css|sass|scss)$/ }, (args) => ({
        path: args.path,
        namespace: 'discard-styles',
      }))
      build.onLoad({ filter: /.*/, namespace: 'discard-styles' }, () => ({
        contents: '',
        loader: 'js',
      }))
    },
  }
}

// Replaces webpack's require.context() in spec/specs.js.
// Generates explicit requires for all spec helper and test files at build time.
function specEntryPlugin() {
  return {
    name: 'spec-entry',
    setup(build) {
      build.onLoad({ filter: /spec[/\\]specs\.js$/ }, () => {
        const specDir = path.resolve('spec')
        const helpers = globSync('spec/helpers/**/*.js').sort()
        const specs = globSync('spec/unpoly/**/*.js').sort()
        const lines = [
          ...helpers.map((f) => `require('./${path.relative('spec', f)}')`),
          ...specs.map((f) => `require('./${path.relative('spec', f)}')`),
          `require('./specs.sass')`,
        ]
        return { contents: lines.join('\n'), resolveDir: specDir, loader: 'js' }
      })
    },
  }
}

// Post-processes the JS output with Terser after esbuild writes it.
function terserPlugin(terserOpts) {
  return {
    name: 'terser',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length > 0) return
        const outfile = build.initialOptions.outfile
        if (outfile && fs.existsSync(outfile)) {
          const code = fs.readFileSync(outfile, 'utf8')
          const { code: processed } = await terserMinify(code, terserOpts)
          fs.writeFileSync(outfile, processed)
        }
      })
    },
  }
}

// ─── Build helper ───────────────────────────────────────────────────────────

function getBuildOptions({ entry, outfile, target = 'es2021', min = false, styles = true, inject = [], plugins = [] }) {
  const targetValue = target === 'modern' ? 'es2021' : target
  const terserOpts = min ? TERSER_FULL_MINIFY : TERSER_STRIP_COMMENTS

  return {
    entryPoints: [entry],
    outfile: path.join(DIST, outfile),
    bundle: true,
    platform: 'browser',
    target: targetValue,
    define: {
      UNPOLY_VERSION: JSON.stringify(pkg.version),
    },
    legalComments: 'none',
    write: true,
    logLevel: 'warning',
    ...(min ? { minify: true } : {}),
    inject,
    plugins: [
      ...(styles ? [sassPlugin({ filter: /\.s[ac]ss$/ })] : [discardStylesPlugin()]),
      ...plugins,
      terserPlugin(terserOpts),
    ],
  }
}

async function buildBundle(opts) {
  return esbuild.build(getBuildOptions(opts))
}

// ─── Build entries (mirror the webpack/entries.js structure) ─────────────────

function unpoly({ es, min }) {
  const suffix = es === 'es6' ? '.es6' : ''
  const minSuffix = min ? '.min' : ''
  return buildBundle({
    entry: './src/unpoly.js',
    outfile: `unpoly${suffix}${minSuffix}.js`,
    target: es,
    min,
    styles: es !== 'es6',
  })
}

function unpolyMigrate({ min }) {
  return buildBundle({
    entry: './src/unpoly-migrate.js',
    outfile: `unpoly-migrate${min ? '.min' : ''}.js`,
    target: 'es6',
    min,
    styles: false,
  })
}

function unpolyBootstrap({ version, min }) {
  return buildBundle({
    entry: `./src/unpoly-bootstrap${version}.js`,
    outfile: `unpoly-bootstrap${version}${min ? '.min' : ''}.js`,
    target: 'es6',
    min,
    styles: true,
  })
}

function specs({ es }) {
  return buildBundle({
    entry: './spec/specs.js',
    outfile: `specs${es === 'es6' ? '.es6' : ''}.js`,
    target: es,
    min: false,
    styles: es !== 'es6',
    plugins: [specEntryPlugin()],
  })
}

function jasmine() {
  return buildBundle({
    entry: './spec/jasmine.js',
    outfile: 'jasmine.js',
    target: 'es6',
    min: false,
    styles: true,
    inject: [path.resolve(__dirname, 'esbuild/jasmine-shim.mjs')],
  })
}

// ─── Build modes ────────────────────────────────────────────────────────────

async function buildDevelopment() {
  await Promise.all([
    unpoly({ es: 'modern', min: false }),
    unpoly({ es: 'es6', min: false }),
    unpolyMigrate({ min: false }),
    unpolyBootstrap({ version: 3, min: false }),
    unpolyBootstrap({ version: 4, min: false }),
    unpolyBootstrap({ version: 5, min: false }),
    specs({ es: 'modern' }),
    specs({ es: 'es6' }),
    jasmine(),
  ])
}

async function buildCI() {
  await buildDevelopment()
  await Promise.all([
    unpoly({ es: 'modern', min: true }),
    unpolyMigrate({ min: true }),
  ])
}

async function buildProduction() {
  await Promise.all([
    unpoly({ es: 'modern', min: false }),
    unpoly({ es: 'modern', min: true }),
    unpoly({ es: 'es6', min: false }),
    unpoly({ es: 'es6', min: true }),
    unpolyMigrate({ min: false }),
    unpolyMigrate({ min: true }),
    unpolyBootstrap({ version: 3, min: false }),
    unpolyBootstrap({ version: 3, min: true }),
    unpolyBootstrap({ version: 4, min: false }),
    unpolyBootstrap({ version: 4, min: true }),
    unpolyBootstrap({ version: 5, min: false }),
    unpolyBootstrap({ version: 5, min: true }),
  ])
}

async function watchDevelopment() {
  const allOpts = [
    { entry: './src/unpoly.js', outfile: 'unpoly.js', target: 'modern', styles: true },
    { entry: './src/unpoly.js', outfile: 'unpoly.es6.js', target: 'es6', styles: false },
    { entry: './src/unpoly-migrate.js', outfile: 'unpoly-migrate.js', target: 'es6', styles: false },
    { entry: './src/unpoly-bootstrap3.js', outfile: 'unpoly-bootstrap3.js', target: 'es6', styles: true },
    { entry: './src/unpoly-bootstrap4.js', outfile: 'unpoly-bootstrap4.js', target: 'es6', styles: true },
    { entry: './src/unpoly-bootstrap5.js', outfile: 'unpoly-bootstrap5.js', target: 'es6', styles: true },
    { entry: './spec/specs.js', outfile: 'specs.js', target: 'modern', styles: true, plugins: [specEntryPlugin()] },
    { entry: './spec/specs.js', outfile: 'specs.es6.js', target: 'es6', styles: false, plugins: [specEntryPlugin()] },
    { entry: './spec/jasmine.js', outfile: 'jasmine.js', target: 'es6', styles: true, inject: [path.resolve(__dirname, 'esbuild/jasmine-shim.mjs')] },
  ]

  const contexts = await Promise.all(
    allOpts.map((opts) => esbuild.context(getBuildOptions(opts)))
  )
  await Promise.all(contexts.map((ctx) => ctx.watch()))
  console.log('Watching for changes...')
}

// ─── Main ───────────────────────────────────────────────────────────────────

const modes = {
  production: buildProduction,
  development: buildDevelopment,
  ci: buildCI,
  watch: watchDevelopment,
}

const buildFn = modes[mode]
if (!buildFn) {
  console.error(`Unknown mode: ${mode}. Use: ${Object.keys(modes).join(', ')}`)
  process.exit(1)
}

const start = Date.now()
await buildFn()
if (mode !== 'watch') {
  console.log(`Done in ${Date.now() - start}ms`)
}
