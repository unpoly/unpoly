Disabling forms while processing
================================

You may disable form fields and buttons during submission, by passing a `{ disable }` option or `[up-disable]` attribute.

By disabling form controls you can prevent concurrent use of the form and provide feedback that the form is processing. A common requirement is to prevent duplicate form submissions from users clicking the submit button multiple times.


### Disabling the entire form

To fully prevent access to the form while it is submitting, you need to disable all input fields and buttons.

For this pass `{ disable: true }` or set an empty `[up-disable]` attribute on the `<form>` element:

```html
<form up-disable action="/session">
  <input type="text" name="email">        <!-- will be disabled -->
  <input type="password" name="password"> <!-- will be disabled -->
  <button type="submit">Sign in</button>  <!-- will be disabled -->
</form>
```


### Disabling some controls only

To only disable some form controls, set the value of `[up-disable]` to any selector that matches fields or buttons.

In the example below we disable all `<button>` elements by setting an `[up-disable="button"]` attribute on the form: 

```html
<form up-disable="button" action="/session">
  <input type="text" name="email">         <!-- will NOT be disabled -->
  <input type="password" name="password">  <!-- will NOT be disabled -->
  <button type="submit">Sign in</button>   <!-- will be disabled -->
  <button type="reset">Clear form</button> <!-- will be disabled -->
</form>
```

Instead of targeting form controls directly, you may also pass a selector for a container element. All fields and buttons within that container will be disabled:

```html
<form up-disable=".buttons" action="/session">
  <input type="text" name="email">           <!-- will NOT be disabled -->
  <input type="password" name="password">    <!-- will NOT be disabled -->
  <div class="buttons">
    <button type="submit">Sign in</button>   <!-- will be disabled -->
    <button type="reset">Clear form</button> <!-- will be disabled -->
  </div>  
</form>
```

### Disabling fields while watching

Unpoly has a number of features that watch a form for changes, like `[up-validate]`, `[up-watch]` or `[up-autosubmit]`.
You may disable form elements while a watcher is processing by setting an `[up-watch-disable]` attribute on a field, on the `<form>` or on any container that contains fields.

See [watch options](/watch-options) for details.



@page disabling-forms
