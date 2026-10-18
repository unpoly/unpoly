Validating forms
================

Unpoly shows validation errors from your server, both after a form was submitted
and while the user is still filling in fields. The error messages are rendered by
your backend, with the same templates that render the form.


## Validating after submission {#validating-after-submission}

When a server-side app cannot save a form submission due to invalid user input,
it usually re-renders the form with validation errors. This pattern also works
for forms that are [submitted through Unpoly](/learn/submitting-forms).

Let's look at a registration form that asks for an e-mail address and a password:

```html
<form method="post" action="/users" up-submit>

  <fieldset>
    <label for="email">E-mail</label>
    <input type="text" id="email" name="email">
  </fieldset>

  <fieldset>
    <label for="password">Password</label>
    <input type="password" id="password" name="password">
  </fieldset>

  <button type="submit">Register</button>

</form>
```

We have some constraints that we want to validate when the form is submitted:

| Field        | Validation                        |
|--------------|-----------------------------------|
| `email`      | must be formatted correctly       |
| `email`      | must not be taken by another user |
| `password`   | must be longer than 8 characters  |

The backend code handling `POST /users` needs to handle two cases:

1. The form was submitted with valid data. We create a new account and sign in the user.
2. The form submission failed due to an invalid e-mail or password. We re-render the form with error messages.

In the second case, we render the form again with the submitted values and a message below each invalid field:

```html
<form method="post" action="/users" up-submit>

  <fieldset>
    <label for="email">E-mail</label>
    <input type="text" id="email" name="email" value="foo@bar.com">
    <div class="error">E-mail has already been taken!</div> <!-- mark-line -->
  </fieldset>

  <fieldset>
    <label for="password">Password</label>
    <input type="password" id="password" name="password" value="secret">
    <div class="error">Password is too short!</div> <!-- mark-line -->
  </fieldset>

  <button type="submit">Register</button>

</form>
```

### Signaling a failed submission {#signaling-a-failed-submission}

For Unpoly to detect the failed submission, the backend must respond with an HTTP status code outside the 2xx range.
We recommend [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) (Unprocessable Content).

In a Ruby on Rails app this would look like this:

```ruby
class UsersController < ApplicationController

  def create
    user_params = params.permit(:email, :password)
    @user = User.new(user_params)
    if @user.save
      sign_in @user
    else
      # Signal a failed form submission with an HTTP 422 status
      render 'form', status: :unprocessable_entity # mark-line
    end
  end

end
```

The examples use Ruby on Rails, but work similarly with any other backend.

If your server-side code cannot communicate status codes like that,
you may [customize Unpoly's failure detection](/learn/error-responses#customizing-failure-detection).

### Changing how validation errors are rendered {#changing-how-validation-errors-are-rendered}

When Unpoly detects a failed submission, it ignores the form's [target](/learn/targeting-fragments)
and updates the `<form>` element instead. This way validation errors always appear next to the user's input:

```html
<form method="post" action="/comments" up-submit up-target="#comments">
  <!-- chip: ❌ Error responses will appear here -->
</form>

<div id="comments">
  <!-- chip: ✔️ Successful responses will appear here -->
</div>
```

The form's values and messages all come from your server-rendered HTML.
Unpoly only decides which fragment to show them in.

To render an error response somewhere else, set an [`[up-fail-target]`](/api/up-submit#up-fail-target) attribute on the `<form>` element:

```html
<form method="post" action="/comments" up-submit up-target="#comments" up-fail-target="#errors"> <!-- mark: up-fail-target="#errors" -->
  ...
</form>

<div id="comments">
  <!-- chip: ✔️ Successful responses will appear here -->
</div>

<div id="errors"> <!-- mark: id="errors" -->
  <!-- chip: ❌ Error responses will appear here -->
</div>
```

Most render options have such a `fail`-prefixed variant.
See [rendering error responses differently](/learn/error-responses#fail-options) for details.

### HTML5 validations {#html5-validations}

HTML5 added a number of validations through attributes like
[`[required]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) or
[`[pattern]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern).
These validations are checked by the browser when the form is submitted.

You may also use HTML5 validation attributes for forms that are [submitted through Unpoly](/learn/submitting-forms).
A failed HTML5 validation prevents the form from being submitted.

> [caution]
> Client-side validations are no substitute for server-side checks. A malicious user can always alter the network request.


## Validating after changing a field {#validating-after-changing-a-field}

With the `[up-validate]` attribute, a field is validated on the server *as soon as the user leaves it*.
This gives the user quick feedback whether their input is valid,
without the need to scroll for error messages or to backtrack to fields completed earlier.

To use it, set an `[up-validate]` attribute on every field that should be validated with the server.
In the registration form above, that is both fields:

```html
<form method="post" action="/users" up-submit>

  <fieldset>
    <label for="email">E-mail</label>
    <input type="text" id="email" name="email" up-validate> <!-- mark: up-validate -->
  </fieldset>

  <fieldset>
    <label for="password">Password</label>
    <input type="password" id="password" name="password" up-validate> <!-- mark: up-validate -->
  </fieldset>

  <button type="submit">Register</button>

</form>
```

When the user changes the e-mail field and moves on, Unpoly submits the form to its `[action]` path.
The request carries all current field values and an additional `X-Up-Validate` header.
The server is expected to validate the input without saving it, and to render the form again with any errors.
Unpoly then updates only the [form group](#form-groups) around the changed field,
which is the `<fieldset>` here.

To validate all fields in a form, set `[up-validate]` on the `<form>` element instead.
You can also set it on any container to validate the fields within.

To submit the form whenever a field changes, like in a filter bar,
see [Submitting when a field changes](/learn/submitting-forms#autosubmit).

Users can change fields faster than your server responds, or submit the form while a validation
is still loading. Unpoly keeps the form consistent: it merges validations into a single request,
queues new validations while one is in flight, and aborts pending validations when a submission
replaces the form. See [preventing race conditions](/learn/reactive-server-forms#race-conditions) for details.

### Handling validation requests on the server {#backend}

Validation requests need a third case in the backend code that handles the form's `[action]` path.
Besides saving valid data and re-rendering an invalid form, the backend must now also render
a new form state from the request parameters when it sees an `X-Up-Validate` header:

```ruby
class UsersController < ApplicationController

  def create
    user_params = params.permit(:email, :password)
    @user = User.new(user_params)
    if request.headers['X-Up-Validate'] # mark-line
      @user.validate # mark-line
      render 'form' # mark-line
    elsif @user.save
      sign_in @user
    else
      render 'form', status: :unprocessable_entity
    end
  end

end
```

The status code does not matter for validation requests.
Unpoly always renders the response of a validation request, even with an error code.

See [`[up-validate]`](/api/up-validate#backend-protocol) for the request and response in detail.

### Which fragment is updated {#form-groups}

Unpoly only re-renders the *form group* around the validated field, not the entire form.
This keeps the user's other input, focus and scroll position intact while the request is loading.

By default, a form group is a `<fieldset>`, a `<label>` or any element with an `[up-form-group]` attribute
around the field. If the field is not within a group, the entire `<form>` is updated.
See `[up-form-group]` for details and `up.form.config.groupSelectors` to configure what counts as a group.

Many apps wrap each label, field and error message in a group like this:

```html
<div up-form-group> <!-- mark: up-form-group -->
  <label for="email">E-mail</label>
  <input type="text" id="email" name="email" up-validate>
  <div class="error">E-mail has already been taken!</div>
</div>
```

To update a different fragment instead of the form group, set the `[up-validate]` attribute to a CSS selector:

```html
<input type="text" name="email" up-validate=".email-errors"> <!-- mark: up-validate=".email-errors" -->
<div class="email-errors"></div>
```

Fields that update other parts of the form this way are how [[reactive-server-forms]] are built.


## Validating while typing {#validating-while-typing}

@include validating-while-typing


## Validating from JavaScript {#script}

To validate a field or form programmatically, pass it to `up.validate()`:

```js
let field = document.querySelector('input[name=email]')
up.validate(field)
```

Like `[up-validate]`, this submits the form with an `X-Up-Validate` header and
updates the field's form group with the response. You can also pass any other element
in the form to re-render it from the current field values:

```js
up.validate('.email-errors')
```

Multiple validations within the same form are [batched](/api/up.validate#batching) into a single request.


@page validation
@signature
