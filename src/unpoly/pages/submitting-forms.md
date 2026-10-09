Submitting forms
================

Any form can update a fragment of the current page, instead of loading a full new document.
Your server handles the submission like any other, and Unpoly swaps the response into the page.


## Submitting a form {#submit}

Begin with a regular `<form>` element, with standard `[method]` and `[action]` attributes.
To have Unpoly handle the submission, set an `[up-submit]` attribute:

```html
<form method="post" action="/subscribers" up-submit> <!-- mark: up-submit -->
  <input type="email" name="email">
  <button type="submit">Subscribe</button>
</form>
```

When the user submits, Unpoly sends the form data in the background.
The server responds with a full HTML page, the same way it would for any browser request.
Unpoly extracts the response's [main element](/main) and replaces the main element
on the current page. The rest of the page stays untouched.

The response may contain other HTML, or even the entire application layout.
Only the main element is extracted. Other elements are discarded from the response,
and their counterparts on the page are kept unchanged.

The form remains a standard form. When JavaScript is unavailable,
the browser submits it with a full page load.

> [tip]
> Instead of annotating individual forms, you can also configure Unpoly
> to [handle all forms on the page](/handling-all-forms).


## Updating a specific fragment {#target}

To update an element other than the main element, set an [`[up-target]`](/up-submit#up-target)
attribute with a CSS selector:

```html
<form method="post" action="/comments" up-submit up-target="#comments"> <!-- mark: up-target="#comments" -->
  <textarea name="text"></textarea>
  <button type="submit">Post comment</button>
</form>

<div id="comments"> <!-- mark: id="comments" -->
  <!-- chip: Content will appear here -->
</div>
```

Unpoly finds the `#comments` element in the server response and swaps it into the current page.

An `[up-target]` attribute already implies `[up-submit]`, so you don't need to set both.
The same goes for other rendering attributes like `[up-layer]` or `[up-transition]`.

A target can also address multiple fragments, append to an existing element,
or resolve relative to the form. See [[targeting-fragments]] for everything
a target selector can express.


## Handling validation errors {#validation}

When the form could not be submitted due to invalid user input,
your server should re-render the form with error messages and respond with
a non-200 status code. We recommend
[HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) (Unprocessable Content).

The error code tells Unpoly that the submission failed. Unpoly then ignores
the `[up-target]` attribute and updates the `<form>` element instead,
so the user sees your error messages next to their input:

```html
<form method="post" action="/comments" up-submit up-target="#comments">
  <!-- chip: ❌ Failed responses will appear here -->
</form>

<div id="comments">
  <!-- chip: ✔️ Successful responses will appear here -->
</div>
```

The form's values and messages all come from your server-rendered HTML.
Unpoly only decides which fragment to show them in.

If your server cannot respond with error codes, you can
[configure other ways to detect failed responses](/failed-responses#customizing-failure-detection).

> [tip]
> Unpoly can also validate fields while the user is still filling in the form.
> See [[validation]].

### Rendering error messages elsewhere {#fail-target}

Instead of re-rendering the form, you can update any fragment on the page by setting an
[`[up-fail-target]`](/up-submit#up-fail-target) attribute:

```html
<form method="post" action="/comments" up-submit up-target="#comments" up-fail-target="#errors"> <!-- mark: up-fail-target="#errors" -->
  ...
</form>

<div id="comments">
  <!-- chip: ✔️ Successful responses will appear here -->
</div>

<div id="errors"> <!-- mark: id="errors" -->
  <!-- chip: ❌ Failed responses will appear here -->
</div>
```

Most render options have such a `fail`-prefixed variant.
See [[failed-responses]] for details.


## Navigation defaults

Submitting a form is considered [navigation](/navigation) by default.
When a form updates the layer's main element, Unpoly behaves like a full page load would:
the browser URL and history are updated, and the new content is scrolled into view.
Focus moves to the new fragment.

See [[navigation]] for all navigation defaults and how to customize them.


## Multiple submit buttons {#submit-buttons}

Just like in regular HTML, a form can have multiple submit buttons.
Unpoly submits the form when any of the buttons is clicked. Pressing `Enter` in a text field
submits using the first submit button.

### Per-button parameters {#per-button-params}

A submit button with `[name]` and `[value]` attributes contributes its value
to the form parameters sent to the server:

```html
<form method="post" action="/proposal" up-submit>
  <button type="submit" name="decision" value="accept">Accept</button> <!-- chip: Sends { decision: 'accept' } -->
  <button type="submit" name="decision" value="reject">Reject</button> <!-- chip: Sends { decision: 'reject' } -->
</form>
```

To send multiple params, set an [`[up-params]`](/up-submit#up-params) attribute on the button:

```html
<button type="submit" up-params="{ decision: 'reject', reason: 'Poor quality' }">Reject</button> <!-- mark: up-params="{ decision: 'reject', reason: 'Poor quality' }" -->
```

### Per-button actions {#per-button-action}

A submit button can send the form to a different server endpoint,
by setting standard `[formaction]` and `[formmethod]` attributes:

```html
<form method="post" action="/proposal/accept" up-submit> <!-- mark: action="/proposal/accept" -->
  <button type="submit">Accept</button>
  <button type="submit" formaction="/proposal/reject">Reject</button> <!-- mark: formaction="/proposal/reject" -->
</form>
```

### Overriding render options {#per-button-options}

A submit button can supplement or override most `[up-...]` attributes from the form:

```html
<form method="post" action="/proposal" up-submit up-target="#status">
  <button type="submit" name="decision" value="accept">Accept</button>
  <button type="submit" name="decision" value="reject" up-confirm="Really reject?">Reject</button> <!-- mark: up-confirm="Really reject?" -->
</form>
```

See [`[up-submit]`](/up-submit#attributes) for a list of overridable attributes.

### Opting into a full page load {#per-button-opt-out}

An individual submit button can opt for a full page load, by setting an `[up-submit="false"]` attribute:

```html
<form method="post" action="/report/update" up-submit>
  <button type="submit" name="command" value="save">Save report</button>
  <button type="submit" name="command" value="download" up-submit="false">Download PDF</button> <!-- mark: up-submit="false" -->
</form>
```


## Showing that the form is processing {#loading}

While a submission is loading, you can disable the form's fields and buttons.
This prevents duplicate submissions and signals that the form is busy:

```html
<form method="post" action="/subscribers" up-submit up-disable> <!-- mark: up-disable -->
  <input type="email" name="email">
  <button type="submit">Subscribe</button>
</form>
```

See [[disabling-forms]] for disabling only some controls.

Unpoly also sets [feedback classes](/feedback-classes) on the form while it is submitting,
and can show [placeholders](/placeholders) or run arbitrary [previews](/previews).
See [[loading-state]] for an overview.


## Submitting forms from JavaScript {#script}

To submit a form element programmatically, pass it to `up.submit()`:

```js
let form = document.querySelector('form.subscribe')
up.submit(form)
```

The form's `[up-...]` attributes are honored, as if the user had submitted the form.
You can pass additional [render options](/up.render#parameters) to supplement
or override the form's attributes:

```js
up.submit(form, { target: '#elsewhere', transition: 'cross-fade' })
```

To update fragments without a form element, use `up.render()`.


## Handling all forms automatically {#unobtrusive}

You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute:

```js
up.form.config.submitSelectors.push('form')
```

Individual forms can opt out by setting an `[up-submit="false"]` attribute.

See [[handling-all-forms]] for the exceptions under this setting.


@page submitting-forms
@signature
