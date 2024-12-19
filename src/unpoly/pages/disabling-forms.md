Disabling forms while working
================================

You may disable form fields and buttons during submission, by passing a `{ disable }` option or setting an `[up-disable]` attribute.

By disabling form controls you can prevent concurrent use of the form and provide feedback that the form is processing. A common requirement is to prevent duplicate form submissions from users clicking the submit button multiple times.


## Disabling the entire form

To fully prevent access to the form while it is submitting, you need to disable all input fields and buttons.

For this pass `{ disable: true }` or set an empty `[up-disable]` attribute on the `<form>` element:

```html
<form up-submit up-disable action="/session"> <!-- mark-phrase "up-disable" -->
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->
</form>
```


## Disabling some controls only

To only disable some form controls, set the value of `[up-disable]` to any selector that matches fields or buttons.

In the example below we disable all `<button>` elements by setting an `[up-disable="button"]` attribute on the form: 

```html
<form up-submit up-disable="button" action="/session"> <!-- mark-phrase "button" -->
  <input type="text" name="email">         <!-- will NOT be disabled -->
  <input type="password" name="password">  <!-- will NOT be disabled -->
  <button type="submit">Sign in</button>   <!-- will be disabled -->
  <button type="reset">Clear form</button> <!-- will be disabled -->
</form>
```

Instead of targeting form controls directly, you may also pass a selector for a container element. All fields and buttons within that container will be disabled:

```html
<form up-submit up-disable=".actions" action="/session"> <!-- mark-phrase ".actions" -->
  <input type="text" name="email">           <!-- will NOT be disabled -->
  <input type="password" name="password">    <!-- will NOT be disabled -->
  <div class="actions">
    <button type="submit">Sign in</button>   <!-- will be disabled -->
    <button type="reset">Clear form</button> <!-- will be disabled -->
  </div>  
</form>
```


## Disabling a form from a link

Sometimes we want to disable form fields when the user activates a hyperlink.
This prevents unwanted user input in the form while the link is navigating away.

Setting an `[up-disable]` attribute on a link will disable all fields within the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) form:

```html
<form action="/session">
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->

  <a href="/register" up-disable> <!-- mark-phrase "up-disable" -->
    Register an account instead
  </a>
</form>
```

If the form is not an ancestor of the link, you can also set the `[up-disable]` value
to a CSS selector that matches a form, fields, or any container that contains fields:

```html
<form action="/session" id="session-form"> <!-- mark-phrase "session-form" -->
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->
</form>

<a href="/register" up-disable="#session-form"> <!-- mark-phrase "#session-form" -->
  Register an account instead
</a>
```


## Disabling fields while watching

Unpoly has a number of features that watch a form for changes, like `[up-validate]`, `[up-watch]` or `[up-autosubmit]`.
You may disable form elements while a watcher is processing by setting an `[up-watch-disable]` attribute on a field, on the `<form>` or on any container that contains fields.

See [watch options](/watch-options) for details.



@page disabling-forms
