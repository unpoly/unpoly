Validating forms
================


Form roundtrip
--------------

Server responds to non-200 status code

Form targets itself by default

Use fail-prefixed options


Re-rendering completed form groups
----------------------------------

- `[up-validate]`
- Form groups

```html
<form action="/users">

  <fieldset>
    <label for="email" up-validate>E-mail</label>
    <input type="text" id="email" name="email" />
  </fieldset>

  <fieldset>
    <label for="password" up-validate>Password</label>
    <input type="password" id="password" name="password" />
  </fieldset>

  <button type="submit">Register</button>

</form>
```


HTML5 validations
-----------------

Like `[required]` or `pattern`

> [CAUTION]
> Client-side validations are not a [substitution](/foo) for server-side validation. A malicious user can always alter the network request.


@page validating-forms
 
