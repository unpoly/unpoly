const watch = process.argv.includes('--watch')
// const railsEnv = process.env.RAILS_ENV || 'development'
const optimize = true // true //  railsEnv !== 'development'

const path = require('path')
const fs = require('fs')

const outdir = path.join(__dirname, 'dist-esbuild')
const errorFilePath = path.join(outdir, `esbuild_error.txt`)

function handleError(error) {
  if (error) fs.writeFileSync(errorFilePath, error.toString())
  else if (fs.existsSync(errorFilePath)) fs.truncate(errorFilePath, 0, () => {})
}

const textReplace = require('esbuild-plugin-text-replace')
const { default: importGlob } = require('esbuild-plugin-import-glob')
const { sassPlugin } = require('esbuild-sass-plugin')

// Respect .browserslistrc for CSS
// const autoprefixer = require('autoprefixer')
// const postcss = require('postcss')

// Respect .browserslistrc for JS build target
// const browserslist = require('browserslist')
const target = 'es2021' // require('esbuild-plugin-browserslist').resolveToEsbuildTarget(browserslist(), { printUnknownTargets: false })

const entryPoints = [
  'unpoly.js',
]

/*
if (railsEnv === 'development' || railsEnv === 'test') {
  entryPoints.push('specs.js')
}
*/

require('esbuild')
  .build({
    entryPoints,

    entryNames: '[dir]/[name]-esbuild',
    assetNames: '[dir]/[name]-esbuild',
    chunkNames: '[dir]/[name]-esbuild',

    bundle: true,
    splitting: false,
    format: 'esm',
    outdir,
    absWorkingDir: path.join(__dirname, 'src'),
    color: true,
    // watch: watch && { onRebuild: handleError },
    minify: optimize, // Note: When minifying, CSS sourcemaps may be incorrect. This seems to be a bug in esbuild.
    mangleProps: /^_/,
    sourcemap: true,
    target,
    loader: {
      '.ico': 'copy',
      '.jpg': 'copy',
      '.png': 'copy',
      '.svg': 'copy',
      '.webp': 'copy',
      '.json': 'copy',
      '.woff2': 'file',
      '.ttf': 'file',
    },
    plugins: [
      textReplace({
        include: /jasmine-core\/lib\/jasmine-core\/jasmine\.js$/,
        pattern: [
          ['let jasmineRequire;', 'let jasmineRequire; const global = window;'],
        ],
      }),
      importGlob(),
      sassPlugin({
        cache: true,
        sourceMap: true,
        sourceMapIncludeSources: true,
        quietDeps: true,
        precompile(source, pathname) {
          // Sass can not resolve `url`s pointing to files provided by custom (i.e. not Sass) loaders,
          // like .woff2 files which are provided by esbuild's file loader.
          //
          // The Sass compile would fail unless we reference the full/absolute path to the .woff2 file.
          // Since that path is different per system, we use a precompile hook to rewrite any such `url`
          // inside our Sass files that starts with a dot.
          //
          // While that sounds odd, it is in fact the solution provided by the author of esbuild-sass-plugin.
          // https://github.com/glromeo/esbuild-sass-plugin/issues/48
          //
          // It might at some point be made obsolete by Sass introducing a new API that the plugin can use.
          // https://github.com/glromeo/esbuild-sass-plugin/issues/48#issuecomment-992644817
          return source.replace(
            /(url\(['"]?)(\.\.?\/)([^'"]+['"]?\))/g,
            `$1${path.dirname(pathname)}/$2$3`,
          )
        },
        /* async transform(source) {
          const { css } = await postcss([autoprefixer]).process(source, { from: undefined })
          return css
        }, */
      }),
    ],
  })
  .then((_result) => {
    console.log("result is", _result)
    handleError(null)
  })
  .catch((error) => {
    console.log("error is", error)
    handleError(error)
    process.exit(1)
  })
