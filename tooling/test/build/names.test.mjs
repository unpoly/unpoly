import { test } from 'node:test'
import assert from 'node:assert/strict'
import esbuild from 'esbuild'
import { SourceMapConsumer } from 'source-map'
import { dropNeedlessNames } from '../../build/names.mjs'

// Bundles `source` the way the build does (keepNames on), then trims its names.
async function build(source, { target = 'es2024', sourcemap = false } = {}) {
  let result = await esbuild.build({
    stdin: { contents: source, sourcefile: 'input.js', loader: 'js' },
    bundle: true,
    format: 'iife',
    target,
    keepNames: true,
    sourcemap: sourcemap ? 'external' : false,
    outfile: 'out.js',
    write: false,
  })
  let js = result.outputFiles.find((file) => file.path.endsWith('.js')).text
  let map = result.outputFiles.find((file) => file.path.endsWith('.map'))?.text ?? null
  return { esbuilt: js, ...dropNeedlessNames(js, map) }
}

// Runs a bundle and returns what it put on `window.result`.
function run(js, window = {}) {
  new Function('window', js)(window)
  return window.result
}

const calls = (js) => js.match(/__name\(/g)?.length ?? 0

test('function names go', async () => {
  let { js } = await build(`
    function declared() {}
    const expressed = function() {}
    const arrow = () => {}
    window.result = [declared, expressed, arrow]
  `)
  assert.equal(calls(js), 0)
  assert.equal(run(js).length, 3)
})

test('a class keeps its name, without a call, when esbuild made it anonymous', async () => {
  // esbuild prints `class Foo {}` as `var Foo = class { static { __name(this, "Foo") } }`.
  let { esbuilt, js } = await build(`
    class Foo { static bar = 1 }
    window.result = Foo
  `)
  assert.match(esbuilt, /= class \{/)
  assert.match(js, /class Foo \{/)
  assert.equal(calls(js), 0)
  assert.equal(run(js).name, 'Foo')
})

test('a class keeps its name, without a call, when lowered for ES2015', async () => {
  // esbuild prints (_a = class { … }, __name(_a, "Foo"), _a.bar = 1, _a).
  let { esbuilt, js } = await build(`
    window.result = class Foo { static bar = 1 }
  `, { target: 'es2015' })
  assert.match(esbuilt, /__name\(_a, "Foo"\)/)
  assert.equal(calls(js), 0)
  assert.equal(run(js).name, 'Foo')
  assert.equal(run(js).bar, 1)
})

test('an ES2015 class with static members gets its name back, without a call', async () => {
  // esbuild prints var _Foo = class _Foo { … }; __name(_Foo, "Foo"); _Foo.bar = 1; var Foo = _Foo;
  let { esbuilt, js } = await build(`
    class Foo { static bar = 1; me() { return Foo.bar } }
    window.result = Foo
  `, { target: 'es2015' })
  assert.match(esbuilt, /class _Foo /)
  assert.equal(calls(js), 0)
  assert.equal(run(js).name, 'Foo')
  assert.equal(new (run(js))().me(), 1)
})

test('a class that esbuild renamed gets its name back when it does not mention it', async () => {
  // esbuild renames the class because `Error` would shadow the global the bundle uses elsewhere.
  let { esbuilt, js } = await build(`
    const MyError = class Error extends window.Error {}
    window.result = [MyError, new Error('global')]
  `)
  assert.match(esbuilt, /class Error2 /)
  assert.equal(calls(js), 0)
  let [MyError, globalError] = run(js, { Error })
  assert.equal(MyError.name, 'Error')
  assert.ok(!(globalError instanceof MyError))
})

test('an ES2015 class that uses its name in a static initializer keeps working', async () => {
  let { js } = await build(`
    class Foo { static bar = 1; static baz = Foo.bar + 1 }
    window.result = Foo
  `, { target: 'es2015' })
  assert.equal(run(js).name, 'Foo')
  assert.equal(run(js).baz, 2)
})

test('a class that esbuild renamed, and that refers to itself, gets its name back everywhere', async () => {
  // The name `Error` would shadow the global the bundle uses elsewhere, so esbuild renames the
  // class and its uses inside it. Renaming all of them back keeps `new Error()` meaning the class.
  let { esbuilt, js } = await build(`
    const MyError = class Error extends window.Error { make() { return new Error('x') } }
    window.result = MyError
  `)
  assert.match(esbuilt, /new Error2\(/)
  assert.equal(calls(js), 0)
  let MyError = run(js, { Error })
  assert.equal(MyError.name, 'Error')
  assert.ok(new MyError().make() instanceof MyError)
})

test('a class that refers to itself gets its name back without a call', async () => {
  // esbuild prints `var Foo = class _Foo { static { __name(this, "Foo") } … new _Foo() … }`.
  let { esbuilt, js } = await build(`
    class Foo { static bar = 1; copy() { return new Foo() } }
    window.result = Foo
  `)
  assert.match(esbuilt, /class _Foo /)
  assert.equal(calls(js), 0)
  let Foo = run(js)
  assert.equal(Foo.name, 'Foo')
  assert.ok(new Foo().copy() instanceof Foo)
})

test('a class that refers to itself in a shorthand property keeps its call', () => {
  // Renaming `_Foo` in `{ _Foo }` would change the property's key. esbuild expands the shorthand
  // today (`{ Foo: _Foo }`), so this input is written by hand.
  let source = '(() => { var Foo = class _Foo { static { __name(this, "Foo") } both() { return { _Foo } } } })()'
  let { js, kept } = dropNeedlessNames(source)
  assert.equal(kept, 1)
  assert.equal(js, source)
})

test('an ES2015 class that runs code while being defined gets its uses renamed, not pointed at the variable', async () => {
  // Pointing `_Foo` at the variable would leave it undefined while the static block runs.
  let { js } = dropNeedlessNames([
    '(() => {',
    '  var _Foo = class _Foo { static helper() { return _Foo.x } static { this.y = this.helper() } };',
    '  __name(_Foo, "Foo");',
    '  window.result = _Foo;',
    '})();',
  ].join('\n'))
  assert.equal(calls(js), 0)
  assert.match(js, /class Foo /)
  assert.match(js, /return Foo\s*\.x/)
  let Foo = run(js)
  assert.equal(Foo.name, 'Foo')
})

test('a class is never named arguments or eval', () => {
  let source = '(() => { var a = class { static { __name(this, "arguments") } }; var b = class { static { __name(this, "eval") } } })()'
  let { js, kept } = dropNeedlessNames(source)
  assert.equal(kept, 2)
  assert.equal(js, source)
})

test('an anonymous class that mentions its future name keeps its call', async () => {
  // Inserting the name would bind `Foo` inside the class to the class. Here that happens to be the
  // same thing, but it needn't be, so we don't look closer.
  let { esbuilt, js } = await build(`
    const Foo = class { me() { return Foo } }
    window.result = Foo
  `)
  assert.match(esbuilt, /= class \{/)
  assert.equal(calls(js), 1)
  assert.equal(run(js).name, 'Foo')
})

test('source maps still point at the right code after a name is inserted', async () => {
  let { js, map } = await build([
    'class Foo {',
    '  static bar = 1',
    '  method() { return "probe" }',
    '}',
    'window.result = Foo',
  ].join('\n'), { sourcemap: true })
  let consumer = await new SourceMapConsumer(JSON.parse(map))
  for (let needle of ['"probe"', 'method']) {
    let index = js.indexOf(needle)
    let before = js.slice(0, index)
    let position = consumer.originalPositionFor({ line: before.split('\n').length, column: index - before.lastIndexOf('\n') - 1 })
    assert.equal(position.line, 3, `${needle} maps to line ${position.line}`)
  }
  let classLine = js.split('\n').findIndex((line) => line.includes('class Foo'))
  assert.equal(consumer.originalPositionFor({ line: classLine + 1, column: js.split('\n')[classLine].indexOf('class') }).line, 1)
})
