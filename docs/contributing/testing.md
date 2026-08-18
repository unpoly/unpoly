# Testing

Unpoly is almost all API surface. Every module publishes HTML attributes, JavaScript
functions, events and configuration, and each of those has to keep behaving across
browsers, CSP modes, slow networks and impatient users. Nobody holds all of that in their
head — not the maintainers, and not an agent reading one file.

That is what the suite is for. Around 4,000 specs run in a real browser on every change, so
you can alter code you do not fully understand and find out immediately whether you broke
something. Treat a green suite as permission to be bold, and a red one as the cheapest
possible bug report.

The corollary: **any change needs a spec.** A behaviour with no spec is a behaviour the next
person will break without noticing.

"Tests", "specs" and "examples" are used interchangeably. Source lives in `src/unpoly/`;
each module `foo.js` has a spec `spec/unpoly/foo_spec.js`.


## Running tests

Unpoly's specs run in a real browser, driven from your terminal:

```
bin/test                             # the whole suite (a few minutes)
bin/test --spec="up.form"            # only specs whose full name contains this
```

`bin/test` needs a running [dev environment](dev-environment.md) and starts one in
the background if none is running.

**Filter while you work.** After editing `src/unpoly/form.js` (or its spec), run
`bin/test --spec="up.form"`. The full suite runs in a real browser and takes
several minutes, so run it unfiltered only as a final gate — and note that
[CI](commit-conventions.md#continuous-integration) runs the full matrix once you open
a pull request. Some modules are used by most others, so a change to `up.fragment`,
`up.network`, `up.script`, `up.layer`, `up.util` or `up.element` can break specs anywhere
and deserves the full suite.

A run with one failing spec looks like this:

```
up.Params F........................................SSS..............SS.......... 64 passed, 1 failed, 5 skipped
up.Request . 1 passed

F1) up.Params → #toQuery → returns the query section for the given object

  Failure/error:
    Expected 'foo-key=foo%20value&bar-key=bar%20value' to equal 'foo-key=foo+value&bar-key=bar+value'.

  Stacktrace:
    spec/unpoly/classes/params_spec.js:35 in anonymous function

  Debug in browser:
    http://localhost:4000/specs?spec=up.Params%20%23toQuery%20returns%20the%20query%20section

65 passed, 1 failed, 5 skipped

Re-run with --verbose for browser logs and HTML state.
```

Stack traces are mapped back to the original source, so the frames point at
`src/unpoly/…` and `spec/unpoly/…` rather than at the bundle.

**How to debug depends on where you are running.** In the terminal runner there is
nothing to attach a debugger to, so inspecting state means logging it: anything you
`console.log` in a spec or in `src/unpoly` shows up in the browser log that `--verbose`
prints (below). But the terminal is not the only option — every failure comes with a
`Debug in browser:` link that opens exactly that spec, and stepping through it in DevTools
is usually the fastest way to understand a failure you can't explain.

**`--verbose` adds the state you would otherwise have to guess at.** Re-running a
failure with the flag keeps everything above and adds the browser log plus an outline of
the DOM as it stood when the spec failed:

```
  Browser log:
    log: field value is "foo@example.com"

  HTML state:
    body
      #fixtures
        form#signup.signup-form[method="post"][action="/action"][up-submit]
          input[type="text"][name="email"][value="foo@example.com"]
          button[type="submit"]
            Sign up
```

The HTML state is a tree of CSS selectors rather than raw markup, which keeps a large
fixture readable: `div` is implied for an element anchored by id or class, attributes
appear in brackets, and text nodes are shown as indented text. That outline is usually
enough to identify the problem without opening a browser — a fixture that was never
compiled, an overlay still on the stack, a fragment inserted in the wrong place, or an
attribute you expected Unpoly to have set.

It is rooted at `body`, so it includes elements attached outside `#fixtures`, and a very
large tree is clipped with a line saying so. `--verbose` also keeps every stack frame,
where the default shows only the topmost frame in a spec file and in `src/`.

**Options:**

| Option | Effect |
|--------|--------|
| `--spec="…"` | Only run specs whose full name contains this string |
| `--file=path[:line]` | Run what a file declares — or, with `:line`, just the group or spec declared on that line |
| `--verbose` | Add the browser log + HTML state (fixtures, overlays) to each failure |
| `--browser=firefox` | Run in Firefox instead of Chrome |
| `--headless=false` | Show the browser window while running |
| `--stop-on-failure=false` | Keep running a spec after its first failed expectation (default: stop) |
| `--csp=none\|nonce-only\|strict-dynamic` · `--es6` · `--migrate` | Serve the specs under a CSP / ES6 / unpoly-migrate variant |

`--minify` runs the specs against the bundle we actually ship. That matters because the
minifier renames every `_`-prefixed member, so a spec that reaches one by name passes
unminified and fails in production — see
[private members](code-style.md#private-members-and-the-minified-build). It needs a
minified build first (`bin/build --config=ci`), and says so if one is missing. CI runs this
variant on every pull request.

A failed spec exits with a non-zero exit code, so `bin/test` composes with other
tooling. The spec runner itself — its exit codes, architecture and self-tests — is
documented in [`tooling/README.md`](../../tooling/README.md).

## If you are an agent

**Give the command a generous timeout.** The full suite takes minutes, and nothing caps
its total runtime. A tool timeout shorter than that kills the run part-way and tells you
nothing about your change.

You don't need to guard against a hang yourself: a run that stops making progress detects
itself and exits non-zero. Set your timeout from how long the suite actually takes.

**Don't pipe the output through `tail` or `head`.** The part you need from a red run is
the failure block, and truncating it means running the whole suite again to see what
broke. If the output is too long to read directly, keep all of it and read the end:

```
bin/test 2>&1 | tee tmp/test.log
```

`tmp/` is gitignored, so a log left there is harmless.


## Why a real browser

Specs always run in a real browser: headless Chrome by default, Firefox with
`--browser=firefox`. There is no jsdom variant, and we don't want one. Unpoly's
behavior depends on details that a DOM emulation doesn't reproduce faithfully — focus
handling, scroll positions, form serialization, event ordering, CSS resolution. A spec
that passes against an emulated DOM would tell us very little.

Chrome is the default because it's the easiest to debug by hand: a failing run prints a
`Debug in browser:` URL that opens the single spec in a real browser window with
DevTools available. See [Compatibility](compatibility.md#browser-support) for which
browsers we support and which ones CI actually exercises.


## How specs are organized

Every module has a spec file at the mirrored path. `src/unpoly/form.js` is tested by
`spec/unpoly/form_spec.js`, and `src/unpoly/classes/params.js` by
`spec/unpoly/classes/params_spec.js`. Where a group of specs grew too large to live
there, it moved into a sibling file that shares the module's prefix — see
[extracted spec files](#extracted-spec-files) below.

Inside a [main module](code-organization.md#responsibilities) spec, the outermost groups
separate the two kinds of API a module exposes:

```js
describe('up.form', function() {

  describe('JavaScript functions', function() {

    describe('up.form.submit()', function() {
      it('...', async function() { ... })
    })

  })

  describe('unobtrusive behavior', function() {

    describe('[up-submit]', function() {
      it('...', async function() { ... })
    })

  })

})
```

Functions are named with parentheses (`up.form.submit()`), selectors in brackets
(`[up-submit]`). A feature with many options often gets one more nesting level, grouped
by topic or by the option under test.

Class specs skip the functions/behavior split — a class has no unobtrusive behavior, so
`params_spec.js` goes straight from `describe('up.Params')` to a group per method.

Nested group names concatenate with spaces to form a spec's *full name*, which is what
`--spec` matches against. So the example above can be narrowed at any depth:

```
bin/test --spec="up.form"                       # the whole module
bin/test --spec="unobtrusive behavior"          # only the attribute specs
bin/test --spec="up.form.submit()"              # one function
```

Full names never change when specs move between files, so a filter is always safe to
copy from a failure and re-run.


### Finding the spec for a feature

**By file name.** Start from the module: `up.form` is tested in `spec/unpoly/form_spec.js`.
If a feature grew large enough to be extracted, it sits in `<module>_<feature>_spec.js`
alongside it — `form_switch_spec.js` for `[up-switch]`, `layer_open_spec.js` for
`up.layer.open()`. Every file for a module shares its prefix, so a listing groups them:

```
$ ls spec/unpoly | grep ^form_
form_spec.js
form_submit_attr_spec.js
form_submit_fn_spec.js
form_switch_spec.js
…
```

Opening the module file also tells you what it gave away, and where that used to sit:

```
grep -n "require('./" spec/unpoly/fragment_spec.js
```

**By title.** When you know what a spec says but not where it lives, `bin/find-spec`
searches every `describe()` and `it()` title — and only titles, so it won't drown you in
spec code that happens to call the feature:

```
$ bin/find-spec "kept element"
spec/unpoly/fragment_keep_spec.js:47  "up.fragment unobtrusive behavior [up-keep] does not run destructors within kept elements"
spec/unpoly/fragment_keep_spec.js:73  "up.fragment unobtrusive behavior [up-keep] does not run destructors within kept elements when the <body> is targeted (bugfix)"
spec/unpoly/fragment_keep_spec.js:143 "up.fragment unobtrusive behavior [up-keep] omits a kept element from the returned up.RenderResult"
…
```

The quoted string *is* the spec's full name, so you can paste it straight into `--spec` —
or any part of it, to widen the filter. Passing a feature name also shows every file it is
spread across, which for a big feature like `up.render()` is more than a dozen.

Or skip the copying: `--file` takes a location and works out the filter itself.

```
bin/test --file=spec/unpoly/classes/params_spec.js        # what that file declares
bin/test --file=spec/unpoly/classes/params_spec.js:29     # just the group on line 29
```

Naming a file runs its outermost group, which is its module — so pointing at an extracted
file runs the module's specs, the same as pointing at the module's own file. Pointing at a
line that declares nothing is an error rather than a silent wider run.


### Where a new spec goes

Put it in the `describe()` group it belongs to. The file follows from the group — you
don't pick a file, and you very rarely create one. If that group happens to live in an
extracted file, add it there; nothing else changes, because the group's full name is the
same either way.

Only extract a group into a new file when it has grown to a size that makes its module
file hard to read — a few dozen KB. That is a rare, deliberate act, not something to do
while adding a spec.


### Extracted spec files

The module file keeps a `require()` at the exact position the group used to occupy, so
reading order survives:

```js
// fragment_render_spec.js
describe('up.render()', function() {

  require('./fragment_render_url_spec')

  describe('with { response } option', function() { ... })
```

The extracted file spells out the path it belongs to with `extendDescribe()`, which
declares no group of its own — it documents the nesting, and the real `describe()` lands
wherever the `require()` sits:

```js
// fragment_render_url_spec.js
extendDescribe('up.fragment', function() {
  extendDescribe('JavaScript functions', function() {
    extendDescribe('up.render()', function() {

      describe('with { url } option', function() { ... })
```

So the split is invisible from the outside: one suite per module, unchanged full names,
and `beforeEach` hooks from the module file still apply.

If you ever add such a file, the tooling keeps you honest: `bin/self-test` fails if it is
listed in `spec/specs.js` (or if nothing loads it), and `bin/lint` names any alias you need
to redeclare, since an extracted file is its own module.


## Anatomy of a spec

Most specs for unobtrusive behavior follow the same five beats: build the HTML, act on
it, assert what was requested, answer the request, assert what changed.

```js
it('submits the form and updates the target', async function() {
  // (1) build the HTML
  const [form, field, submitButton] = htmlFixtureList(`
    <form method="post" action="/action" up-submit up-target="#target">
      <input type="text" name="email" value="foo@example.com">
      <button type="submit">Submit</button>
    </form>
  `)
  htmlFixtureList('<div id="target">old target</div>')

  // (2) act
  Trigger.clickSequence(submitButton)
  await wait()

  // (3) assert the request
  expect(jasmine.lastRequest().data()).toMatchParams({ email: 'foo@example.com' })

  // (4) answer it
  jasmine.respondWithSelector('#target', { text: 'new target' })
  await wait()

  // (5) assert the result
  expect('#target').toHaveText('new target')
})
```

Specs for JavaScript functions are usually shorter — often just build, call, assert —
because there's no user interaction to simulate and frequently no request.

Each beat has a section below.


## Building test HTML

**Use `htmlFixtureList()`.** It takes a string of HTML, inserts it into the page, and
returns the created elements in document order — outermost first — so you can
destructure the ones you need:

```js
const [form, field] = htmlFixtureList(`
  <form method="post" action="/action">
    <input type="text" name="email">
  </form>
`)
```

Writing the literal HTML is the point. Unpoly's features are HTML features, and a spec
that spells out its markup lets you see at a glance what is being tested. Everything
inserted this way is removed after the spec, so there's no cleanup to write.

### The parameterized HTML function

When a spec needs the same markup more than once with variations — typically an "old"
page and the server's "new" response — build it with a function:

```js
let html = (prefix) => `
  <div id="fragment1">${prefix} fragment1</div>
  <div id="fragment2" up-hungry>${prefix} fragment2</div>
`

htmlFixtureList(html('old'))

await up.render({ target: '#fragment1', document: html('new') })
```

This keeps the two versions visibly identical apart from the one thing that differs.

### Fixtures are not compiled

`htmlFixtureList()` inserts elements without running [compilers](https://unpoly.com/up.compiler).
When the feature under test is implemented as a compiler or with `up.attribute()`, call
`up.hello()` yourself:

```js
const [form, field] = htmlFixtureList(`...`)
up.hello(form)
```

Keeping this explicit is deliberate: some specs care about exactly when compilers run.

### State resets between specs

You never have to undo what a spec did. Fixtures are removed, and Unpoly itself is reset
after every spec — compilers you registered, `up.*.config` you changed, open overlays, the
cache. So a spec can call `up.compiler()` or set config freely, and the next one starts
clean.


### Overlays and styles

| Helper | Use |
|---|---|
| `makeLayers(n)` or `makeLayers([plan, …])` | Build a layer stack. Pass a count for *n* plain layers, or plans (`{ target, content, fragment, … }`) to control each one |
| `fixtureStyle(css)` | Insert a temporary stylesheet |
| `registerFixture(element)` | Register an element you created yourself, so it gets cleaned up with the rest |

### Older fixture patterns

Most existing specs build HTML from selectors instead, via `fixture()`, `$fixture()`,
`htmlFixture()`, `helloFixture()` or `up.element.affix()`:

```js
// The older style. Don't write new specs like this.
const $form = $fixture('form[action="/form-target"][method="put"][up-submit]')
$form.append('<input name="field1" value="value1">')
const $submitButton = $form.affix('input[type="submit"]')
```

There are thousands of these, and they work fine — they just produce a wall of
selectors that's hard to read as HTML. We're migrating them to `htmlFixtureList()` over
time. Write new specs in the current style; if you find yourself editing an old one, you
may as well convert it, but a working spec in the old style is much better than no spec.

`up.element.affix()` remains useful for spawning a one-off element from a selector
elsewhere in a spec. Just don't build the spec's initial HTML with it.


## Simulating user interaction

`Trigger` dispatches the full event sequence a real interaction produces, not just the
single event you might reach for. `Trigger.clickSequence(button)` fires
`pointerover`, `mouseover`, `pointerdown`, `mousedown`, focus, `pointerup`, `mouseup`
and `click` — which matters, because Unpoly listens across that sequence.

Frequently used:

| Call | Simulates |
|---|---|
| `Trigger.clickSequence(element)` | A click, with its full pointer and focus sequence |
| `Trigger.change(field)` · `Trigger.input(field)` | A changed field (set `field.value` first) |
| `Trigger.submitFormWithEnter(field)` | Pressing Enter inside a field |
| `Trigger.toggleCheckSequence(checkbox)` | Toggling a checkbox or radio |
| `Trigger.keySequence(element, 'Escape')` · `Trigger.escapeSequence(element)` | A key press |
| `Trigger.hoverSequence(element)` · `Trigger.unhoverSequence(element)` | Pointer entering or leaving |
| `Trigger.tabSequence(element)` | Tabbing to the next focusable element |
| `Trigger.clickLinkWithKeyboard(link)` | Activating a link from the keyboard |

`spec/helpers/trigger.js` has the rest, including the individual events
(`Trigger.mousedown()`, `Trigger.focus()`, …) when you need one in isolation.


## The network is always mocked

A global `beforeEach` installs `jasmine.Ajax`, so **no request ever leaves the browser**
and there is nothing to set up or tear down per spec. Instead you inspect what Unpoly
would have sent, and decide what the server says:

| Call | Purpose |
|---|---|
| `jasmine.lastRequest()` | The most recent request. Fails the spec if there was none |
| `jasmine.lastRequest().data()` | Its params, for `toMatchParams()` |
| `jasmine.respondWith(html)` | Answer with an HTML body |
| `jasmine.respondWith({ status, responseHeaders, responseText, … })` | Answer with a specific status or headers |
| `jasmine.respondWithSelector('#target', { text: 'new' })` | Answer with a body built from a selector — the common case |

`jasmine.respondWith()` answers the last request by default; pass `{ request }` (an
index, or a request object) to answer an earlier one when several are in flight.


## Waiting for async code

There is **no single rule** here, because the right thing to await depends on what you
want to observe.

In particular, you often can't just await the promise the API returns. `up.render({ url })`
settles only after the server has responded *and* the fragment has been updated — so if
you await it, you've already sailed past the point where the request was inspectable and
answerable. That's why the shape in [Anatomy of a spec](#anatomy-of-a-spec) waits twice:
once to let the request go out, once to let the response render.

When you *do* only care about the end state, awaiting the promise is the clearest thing
to write — as the compiler example above does with `await up.render(...)`.

### How to wait

`wait()` does nearly all of it. It waits one macrotask, which is enough for the
already-queued callbacks to run:

```js
await wait()        // one macrotask
await wait(50)      // 50ms of real time — only for animations, see below
```

`spec/helpers/wait.js` holds finer-grained variants — microtask ticks, a fixed number of
macrotasks, an idle callback — for the rare spec that has to land between two specific
ticks. Reach for one only when `wait()` genuinely can't express the timing.

### Real time and clocks

Wait for actual time **only when the thing you're testing is time-based** — an
animation, or a configured delay like `up.form.config.watchInputDelay`. Everywhere else
a real-time wait just makes the suite slower and flakier.

`jasmine.clock()` is not the tool for this either. Don't install it, with one exception:
making a mocked request time out. `jasmine.lastRequest().responseTimeout()` comes from
jasmine-ajax and only works with the clock installed. The handful of specs that do this
say so in a comment.

Older specs use `up.util.timer(ms, callback)`. Use `await wait(ms)` instead.

### Asserting on promises

Prefer Jasmine's `expectAsync()`:

```js
await expectAsync(promise).toBeResolvedTo(value)
await expectAsync(promise).toBeRejected()
```

`promiseState(promise)` resolves to `{ state, value }` with `state` being `'pending'`,
`'fulfilled'` or `'rejected'`. Reach for it when you need to assert that a promise
*hasn't* settled yet, which `expectAsync()` can't express.

### When async/await isn't enough

A few callback-timing observations can't be expressed with `async`/`await` — cases where
you must assert from *inside* a callback rather than after awaiting it. For those,
Jasmine's `done` callback is still available: declare the spec as
`it('…', function(done) { … })` and call `done()` once the observation is complete.

It isn't the default. Most of the remaining `done()` specs predate `async`/`await` and
would read better converted, so reach for it only when the observation genuinely needs
it.


## Matchers

Custom matchers live one per file in `spec/helpers/`, named after the matcher
(`to_have_text.js` → `toHaveText()`). There are around seventy. Check for an existing one
before asserting by hand — most things you'd want to say about an element, a request or
a cache entry already have a matcher, and using it gives a far better failure message
than a hand-rolled boolean.

Most element matchers accept a **CSS selector string** in place of the element, which is
why specs can assert without keeping a reference around:

```js
expect('#target').toHaveText('new target')
expect('#target').toBeVisible()
```

To assert that an element is *gone*, negate a containment check rather than looking for
a "missing" matcher:

```js
expect(document).not.toHaveSelector('up-progress-bar')
```

The ones you'll use constantly:

| Matcher | Asserts |
|---|---|
| `toHaveText(text)` | The element's text content |
| `toHaveClass(name)` | A CSS class is present |
| `toHaveSelector(selector)` | A descendant matches the selector |
| `toMatchSelector(selector)` | The element itself matches |
| `toBeAttached()` · `toBeDetached()` | Whether the element is in the DOM tree |
| `toBeMissing()` | A *value* is `null` or `undefined` — not a DOM check |
| `toBeVisible()` · `toBeHidden()` | Rendered visibility |
| `toBeFocused()` | The element has focus |
| `toHaveAttribute(name, value)` | An attribute and (optionally) its value |
| `toMatchParams(object)` | Request params, from `jasmine.lastRequest().data()` |
| `toMatchURL(url)` | URL equality, ignoring irrelevant differences |
| `toBeCached()` · `toBeExpired()` | The state of a cache entry |
| `toBeOverlay()` · `toBeRootLayer()` | What kind of layer this is |

Alongside these, Jasmine's own `jasmine.createSpy()` and `spyOn()` carry a lot of the
weight in function specs — the compiler example above asserts entirely through a spy.


## Specs with special conditions

**Browser capabilities.** `describeFallback()` runs a group with an `up.browser`
capability stubbed out, so you can cover the degraded path:

```js
describeFallback('canPushState', function() { ... })
```

`up.browser` exposes only two capabilities today — `canPushState()` and `canJQuery()`.

**Expected errors.** Jasmine fails a spec when an error reaches `window.onerror`, which
is wrong when the error is the thing you're testing. Call `allowGlobalErrors()` in the
group, or assert on it with `jasmine.expectGlobalError()`.

**Deprecated features.** Specs for `unpoly-migrate` polyfills are guarded with
`if (up.migrate.loaded)`, because the suite also runs without that build. See
[Compatibility](compatibility.md#specs-for-deprecated-features).


## Manual tests

Some things are impractical to assert in a unit test — the visual look of an overlay,
or edge cases while Unpoly boots. For those there is an optional sibling repository,
[`unpoly-manual-tests`](https://github.com/unpoly/unpoly-manual-tests): a Rails app
whose pages exercise Unpoly features against a real server.

[`bin/dev`](dev-environment.md#running-the-dev-environment) boots it on port 4001 if you
have it checked out next to this repository. It doubles as a scratch pad — when you want
to poke at a feature by hand rather than through a spec, add a page there.
