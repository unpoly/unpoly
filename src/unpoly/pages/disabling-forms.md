Disabling forms while working
=============================

You may disable form fields and buttons during submission, by passing a `{ disable }` option or setting an `[up-disable]` attribute.

By disabling form controls you can prevent concurrent use of the form and provide feedback that the form is processing. A common requirement is to prevent duplicate form submissions from users clicking the submit button multiple times.


## Disabling the entire form

To fully prevent access to the form while it is submitting, you need to disable all input fields and buttons.

For this set an empty `[up-disable]` attribute on the `<form>` element:

```html
<form up-submit up-disable action="/session"> <!-- mark-phrase: up-disable -->
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->
</form>
```

When the form is submitted, all form fields will be disabled.
When the server responds all fields will be re-enabled before the response is rendered.

> [info]
> The values of disabled fields will still be included in the submitted form params.

From JavaScript you can pass an `{ disable: true }` option:

```js
up.submit(form, { disable: true })
```


## Disabling some controls only

To only disable some form controls, set the value of `[up-disable]` to any CSS selector. All matching fields and buttons will be disabled.

In the example below we disable all `<button>` elements by setting an `[up-disable="button"]` attribute on the form: 

```html
<form up-submit up-disable="button" action="/session"> <!-- mark-phrase: button -->
  <input type="text" name="email">         <!-- will NOT be disabled -->
  <input type="password" name="password">  <!-- will NOT be disabled -->
  <button type="submit">Sign in</button>   <!-- will be disabled -->
  <button type="reset">Clear form</button> <!-- will be disabled -->
</form>
```

Instead of targeting form controls directly, you may also pass a selector for a container element. All fields and buttons within that container will be disabled:

```html
<form up-submit up-disable=".actions" action="/session"> <!-- mark-phrase: .actions -->
  <input type="text" name="email">           <!-- will NOT be disabled -->
  <input type="password" name="password">    <!-- will NOT be disabled -->
  <div class="actions">
    <button type="submit">Sign in</button>   <!-- will be disabled -->
    <button type="reset">Clear form</button> <!-- will be disabled -->
  </div>  
</form>
```

From JavaScript you can also pass a selector, or an array of elements:

```js
up.submit(form, { disable: [button, field] })
```



## Disabling a form from a link {#from-link}

Sometimes we want to disable form fields when the user activates a hyperlink.
This prevents unwanted user input in the form while the link is navigating away.

Setting an `[up-disable]` attribute on a link will disable all fields within the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) form:

```html
<form action="/session">
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->

  <a href="/register" up-disable> <!-- mark-phrase: up-disable -->
    Register an account instead
  </a>
</form>
```

If the form is not an ancestor of the link, you can also set the `[up-disable]` value
to a CSS selector that matches a form, fields, or any container that contains fields:

```html
<form action="/session" id="session-form"> <!-- mark-phrase: session-form -->
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->
</form>

<a href="/register" up-disable="#session-form"> <!-- mark-phrase: #session-form -->
  Register an account instead
</a>
```


## Disabling controls while watching {#while-watching}

Unpoly has a number of features that watch a form for changes, like `[up-validate]`, `[up-watch]` or `[up-autosubmit]`.
You may disable form elements while a watcher is processing by setting an `[up-watch-disable]` attribute on a field, on the `<form>` or on any container that contains fields.

See [watch options](/watch-options) for details.


## Disabling controls from a preview {#from-preview}

When [previewing a request](/previews), you can use the
[`preview.disable()`](/up.Preview.prototype.disable) method to temporarily disable controls.

For example, this preview disables an `input[name=email]` and all controls within a container matching `.button-bar`:

```js
up.preview('.sign-in', function(preview) {
  preview.disable('input[name=email]')
  preview.disable('.button-bar')
})
```

## Focus preservation

Disabled fields cannot have focus. This is a browser limitation.

When a focused field is disabled by `[up-disable]` or `{ disable }`, it will lose focus. In this case Unpoly will
focus the closest [form group](/up-form-group) around the field. If the field is not within a form group, the containing `<form>` is focused.

When the render pass ends, Unpoly will restore focus, selection range and scroll position of any element that lost focus through disabling.
When the user focuses something else during the render pass, no focus-related state is restored after rendering.



@page disabling-forms
