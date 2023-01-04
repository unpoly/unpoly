Validating forms
================

There are levels


Validating after submission
---------------------------



Server should responds to non-200 status code. We recommend to use 422 (unprocessable entity)

Form targets itself by default. By deriving a target. This preserves elements around the form. 

Use fail-prefixed options

You can tell Unpoly to handle all forms.

```html
<form action="/users">

  <fieldset>
    <label for="email" up-validate>E-mail</label>
    <input type="text" id="email" name="email">
  </fieldset>

  <fieldset>
    <label for="password" up-validate>Password</label>
    <input type="password" id="password" name="password">
  </fieldset>

  <button type="submit">Register</button>

</form>
```

Backend must respond with error code. 

Response with 422 (unprocessable entity):

```html
<form action="/users">

  <fieldset>
    <label for="email" up-validate>E-mail</label>
    <input type="text" id="email" name="email">
    <div class="error">E-mail has already been taken!</div> <!-- mark-line -->
  </fieldset>
  
  ...

</form>
```





Validating after change
------------------------

- User gets quick feedback, does not need to scroll for error messages
- `[up-validate]`
- Form groups
- Submits form to its `[action]` with an `X-Up-Validate` header
- Same response, just don't serialize
- Example controller
- By default `[up-validate]` validates on `change`. Customize with `[up-watch-event]` or `up.form.config.watchChangeEvents`.




Validating while typing
-----------------------

- By default `[up-validate]` 

```html
<input name="email"
  up-validate
  up-watch-event="input"
  up-keep
>
```


HTML5 validations
-----------------

Like `[required]` or `pattern`

> [CAUTION]
> Client-side validations are not a [substitution](/foo) for server-side validation. A malicious user can always alter the network request.


@page validation
