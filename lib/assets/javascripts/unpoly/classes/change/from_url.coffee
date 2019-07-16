#= require ./change

u = up.util

class up.Change.FromURL extends up.Change

  constructor: (options) ->
    super(options)
    @successOptions = u.copy(@options)
    # Remember the layer that was current when the request was made,
    # so changes with `{ layer: 'new' }` will know what to stack on.
    @successOptions.currentLayer = up.layer.current
    @successOptions.inspectResponse = @fullLoad
    @deriveFailureOptions()

  @PREFLIGHT_KEYS: [
    'url',
    'method',
    'origin',
    'headers',
    'query', # TODO
    'params',
    'cache',
    'navigate',
    'confirm',
    'feedback',
    'origin',
  ]

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
    mode = @successOptions.failOptions ? 'explicit'

    switch mode
      when 'explicit'
        # In explicit mode the developer needs to pass all failVariant
        # keys that should be used for failed responses. From the succcess options
        # we only inherit keys that need to be known before the request goes out,
        # like { method }, { url } or { params }.
        preflightOptions = u.only(@successOptions, @constructor.PREFLIGHT_KEYS...)
        @failureOptions = u.merge(preflightOptions, @explicitFailureOptions())
      when 'inherit'
        # In inherit mode all success options are copied and can then be
        # overridden with failVariant keys.
        @failureOptions = u.merge(@successOptions, @explicitFailureOptions())
      when 'mirror'
        # In mirror mode we use the same options for failure that we use for success.
        # This is useful for up.validate(), where we want to always use the form's
        # success options regardless of the response status.
        @failureOptions = u.copy(@successOptions)

  explicitFailureOptions: ->
    opts = {}
    for key, value of @successOptions
      # Keep key/value unless there is a defined failOverride
      if unprefixedKey = u.unprefixCamelCase(key, 'fail')
        failValue = @successOptions[key]
        # up.OptionParser sets keys to undefined, even if neither options nor element
        # produces that option. Hence we ignore undefined values. To override it with
        # an empty value, the developer needs to pass null instead.
        unless u.isUndefined(failValue)
          opts[unprefixedKey] = failValue
    return opts

  execute: ->
    if !up.browser.canPushState() && @successOptions.history != false
      @fullLoad() unless @successOptions.preload
      return u.unresolvablePromise()

    @buildRequest()

    promise = up.request(@request)
    unless @successOptions.preload
      promise = promise.then(@onRequestSuccess, @onRequestFailure)
    return promise

  buildRequest: ->
    console.debug("buildRequest with successOptions %o", @successOptions)
    console.debug("buildRequest with failureOptions %o", @failureOptions)

    successPreview = new up.Change.FromContent(@successOptions)
    failurePreview = new up.Change.FromContent(@failureOptions)

    @successOptions.layer = successPreview.preflightLayer()
    @failureOptions.layer = failurePreview.preflightLayer()

    requestAttrs = u.merge @successOptions,
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

    responseURL = response.url
    locationFromExchange = responseURL

    console.debug("TODO: Restore old behavior from master that respects response success/failure")

    if hash = @request.hash
      options.hash = hash
      locationFromExchange += hash

    isReloadable = (response.method == 'GET')

    if isReloadable
      # Remember where we got the fragment from so we can up.reload() it later.
      options.source ?= responseURL
    else
      # Keep the source of the previous fragment (e.g. the form that was submitted into failure).
      options.source ?= 'keep'
      # Since the current URL is not retrievable over the GET-only address bar,
      # we can only provide history if a location URL is passed as an option.
      options.history = !options.location

    options.location ?= locationFromExchange
    options.title ?= response.title
    options.acceptLayer = response.acceptLayer
    options.dismissLayer = response.dismissLayer
    options.event = response.event
    options.layerEvent = response.layerEvent

  failedResponseHasContent: (response) ->
    # Check if the failed response wasn't cause by a fatal error
    # like a timeout or disconnect.
    (response instanceof up.Response) && !response.isFatalError()

  fullLoad: =>
    up.browser.loadPage(@successOptions.url, u.only(@successOptions, 'method', 'params'))
