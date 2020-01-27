#= require ../request

u = up.util
e = up.element

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

    if @request.method != 'GET'
      # Browser forms can only have GET or POST methods.
      # When we want to make a request with another method, most backend
      # frameworks allow to pass the method as a param.
      params.add(up.protocol.config.methodParam, @request.method)
      method = 'POST'

    @form = e.affix(document.body, 'form.up-page-loader', { method, action })

    if (csrfParam = @request.csrfParam()) && (csrfToken = @request.csrfToken())
      params.add(csrfParam, csrfToken)

    # @params will be undefined for GET requests, since we have already
    # transfered all params to the URL during normalize().
    u.each(params.toArray(), @addField.bind(this))

    up.browser.submitForm(@form)

  addField: (attrs) ->
    e.affix(@form, 'input[type=hidden]', attrs)
