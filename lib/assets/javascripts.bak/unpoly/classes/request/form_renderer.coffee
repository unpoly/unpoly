u = up.util
e = up.element


# In HTML5, forms may only have a GET or POST method.
# There were several proposals to extend this to PUT, DELETE, etc.
# but they have all been abandoned.
HTML_FORM_METHODS = ['GET', 'POST']

class up.Request.FormRenderer

  constructor: (@request) ->

  buildAndSubmit: ->
    @params = u.copy(@request.params)
    action = @request.url
    method = @request.method

    # GET forms cannot have an URL with a query section in their [action] attribute.
    # The query section would be overridden by the serialized input values on submission.
    paramsFromQuery = up.Params.fromURL(action)
    @params.addAll(paramsFromQuery)
    action = up.Params.stripURL(action)

    unless u.contains(HTML_FORM_METHODS, method)
      # HTML forms can only have a GET or POST method. Other HTTP methods will be converted
      # to a `POST` request and carry their original method as a `_method` parameter.
      method = up.protocol.wrapMethod(method, @params)

    @form = e.affix(document.body, 'form.up-request-loader', { method, action })

    # We only need an [enctype] attribute if the user has explicitely
    # requested one. If none is given, we can use the browser's default
    # [enctype]. Binary values cannot be sent by this renderer anyway, so
    # we don't need to default to multipart/form-data in this case.
    if contentType = @request.contentType
      @form.setAttribute('enctype', contentType)

    if (csrfParam = @request.csrfParam()) && (csrfToken = @request.csrfToken())
      @params.add(csrfParam, csrfToken)

    # @params will be undefined for GET requests, since we have already
    # transfered all params to the URL during normalize().
    u.each(@params.toArray(), @addField.bind(this))

    up.browser.submitForm(@form)

  addField: (attrs) ->
    e.affix(@form, 'input[type=hidden]', attrs)
