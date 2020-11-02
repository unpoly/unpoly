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

    # By default HTTP methods other than `GET` or `POST` will be converted into a `POST`
    # request and carry their original method as a `_method` parameter. This is to
    # [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).
    method = up.network.wrapMethod(@request.method, params)

    @form = e.affix(document.body, 'form.up-page-loader', { method, action })

    if (csrfParam = @request.csrfParam()) && (csrfToken = @request.csrfToken())
      params.add(csrfParam, csrfToken)

    # @params will be undefined for GET requests, since we have already
    # transfered all params to the URL during normalize().
    u.each(params.toArray(), @addField.bind(this))

    up.browser.submitForm(@form)

  addField: (attrs) ->
    e.affix(@form, 'input[type=hidden]', attrs)
