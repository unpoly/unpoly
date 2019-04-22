#= require ./namespace

class up.Change.FromURL

  constructor: (options) ->
    @successOptions = u.options(options)
    # Remember the layer that was current when the request was made,
    # so changes with `{ layer: 'new' }` will know what to stack on.
    @successOptions.currentLayer = up.layer.current
    @successOptions.inspectResponse = @fullLoad
    @successOptions.navigate ?= true # TODO: Better name for { navigate }
    @deriveFailureOptions()

  deriveFailureOptions: ->
    # `successOptions` is an object like
    #
    #     { foo: 1, failFoo: undefined, bar: 2, failBar: 3, baz: 4 }
    #
    # We want to use the failVariant keys where they exists and are defined.
    # Hence the result should be:
    #
    #     { foo: 1, bar: 3, baz: 4 }
    #
    # Note how we *don't* override `foo` with `undefined`.
    @failureOptions = u.copy(@successOptions)
    if @failureOptions.allowFailOverrides != false
      for key, value of @failureOptions
        # Keep key/value unless there is a defined failOverride
        if unprefixedKey = u.unprefixCamelCase(key, 'fail')
          failValue = u.pluckKey(@failureOptions, key)
          unless u.isUndefined(failValue)
            @failureOptions[unprefixedKey] = failValue

  execute: ->
    if !up.browser.canPushState() && options.history != false
      fullLoad() unless options.preload
      return u.unresolvablePromise()

    @buildRequest()

    promise = up.request(@request)
    unless options.preload
      promise = promise.then(@onRequestSuccess, @onRequestFailure)
    return promise

  buildRequest: ->
    successPreview = new up.Change.FromContent(@successOptions)
    failurePreview = new up.Change.FromContent(@failureOptions)

    @successOptions.layer = successPreview.preflightLayer()
    @failureOptions.layer = failurePreview.preflightLayer()

    requestAttrs = u.only @successOptions,
      'url',
      'method',
      'data', # deprecated
      'params',
      'cache',
      'preload',
      'headers',
      'timeout',
      'navigate'

    u.assign requestAttrs,
      target: successPreview.preflightTarget()
      failTarget: failurePreview.preflightTarget()
      preflightLayer: @successOptions.layer

    @request = new up.Request(requestAttrs)

  onRequestSuccess: (response) =>
    @processResponse(response, @successOptions)

  onRequestFailure: (response) =>
    rejectWithFailedResponse = -> Promise.reject(response)
    if @failedResponseHasContent(response)
      promise = @processResponse(response, @failureOptions)
      # Although processResponse() we will perform a successful replacement of options.failTarget,
      # we still want to reject the promise that's returned to our API client.
      u.always(promise, rejectWithFailedResponse)
    else
      rejectWithFailedResponse()

  processResponse: (response, options) ->
    @augmentOptionsFromResponse(response, options)
    new up.Change.FromContent(options).execute()

  augmentOptionsFromResponse: (response, options) ->
    options.document = response.text

    responseUrl = response.url
    locationFromExchange = responseUrl

    if hash = @request.hash
      options.hash = hash
      locationFromExchange += hash

    isReloadable = (response.method == 'GET')

    if u.isString(options.history)
      up.legacy.warn("Passing a URL as { history } option is deprecated. Pass it as { location } instead.")
      delete options.history
      options.location = options.history

    if isReloadable
      # Remember where we got the fragment from so we can up.reload() it later.
      options.source = responseUrl
    else
      # Keep the source of the previous fragment (e.g. the form that was submitted into failure).
      options.source = 'keep'
      # Since the current URL is not retrievable over the GET-only address bar,
      # we can only provide history if a location URL is passed as an option.
      options.history = !options.location

    # Accept { history: false } as a shortcut to disable all history-related options.
    if options.history == false
      options.location = null
      options.title = null
    else
      options.location ?= locationFromExchange
      options.title ?= response.title

    options.acceptLayer = response.acceptLayer
    options.dismissLayer = response.dismissLayer


  failedResponseHasContent: (response) ->
    # Check if the failed response wasn't cause by a fatal error
    # like a timeout or disconnect.
    (response instanceof up.Response) && !response.isFatalError()

  fullLoad: =>
    up.browser.loadPage(@successOptions.url, u.only(@successOptions, 'method', 'params'))
