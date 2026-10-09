Disabling forms while working
=============================

Unpoly can disable a form's fields and buttons while it is submitting, by setting
an `[up-disable]` attribute or passing a `{ disable }` option.
This prevents duplicate submissions and shows the user that the form is processing.


## Disabling the entire form {#disabling-the-entire-form}

To fully prevent access to the form while it is submitting, set an empty `[up-disable]` attribute on the `<form>` element:

```html
<form method="post" action="/session" up-submit up-disable> <!-- mark: up-disable -->
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->
</form>
```

When the form is submitted, all fields and buttons are disabled.
When the server responds, they are re-enabled before the response is rendered.

> [info]
> The values of disabled fields are still included in the submitted form params.

From JavaScript you can pass a `{ disable: true }` option:

```js
up.submit(form, { disable: true })
```


## Disabling some controls only {#disabling-some-controls-only}

To only disable some form controls, set the value of `[up-disable]` to a CSS selector.
All matching fields and buttons are disabled.

In the example below we disable all `<button>` elements by setting an `[up-disable="button"]` attribute on the form:

```html
<form method="post" action="/session" up-submit up-disable="button"> <!-- mark: up-disable="button" -->
  <input type="text" name="email">         <!-- will NOT be disabled -->
  <input type="password" name="password">  <!-- will NOT be disabled -->
  <button type="submit">Sign in</button>   <!-- will be disabled -->
  <button type="reset">Clear form</button> <!-- will be disabled -->
</form>
```

Instead of targeting form controls directly, you may also pass a selector for a container element.
All fields and buttons within that container are disabled:

```html
<form method="post" action="/session" up-submit up-disable=".actions"> <!-- mark: up-disable=".actions" -->
  <input type="text" name="email">           <!-- will NOT be disabled -->
  <input type="password" name="password">    <!-- will NOT be disabled -->
  <div class="actions">
    <button type="submit">Sign in</button>   <!-- will be disabled -->
    <button type="reset">Clear form</button> <!-- will be disabled -->
  </div>
</form>
```

From JavaScript you can pass a selector, an element or an array of elements:

```js
up.submit(form, { disable: [button, field] })
```


## Disabling a form from a link {#from-link}

Sometimes we want to disable form fields when the user activates a hyperlink.
This prevents unwanted user input in the form while the link is navigating away.

Setting an `[up-disable]` attribute on a link within a form disables all fields and buttons of that form:

```html
<form method="post" action="/session" up-submit>
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->

  <a href="/register" up-follow up-disable> <!-- mark: up-disable -->
    Register an account instead
  </a>
</form>
```

If the link is not within the form, set the `[up-disable]` value
to a CSS selector that matches the form, some fields, or any container that contains fields:

```html
<form method="post" action="/session" id="session-form" up-submit> <!-- mark: id="session-form" -->
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->
</form>

<a href="/register" up-follow up-disable="#session-form"> <!-- mark: up-disable="#session-form" -->
  Register an account instead
</a>
```


## Disabling controls while watching {#while-watching}

Unpoly has a number of features that watch a form for changes, like `[up-validate]`, `[up-watch]` or `[up-autosubmit]`.
To disable form controls while such a watcher is processing a change, set an `[up-watch-disable]` attribute
on the watched field, on the `<form>` or on any container that contains fields:

```html
<form method="post" action="/purchases" up-watch-disable> <!-- mark: up-watch-disable -->
  <select name="continent" up-validate="#country">...</select>
  <select name="country" id="country">...</select>
</form>
```

See [disabling fields while working](/watch-options#disabling) for details.


## Disabling controls from a preview {#from-preview}

When [previewing a request](/previews), you can use the
[`preview.disable()`](/up.Preview.prototype.disable) method to temporarily disable controls.

For example, this preview disables an `input[name=email]` and all controls within a container matching `.button-bar`:

```js
up.preview('sign-in', function(preview) {
  preview.disable('input[name=email]')
  preview.disable('.button-bar')
})
```

Like all preview changes, the controls are re-enabled when the request ends.


## Focus preservation {#focus-preservation}

Disabled fields cannot have focus. This is a browser limitation.

When a focused field is disabled by `[up-disable]` or `{ disable }`, it loses focus. In this case Unpoly
focuses the closest [form group](/up-form-group) around the field. If the field is not within a form group,
the containing `<form>` is focused.

When the render pass ends, Unpoly restores focus, selection range and scroll position of any element that lost focus through disabling.
When the user focuses something else during the render pass, no focus-related state is restored after rendering.


@page disabling-forms
