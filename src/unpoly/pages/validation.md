Validating forms
================

Unpoly offers various methods to check user input against server-side validation rules,
and to display error messages for invalid fields.

You can validate forms [after submission](#validating-after-submission),
[after changing a field](#validating-after-changing-a-field) or
[while the user is typing](#validating-while-typing).


Validating after submission
---------------------------

When a server-side app could not commit a form submission due to invalid user input,
it will usually re-render the form with validation errors. This pattern can also be
used for forms that are [submitted through Unpoly](/up-submit).

Let's look at a standard registration form that asks for an e-mail and password:

```html
<form action="/users">

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
2. The form submission failed due to an invalid email or password. We re-render the form with error messages.

We're going to render validation errors using the following HTML:

  ```html
<form action="/users">

  <fieldset>
    <label for="email" up-validate>E-mail</label>
    <input type="text" id="email" name="email" value="foo@bar.com">
    <div class="error">E-mail has already been taken!</div> <!-- mark-line -->
  </fieldset>

  <fieldset>
    <label for="password" up-validate>Password</label>
    <input type="password" id="password" name="password" value="secret">
    <div class="error">Password is too short!</div> <!-- mark-line -->
  </fieldset>

</form>
```

### Signaling a failed submission

For Unpoly to be able to detect a failed form submission,
the backend must response with a non-200 HTTP status code.
We recommend to use [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422)
(Unprocessable Entity).

In a Ruby on Rails app this would look like this:

```ruby
class UsersController < ApplicationController

  def create
    user_params = params.require(:user).permit(:email, :password)
    @user = User.new(user_params)
    if @user.save?
      sign_in @user
    else
      # Signal a failed form submission with an HTTP 422 status
      render 'form', status: :unprocessable_entity
    end
  end

end
```

If your server-side code cannot communicate status codes like that,
you may [customize Unpoly's failure detection](/failed-responses#customizing-failure-detection).


### Changing how validation errors are rendered

When Unpoly detects a failed form submission, it will ignore the form's [target](/targeting-fragments)
and update the `<form>` element instead.

To configure the rendering of failed form submissions,
see [handling failed responses differently](/failed-responses#rendering-failed-responses-differently).


### HTML5 validations

HTML5 added a number of validations through attributes like
[`[required]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required) or
[`[pattern]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern).
These validations are checked on the client when the form is submitted.

You may also use HTML5 validation attributes for forms that are [submitted through Unpoly](/up-submit).
A failed HTML5 validation will prevent the form from being submitted.

> [CAUTION]
> Client-side validations are no substitution for server-side checks. A malicious user can always alter the network request.


Validating after changing a field
---------------------------------

The `[up-validate]` attribute is a comprehensive tool
to validate a form group on the server *as soon as the user blurs the field*.
This gives the user quick feedback whether their change is valid,
without the need to scroll for error messages or to backtrack to
fields completed earlier.

This behavior can be implemented by setting an `[up-validate]` attribute on inputs
that must be validated with the server:

```html
<form action="/users">

  <fieldset>
    <label for="email" up-validate>E-mail</label> <!-- mark-phrase "up-validate" -->
    <input type="text" id="email" name="email">
  </fieldset>

  <fieldset>
    <label for="password" up-validate>Password</label> <!-- mark-phrase "up-validate" -->
    <input type="password" id="password" name="password">
  </fieldset>

  <button type="submit">Register</button>

</form>
```

When a form field with an `[up-validate]` attribute is changed, the form is submitted to the server
which is expected to render a new form state from its current field values.
The [form group](/up-form-group) around the changed field is then updated with the server response.

For a full example see the [documentation for `[up-validate]`](/up-validate).

> [tip]
> The `[up-validate]` attribute is a useful tool to partially update a form when one fields depends on the value of another field.
> See [dependent fields](/dependent-fields) for more details and examples.


Validating while typing
-----------------------

@include validating-while-typing



@page validation
