#= require ../request

u = up.util
e = up.element


# In HTML5, forms may only have a GET or POST method.
# There were several proposals to extend this to PUT, DELETE, etc.
# but they have all been abandoned.
HTML_FORM_METHODS = ['GET', 'POST']

class up.Request.FormRenderer

  constructor: (@request) ->

  buildAndSubmit: ->
    params = u.copy(@request.params)
    action = @request.url
    method = @request.method

    # GET forms cannot have an URL with a query section in their [action] attribute.
    # The query section would be overridden by the serialized input values on submission.
    paramsFromQuery = up.Params.fromURL(action)
    params.addAll(paramsFromQuery)
    action = u.normalizeURL(action, search: false)

    unless u.contains(HTML_FORM_METHODS, method)
      # HTML forms can only have a GET or POST method. Other HTTP methods will be converted
      # to a `POST` request and carry their original method as a `_method` parameter.
      method = up.protocol.wrapMethod(@request.method, params)

    @form = e.affix(document.body, 'form.up-request-loader', { method, action })

    if (csrfParam = @request.csrfParam()) && (csrfToken = @request.csrfToken())
      params.add(csrfParam, csrfToken)

    # @params will be undefined for GET requests, since we have already
    # transfered all params to the URL during normalize().
    u.each(params.toArray(), @addField.bind(this))

    up.browser.submitForm(@form)

  addField: (attrs) ->
    e.affix(@form, 'input[type=hidden]', attrs)
