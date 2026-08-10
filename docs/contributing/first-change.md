# Your first change to Unpoly

This guide walks through one complete change, from a fresh checkout to a pull request.

We will add an `[up-trim]` attribute for forms that Unpoly submits. When such a form is
submitted, Unpoly removes leading and trailing whitespace from all text inputs. We will
pair it with an `up.form.trim(form)` function that you can call from your own code.

That pairing is deliberate. Unpoly offers [layered APIs](philosophy.md#layered-apis):
a single HTML attribute for the common case, and a JavaScript function underneath for
everything else. Most features you add will want both.

We build it in three passes — the JavaScript function, then the HTML attribute, then
the documentation — and commit after each.

Code blocks below are diffs: `+` lines are what you add, unprefixed lines are existing
code shown for context, and `...` marks code left out.


## Before you start

Specs don't run against `src/` directly, but against a transpiled build in `dist/`.
[Install the development dependencies](dev-environment.md#installing-development-dependencies),
then start a [dev environment](dev-environment.md#running-the-dev-environment) and
leave it running in its own terminal:

```
bin/dev
```

Work on a branch, never on `master`:

```
git checkout -b up-trim
```


## Where the code goes

Every feature belongs to exactly one [main module](code-organization.md#responsibilities).
Forms are the topic of `up.form`, so we work in two files:

- `src/unpoly/form.js` for the implementation
- `spec/unpoly/form_spec.js` for the specs

Every module `foo.js` has a spec `foo_spec.js`. See
[code organization](code-organization.md#directory-structure--where-to-find-files)
for the full layout.


## 1. The JavaScript function

Start with the spec. `form_spec.js` keeps JavaScript functions and unobtrusive
behavior in separate example groups, so a function spec goes under
`JavaScript functions`:

```diff
 describe('up.form', function() {
 
   describe('JavaScript functions', function() {
     ...
 
+    describe('up.form.trim()', function() {
+
+      it('removes leading and trailing whitespace from text inputs', function() {
+        let [form, textInput, textarea] = htmlFixtureList(`
+          <form method="post" action="/action">
+            <input type="text" name="foo" value="  value">
+            <textarea name="bar">  value</textarea>
+          </form>
+        `)
+
+        up.form.trim(form)
+
+        expect(textInput.value).toEqual('value')
+        expect(textarea.value).toEqual('value')
+      })
+
+    })
```

`htmlFixtureList()` is one of many [spec helpers](testing.md) that are available as
globals, with no import. It inserts the HTML into the page and returns its elements in
document order — root first — which is what the destructuring above picks apart.

Run only this example. The [`--spec` filter](testing.md#running-tests) matches any
part of an example's full name:

```
bin/test --spec="up.form.trim()"
```

Watch it fail. A failure proves that our test actually covers something.

Now the implementation. `up.form` follows the
[main module pattern](code-organization.md#main-module-pattern): an IIFE that returns
its public symbols. Add the function inside it, and list it in the returned object:

```diff
 up.form = (function() {
   ...
 
+  function trim(form) {
+    for (let field of findFields(form)) {
+      let { value } = field
+      if (u.isString(value)) {
+        field.value = value.trim()
+      }
+    }
+  }
 
   ...
 
   return {
     ...
+    trim,
   }
 })()
```

Only the symbols in that returned object become public API, so listing `trim` there is
what publishes `up.form.trim()`. Note the house [code style](code-style.md): no types,
no dependencies, and `bin/lint` runs [the same ESLint rules](code-style.md#linting) as
the build.

Run the spec again and watch it pass. Commit, [prefixed with the
module](commit-conventions.md):

```
git commit -m "[form] Add up.form.trim()"
```


## 2. The HTML attribute

Again, start with the spec. This one goes into the `unobtrusive behavior` group,
nested under the selector it modifies:

```diff
 describe('up.form', function() {
 
   describe('unobtrusive behavior', function() {
     ...
 
     describe('[up-submit]', function() {
       ...
 
+      describe('with [up-trim] modifier', function() {
+
+        it('removes leading and trailing whitespace from text inputs', async function() {
+          let [form, textInput, textarea, submitButton] = htmlFixtureList(`
+            <form method="post" action="/action" up-submit up-trim>
+              <input type="text" name="foo" value="  value">
+              <textarea name="bar">  value</textarea>
+              <button type="submit">Submit</button>
+            </form>
+          `)
+
+          Trigger.clickSequence(submitButton)
+
+          // Wait for the effects of async code
+          await wait()
+
+          // Assert that the form elements were trimmed
+          expect(textInput.value).toEqual('value')
+          expect(textarea.value).toEqual('value')
+
+          // Assert that the params were parsed from the trimmed elements
+          const request = jasmine.lastRequest()
+          expect(request.data()).toMatchParams({
+            foo: 'value',
+            bar: 'value',
+          })
+        })
+
+      })
```

The fixture needs `[up-submit]` next to `[up-trim]`: only forms matching
`up.form.config.submitSelectors` are submitted by Unpoly at all, so a plain
`<form up-trim>` would do nothing.

Submitting a form is an async operation, so we `await wait()` before we can observe
its effect. The [network is always mocked](testing.md) in specs, so no request leaves
the browser and `jasmine.lastRequest()` can inspect what would have been sent.

Run it and watch it fail:

```
bin/test --spec="up-trim"
```

Attribute values for a form submission are parsed in `up.form.submitOptions()`:

```diff
   function submitOptions(form, options, parserOptions) {
     ...
     let parser = new up.OptionsParser(form, options, parserOptions)
 
+    parser.boolean('trim')
+    if (options.trim) trim(form)
+
     parser.include(destinationOptions)
     ...
     return options
   }
```

`parser.boolean('trim')` reads an `[up-trim]` attribute from the form and sets
`options.trim`. Keep the two lines where they are: `destinationOptions()` serializes
the fields into `{ params }`, so trimming after it would submit untrimmed values.

Note that we never touched `up.form.submit()`. It renders whatever `submitOptions()`
returns, which is how one option buys both the attribute and
`up.form.submit(form, { trim: true })`.

Run the spec again and watch it pass. Commit:

```
git commit -m "[form] Support [up-trim] modifier on submitting forms"
```


## 3. Documentation

All public API must be documented. Doc comments live beside the code they describe, in
a [superset of JSDoc](documentation.md) with directives like `@function`, `@selector`
and `@param`. We added three surfaces, so we document three things.

`up.form.trim()` is a new function, so it needs a doc comment of its own. New API
starts out `@experimental` and is promoted to `@stable` once we're happy with it:

```diff
+  /*-
+  Removes leading and trailing whitespace from all text inputs in the given form.
+
+  @function up.form.trim
+  @param {Element} form
+  @experimental
+  */
   function trim(form) {
     ...
   }
```

`up.submit()` only gains a new option. Its params are grouped into `@section`s, and
some sections pull shared text from a partial with `@mix` — so add the new `@param`
into the section it belongs to, at the section's indentation:

```diff
   /*-
   ...
   @function up.submit
   ...
   @section Request
     @mix up.submit/request
+
+    @param {boolean} [options.trim=false]
+      Whether to remove leading and trailing whitespace from all text inputs
+      before submitting.
   ...
   @stable
   */
```

The comment says `@function up.submit`, not `up.form.submit`, because the function is
[aliased](code-organization.md#main-module-pattern) onto the `up` global — which is
also why its doc page is `/up.submit`.

Same for the `[up-submit]` selector, which gains a new attribute. Note how prose
[refers to features](documentation.md#referring-to-features) by a CSS-like syntax:
`[up-trim]` for an attribute, `up.form.trim()` for a function. Attribute defaults are
quoted:

```diff
   /*-
   ...
   @selector [up-submit]
   ...
   @section Request
     @param action
       ...
+
+    @param [up-trim='false']
+      Whether to remove leading and trailing whitespace from all text inputs
+      before submitting.
   ...
   @stable
   */
   up.on('submit', config.selectorFn('submitSelectors'), function(event, form) {
     ...
   })
```

A small modifier like this needs no [guide page](documentation.md). Those are for
whole topics, and live as Markdown in `src/unpoly/pages`.

The dev environment also serves the documentation site from the `unpoly-site` sibling
repo, if you have it checked out. It should now show the new params for
<http://localhost:4567/up-submit> and <http://localhost:4567/up.submit>. The new page
<http://localhost:4567/up.form.trim> is a *new* page rather than a changed one, so it
only appears after
[restarting the dev environment](dev-environment.md#running-the-dev-environment).

Commit:

```
git commit -m "[docs] Document up.form.trim() and [up-trim]"
```


## Opening a pull request

Push the branch and open a pull request with all three commits. Opening it is what
starts [CI](commit-conventions.md#continuous-integration), which runs the whole suite
in six configurations — pushing a branch on its own runs nothing.

If you are an agent, ask your human before committing, pushing or opening a pull
request. See [commit conventions](commit-conventions.md) for the details.

That's the whole loop. [CONTRIBUTING.md](../../CONTRIBUTING.md) indexes the guides you
skipped past on the way.
