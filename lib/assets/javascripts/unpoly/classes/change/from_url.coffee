#= require ./change

u = up.util

class up.Change.FromURL extends up.Change

  constructor: (@options) ->
    super(@options)

    # We keep all failKeys in our successOptions, nothing will use them.
    @successOptions = @options

    # deriveFailOptions() will merge shared keys and (unsuffixed) failKeys.
    @failOptions = up.RenderOptions.deriveFailOptions(@successOptions)

  execute: ->
    if !up.browser.canPushState() && !@options.preload
      up.browser.loadPage(@options)
      # Prevent our caller from executing any further code, since we're already
      # navigating away from this JavaScript environment.
      return u.unresolvablePromise()

    promise = @makeRequest()

    if @options.preload
      return promise
    else
      # Use always() since onRequestSettled() will decide whether the promise
      # will be fulfilled or rejected.
      return u.always(promise, (responseOrError) => @onRequestSettled(responseOrError))

  makeRequest: ->
    successPreview = new up.Change.FromContent(u.merge(@successOptions, preview: true))
    failPreview = new up.Change.FromContent(u.merge(@failOptions, preview: true))

    requestAttrs = u.merge(
      @successOptions,
      successPreview.requestAttributes(),
      u.renameKeys(failPreview.requestAttributes(optional: true), up.fragment.failKey)
    )

    return @request = up.request(requestAttrs)

  onRequestSettled: (@response) ->
    # Wrap @response in Promise.reject() so it always causes our return value to reject.
    rejectWithFailedResponse = => Promise.reject(@response)

    if !(@response instanceof up.Response)
      # value is up.error.aborted() or another fatal error that can never
      # be used as a fragment update. At this point up:request:aborted or up:request:fatal
      # have already been emitted by up.Request.
      return rejectWithFailedResponse()
    else if issue = @responseIssue()
      @request.emit(@buildEvent('up:fragment:unusable'), log: issue)
      return rejectWithFailedResponse()
    else if @isSuccessfulResponse()
      return @updateContentFromResponse('Loaded fragment from successful response', @successOptions)
    else
      log = ['Loaded fragment from failed response (HTTP %d)', @response.status]
      contentUpdated = @updateContentFromResponse(log, @failOptions)
      # Although processResponse() will fulfill with a successful replacement of options.failTarget,
      # we still want to reject the promise that's returned to our API client.
      return u.always(contentUpdated, rejectWithFailedResponse)

  responseIssue: ->
    unless @response.text
      return 'Response is empty'

    contentType = @response.contentType
    unless /\bx?html\b/.test(contentType)
      return "Response is not HTML (Content-Type #{contentType})"

  isSuccessfulResponse: ->
    @successOptions.fail == false || @response.ok

  buildEvent: (type, props) ->
    defaultProps = { @request, @response, renderOptions: @options }
    return up.event.build(type, u.merge(defaultProps, props))

  updateContentFromResponse: (log, renderOptions) ->
    # Allow listeners to inspect the response and either prevent the fragment change
    # or manipulate change options. An example for when this is useful is a maintenance
    # page with its own layout, that cannot be loaded as a fragment and must be loaded
    # with a full page load.
    event = @buildEvent('up:fragment:loaded', { renderOptions })
    @request.whenEmitted(event, { log, callback: @options.onLoaded }).then =>
      # The response might carry some updates for our change options,
      # like a server-set location, or server-sent events.
      @augmentOptionsFromResponse(renderOptions)

      return new up.Change.FromContent(renderOptions).execute()

  augmentOptionsFromResponse: (renderOptions) ->
    renderOptions.document = @response.text

    responseURL = @response.url
    locationFromExchange = responseURL

    if hash = @request.hash
      renderOptions.hash = hash
      locationFromExchange += hash

    isReloadable = (@response.method == 'GET')

    if isReloadable
      # Remember where we got the fragment from so we can up.reload() it later.
      renderOptions.source = @improveHistoryValue(renderOptions.source, responseURL)
    else
      # Keep the source of the previous fragment (e.g. the form that was submitted into failure).
      renderOptions.source = @improveHistoryValue(renderOptions.source, 'keep')
      # Since the current URL is not retrievable over the GET-only address bar,
      # we can only provide history if a location URL is passed as an option.
      renderOptions.history = !!renderOptions.location

    renderOptions.location = @improveHistoryValue(renderOptions.location, locationFromExchange)
    renderOptions.title = @improveHistoryValue(renderOptions.title, @response.title)
    renderOptions.acceptLayer = @response.acceptLayer
    renderOptions.dismissLayer = @response.dismissLayer
    renderOptions.eventPlans = @response.eventPlans

    # Only if the @response contains a new context object (set by the server)
    # we will override the context from options.
    if context = @response.context
      renderOptions.context = context
