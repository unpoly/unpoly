Handling all forms
==================

You can configure Unpoly to handle every form on the page, without
annotating each form with an `[up-submit]` attribute.

Submissions then update fragments instead of loading full pages, and you need
fewer `[up-...]` attributes in your HTML.

> [note]
> Links can be handled the same way. See [[handling-all-links]].


## Submitting all forms {#submitting-all-forms}

To submit *all* forms on a page without requiring an `[up-submit]` attribute:

```js
up.form.config.submitSelectors.push('form')
```

Some forms will still submit with a full page load under this setting:

- Forms with an `[up-submit=false]` attribute.
- Forms with a [`[target]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#target) attribute (to target an iframe or open a new browser tab).
- Forms with a cross-origin `[action]` attribute.
- Any additional exceptions configured in `up.form.config.noSubmitSelectors`.

Scripts that expect a full page load after every submission need adjusting, see [[legacy-scripts]].


## Making exceptions {#exceptions}

You can still make exceptions by setting an `[up-submit=false]` attribute on a form:

```html
<form method="post" action="/report" up-submit="false"> <!-- mark: up-submit="false" -->
  ...
</form>
```

Submitting this form makes a full page load, as if Unpoly had not been loaded.

A single [submit button](/submitting-forms#submit-buttons) can also opt for a full page load
by setting an `[up-submit=false]` attribute on the button:

```html
<form method="post" action="/report/update">
  <button type="submit" name="command" value="save">Save report</button>
  <button type="submit" name="command" value="download" up-submit="false">Download PDF</button> <!-- mark: up-submit="false" -->
</form>
```

The form is still submitted through Unpoly when the user presses *Save report*.
Only *Download PDF* loads a full page.


## Using a macro instead {#macro}

Instead of changing `up.form.config.submitSelectors`, you can register a [macro](/up.macro)
that sets `[up-submit]` on every form:

```js
up.macro('form:not([up-submit=false])', function(form) {
  form.setAttribute('up-submit', '')
})
```

Forms with `[up-submit=false]` are left alone. The [exceptions above](#submitting-all-forms) still apply:
forms with a `[target]` or a cross-origin `[action]` load a full page.

A macro can set other attributes in the same pass, like [`[up-disable]`](/up-submit#up-disable)
to disable the form while it submits.


@page handling-all-forms
@signature
