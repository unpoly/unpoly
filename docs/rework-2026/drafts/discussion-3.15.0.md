A lot has changed for everyone who builds software since our last release. Many of us now write code together with AI agents.

This release makes Unpoly work better for this new way of building software. A [completely rewritten documentation site](https://unpoly.com) helps humans and agents learn Unpoly best practices and look up API details. It is available as HTML, as Markdown and as an offline skill. A new contributor guide helps both contribute to the project. We believe that hypermedia-driven apps (HDAs) fit this new age well. They need less code and fewer dependencies, and have fewer moving parts.
That makes HDAs straightforward to understand and change, for humans and agents alike.

We also made some changes to Unpoly itself. A major new feature is the ability to implement custom form fields as web components ("form-associated custom elements"). We fixed a ton of minor bugs and inconsistencies that had accumulated over Unpoly's 10+ years, and meaningfully improved our test coverage.

Breaking changes are marked with ⚠️ when [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading) polyfills them, and with ❌ when they need a change to your code.


### A relaunched documentation site

You can now learn Unpoly on unpoly.com from start to finish, and look up details when you need them.

- The new Learn area is a course: [Getting started](https://unpoly.com/learn/start/overview) takes you from how Unpoly works to your first links, forms, overlays and compilers. After it, 13 chapters cover everything from [Links](https://unpoly.com/learn/links) and [Forms](https://unpoly.com/learn/forms) to [Backend integration](https://unpoly.com/learn/backend-integration) and [Advanced rendering](https://unpoly.com/learn/advanced-rendering). Each chapter opens with an overview, and every page links to the next one, so you can read the docs like a book.
- We rewrote the existing guides, split long pages into focused ones, merged pages that overlapped, and added pages for topics that had no home before. We checked the code examples against the source code and fixed the ones that did not work.
- The sidebar shows where you are in a chapter or module, longer pages show their contents, and a new menu makes the site usable on a phone. Diagrams and videos show what happens on the page.
- The API reference at `/api` documents every attribute, function, event and option. Every API page links to the Learn page that explains its topic.
- The new search shows whether a result is a Learn page or an API page, and where it sits in the docs.

Guides now live under `/learn`, like `/learn/caching`. API pages live under `/api`, like `/api/up.render`.
Some pages also got a new name, e.g. *Handling failed responses* is now [Error responses](https://unpoly.com/learn/error-responses), and *Preserving elements* is now [Keeping elements](https://unpoly.com/learn/keeping-elements).
Old URLs redirect to the new pages, so your links and bookmarks keep working.


### Docs for coding agents

An [agent skill](https://unpoly.com/learn/skill) gives your coding agent the same documentation as you: every guide and the full API reference, with a search script that works offline.
With it, your agent follows Unpoly's common patterns for links, forms and overlays, and can look up the exact attributes, options and edge cases.
The skill also contains the release notes of every version, for when your agent upgrades an app.

Install the skill with the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add --global https://unpoly.com
```

If you use Claude Code, you can also [install the skill as a plugin](https://unpoly.com/learn/skill#claude-code).

Agents can also read the docs without the skill:

- Every page is also available as Markdown. Append `.md` to its URL, e.g. [`https://unpoly.com/api/up.render.md`](https://unpoly.com/api/up.render.md). Agents that ask for `text/markdown` first in their `Accept` header get Markdown at the page's own URL.
- [`/llms.txt`](https://unpoly.com/llms.txt) lists all guides and API modules, with links an agent can follow.
- To give a chat a single page, use the copy button next to a page's title. It copies the page as Markdown.


### A guide for contributors

If you want to change Unpoly itself, start with [`CONTRIBUTING.md`](https://github.com/unpoly/unpoly/blob/master/CONTRIBUTING.md).
It links 13 guides, written for people and for coding agents. They explain how to set up a development environment, where code lives, and how we test, document and release Unpoly. Two deep-dives explain the rendering core and the selector engine.
A walkthrough takes you through a first change: a new `[up-*]` attribute, its spec, its documentation and its commit.

Coding agents find the guide on their own, because `AGENTS.md` and `CLAUDE.md` point to the same file.

The guides come with new tools:

- `bin/dev` starts a build watcher, a test server and the documentation site with one command.
- `bin/test` runs the specs in a real browser from the terminal, and `bin/find-spec` finds the specs relevant to your change, so you don't need to run the whole suite.
- A scratch server shows your change on a few real pages, for things a spec cannot show, like how an overlay looks.


### Custom form fields

Custom controls like date pickers or tag editors can now take part in Unpoly forms like a native `<input>`.
Unpoly now builds request params with the browser's own form-data algorithm, so a
[form-associated custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#form-associated_custom_elements)
is submitted without any configuration.
When it also has a `value` property, Unpoly can [watch](https://unpoly.com/api/up.watch), [validate](https://unpoly.com/learn/validation) and [switch](https://unpoly.com/learn/switching-form-state) it like any other field, and [`[up-disable]`](https://unpoly.com/learn/disabling-forms) disables it while the form is submitting.

Here is a minimal date picker that reports its value to the form:

```js
class DatePicker extends HTMLElement {
  static formAssociated = true
  #internals = this.attachInternals()
  #value = ''

  get value() {
    return this.#value
  }

  set value(newValue) {
    this.#value = newValue
    this.#internals.setFormValue(newValue)
  }

  // Called when the element is inserted into the page
  connectedCallback() {
    // Render a calendar with a button for each day
    this.innerHTML = `
      <button type="button" data-day="2026-11-01">1</button>
      <button type="button" data-day="2026-11-02">2</button>
      …
    `
    this.addEventListener('click', (event) => {
      let dayButton = event.target.closest('[data-day]')
      if (dayButton) this.onDayPicked(dayButton.dataset.day)
    })
  }

  // Called when the user clicks a day
  onDayPicked(day) {
    this.value = day
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

customElements.define('date-picker', DatePicker)
```

You can use it in a form like a native field, including with [`[up-validate]`](https://unpoly.com/api/up-validate):

```html
<form method="post" action="/events" up-submit up-validate>
  <date-picker name="starts_at"></date-picker>
  <input type="text" name="title">
</form>
```

An element that is defined after the form was rendered, e.g. by a lazily loaded component, is picked up as soon as it is defined.
Values appended by a [`formdata`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event) listener are now sent as well.

The new guide [Custom form fields](https://unpoly.com/learn/custom-form-fields) compares four ways to build a custom control, from a hidden native field to a plain `<div>` that you register as a field.

Thanks to @kmmbvnr for contributing form-associated custom elements and `formdata` support.


### Form submissions now match the browser

Unpoly now uses the browser's form-data algorithm, so edge cases behave like a native form submission.
These changes cannot be polyfilled. If your server or your tests depend on the exact params of a submission, review them:

- A form with an `<input type="file">` is now submitted as `multipart/form-data`, even when no file is selected.
- An `<input type="image">` used as the submit button now sends its `name.x` and `name.y` coordinates instead of its `[value]`.
- A `<button type="reset">` or `<input type="reset">` with a `[name]` no longer sends a param. It is no longer watched or validated, but [`[up-disable]`](https://unpoly.com/api/up-submit#up-disable) still disables it.
- A field inside a `<fieldset disabled>` is no longer submitted or validated. This includes custom elements in `up.form.config.fieldSelectors`. [Watchers](https://unpoly.com/api/up.watch) and [`[up-switch]`](https://unpoly.com/learn/switching-form-state) still see the field.
- Params now arrive in the order the browser produces them: the form's fields in document order, then values from `formdata` listeners, then custom elements registered in `up.form.config.fieldSelectors`. A submit button's `[name]` and `[value]` now appear at the button's position, not after the form's `[up-params]`.
- A [validation](https://unpoly.com/learn/validation) request no longer sends the params of the form's first submit button, and no longer uses that button's `[formaction]`, `[formmethod]`, `[up-params]` or `[up-headers]`. Nobody pressed the button, so only the `<form>` decides where a validation goes.
- Unpoly now throws an error when a field uses a `[form]` attribute to join a form in another [layer](https://unpoly.com/api/up.layer). The browser would submit that field with the wrong layer's form. If you render the same page in an overlay, give each form a unique `[id]`, or move the field into the form. The error message suggests these fixes.
- `up.Params.fromForm()` now requires a `<form>` element, as documented. To read params from any other container, use `up.Params.fromContainer()`.
- `up.Params.fromForm()` takes a new `{ submitButton }` option. It defaults to the form's first submit button. Pass `false` to send no button. The `{ includeDisabled }` option is ignored here, because the browser never sends a disabled field.
- When a form with [`[up-accept]` or `[up-dismiss]`](https://unpoly.com/learn/closing-overlays#result-values) closes an overlay, the result value now also contains the `[name]` and `[value]` of the submit button the user pressed.


### Forms

- While a [validation](https://unpoly.com/learn/validation) request is loading, [feedback classes](https://unpoly.com/learn/feedback-classes) like `.up-loading` are now set by default, as for every other request. To turn them off, set `[up-watch-feedback="false"]` or pass `{ feedback: false }`.
- A custom control only needs a `value` property to work as a [custom form field](https://unpoly.com/learn/custom-form-fields).
- A form-associated custom element is only submitted when it calls `setFormValue()`, even when it is listed in `up.form.config.fieldSelectors`.
- A `formdata` listener changes what Unpoly sends, not what it watches. See [Adding values with a `formdata` listener](https://unpoly.com/learn/custom-form-fields#formdata).
- New experimental config [`up.form.config.noFieldSelectors`](https://unpoly.com/api/up.form.config#config.noFieldSelectors) excludes elements from being treated as fields, e.g. a form-associated custom element that renders a button.
- When Unpoly disables a custom control that has no `disabled` property, it now sets the `[disabled]` attribute.
- When Unpoly [focuses](https://unpoly.com/learn/focus) a form-associated custom element, it now sets `.up-focus-visible`, even after a mouse or touch interaction. Such an element is now a field, and `up.viewport.config.autoFocusVisible` shows a [focus ring](https://unpoly.com/learn/focus-visibility) for every field.
- A custom control with a `[name]` but no readable value no longer reports an `undefined` value to watchers.
- Pages with many watched forms are much faster. Before, every `[up-autosubmit]`, `[up-validate]`, `[up-switch]` or `up.watch()` looked at every field on the page after each fragment update. A page with hundreds of small forms could freeze for a second after each update.
- `up.form.fields()` and `up.form.submitButtons()` now ignore elements in another [layer](https://unpoly.com/api/up.layer) and elements that are being [destroyed](https://unpoly.com/api/up.destroy), like other `up.fragment` lookups. A field in a popup that is attached inside a form is no longer watched by that form.
- ⚠️ `up.form.config.genericButtonSelectors` was renamed to `up.form.config.anyButtonSelectors`. It now matches every kind of button, including submit and reset buttons. The old name is polyfilled by `unpoly-migrate.js`.


### Overlays

- ❌ An `up:layer:dismiss` or `up:layer:accept` listener can now keep an overlay open when a link or form in a parent layer would close it ([peeling](https://unpoly.com/learn/closing-overlays#peeling)). The render pass then fails with `up.Aborted` and nothing is updated.
  This affects listeners that prevent closing, e.g. to confirm unsaved changes. To let links in a parent layer close the overlay as before, return early when `event.value` is `':peel'`:

  ```js
  up.on('up:layer:dismiss', function(event) {
    if (event.value === ':peel') return
    if (!confirm('Discard your changes?')) event.preventDefault()
  })
  ```

  To force a single link, set [`[up-peel="force"]`](https://unpoly.com/api/up-follow#up-peel) instead.
- When a listener keeps an overlay open, the overlays below it now also stay open.
- To close overlays even when a listener prevents it, use [`[up-peel="force"]`](https://unpoly.com/api/up-follow#up-peel), or pass `{ force: true }` to `up.Layer#accept()`, `up.Layer#dismiss()` or `up.Layer#peel()`. You can combine `force` with an intent, e.g. `[up-peel="accept force"]`.
- Pressing the back button still closes overlays, even when a listener prevents it.
- New [`[up-on-accept]`](https://unpoly.com/api/up-layer-new#up-on-accept) and [`[up-on-dismiss]`](https://unpoly.com/api/up-layer-new#up-on-dismiss) attributes run code before an overlay closes, and can keep it open with `event.preventDefault()`. The matching [`{ onAccept }`](https://unpoly.com/api/up.layer.open#options.onAccept) and [`{ onDismiss }`](https://unpoly.com/api/up.layer.open#options.onDismiss) options are now documented.
- When an overlay that was opened without an `{ origin }` closes, focus now moves to the parent overlay, as described in [focus in overlays](https://unpoly.com/learn/focus#overlays). It used to fall back to the `<body>`.
- Fix: [`[up-focus-visible]`](https://unpoly.com/api/up-follow#up-focus-visible) and the `{ focusVisible }` option were ignored when opening an overlay.
- Fix: The `{ duration }` and `{ easing }` options of `up.layer.open()` were ignored for the opening animation. This also affected `[up-duration]` and `[up-easing]` on a link that opens an overlay. Only `up.layer.config` was used.


### Caching

- New config [`up.network.config.cacheEnabled`](https://unpoly.com/api/up.network.config#config.cacheEnabled) turns off the [cache](https://unpoly.com/learn/caching) entirely, e.g. for debugging. When it is `false`, no response is read from or written to the cache, and [preloading](https://unpoly.com/learn/preloading) is disabled. If you used `up.network.config.cacheSize = 0` to turn off caching, [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading) now tells you to use this setting instead.
- An [`X-Up-Expire-Cache: false`](https://unpoly.com/api/X-Up-Expire-Cache) response header now expires no cache entries, like [`X-Up-Evict-Cache: false`](https://unpoly.com/api/X-Up-Evict-Cache). It used to be treated as a URL pattern matching `/false`.
- Fix: When a compiler requested the URL of a request that had just been aborted or had just finished, it sometimes got the old request from the cache. It now makes a new request.


### Rendering

- Fix: The `{ onFailFinished }` callback and `[up-on-fail-finished]` attribute are now called after an [error response](https://unpoly.com/learn/error-responses) has finished rendering. They used to never be called.
- Fix: [`[up-reveal-padding]`](https://unpoly.com/api/up-follow#up-reveal-padding) and the `{ revealPadding }` render option were ignored. Only `up.viewport.config.revealPadding` was used.
- Fix: [Target derivation](https://unpoly.com/learn/target-derivation) for an SVG element with a camelCase tag name, like `<clipPath>`, now produces a selector that matches the element.
- Fix: While an overlay was open, `up.fragment.get(root, selector)` could return an element outside the given root.
- When the server responds to [polling](https://unpoly.com/api/up-poll) or a [deferred](https://unpoly.com/api/up-defer) placeholder with an error code, Unpoly no longer throws an uncaught `up.CannotMatch` error. The response is not rendered: polling tries again after the next interval, and a deferred placeholder keeps its fallback content. A promise returned by `up.reload()` or `up.deferred.load()` still rejects, now with an `up.RenderResult`. To render error responses anyway, set [`[up-fail=false]`](https://unpoly.com/learn/error-responses) on the `[up-poll]` or `[up-defer]` element, or render them into another fragment with [`[up-fail-target]`](https://unpoly.com/api/up-defer#up-fail-target).
- With [`up.history.config.enabled = false`](https://unpoly.com/api/up.history.config#config.enabled), a render pass no longer changes the window title, meta tags or `html[lang]`. Before, only the browser URL stayed unchanged, so the page could show the title of one page with the URL of another.
- Fix: An explicit list of elements passed as [`{ metaTags }`](https://unpoly.com/api/up.render#options.metaTags) was replaced by the meta tags from the response.
- Fix: [`[up-scroll-behavior]`](https://unpoly.com/api/up-follow#up-scroll-behavior) and the `{ scrollBehavior }` option were ignored when scrolling to the `top` or `bottom`, to a pixel position, to a `#hash` or when restoring a scroll position. Only revealing an element honored them.
- Fix: A [combined transition](https://unpoly.com/learn/transitions#combining-animations) like `move-to-bottom/none` swapped the elements instantly. When one half is `none`, the other half is now animated.


### Links and URLs

- Pressing the Space key now activates a [faux button](https://unpoly.com/learn/faux-interactive-elements), e.g. an element with [`[up-emit]`](https://unpoly.com/api/up-emit) or [`[up-clickable]`](https://unpoly.com/api/up-clickable). Before, only the Enter key worked.
- An [`[up-on-offline]`](https://unpoly.com/api/up-follow#up-on-offline) callback now receives the `up:fragment:offline` event as `event`, so it can call `event.retry()`. It used to receive the event as `error`.
- [URL patterns](https://unpoly.com/api/url-patterns) now match full URLs on the page's own origin, like `https://example.com/users/*`. Such patterns never matched before.


### Smaller fixes and changes

- `unpoly.js` is now compiled using ES2024 (up from ES2021). It needs Chrome 119, Firefox 121 or Safari 17.4, all released by March 2024. The [ES6 build](https://unpoly.com/learn/legacy-browsers#es6-build) for legacy browsers remains available.
- A `click` event dispatched by a script is no longer passed to [`up.on()`](https://unpoly.com/api/up.on) callbacks when the element has a `[disabled]` attribute, even for elements that browsers cannot disable. Before, only a `disabled` property had this effect.
- The npm package now also includes source maps for the unminified files, like `unpoly.js.map`.
- `up.template.clone()` with an `{ origin }` now also finds a template in an ancestor layer, as described in [template lookup](https://unpoly.com/learn/templates#lookup). It used to only look in the origin's layer.
- Fix: `up.viewport.restoreFocus()` threw an error when called without a `{ layer }` option, or with a layer name like `{ layer: 'root' }`.
- Fix: `up.viewport.restoreScroll()` ignored its `{ location }` option. It always restored the positions saved for the layer's current location.
- Fix: `up.fragment.matches()` with `{ layer: 'new', mode }` options expanded a selector like `:main` for the root layer, or threw an error while an overlay was open.
- Fix: The `unpoly-migrate.js` polyfills for `up.popup.attach()`, `up.modal.follow()` and `up.modal.extract()` now open a new overlay again.
- Fix: The `unpoly-migrate.js` polyfill for `up.network.shouldReduceRequests()` now logs a warning instead of throwing an error.


> [!NOTE]
> Our sponsor [makandra](https://makandra.de/en) funded this release ❤️\
> You can hire makandra for [Unpoly support](https://unpoly.com/support).
