# Testing

**Any change needs a spec.** Unpoly is almost all API surface, and the ~4,000 specs that run in a real browser on
every change are what let you alter code you don't fully understand and find out immediately whether you broke it.
Treat a green suite as permission to be bold, and a red one as the cheapest possible bug report.

"Tests", "specs" and "examples" are used interchangeably. Source lives in `src/unpoly/`; each module `foo.js` has a
spec `spec/unpoly/foo_spec.js`, listed in `spec/specs.js`.

<!-- toc -->
- [Running tests](#running-tests)
  - [Reading a failure](#reading-a-failure)
  - [Debugging a failure](#debugging-a-failure)
  - [Options and filters](#options-and-filters)
- [The full test suite is slow](#the-full-test-suite-is-slow)
- [If you are an agent](#if-you-are-an-agent)
- [Why a real browser](#why-a-real-browser)
- [How specs are organized](#how-specs-are-organized)
  - [Finding the spec for a feature](#finding-the-spec-for-a-feature)
  - [Where a new spec goes](#where-a-new-spec-goes)
  - [Extracted spec files](#extracted-spec-files)
- [Anatomy of a spec](#anatomy-of-a-spec)
- [Building test HTML](#building-test-html)
  - [The parameterized HTML function](#the-parameterized-html-function)
  - [Fixtures are not compiled](#fixtures-are-not-compiled)
  - [State resets between specs](#state-resets-between-specs)
  - [Overlays and styles](#overlays-and-styles)
  - [Older fixture patterns](#older-fixture-patterns)
- [Simulating user interaction](#simulating-user-interaction)
- [The network is always mocked](#the-network-is-always-mocked)
- [Waiting for async code](#waiting-for-async-code)
  - [How to wait](#how-to-wait)
  - [Real time and clocks](#real-time-and-clocks)
  - [Asserting on promises](#asserting-on-promises)
  - [When async/await isn't enough](#when-asyncawait-isnt-enough)
- [Matchers](#matchers)
- [Specs with special conditions](#specs-with-special-conditions)
- [Trying something by hand](#trying-something-by-hand)
<!-- /toc -->


## Running tests

Unpoly's specs run in a real browser, driven from your terminal:

```
bin/test --spec="up.form HTML [up-switch]"   # only specs whose full name contains this
bin/test --all                               # the whole suite (~9 minutes)
```

`bin/test` needs a running [dev environment](dev-environment.md) and starts one in
the background if none is running.

### Reading a failure

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

### Debugging a failure

In the terminal there is no debugger, so you inspect state by logging it: anything you
`console.log` in a spec or in `src/unpoly` shows up in the browser log that `--verbose`
prints. A failure you can't explain is often fastest to understand by opening its
`Debug in browser:` link and stepping through it in DevTools.

`--verbose` adds the browser log, every stack frame, and an outline of the DOM (rooted at
`body`) as it stood when the spec failed:

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

That outline usually shows the problem without opening a browser: a fixture that was
never compiled, an overlay still on the stack, a fragment inserted in the wrong place.

### Options and filters

| Option | Effect |
|--------|--------|
| `--spec="…"` | Only run specs whose full name contains this string. Matched verbatim, never as a pattern |
| `--file=path[:line[-end]]` | Run what a file declares — or, with `:line`, just the group or spec declared on that line |
| `--all` | Run every spec. Required for an unfiltered run, so the nine minutes are deliberate |
| `--verbose` | Add the browser log + HTML state (fixtures, overlays) to each failure |
| `--browser=firefox` | Run in Firefox instead of Chrome |
| `--headless=false` | Show the browser window while running |
| `--stop-on-failure=false` | Keep running a spec after its first failed expectation (default: stop) |
| `--csp=none\|nonce-only\|strict-dynamic` · `--es6` · `--migrate` | Serve the specs under a CSP / ES6 / unpoly-migrate variant |

`--spec` and `--file` are **repeatable**, and a run is the union of everything they select
(overlaps run once):

```
bin/test --spec="up.form HTML [up-switch]" --spec="up.Params"
bin/test --file=spec/unpoly/form_switch_spec.js --file=spec/unpoly/radio_spec.js:88
```

`--minify` runs the specs against the bundle we actually ship, where every `_`-prefixed
member is renamed (see [private members](code-style.md#private-members-and-the-minified-build)).
`bin/test` builds the minified bundles itself when they are missing or stale.

A failed spec exits non-zero. The spec runner itself is documented in
[`tooling/README.md`](../../tooling/README.md).


## The full test suite is slow

`bin/test --all` takes about **nine minutes**, which is why an unfiltered run needs the flag.
Don't run it after every edit.

**Find the specs that cover your change and run only those.** `bin/find-spec` searches
`describe()` and `it()` titles and prints the line range (`path:start-end`) and full name of
every match. The range tells you which lines to read, and works with `--file`. Search more
than once: the name in a spec title is rarely the one you were editing, so try the attribute,
the function, the option and the plain-English term:

```
bin/find-spec "fieldSelectors"
bin/find-spec "custom form field"
```

**A whole module is not a narrow filter.** `--spec="up.fragment"` alone takes about five
minutes. Name the groups that cover your change, like `up.form HTML [up-switch]` rather than
`up.form`.

**Run the full suite only when the blast radius is wide:** a change to `up.fragment`,
`up.network`, `up.script`, `up.layer`, `up.util` or `up.element`, a change across many
modules, or a refactoring whose reach you can't enumerate. Otherwise the filtered run *is*
the verification.

**Leave the build variants to CI.** Minified, ES6, two CSP modes and `unpoly-migrate.js` are
each another full suite, and [CI](commit-conventions.md#continuous-integration) runs them on
every pull request. Check its result before you call a change done. Run one locally
(filtered) only when CI reported a failure in it, or when your change is about what it
exercises, like `--csp=…` for CSP work or `--migrate` for a new polyfill.


## If you are an agent

**Filter before you run** (see [above](#the-full-test-suite-is-slow)).

**Give the command a generous timeout**, set from how long the run actually takes. A
shorter tool timeout kills the run and tells you nothing. You don't need to guard against
a hang: a run that stops making progress exits non-zero by itself.

**The full output is always in `tmp/test.log`**, without colours. Read it instead of
running the suite again.

**Run Firefox only for a Firefox issue.** Firefox runs (`--browser=firefox`) are too
unreliable for a general check, so CI doesn't run them either. Leave them out unless your
task is about a bug in Firefox.


## Why a real browser

Specs always run in a real browser: headless Chrome by default, Firefox with
`--browser=firefox`. There is no jsdom variant, and we don't want one. Unpoly's
behavior depends on details that a DOM emulation doesn't reproduce faithfully — focus
handling, scroll positions, form serialization, event ordering, CSS resolution.
See [Compatibility](compatibility.md#browser-support) for which browsers CI exercises.


## How specs are organized

Every module has a spec file at the mirrored path. `src/unpoly/form.js` is tested by
`spec/unpoly/form_spec.js`, and `src/unpoly/classes/params.js` by
`spec/unpoly/classes/params_spec.js`. Where a group of specs grew too large to live
there, it moved into a sibling file that shares the module's prefix — see
[extracted spec files](#extracted-spec-files) below.

Inside a [main module](code-organization.md#responsibilities) spec, groups nest by
module, kind and feature:

```js
describe('up.link', function() {                                     // module

  describe('JavaScript', function() {                                // kind

    describe('up.follow()', function() {                             // feature
      it('...', async function() { ... })                            // general behavior
      describe('with { confirm } option', function() { ... })        // option
      describe("when the link's [href] is '#'", function() { ... })  // aspect
    })

  })

  describe('HTML', function() {                                      // kind

    describe('[up-follow]', function() {                             // feature
      it('...', async function() { ... })                            // general behavior
      describe('with [up-instant] modifier', function() { ... })     // modifier
    })

  })

})
```

Features are named as in the API docs: functions with parentheses (`up.follow()`), selectors
in brackets (`[up-follow]`). JavaScript and HTML are the only kinds; events and config objects
go under JavaScript, and the rare feature without any API under HTML. Modules with a single
kind may skip that level, as do classes, which go straight from `describe('up.Params')` to a
group per method.

**Below the feature**, ungrouped specs describe its general behavior. Larger features group
the rest by one main axis, usually per option or modifier, plus the occasional cross-cutting
group like `when the server responds with an error`.

Nested group names concatenate with spaces to form a spec's *full name*, which is what
`--spec` matches against. So the example above can be narrowed at any depth:

```
bin/test --spec="up.link"                       # the whole module
bin/test --spec="up.link HTML"                  # only the attribute specs
bin/test --spec="up.follow()"                   # one function
```

Full names never change when specs move between files.


### Finding the spec for a feature

**By file name.** `up.form` is tested in `spec/unpoly/form_spec.js`. A feature large enough
to be extracted sits beside it in `<module>_<feature>_spec.js`, like `form_switch_spec.js`
for `[up-switch]`. `ls spec/unpoly | grep ^form_` lists them all.

**By title.** `bin/find-spec` searches only `describe()` and `it()` titles:

```
$ bin/find-spec "kept element"
spec/unpoly/fragment_keep_spec.js:47-71   "up.fragment HTML [up-keep] does not run destructors within kept elements"
spec/unpoly/fragment_keep_spec.js:73-92   "up.fragment HTML [up-keep] does not run destructors within kept elements when the <body> is targeted (bugfix)"
spec/unpoly/fragment_keep_spec.js:143-163 "up.fragment HTML [up-keep] omits a kept element from the returned up.RenderResult"
…
```

The quoted string is the spec's full name, so you can paste it (or any part of it) into
`--spec`. A spec that only runs under a condition, like `(if up.migrate.loaded)`, says so
after the quotes; run it with the matching option (`--migrate`).

Or let `--file` work out the filter from a location:

```
bin/test --file=spec/unpoly/classes/params_spec.js        # what that file declares
bin/test --file=spec/unpoly/classes/params_spec.js:29     # just the group on line 29
```

On an [extracted file](#extracted-spec-files), `--file` runs just the blocks that file
declares. On a module's own spec file, it runs the **whole module**, extracted files
included, so point at the line of the group you need instead. The runner echoes the
filters it derived.


### Where a new spec goes

Put it in the `describe()` group it belongs to. The file follows from the group, even when
that is an extracted file. When a feature groups by option, a new option gets its own
`with …` group. Otherwise, if no group fits, leave the spec ungrouped. Open a new group only
for a cluster that a reader would look for together, like `when the server responds with an
error`. The specs you wrote for one change are not a cluster by themselves.

Extract a group into a new file only when its module file grows hard to read (a few dozen KB).


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
  extendDescribe('JavaScript', function() {
    extendDescribe('up.render()', function() {

      describe('with { url } option', function() { ... })
```

So the split is invisible from the outside: one suite per module, unchanged full names,
and `beforeEach` hooks from the module file still apply.

`bin/self-test` fails if nothing loads an extracted file, or if its `extendDescribe()` chain
doesn't match where it is required. `bin/lint` names any alias you need to redeclare.


## Anatomy of a spec

Most specs for HTML attributes follow the same five beats: build the HTML, act on
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

Specs for JavaScript functions are usually shorter: build, call, assert.


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

Writing the literal HTML is the point: a spec that spells out its markup shows at a glance
what is being tested.

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

`htmlFixtureList()` inserts elements without running [compilers](https://unpoly.com/api/up.compiler).
When the feature under test is implemented as a compiler or with `up.attribute()`, call
`up.hello()` yourself:

```js
const [form, field] = htmlFixtureList(`...`)
up.hello(form)
```

Keeping this explicit is deliberate: some specs care about exactly when compilers run.

### State resets between specs

You never have to undo what a spec did. Fixtures are removed, and Unpoly is reset after
every spec: registered compilers, changed `up.*.config`, open overlays, the cache.


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

They work, but read as a wall of selectors. Write new specs with `htmlFixtureList()`, and
convert an old one when you edit it anyway. `up.element.affix()` is still fine for a one-off
element later in a spec.


## Simulating user interaction

`Trigger` dispatches the full event sequence a real interaction produces, which matters
because Unpoly listens across that sequence. `Trigger.clickSequence(button)` fires
`pointerover`, `mouseover`, `pointerdown`, `mousedown`, focus, `pointerup`, `mouseup`
and `click`.

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

`spec/helpers/trigger.js` has the rest, including single events like `Trigger.mousedown()`.


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
| `await jasmine.populateCache('/path', 'response text')` | Request a URL and answer it, so its response is in the cache |

`jasmine.respondWith()` answers the last request by default; pass `{ request }` (an
index, or a request object) to answer an earlier one when several are in flight.


## Waiting for async code

What to await depends on what you want to observe. `up.render({ url })` settles only after
the server has responded *and* the fragment has been updated, so awaiting it skips past the
point where you could inspect and answer the request. That's why the
[spec anatomy](#anatomy-of-a-spec) waits twice. When you only care about the end state,
await the promise.

### How to wait

`wait()` does nearly all of it. It waits one macrotask, which is enough for the
already-queued callbacks to run:

```js
await wait()        // one macrotask
await wait(50)      // 50ms of real time — only for animations, see below
```

`spec/helpers/wait.js` holds finer-grained variants (microtasks, a number of macrotasks, an
idle callback) for the rare spec that has to land between two specific ticks.

### Real time and clocks

Wait for actual time **only when the thing you're testing is time-based**, like an
animation or `up.form.config.watchInputDelay`. Every millisecond is paid on every run, so
keep it short:

- Code that defers by a task (`u.task()`) needs tasks, not time: `await jasmine.waitTasks(2)`,
  not `await wait(100)`.
- Set configured delays (`lateDelay`, `watchInputDelay`, animation durations) to a few
  milliseconds, then wait that plus 50–100 ms for timer inaccuracy.
- Assert an earlier sign instead of the end state, like a progress bar's full width
  instead of its removal after the animation.

Don't install `jasmine.clock()`, except to make a mocked request time out:
`jasmine.lastRequest().responseTimeout()` only works with the clock installed.

Older specs use `up.util.timer(ms, callback)`. Use `await wait(ms)` instead.

### Asserting on promises

Prefer Jasmine's `expectAsync()`:

```js
await expectAsync(promise).toBeResolvedTo(value)
await expectAsync(promise).toBeRejected()
await expectAsync(promise).toBePending()
```

These also work for thenables like `up.Request` and `up.RenderJob`. `promiseState(promise)`
resolves to `{ state, value }` when you need the state or value itself.

### When async/await isn't enough

When you must assert from *inside* a callback, Jasmine's `done` callback is still
available: `it('…', function(done) { … })`. Most existing `done()` specs just predate
`async`/`await`, so don't copy them otherwise.


## Matchers

Around seventy custom matchers live one per file in `spec/helpers/` (`to_have_text.js` →
`toHaveText()`). Check for one before asserting by hand: it gives a far better failure
message than a boolean.

Most element matchers accept a **CSS selector string** in place of the element:

```js
expect('#target').toHaveText('new target')
expect('#target').toBeVisible()
```

To assert that an element is *gone*, negate a containment check:

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

Jasmine's `jasmine.createSpy()` and `spyOn()` carry a lot of the weight in function specs.


## Specs with special conditions

**Browser capabilities.** `describeFallback()` runs a group with an `up.browser`
capability stubbed out, so you can cover the degraded path:

```js
describeFallback('canPushState', function() { ... })
```

**Expected errors.** Jasmine fails a spec when an error reaches `window.onerror`, which
is wrong when the error is the thing you're testing. Call `allowGlobalErrors()` in the
group, or assert on it with `jasmine.expectGlobalError()`.

**Deprecated features.** Specs for `unpoly-migrate` polyfills are guarded with
`if (up.migrate.loaded)`, because the suite also runs without that build. See
[Compatibility](compatibility.md#specs-for-deprecated-features).


## Trying something by hand

Some things the mocked suite cannot show you, like the look of an overlay or a form across
several validation roundtrips. For those, `bin/dev` serves a **scratch server** on port 4001
(see [Trying out changes](trying-out-changes.md)). What you learn there still belongs in a spec.
