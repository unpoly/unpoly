#= require ./change

u = up.util

class up.Change.FromURL extends up.Change

  constructor: (@options) ->
    super(@options)

    # Look up layers *before* we make the request.
    # In case of { layer: 'origin' } (default for navigation) the { origin }
    # element may get removed while the request was in flight, making
    # up.Change.FromContent#execute() fail with "layer { origin } does not exist".
    @options.layer = up.layer.getAll(@options)

    # Since up.layer.getAll() already normalizes layer options,
    # we don't need to normalize again in up.Change.FromContent.
    @options.normalizeLayerOptions = false

    # We keep all failKeys in our successOptions, nothing will use them.
    @successOptions = @options

    # deriveFailOptions() will merge shared keys and (unsuffixed) failKeys.
    @failOptions = up.RenderOptions.deriveFailOptions(@successOptions)

  execute: ->
    if newPageReason = @newPageReason()
      up.puts 'up.render()', newPageReason
      up.browser.loadPage(@options)
      # Prevent our caller from executing any further code, since we're already
      # navigating away from this JavaScript environment.
      return u.unresolvablePromise()

    promise = @makeRequest()

    if @options.preload
      return promise

    # Use always() since onRequestSettled() will decide whether the promise
    # will be fulfilled or rejected.
    return u.always(promise, (responseOrError) => @onRequestSettled(responseOrError))

  newPageReason: ->
    # Rendering content from cross-origin URLs is out of scope for Unpoly.
    # We still allow users to call up.render() with a cross-origin URL, but
    # we will then make a full-page request.
    if u.isCrossOrigin(@options.url)
      return 'Loading cross-origin content in new page'

    # Unpoly may have been booted without suppport for history.pushState.
    # E.g. when the initial page was loaded from a POST response.
    # In this case we make a full page load in hopes to reboot with
    # pushState support.
    unless up.browser.canPushState()
      return 'Loading content in new page to restore history support'

  makeRequest: ->
    successAttrs = @preflightPropsForRenderOptions(@successOptions)
    failAttrs = @preflightPropsForRenderOptions(@failOptions, { optional: true })

    requestAttrs = u.merge(
      @successOptions, # contains preflight keys relevant for the request, e.g. { url, method, solo }
      successAttrs,    # contains meta information for an successful update, e.g. { layer, mode, context, target }
      u.renameKeys(failAttrs, up.fragment.failKey) # contains meta information for a failed update, e.g. { failTarget }
    )

    @request = up.request(requestAttrs)

    # The request is also a promise for its response.
    return @request

  preflightPropsForRenderOptions: (renderOptions, requestAttributesOptions) ->
    preview = new up.Change.FromContent(u.merge(renderOptions, preview: true))
    # #preflightProps() will return meta information about the change that is most
    # likely before the request was dispatched.
    # This might change postflight if the response does not contain the desired target.
    return preview.preflightProps(requestAttributesOptions)

  onRequestSettled: (@response) ->
    if !(@response instanceof up.Response)
      # value is up.error.aborted() or another fatal error that can never
      # be used as a fragment update. At this point up:request:aborted or up:request:fatal
      # have already been emitted by up.Request.
      throw @response
    else if @isSuccessfulResponse()
      return @updateContentFromResponse(['Loaded fragment from successful response to %s', @request.description], @successOptions)
    else
      log = ['Loaded fragment from failed response to %s (HTTP %d)', @request.description, @response.status]
      throw @updateContentFromResponse(log, @failOptions)
      # Although processResponse() will fulfill with a successful replacement of options.failTarget,
      # we still want to reject the promise that's returned to our API client.

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
    @request.assertEmitted(event, { log, callback: @options.onLoaded })

    # The response might carry some updates for our change options,
    # like a server-set location, or server-sent events.
    @augmentOptionsFromResponse(renderOptions)

    return new up.Change.FromContent(renderOptions).execute()

  augmentOptionsFromResponse: (renderOptions) ->
    responseURL = @response.url
    serverLocation = responseURL

    if hash = @request.hash
      renderOptions.hash = hash
      serverLocation += hash

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

    renderOptions.location = @improveHistoryValue(renderOptions.location, serverLocation)
    renderOptions.title = @improveHistoryValue(renderOptions.title, @response.title)
    renderOptions.eventPlans = @response.eventPlans

    if serverTarget = @response.target
      renderOptions.target = serverTarget

    renderOptions.document = @response.text

    renderOptions.acceptLayer = @response.acceptLayer
    renderOptions.dismissLayer = @response.dismissLayer

    # Don't require a target match if the server wants to close the overlay and doesn't send content.
    # However the server is still free to send matching HTML. It would be used if the root layer is updated.
    if !renderOptions.document && (u.isDefined(renderOptions.acceptLayer) || u.isDefined(renderOptions.dismissLayer))
      renderOptions.target = ':none'

    # If the server has provided an update to our context via the X-Up-Context
    # response header, merge it into our existing { context } option.
    renderOptions.context = u.merge(renderOptions.context, @response.context)
