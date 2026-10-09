Forms
=====

Unpoly submits forms in the background and updates a fragment of the current page
with the response. Your server keeps rendering plain HTML, and one convention
on your backend also makes validation errors work. Fields can then re-render
parts of the form while the user is still filling it in.


Submitting in place
-------------------

Take a regular form, with standard `[method]` and `[action]` attributes,
and add an `[up-submit]` attribute:

```html
<form method="post" action="/subscribers" up-submit> <!-- mark: up-submit -->
  <input type="email" name="email">
  <button type="submit">Subscribe</button>
</form>
```

When the user submits, Unpoly sends the form data in the background.
Your server processes it like any form submission, usually responding with
a redirect to the next screen. Unpoly extracts the response's
[main element](/main) and swaps it into the current page.
The rest of the page keeps its state: scroll positions, focus and other forms all survive.

To update a different fragment, add an [`[up-target]`](/up-submit#up-target) attribute with a CSS selector:

```html
<form method="post" action="/comments" up-submit up-target="#comments"> <!-- mark: up-target="#comments" -->
  ...
</form>

<div id="comments">
  ...
</div>
```

The form stays a standard form. When JavaScript is unavailable,
the browser submits it with a full page load.

<p class="read-more"><a href="/submitting-forms">Read more: Submitting forms</a></p>


Submitting is navigation
------------------------

Submitting a form counts as [navigation](/navigation-defaults).
When a form updates the layer's main element, Unpoly behaves like a full page load would:
the browser URL and history are updated, and the new content is scrolled into view.
Each of these defaults can be customized.


Showing validation errors
-------------------------

When the user submitted invalid data, re-render the form with error messages and
respond with an error code like [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422).
Unpoly then ignores the `[up-target]` and updates the `<form>` element itself,
so the user sees your messages next to their input.

To validate a field before the form is submitted, set an `[up-validate]` attribute:

```html
<form method="post" action="/users" up-submit>
  <fieldset>
    <label for="email">E-mail</label>
    <input type="email" id="email" name="email" up-validate> <!-- mark: up-validate -->
  </fieldset>
  ...
</form>
```

When the user leaves the field, Unpoly submits the form with an `X-Up-Validate` header.
Your server validates the input without saving it and renders the form again.
Only the `<fieldset>` around the field is updated, now with any error message.

<p class="read-more"><a href="/validation">Read more: Validating forms</a></p>


Forms that react on the server
------------------------------

Since `[up-validate]` can target any fragment, a field can re-render other parts
of the form when it changes. Pick a continent, and the country select
is filled with the matching countries:

```html
<select name="continent" up-validate="#country"> <!-- mark: up-validate="#country" -->
  ...
</select>

<select name="country" id="country"> <!-- mark: id="country" -->
  ...
</select>
```

The server renders the new form state from the submitted values, using
the same HTML templates as always. Unpoly swaps in only the `#country` element.
When the user changes fields faster than the network responds, the form still
ends up in a consistent state.

<p class="read-more"><a href="/reactive-server-forms">Read more: Reactive server forms</a></p>


Switching state on the client
-----------------------------

Light effects like showing, hiding or disabling another element need no server request.
A field with an `[up-switch]` attribute controls elements that declare
for which values they are shown:

```html
<select name="payment" up-switch=".payment-dependent"> <!-- mark: up-switch=".payment-dependent" -->
  <option value="card">Credit card</option>
  <option value="invoice">Invoice</option>
</select>

<input name="card_number" class="payment-dependent" up-show-for="card"> <!-- mark: up-show-for="card" -->
```

The card number field is shown while *Credit card* is selected and hidden otherwise.

<p class="read-more"><a href="/switching-form-state">Read more: Switching form state</a></p>


Also in this topic
------------------

To disable fields and buttons while a form is submitting, see [[disabling-forms]].

To show confirmations or errors after a submission, see [[flashes]].

To submit all forms through Unpoly without annotating each one, see [[handling-all-forms]].

To build a date picker, tag editor or other control that works with these features, see [[custom-form-fields]].

To fine-tune which events trigger a validation and how changes are debounced, see [[watch-options]].

@page forms
@menu-title Overview
@signature
