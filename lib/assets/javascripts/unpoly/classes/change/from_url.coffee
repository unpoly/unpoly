#= require ./change

u = up.util

class up.Change.FromURL extends up.Change

  constructor: (@successOptions) ->
    super(@successOptions)
    @failOptions = up.RenderOptions.deriveFailOptions(@successOptions)

  execute: ->
    unless up.browser.canPushState()
      @fullLoad() unless @successOptions.preload
      return u.unresolvablePromise()

    promise = @makeRequest()
    unless @successOptions.preload
      # Use always() since onRequestSettled() will decide whether the promise
      # will be fulfilled or rejected.
      promise = u.always(promise, (responseOrError) => @onRequestSettled(responseOrError))

    return promise

  makeRequest: ->
    successPreview = new up.Change.FromContent(u.merge(@successOptions, preview: true))
    failPreview = new up.Change.FromContent(u.merge(@failOptions, preview: true))

    requestAttrs = u.merge(
      @successOptions,
      successPreview.requestAttributes(),
      u.renameKeys(failPreview.requestAttributes(optional: true), up.fragment.failKey)
    )

    return @request = up.request(requestAttrs)

  onRequestSettled: (responseOrError) ->
    rejectWithFailedResponse = -> Promise.reject(responseOrError)

    if @isResponseWithHTMLContent(responseOrError)
      if @isSuccessfulResponse(responseOrError)
        up.puts('up.render()', 'Upating page with successful response')
        return @updateContentFromResponse(responseOrError, @successOptions)
      else
        up.puts('up.render()', 'Updating page with failed response (HTTP %d)', responseOrError.status)
        promise = @updateContentFromResponse(responseOrError, @failOptions)
        # Although processResponse() will fulfill with a successful replacement of options.failTarget,
        # we still want to reject the promise that's returned to our API client.
        return u.always(promise, rejectWithFailedResponse)
    else
      up.puts('up.render()', 'Response without HTML content (HTTP %d, Content-Type %s)', responseOrError.status, responseOrError.contentType)
      return rejectWithFailedResponse()

  isSuccessfulResponse: (response) ->
    @successOptions.fail == false || response.ok

  updateContentFromResponse: (response, options) ->
    # The response might carry some updates for our change options,
    # like a server-set location, or server-sent events.
    @augmentOptionsFromResponse(response, options)

    change = new up.Change.FromContent(options)

    # Allow listeners to inspect the response and either prevent the fragment change
    # or manipulate change options. An example for when this is useful is a maintenance
    # page with its own layout, that cannot be loaded as a fragment and must be loaded
    # with a full page load.
    loadedEvent = up.event.build('up:fragment:loaded', { renderOptions: options, request: response.request, response })
    promise = response.request.whenEmitted(loadedEvent, callback: options.onLoaded)
    promise = promise.then -> change.execute()
    promise

  augmentOptionsFromResponse: (response, options) ->
    options.document = response.text

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
    options.eventPlans = response.eventPlans

    # Only if the response contains a new context object (set by the server)
    # we will override the context from options.
    if context = response.context
      options.context = context

  isResponseWithHTMLContent: (responseOrError) ->
    # Check if the failed response wasn't cause by a fatal error
    # like a timeout or disconnect.
    return (responseOrError instanceof up.Response) &&
      responseOrError.text && # check if the body contains a non-empty string
      /\bx?html\b/.test(responseOrError.contentType) # HTML4+ is text/html, XHTML is application/xhtml+xml

  fullLoad: =>
    up.browser.loadPage(@successOptions.url, u.pick(@successOptions, ['method', 'params']))
