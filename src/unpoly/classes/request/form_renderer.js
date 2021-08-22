const u = up.util
const e = up.element

// In HTML5, forms may only have a GET or POST method.
// There were several proposals to extend this to PUT, DELETE, etc.
// but they have all been abandoned.
const HTML_FORM_METHODS = ['GET', 'POST']

up.Request.FormRenderer = class FormRenderer {

  constructor(request) {
    this.request = request
  }

  buildAndSubmit() {
    this.params = u.copy(this.request.params)
    let action = this.request.url
    let { method } = this.request

    // GET forms cannot have an URL with a query section in their [action] attribute.
    // The query section would be overridden by the serialized input values on submission.
    const paramsFromQuery = up.Params.fromURL(action)
    this.params.addAll(paramsFromQuery)
    action = up.Params.stripURL(action)

    if (!u.contains(HTML_FORM_METHODS, method)) {
      // HTML forms can only have a GET or POST method. Other HTTP methods will be converted
      // to a `POST` request and carry their original method as a `_method` parameter.
      method = up.protocol.wrapMethod(method, this.params)
    }

    this.form = e.affix(document.body, 'form.up-request-loader', { method, action })

    // We only need an [enctype] attribute if the user has explicitly
    // requested one. If none is given, we can use the browser's default
    // [enctype]. Binary values cannot be sent by this renderer anyway, so
    // we don't need to default to multipart/form-data in this case.
    let contentType = this.request.contentType
    if (contentType) {
      this.form.setAttribute('enctype', contentType)
    }

    let csrfParam, csrfToken
    if ((csrfParam = this.request.csrfParam()) && (csrfToken = this.request.csrfToken())) {
      this.params.add(csrfParam, csrfToken)
    }

    // @params will be undefined for GET requests, since we have already
    // transfered all params to the URL during normalize().
    u.each(this.params.toArray(), this.addField.bind(this))

    up.browser.submitForm(this.form)
  }

  addField(attrs) {
    e.affix(this.form, 'input[type=hidden]', attrs)
  }
}
