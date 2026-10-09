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


## Configuring default behavior for all elements {#defaults}

Instead of configuring the same attributes on many elements, you can configure
Unpoly to apply behavior to all elements matching a given CSS selector.

Pushing a selector to `up.form.config.submitSelectors` is an example of this pattern.
Other examples are `up.link.config.followSelectors` for [links](/handling-all-links)
or `up.form.config.fieldSelectors` for [custom form fields](/custom-form-fields#configured).

> [tip]
> An alternative way to apply default behavior to many elements is a [macro](/up.macro).


### Making exceptions

You can still make exceptions by setting an `[up-submit=false]` attribute:

```html
<form method="post" action="/report" up-submit="false"> <!-- mark: up-submit="false" -->
  ...
</form>
```

Submitting this form makes a full page load, as if Unpoly had not been loaded.


## Customizing navigation defaults

[Submitting a form](/up-submit) or [following a link](/following-links) is considered
[navigation](/navigation-defaults) by default.

When navigating, Unpoly uses defaults to satisfy the user's expectations regarding
scrolling, history, focus, request cancellation, etc.

See [navigation defaults](/submitting-forms#navigation-defaults) for how a submission behaves,
and [[navigation-defaults]] for a detailed breakdown of all defaults and how to customize them.


## Fixing legacy JavaScript code

Legacy code often contains JavaScript that expects a full page load whenever the
user submits a form. When Unpoly handles all forms, submitting no longer
causes these additional page loads.

See [[legacy-scripts]] for making such code work with Unpoly.


@page handling-all-forms
@signature
