Submitting forms in-place
=========================

You can enhance any form to update the existing page, without making a full page load.


## Forms that update fragments {#submit}

Begin with a regular `<form>` element, with standard `[method]` and `[action]` attributes.
To have Unpoly handle the form submission, set an `[up-submit]` attribute.
This will cause Unpoly to submit the form using JavaScript and update the [main element](/main)
with the response:

```html
<form method="post" action="/path" up-submit> <!-- mark: up-submit -->
  ...
</form>

<main>
  <!-- chip: Content will appear here -->
</main>
```

The server response must contain at least the targeted `<main>` element.
It's OK for the response to contain other HTML, or even the entire application layout.
However, only the `<main>` element will be extracted and placed into the page.
Other elements will be discarded from the response and will be kept unchanged on the page.

### Updating other fragments {#target}

Instead of updating the [main element](/main), you can [target any fragment](/targeting-fragments) in the page.
To do so, set an [`[up-target]`](/up-submit#up-target) attribute with a CSS selector matching the element you want to swap:

```html
<form method="post" action="/path" up-submit up-target="#success"> <!-- mark: up-target="#success" -->
  ...
</form>

<div id="success"> <!-- mark: id="success" -->
  <!-- chip: Content will appear here -->
</div>
```


## Handling validation errors {#validation}

When the form could not be submitted due to invalid user input,
Unpoly defaults to re-rendering the form to show validation errors.

For Unpoly to be able to detect a failed form submission, the backend must respond with a non-200 HTTP status code.
We recommend to use [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) (Unprocessable Entity).
You can also [configure other methods for detecting failed responses](/failed-responses#customizing-failure-detection). 

If the server responds with any error code, Unpoly will ignore the `[up-target]` attribute
and update the `<form>` element:

```html
<form method="post" action="/path" up-submit up-target="#success">
  <!-- chip: ❌ Failed responses will appear here -->
</form>

<div id="success">
  <!-- chip: ✔️ Successful responses will appear here -->
</div>
```

> [tip]
> See [validating forms](/validation) for many methods of validating user input,
> including live server validation while the user is completing fields.

### Rendering error messages elsewhere {#fail-target}

Instead of re-rendering the form, you can update any fragment on the page by setting an
[`[up-fail-target]`](/up-submit#up-fail-target) attribute:

```html
<form method="post" action="/path" up-submit up-target="#success" up-fail-target="#failure"> <!-- mark: up-fail-target="#failure" -->
</form>

<div id="success">
  <!-- chip: ✔️ Successful responses will appear here -->
</div>

<div id="failure"> <!-- mark: id="failure" -->
  <!-- chip: ❌ Failed responses will appear here -->
</div>
```


## Multiple submit buttons {#submit-buttons}

Just like in regular HTML, you can have multiple submit buttons on a form.
Unpoly will submit the form when any of the buttons is clicked. Submitting the form
by pressing the `Enter` key will submit using the first submit button.

### Per-button parameters {#per-button-params}

If a submit button has a `[name]` and `[value]` attribute, it will be included
in the form parameters sent to the server:

```html
<form method="post" action="/proposal" up-submit>
  <button type="submit" name="decision" value="accept">Accept</button> <!-- chip: Sends { decision: 'accept' } -->
  <button type="submit" name="decision" value="reject">Reject</button> <!-- chip: Sends { decision: 'reject' } -->
</form>
```

To include multiple params, set an [`[up-params]`](/up-submit#up-params) attribute on the button:

```html
<button type="submit" up-params="{ decision: 'reject', reason: 'Poor quality' }">Reject</button> <!-- mark: up-params="{ decision: 'reject', reason: 'Poor quality' }" -->
```

### Per-button actions {#per-button-action}

Submit buttons can cause the form to submit to a different server endpoint,
by setting `[formaction]` and `[formaction]` attributes:

```html
<form method="post" action="/proposal/accept" up-submit> <!-- mark: action="/proposal/accept" -->
  <button type="submit">Accept</button>
  <button type="submit" formaction="/proposal/reject">Reject> <!-- mark: formaction="/proposal/reject" -->
</form>
```

### Overriding render options {#per-button-options}

Submit buttons can supplement or override most Unpoly attributes from the form:

```html
<form method="post" action="/proposal/accept" up-submit>
  <button type="submit" up-target="#success">Accept</button>
  <button type="submit" up-target="#failure" up-confirm="Really reject?">Reject</button> <!-- mark: up-confirm="Really reject?" -->
</form>
```

See [`[up-submit]`](/up-submit#attributes) for a list of overridable attributes 


### Opting into a full page load {#per-button-opt-out}

Individual submit buttons can opt for a full page load, by setting an `[up-submit="false"]` attribute:

```html
<form method="post" action="/report/update" up-submit>
  <button type="submit" name="command" value="save">Save report</button>
  <button type="submit" name="command" value="download" up-submit="false">Download PDF</button> <!-- mark: up-submit="false" -->
</form>
```

  



## Showing that the form is processing {#loading}

You can apply arbitrary effects while a form is submitting, such as disabling controls or previewing the final page state.

See [Loading state](/loading-state) and [Disabling form while working](/disabling-forms).


## Handling all forms automatically {#unobtrusive}

You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute:

```js
up.form.config.submitSelectors.push(['form'])
```

You can except individual forms by setting a `[up-submit="false"]` attribute.

See [Handling all links and forms](/handling-everything).


## Submitting forms with JavaScript {#script}

You can use the `up.submit()` function to submit a form from a script:

```js
let form = document.querySelector('form#my-form')
up.form.submit(form)
```

The `up.submit()` call will parse all modifying attributes for `[up-submit]` from the given form element. You can pass additional options to override (or supplement) any options parsed from the form's attributes:

```js
// This overrides any [up-target] or [up-transition] attributes
up.submit(form, { target: '#elsewhere', transition: 'cross-fade' })
```




@page submitting-forms
@menu-title Submitting forms

