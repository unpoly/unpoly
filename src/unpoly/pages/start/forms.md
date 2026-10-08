Submit a form
=============

Forms can update fragments the same way links do.
One convention on your server also makes failed validations work.


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


Showing validation errors
-------------------------

This is the one thing Unpoly asks of your backend: when the user submitted
invalid data, re-render the form with error messages and respond with an error
code like [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422)
(Unprocessable Content).

The error code tells Unpoly that the submission failed. Instead of updating
the main element, Unpoly now updates **the `<form>` itself**, so the user sees
your error messages next to their input:

```html
<form method="post" action="/subscribers" up-submit>
  <input type="email" name="email" value="no-at-sign">
  <div class="error">Please enter a valid email address.</div> <!-- chip: rendered by your server -->
  <button type="submit">Subscribe</button>
</form>
```

The form's values and messages all come from your server-rendered HTML.
Unpoly only decides which fragment to show them in.


@page start/forms
@signature
