#= require ./change

u = up.util

class up.Change.FromURL extends up.Change

  constructor: (options) ->
    super(options)

    @successOptions = u.copy(@options)
    @successOptions.inspectResponse = @fullLoad
    @deriveFailureOptions()

  # These options are used before the request is sent.
  # Hence there is no failVariant.
  @PREFLIGHT_KEYS: [
    'base',
    'inspectResponse',
    'url',
    'method',
    'origin',
    'headers',
    'query', # TODO
    'params',
    'cache',
    'solo',
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
        preflightOptions = u.pick(@successOptions, @constructor.PREFLIGHT_KEYS)
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
      # Drop key/value pair unless there is a defined failOverride
      if unprefixedKey = u.unprefixCamelCase(key, 'fail')
        failValue = @successOptions[key]
        # up.OptionParser sets keys to undefined, even if neither options nor element
        # produces that option. Hence we ignore undefined values. To override it with
        # an empty value, the developer needs to pass null instead.
        if u.isDefined(failValue)
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
    successPreview = new up.Change.FromContent(@successOptions)
    failurePreview = new up.Change.FromContent(@failureOptions)

    @successOptions.layer = successPreview.preflightLayer()
    @failureOptions.layer = failurePreview.preflightLayer(optional: true)

    requestAttrs = u.merge @successOptions,
      target: successPreview.preflightTarget()
      failTarget: failurePreview.preflightTarget(optional: true)
      layer: @successOptions.layer

    @request = new up.Request(requestAttrs)

  onRequestSuccess: (response) =>
    up.log.debug('Updating page with successful response')
    @processResponse(response, @successOptions)

  onRequestFailure: (response) =>
    rejectWithFailedResponse = -> Promise.reject(response)
    if @failedResponseHasContent(response)
      up.log.debug('Updating page with failed response')
      promise = @processResponse(response, @failureOptions)
      # Although processResponse() will fulfill with a successful replacement of options.failTarget,
      # we still want to reject the promise that's returned to our API client.
      return u.always(promise, rejectWithFailedResponse)
    else
      up.log.debug('Response failed without content')
      return rejectWithFailedResponse()

  processResponse: (response, options) ->
    @augmentOptionsFromResponse(response, options)
    new up.Change.FromContent(options).execute()

  augmentOptionsFromResponse: (response, options) ->
    options.html = response.text

    responseURL = response.url
    locationFromExchange = responseURL

    if hash = @request.hash
      options.hash = hash
      locationFromExchange += hash

    isReloadable = (response.method == 'GET')

    if isReloadable
      # Remember where we got the fragment from so we can up.reload() it later.
      options.source = @improveHistoryValue(options.source, responseURL)
    else
      # Keep the source of the previous fragment (e.g. the form that was submitted into failure).
      options.source = @improveHistoryValue(options.source, 'keep')
      # Since the current URL is not retrievable over the GET-only address bar,
      # we can only provide history if a location URL is passed as an option.
      options.history = !!options.location

    options.location = @improveHistoryValue(options.location, locationFromExchange)
    options.title = @improveHistoryValue(options.title, response.title)
    options.acceptLayer = response.acceptLayer
    options.dismissLayer = response.dismissLayer
    options.event = response.events

  # Values we want to keep:
  # - false (no update)
  # - string (forced update)
  # Values we want to override:
  # - true (do update with defaults)
  # - missing (do with defaults)
  improveHistoryValue: (value, newValue) ->
    if value == false || u.isString(value)
      value
    else
      newValue

  failedResponseHasContent: (response) ->
    # Check if the failed response wasn't cause by a fatal error
    # like a timeout or disconnect.
    (response instanceof up.Response) && !response.isFatalError()

  fullLoad: =>
    up.browser.loadPage(@successOptions.url, u.pick(@successOptions, ['method', 'params']))
