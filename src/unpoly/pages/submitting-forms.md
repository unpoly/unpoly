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
<form method="post" action="/path" up-submit up-target="#success"> <!-- mark: #success -->
  ...
</form>

<div id="success"> <!-- mark: success -->
  <!-- chip: Content will appear here -->
</div>
```


## Handling validation errors {#validation}

When the form could not be submitted due to invalid user input,
Unpoly defaults to re-rendering the form to show validation errors.

For Unpoly to be able to detect a failed form submission, the backend must response with a non-200 HTTP status code.
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

## Rendering error messages elsewhere

Instead of re-rendering the form, you can update any fragment on the page by setting an
[`[up-fail-target]`](/up-submit#up-fail-target) attribute:

```html
<form method="post" action="/path" up-submit up-target="#success" up-fail-target="#failure">
</form>

<div id="success">
  <!-- chip: ✔️ Successful responses will appear here -->
</div>

<div id="failure">
  <!-- chip: ❌ Failed responses will appear here -->
</div>
```


## Multiple submit buttons


## Showing that the form is processing

See [Loading state](/loading-state) and [Disabling form controls while working](/disabling-forms).


## Short notation

You may omit the `[up-submit]` attribute if the form has one of the following attributes:

- `[up-target]`
- `[up-layer]`
- `[up-transition]`

Such a form will still be submitted through Unpoly.

## Handling all forms automatically

You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute.

See [Handling all links and forms](/handling-everything).


@page submitting-forms
