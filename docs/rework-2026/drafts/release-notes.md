3.15.0
-----

This release comes with a new documentation site, written for people and for coding agents.
Unpoly now also works with custom form fields, like date pickers built as web components.

Breaking changes are marked with ⚠️ when [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading) polyfills them,
and with ❌ when they need a change to your code. Bug fixes and changes that align Unpoly with native browser behavior
are listed in their topic without a marker.

> [note]
> Our sponsor [makandra](https://makandra.de/en) funded this release ❤️\
> You can hire makandra for [Unpoly support](https://unpoly.com/support).

Contents:

- [A new documentation site](#a-new-documentation-site)
- [Docs for coding agents](#docs-for-coding-agents)
- [Custom form fields](#custom-form-fields)
- [Form submissions now match the browser](#form-submissions-now-match-the-browser)
- [Forms](#forms)
- [Overlays](#overlays)
- [Caching](#caching)
- [Rendering](#rendering)
- [Links and URLs](#links-and-urls)
- [Smaller fixes and changes](#smaller-fixes-and-changes)
- [Upgrading](#upgrading)


### A new documentation site

We rewrote unpoly.com so you can learn Unpoly from start to finish, and look up details when you need them.

The site now has two areas. **Learn** at `/learn` explains concepts and shows how to combine features for common tasks.
The **API reference** at `/api` documents every attribute, function, event and option.

- [Getting started](/start/overview) replaces the old tutorial. Eight short pages take you from how Unpoly works to your first links, forms, overlays and compilers.
- After Getting started, the Learn area has 13 chapters, from [Links](/links) and [Forms](/forms) to [Backend integration](/backend-integration) and [Advanced rendering](/advanced-rendering). Each chapter opens with an overview page. Every page ends with a link to the next one, so you can read the docs like a book.
- Every API page links to the Learn pages that explain its topic.
- New guides cover [following links](/following-links), [handling all links](/handling-all-links) and [all forms](/handling-all-forms), [hungry elements](/hungry-elements), [streaming real-time updates](/real-time-updates) over Server-Sent Events or WebSockets, [background requests](/background-requests), [React or Vue components as islands](/islands), [custom form fields](/custom-form-fields) and the [server protocol](/server-protocol).
- The search was rebuilt. It shows whether a result is a Learn page or an API page, and where it sits in the docs.
- We checked many code examples against the source code and fixed the ones that did not work.

Guides now live under `/learn`, like `/learn/caching`. API pages live under `/api`, like `/api/up.render`.
Some pages also got a new name, e.g. *Handling failed responses* is now [Error responses](/error-responses), and *Preserving elements* is now [Keeping elements](/keeping-elements).
Old URLs redirect to the new pages, so your links and bookmarks keep working.


### Docs for coding agents

Your coding agent can now read the same documentation as you, in a format it can use well.

- Every page is also available as Markdown. Append `.md` to its URL, e.g. [`https://unpoly.com/api/up.render.md`](https://unpoly.com/api/up.render.md). Agents that ask for `text/markdown` first in their `Accept` header get Markdown at the page's own URL.
- [`/llms.txt`](https://unpoly.com/llms.txt) lists all guides and API modules, with links an agent can follow.
- An [agent skill](/skill) bundles every guide, the API reference and the release notes of all versions, with a search script that works offline. The release notes help your agent upgrade an app from an older Unpoly version.

Install the skill with the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add --global https://unpoly.com
```

If you use Claude Code, you can also [install the skill as a plugin](/skill#claude-code).
To give a chat a single page, use the copy button next to a page's title. It copies the page as Markdown.


### Custom form fields

Custom controls like date pickers or tag editors can now take part in Unpoly forms like a native `<input>`.
Unpoly now builds request params with the browser's own form-data algorithm, so a
[form-associated custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#form-associated_custom_elements)
is submitted without any configuration.
When it also has a `value` property, Unpoly can [watch](/up.watch), [validate](/validation) and [switch](/switching-form-state) it like any other field, and [`[up-disable]`](/disabling-forms) disables it while the form is submitting.

Here is a minimal date picker that reports its value to the form:

```js
class DatePicker extends HTMLElement {
  static formAssociated = true // mark: formAssociated
  #internals = this.attachInternals()
  #value = ''

  get value() {
    return this.#value
  }

  set value(newValue) {
    this.#value = newValue
    this.#internals.setFormValue(newValue) // mark: setFormValue
  }

  // Called when the user picks a day in the calendar
  onDayPicked(day) {
    this.value = day
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

customElements.define('date-picker', DatePicker)
```

You can use it in a form like a native field, including with [`[up-validate]`](/up-validate):

```html
<form method="post" action="/events" up-submit up-validate>
  <date-picker name="starts_at"></date-picker> <!-- mark: date-picker -->
  <input type="text" name="title">
</form>
```

An element that is defined after the form was rendered, e.g. by a lazily loaded component, is picked up as soon as it is defined.
Values appended by a [`formdata`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event) listener are now sent as well.

The new guide [Custom form fields](/custom-form-fields) compares four ways to build a custom control, from a hidden native field to a plain `<div>` that you register as a field.

Thanks to @kmmbvnr for contributing form-associated custom elements and `formdata` support.


### Form submissions now match the browser

Unpoly now uses the browser's form-data algorithm, so edge cases behave like a native form submission:

- A form with an `<input type="file">` is now submitted as `multipart/form-data`, even when no file is selected.
- An `<input type="image">` used as the submit button now sends its `name.x` and `name.y` coordinates instead of its `[value]`.
- A `<button type="reset">` or `<input type="reset">` with a `[name]` no longer sends a param. It is no longer watched or validated, but [`[up-disable]`](/up-submit#up-disable) still disables it.
- A field inside a `<fieldset disabled>` is no longer submitted or validated. This includes custom elements in `up.form.config.fieldSelectors`. [Watchers](/up.watch) and [`[up-switch]`](/switching-form-state) still see the field.
- Params now arrive in the order the browser produces them: the form's fields in document order, then values from `formdata` listeners, then custom elements registered in `up.form.config.fieldSelectors`. A submit button's `[name]` and `[value]` now appear at the button's position, not after the form's `[up-params]`.
- A [validation](/validation) request no longer sends the params of the form's first submit button, and no longer uses that button's `[formaction]`, `[formmethod]`, `[up-params]` or `[up-headers]`. Nobody pressed the button, so only the `<form>` decides where a validation goes.
- Unpoly now throws an error when a field uses a `[form]` attribute to join a form in another [layer](/up.layer). The browser would submit that field with the wrong layer's form. If you render the same page in an overlay, give each form a unique `[id]`, or move the field into the form. The error message suggests these fixes.
- `up.Params.fromForm()` now requires a `<form>` element, as documented. To read params from any other container, use `up.Params.fromContainer()`.
- `up.Params.fromForm()` takes a new `{ submitButton }` option. It defaults to the form's first submit button. Pass `false` to send no button. The `{ includeDisabled }` option is ignored here, because the browser never sends a disabled field.
- When a form with [`[up-accept]` or `[up-dismiss]`](/closing-overlays#result-values) closes an overlay, the result value now also contains the `[name]` and `[value]` of the submit button the user pressed.


### Forms

- While a [validation](/validation) request is loading, [feedback classes](/feedback-classes) like `.up-loading` are now set by default, as for every other request. To turn them off, set `[up-watch-feedback="false"]` or pass `{ feedback: false }`.
- A custom control only needs a `value` property to work as a [custom form field](/custom-form-fields).
- A form-associated custom element is only submitted when it calls `setFormValue()`, even when it is listed in `up.form.config.fieldSelectors`.
- A `formdata` listener changes what Unpoly sends, not what it watches. See [Adding values with a `formdata` listener](/custom-form-fields#formdata).
- New experimental config [`up.form.config.noFieldSelectors`](/up.form.config#config.noFieldSelectors) excludes elements from being treated as fields, e.g. a form-associated custom element that renders a button.
- When Unpoly disables a custom control that has no `disabled` property, it now sets the `[disabled]` attribute.
- When Unpoly [focuses](/focus) a form-associated custom element, it now sets `.up-focus-visible`, even after a mouse or touch interaction. Such an element is now a field, and `up.viewport.config.autoFocusVisible` shows a [focus ring](/focus-visibility) for every field.
- A custom control with a `[name]` but no readable value no longer reports an `undefined` value to watchers.
- ⚠️ `up.form.config.genericButtonSelectors` was renamed to `up.form.config.anyButtonSelectors`. It now matches every kind of button, including submit and reset buttons. The old name is polyfilled by `unpoly-migrate.js`.


### Overlays

- ❌ An `up:layer:dismiss` or `up:layer:accept` listener can now keep an overlay open when a link or form in a parent layer would close it ([peeling](/closing-overlays#peeling)). The render pass then fails with `up.Aborted` and nothing is updated. See [Upgrading](#upgrading) for how to keep the old behavior.
- When a listener keeps an overlay open, the overlays below it now also stay open.
- To close overlays even when a listener prevents it, use [`[up-peel="force"]`](/up-follow#up-peel), or pass `{ force: true }` to `up.Layer#accept()`, `up.Layer#dismiss()` or `up.Layer#peel()`. You can combine `force` with an intent, e.g. `[up-peel="accept force"]`.
- Pressing the back button still closes overlays, even when a listener prevents it.
- New [`[up-on-accept]`](/up-layer-new#up-on-accept) and [`[up-on-dismiss]`](/up-layer-new#up-on-dismiss) attributes run code before an overlay closes, and can keep it open with `event.preventDefault()`. The matching [`{ onAccept }`](/up.layer.open#options.onAccept) and [`{ onDismiss }`](/up.layer.open#options.onDismiss) options are now documented.


### Caching

- New config [`up.network.config.cacheEnabled`](/up.network.config#config.cacheEnabled) turns off the [cache](/caching) entirely, e.g. for debugging. When it is `false`, no response is read from or written to the cache, and [preloading](/preloading) is disabled.
- An [`X-Up-Expire-Cache: false`](/X-Up-Expire-Cache) response header now expires no cache entries, like [`X-Up-Evict-Cache: false`](/X-Up-Evict-Cache). It used to be treated as a URL pattern matching `/false`.
- Fix: When a compiler requested the URL of a request that had just been aborted or had just finished, it sometimes got the old request from the cache. It now makes a new request.


### Rendering

- Fix: The `{ onFailFinished }` callback and `[up-on-fail-finished]` attribute are now called after an [error response](/error-responses) has finished rendering. They used to never be called.
- Fix: [`[up-reveal-padding]`](/up-follow#up-reveal-padding) and the `{ revealPadding }` render option were ignored. Only `up.viewport.config.revealPadding` was used.
- Fix: [Target derivation](/target-derivation) for an SVG element with a camelCase tag name, like `<clipPath>`, now produces a selector that matches the element.
- Fix: While an overlay was open, `up.fragment.get(root, selector)` could return an element outside the given root.


### Links and URLs

- Pressing the Space key now activates a [faux button](/faux-interactive-elements), e.g. an element with [`[up-emit]`](/up-emit) or [`[up-clickable]`](/up-clickable). Before, only the Enter key worked.
- An [`[up-on-offline]`](/up-follow#up-on-offline) callback now receives the `up:fragment:offline` event as `event`, so it can call `event.retry()`. It used to receive the event as `error`.
- [URL patterns](/url-patterns) now match full URLs on the page's own origin, like `https://example.com/users/*`. Such patterns never matched before.


### Smaller fixes and changes

- A `click` event dispatched by a script is no longer passed to [`up.on()`](/up.on) callbacks when the element has a `[disabled]` attribute, even for elements that browsers cannot disable. Before, only a `disabled` property had this effect.
- The npm package now also includes source maps for the unminified files, like `unpoly.js.map`.
- Fix: The `unpoly-migrate.js` polyfills for `up.popup.attach()`, `up.modal.follow()` and `up.modal.extract()` now open a new overlay again.
- Fix: The `unpoly-migrate.js` polyfill for `up.network.shouldReduceRequests()` now logs a warning instead of throwing an error.


### Upgrading

Most changes in this release need no changes to your code. Check these cases:

- **Overlays that refuse to close.** If you have an `up:layer:dismiss` or `up:layer:accept` listener that prevents closing, e.g. to confirm unsaved changes, it now also runs when a link in a parent layer closes the overlay. To let those links close the overlay as before, return early when `event.value` is `':peel'`:

  ```js
  up.on('up:layer:dismiss', function(event) {
    if (event.value === ':peel') return // mark-line
    if (!confirm('Discard your changes?')) event.preventDefault()
  })
  ```

  To force a single link, set [`[up-peel="force"]`](/up-follow#up-peel) instead.

- **Form params.** If your server or your tests depend on the exact params of a submission, review the items in [Form submissions now match the browser](#form-submissions-now-match-the-browser). The browser's form-data algorithm cannot be polyfilled.
- **Overlays that reuse a page with `[form]` fields.** If a page uses the `[form]` attribute and you also open it in an overlay, give each form a unique `[id]`, or move the field into the form.
- **Validation styles.** Validations now set `.up-loading` and other [feedback classes](/feedback-classes). If your styles should not apply during a validation, set `[up-watch-feedback="false"]` on the form.

[`unpoly-migrate.js`](/changes/upgrading) polyfills the renamed `up.form.config.genericButtonSelectors`.
If you used `up.network.config.cacheSize = 0` to turn off caching, it now tells you to set `up.network.config.cacheEnabled = false` instead.
