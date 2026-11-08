// Turns a bundle from bundles.mjs into esbuild options, and finishes esbuild's output: the
// strict-mode directive, Terser, and writing the files to dist/.
//
// esbuild bundles and strips TypeScript. It does not type-check (that's bin/typecheck) and does
// not lint (bin/lint, and the dev watcher, see watch.mjs).

import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import esbuild from 'esbuild'
import { globSync } from 'glob'
import * as sass from 'sass'
import { PROJECT_ROOT } from './build_status.mjs'

export const DIST = path.join(PROJECT_ROOT, 'dist')

// The extensions a bundle can import, and so the ones an edit to which can change dist/. The dev
// runner checks its own list against this one (see build_sync.mjs and its self-test).
export const LOADED_EXTENSIONS = ['.ts', '.js', '.mjs', '.js.erb', '.sass', '.scss', '.css']

export function esbuildOptions(bundle, { sourcemap }) {
  return {
    absWorkingDir: PROJECT_ROOT,
    entryPoints: [bundle.entry],
    outfile: path.join(DIST, bundle.out),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: bundle.target,
    // Lets `import './util.js'` find `util.ts` (esbuild does that on its own) and an
    // extensionless `require('./foo')` find `foo.js.erb`.
    resolveExtensions: LOADED_EXTENSIONS,
    // Never write a separate .LICENSE.txt file. We have no license comments to keep.
    legalComments: 'none',
    sourcemap: sourcemap ? 'external' : false,
    // The root tsconfig.json is for type checking (bin/typecheck). Its options must not change
    // what we emit, so esbuild doesn't read it.
    tsconfigRaw: {
      compilerOptions: {
        // How TypeScript compiled class fields for each target before: [[Define]] semantics
        // (native fields) for the modern bundle, assignments in the constructor for ES2015.
        // esbuild's default would be __publicField() helpers for ES2015.
        useDefineForClassFields: bundle.target !== 'es2015',
      },
    },
    inject: bundle.inject,
    // jasmine-core reads `global`, which webpack 5 used to rewrite to the global object.
    define: { global: 'globalThis' },
    // We write ourselves in finish(), after Terser.
    write: false,
    logLevel: 'silent',
    plugins: [
      erbPlugin(),
      globPlugin(),
      bundle.styles ? sassPlugin() : discardStylesPlugin(),
    ],
  }
}

// Writes esbuild's in-memory output to dist/, after the steps esbuild can't do itself.
// `terser` is a TerserPool. It minifies the .min bundles, and with `strip` removes the comments
// from the others (see stripOptions() in terser.mjs).
export async function finish(bundle, result, { terser, strip }) {
  let jsPath = path.join(DIST, bundle.out)
  let mapPath = `${jsPath}.map`
  let files = new Map(result.outputFiles.map((file) => [file.path, file.text]))
  let js = files.get(jsPath)
  let map = files.get(mapPath) ?? null

  if (bundle.strict) {
    ({ js, map } = insertStrictDirective(js, map))
  }

  let ecma = Number(bundle.target.slice(2))
  if (bundle.min) {
    ({ code: js, map } = await terser.run({ kind: 'minify', ecma, code: js, map, url: path.basename(mapPath) }))
  } else if (strip) {
    ({ code: js, map } = await terser.run({ kind: 'strip', ecma, code: js, map, url: path.basename(mapPath) }))
  }

  files.set(jsPath, js)
  if (map) files.set(mapPath, map)

  if (bundle.min) {
    await minifyStyles(files, bundle.target)
  }

  mkdirSync(DIST, { recursive: true })
  for (let [file, content] of files) {
    writeFileSync(file, content)
  }
}

// esbuild only minifies CSS together with JS, and Terser does our JS. So the stylesheet esbuild
// extracted gets a pass of its own, chaining its source map through to the .sass files.
async function minifyStyles(files, target) {
  for (let [cssPath, css] of files) {
    if (!cssPath.endsWith('.css')) continue
    let mapPath = `${cssPath}.map`
    let map = files.get(mapPath)
    let input = css.replace(/\/\*# sourceMappingURL=.*?\*\/\s*$/, '')
    if (map) input += `\n/*# sourceMappingURL=data:application/json;base64,${Buffer.from(map).toString('base64')} */`
    let result = await esbuild.transform(input, {
      loader: 'css',
      minify: true,
      target,
      sourcemap: map ? 'external' : false,
      sourcefile: path.basename(cssPath),
    })
    let code = result.code
    if (map) {
      code += `/*# sourceMappingURL=${path.basename(mapPath)} */\n`
      files.set(mapPath, result.map)
    }
    files.set(cssPath, code)
  }
}

// esbuild hoists our ES modules into a single function and, since modules are implicitly
// strict, drops their directives. Webpack had kept every module strict, and the remaining
// scripts sloppy. We make the whole bundle strict, which is where the conversion to ES modules
// ends up anyway.
//
// The directive goes *inside* the IIFE: a file-level "use strict" would leak into every script
// concatenated after unpoly.js (as the Rails asset pipeline does). esbuild's `banner` can only
// put it at the top of the file.
export function insertStrictDirective(js, map) {
  const OPENER = '(() => {\n'
  if (!js.startsWith(OPENER)) {
    throw new Error(`Expected the bundle to start with ${JSON.stringify(OPENER)}, but got ${JSON.stringify(js.slice(0, 40))}`)
  }
  js = OPENER + '  "use strict";\n' + js.slice(OPENER.length)
  if (map) {
    // The new line 2 maps to nothing, and every mapping after it moves down by one line.
    let parsed = JSON.parse(map)
    let lines = parsed.mappings.split(';')
    lines.splice(1, 0, '')
    parsed.mappings = lines.join(';')
    map = JSON.stringify(parsed)
  }
  return { js, map }
}

// esbuild calls a plugin's onLoad again on every rebuild. Sass and ERB are slow enough to matter
// in the watcher, so we remember their results until the file, or a file it pulled in, changes.
const loadCache = new Map()

function cachedLoad(file, load) {
  let stamp = (files) => files.map((f) => { try { return statSync(f).mtimeMs } catch { return 0 } }).join()
  let hit = loadCache.get(file)
  if (hit && hit.stamp === stamp([file, ...hit.result.watchFiles])) return hit.result
  let result = load()
  result.watchFiles ??= []
  loadCache.set(file, { stamp: stamp([file, ...result.watchFiles]), result })
  return result
}

// Compiles Sass. esbuild then bundles the CSS into a .css file beside the .js file
// (unpoly.js → unpoly.css), and chains Sass's source map, so the CSS maps to the .sass files.
function sassPlugin() {
  return {
    name: 'sass',
    setup(build) {
      build.onLoad({ filter: /\.s[ac]ss$/ }, (args) => cachedLoad(args.path, () => {
        let result = sass.compile(args.path, {
          sourceMap: true,
          sourceMapIncludeSources: true,
        })
        let map = Buffer.from(JSON.stringify(result.sourceMap)).toString('base64')
        return {
          contents: `${result.css}\n/*# sourceMappingURL=data:application/json;base64,${map} */`,
          loader: 'css',
          watchFiles: result.loadedUrls.map((url) => url.pathname),
        }
      }))
    },
  }
}

// For bundles that leave the stylesheets to another bundle (the es6 bundle shares unpoly.css).
function discardStylesPlugin() {
  return {
    name: 'discard-styles',
    setup(build) {
      build.onLoad({ filter: /\.(css|s[ac]ss)$/ }, () => ({ contents: '', loader: 'js' }))
    },
  }
}

// Renders `.js.erb` files with Ruby's ERB. Only src/unpoly/namespace.js.erb, for the version number.
function erbPlugin() {
  return {
    name: 'erb',
    setup(build) {
      build.onLoad({ filter: /\.js\.erb$/ }, (args) => cachedLoad(args.path, () => ({
        contents: execFileSync('ruby', ['-rerb', '-e', 'print ERB.new(File.read(ARGV[0])).result', args.path], { cwd: PROJECT_ROOT, encoding: 'utf8' }),
        loader: 'js',
        // The template reads package.json.
        watchFiles: [path.join(PROJECT_ROOT, 'package.json')],
      })))
    },
  }
}

// `require('./helpers/**/*.js')` requires every matching file, in alphabetical order. This is how
// spec/specs.js loads its helpers.
function globPlugin() {
  return {
    name: 'glob',
    setup(build) {
      build.onResolve({ filter: /\*/ }, (args) => ({
        path: path.join(args.resolveDir, args.path),
        namespace: 'glob',
        pluginData: { pattern: args.path, resolveDir: args.resolveDir },
      }))
      build.onLoad({ filter: /.*/, namespace: 'glob' }, (args) => {
        let { pattern, resolveDir } = args.pluginData
        let files = globSync(pattern, { cwd: resolveDir, posix: true }).sort()
        return {
          contents: files.map((file) => `require(${JSON.stringify(`./${file}`)})`).join('\n'),
          loader: 'js',
          resolveDir,
          // A new helper file must trigger a rebuild, too.
          watchDirs: [path.join(resolveDir, pattern.split('*')[0])],
        }
      })
    },
  }
}
