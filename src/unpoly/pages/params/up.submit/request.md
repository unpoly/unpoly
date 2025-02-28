@partial up.submit/request

@mix up.render/request
  @param options.url
    Where to send the form data when the form is submitted.

    Defaults to the form's `[action]` attribute.

  @param options.method
    The HTTP method to use for the request.

    Defaults to the form's `[method]` attribute.

    The value is case-insensitive.

    You can also use methods that would not be allowed on a `<form>` element,
    such as `'patch`' or `'delete'`. These will be [wrapped in a POST request](/up.network.config#config.wrapMethod).

  @param options.params
    Additional [Form parameters](/up.Params) that should be sent as the request's
    [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

    The given value will be added to params [parsed](/up.Params.fromForm)
    from the form's input fields.

@param {Element|false} [options.submitButton]
  The submit button used to submit the form.

  If the submit button has a `[name]` and `[value]` attribute, it will
  be included in the request params.

  By default, the form's first submit button will be assumed.
  Pass `{ submitButton: false }` to not assume any submit button.
