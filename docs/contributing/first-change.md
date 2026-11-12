# Your first change to Unpoly

This guide walks through one complete change, from a fresh checkout to a pull request.

Code blocks below are diffs, where `...` marks code left out.
<!-- toc -->
- [Our example feature](#our-example-feature)
- [Before you start](#before-you-start)
- [Where the code goes](#where-the-code-goes)
- [1. The function](#1-the-function)
- [2. The HTML attribute](#2-the-html-attribute)
- [3. Documentation](#3-documentation)
- [Opening a pull request](#opening-a-pull-request)
<!-- /toc -->


## Our example feature

We will add an `[up-trim]` attribute for forms that Unpoly submits. When such a form is
submitted, Unpoly removes leading and trailing whitespace from all text inputs. We will
pair it with an `up.form.trim(form)` function that you can call from your own code.

That pairing is deliberate. Unpoly offers [layered APIs](philosophy.md#layered-apis):
a single HTML attribute for the common case, and a JavaScript function for custom integrations.
Most features you add will require both.

We build it in three passes (the function, then the HTML attribute, then the
documentation) and commit after each.


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

Every feature belongs to exactly one [namespace](code-organization.md#responsibilities).
Forms are the topic of `up.form`, so we work in these files:

- `src/unpoly/form.ts` for the implementation, which is TypeScript
- `src/unpoly/fragment/types.ts` for the type of a new option (`up.submit()` takes render options)
- `spec/unpoly/form_spec.js` for the specs — except the `[up-submit]` specs, which grew
  large enough to live in a sibling file, `spec/unpoly/form_submit_attr_spec.js`
- `src/unpoly/form.md` for the documentation

Every namespace file `foo.ts` has a spec `foo_spec.js` and its docs in `foo.md`, and most keep
their types in `foo/types.ts`. A feature with a lot of specs may have a spec file of its own.
`bin/find-spec "[up-submit]"` tells you which file to open; see
[testing](testing.md#finding-the-spec-for-a-feature) and
[code organization](code-organization.md#directory-structure).


## 1. The function

Start with the spec. `form_spec.js` keeps its JavaScript API and its HTML API in separate
example groups, so a function spec goes under `JavaScript`:

```diff
 describe('up.form', function() {
 
   describe('JavaScript', function() {
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
document order, which is what the destructuring above picks apart.

Run only this example. The [`--spec` filter](testing.md#running-tests) matches any
part of an example's full name:

```
bin/test --spec="up.form.trim()"
```

Watch it fail. A failure proves that our test actually covers something.

Now the implementation. `form.ts` follows the
[namespace pattern](code-organization.md#namespace-pattern): an ES module that exports its
functions, plus an `api` object with the ones that become public. Add an exported function,
and list it in `api.form`:

```diff
+export function trim(form: Element): void {
+  for (let field of findFields(form)) {
+    let { value } = field
+    if (u.isString(value)) {
+      field.value = value.trim()
+    }
+  }
+}
+
 ...
 
 export const api = {
   form: {
     ...
     group: findGroup,
+    trim,
   },
   ...
 }
```

The function declares the types of its parameters and its return value, as every named
function does (see [Code style](code-style.md#writing-types)). `u` is `up.util`, which
`form.ts` already imports as `import * as u from './util.js'`.

Exporting `trim` lets other modules import it. Only the `api` object reaches `window.up`, so
listing `trim` there is what publishes `up.form.trim()`.

Before the specs, run the type check and the linter. Both take a second or two, while even a
single spec takes about fifteen:

```
bin/typecheck
bin/lint
```

Both print nothing when all is well. Then run the spec again and watch it pass.

Commit, [prefixing your message with the namespace](commit-conventions.md) in square brackets:

```
git commit -m "[form] Add up.form.trim()"
```


## 2. The HTML attribute

Again, start with the spec. This one goes into the `HTML` group, nested
under the selector it modifies — which lives in `spec/unpoly/form_submit_attr_spec.js`.
That file names the groups it belongs to with `extendDescribe()` instead of `describe()`,
because it was extracted from `form_spec.js`; nothing else about writing the spec changes.

```diff
 extendDescribe('up.form', function() {
 
   extendDescribe('HTML', function() {
 
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
+          // Trigger the same event sequence a human click would trigger
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

The [network is always mocked](testing.md) in specs, so no request leaves
the browser and `jasmine.lastRequest()` can inspect what would have been sent.
Submitting a form is an async operation, so we `await wait()` before we can observe
its effect. This effectively waits for one macrotask, by which all promises (or `await`) have settled.

Run the spec and watch it fail:

```
bin/test --spec="up-trim"
```

Attribute values for a form submission are parsed in `up.form.submitOptions()`:

```diff
 export function submitOptions(form: any, options?: RenderOptions, parserOptions?: e.OptionsParserOptions): RenderOptions {
   ...
   let parser = new OptionsParser(form, options, parserOptions)
 
+  parser.boolean('trim')
+  if (options.trim) trim(form)
+
   parser.include(destinationOptions)
   ...
   return options
 }
```

`parser.boolean('trim')` reads an `[up-trim]` attribute from the form and sets
`options.trim` (unless already defined). When the option is set, we trim form fields before `destinationOptions()` serializes
the fields into `options.params`.

`bin/typecheck` doesn't accept this yet:

```
src/unpoly/form.ts(178,15): error TS2339: Property 'trim' does not exist on type 'RenderOptions'.
```

`up.submit()` takes render options, and `RenderOptions` lists every option it knows. Like
all of up.fragment's types, it lives in `fragment/types.ts`. Add the new option next to the
other form options:

```diff
 export interface RenderOptions {
   ...
   // The button that submitted a form (up.submit()), or false for none.
   submitButton?: Element | false
+  // Whether to trim the fields of a submitted form (up.submit()).
+  trim?: boolean
   ...
 }
```

Note that we never touched `up.form.submit()`. It renders whatever `submitOptions()`
returns, so it now supports a `{ trim: true }` option without changes (simplified):

```ts
export function submit(form: e.ElementOrSelector, options?: RenderOptions): RenderJob {
  return render(submitOptions(form, options))
}
```

Run `bin/typecheck` and `bin/lint` again, then the spec, and watch it pass.

We can now commit:

```
git commit -m "[form] Support [up-trim] modifier on submitting forms"
```


## 3. Documentation

All public API must be documented. The documentation for `form.ts` lives beside it in
`form.md`, a [doc file](documentation.md#doc-files) with one entry per feature. Entries are
written in a [superset of JSDoc](documentation.md) with directives like `@function`,
`@selector` and `@param`. We added three surfaces, so we document three things.

`up.form.trim()` is a new function, so it needs a doc entry of its own. Each entry starts with
an H1 naming the feature, and a line of five dashes separates it from its neighbors. We put
the new entry where `trim()` sits in `form.ts`. New API starts out `@experimental` and will
be promoted to `@stable` when we're still happy with it some releases later.

```diff
+# up.form.trim()
+
+Removes leading and trailing whitespace from all text inputs in the given form.
+
+@function up.form.trim
+@param {Element} form
+@experimental
+
+-----
+
 # up.form.submitButtons()
```

`up.submit()` only gains a new option. Its params are grouped into `@section`s, and
some sections pull shared text from a partial with `@mix` — so add the new `@param`
into the section it belongs to, at the section's indentation:

```diff
 # up.submit()

 ...
 @function up.submit
 ...
 @section Request
   @mix up.submit/request
+
+  @param {boolean} [options.trim=false]
+    Whether to remove leading and trailing whitespace from all text inputs
+    before submitting.
 ...
 @stable
```

The entry says `@function up.submit`, not `up.form.submit`, because the function is
[aliased](code-organization.md#namespace-pattern) onto the `up` global — which is
also why its doc page is `/api/up.submit`.

Same for the `[up-submit]` selector, which gains a new attribute. Note how prose
[refers to features](documentation.md#referring-to-features) by a CSS-like syntax:
`[up-trim]` for an attribute, `up.form.trim()` for a function. Attribute defaults are
quoted:

```diff
 # [up-submit]

 ...
 @selector [up-submit]
 ...
 @section Request
   @param action
     ...
+
+  @param [up-trim='false']
+    Whether to remove leading and trailing whitespace from all text inputs
+    before submitting.
 ...
 @stable
```

A small modifier like this needs no [guide page](documentation.md). Those are for
whole topics, and live as Markdown in `src/unpoly/pages`.

Previewing the rendered result is
[optional](documentation.md#previewing-your-changes) — you can open a pull request
without it.

Once you're happy with your documentation, commit:

```
git commit -m "[docs] Document up.form.trim() and [up-trim]"
```


## Opening a pull request

Push the branch and [open a single pull request](https://github.com/unpoly/unpoly/compare) for your three commits.

Opening a PR will start [CI](commit-conventions.md#continuous-integration), which runs the type
check, the linter and the whole test suite in seven configurations.\
Once CI is green, a human should review your code.
