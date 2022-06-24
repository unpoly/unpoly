const u = up.util

up.Change.FromURL = class FromURL extends up.Change {

  constructor(options) {
    super(options)

    // Look up layers *before* we make the request.
    // In case of { layer: 'origin' } (default for navigation) the { origin }
    // element may get removed while the request was in flight, making
    // up.Change.FromContent#execute() fail with "layer { origin } does not exist".
    this.options.layer = up.layer.getAll(this.options)

    // Since up.layer.getAll() already normalizes layer options,
    // we don't need to normalize again in up.Change.FromContent.
    this.options.normalizeLayerOptions = false
  }

  execute() {
    let newPageReason = this.newPageReason()
    if (newPageReason) {
      up.puts('up.render()', newPageReason)
      up.network.loadPage(this.options)
      // Prevent our caller from executing any further code, since we're already
      // navigating away from this JavaScript environment.
      return u.unresolvablePromise()
    }

    this.request = up.request(this.getRequestAttrs())
    this.options.onRequest?.(this.request)

    up.feedback.showAroundRequest(this.request, this.options)

    up.form.disableWhile(this.request, this.options)

    if (this.options.preload) {
      return this.request
    }

    // Use always() since onRequestSettled() will decide whether the promise
    // will be fulfilled or rejected.
    return u.always(this.request, responseOrError => this.onRequestSettled(responseOrError))
  }

  deriveFailOptions() {
    // This will merge shared keys and unprefix failKeys.
    return up.RenderOptions.deriveFailOptions(this.options)
  }

  newPageReason() {
    // Rendering content from cross-origin URLs is out of scope for Unpoly.
    // We still allow users to call up.render() with a cross-origin URL, but
    // we will then make a full-page request.
    if (u.isCrossOrigin(this.options.url)) {
      return 'Loading cross-origin content in new page'
    }

    // Unpoly may have been booted without suppport for history.pushState.
    // E.g. when the initial page was loaded from a POST response.
    // In this case we make a full page load in hopes to reboot with
    // pushState support.
    if (!up.browser.canPushState()) {
      return 'Loading content in new page to restore history support'
    }
  }

  getRequestAttrs() {
    const successAttrs = this.preflightPropsForRenderOptions(this.options)
    const failAttrs = this.preflightPropsForRenderOptions(this.deriveFailOptions(), { optional: true })

    return {
      ...this.options, // contains preflight keys relevant for the request, e.g. { url, method }
      ...successAttrs, // contains meta information for an successful update, e.g. { layer, mode, context, target }
      ...u.renameKeys(failAttrs, up.fragment.failKey) // contains meta information for a failed update, e.g. { failTarget }
    }
  }

  // This is required by up.Change.FromOptions to handle { abort: 'target' }.
  getPreflightProps() {
    return this.getRequestAttrs()
  }

  preflightPropsForRenderOptions(renderOptions, requestAttributesOptions) {
    const preview = new up.Change.FromContent({ ...renderOptions, preview: true })
    // #getPreflightProps() will return meta information about the change that is most
    // likely before the request was dispatched.
    // This might change postflight if the response does not contain the desired target.
    return preview.getPreflightProps(requestAttributesOptions)
  }

  onRequestSettled(response) {
    if (response instanceof up.Response) {
      return this.onRequestSettledWithResponse(response)
    } else {
      // Value is up.error.aborted(), up.error.offline or another fatal error that can never
      // be used as a fragment update. At this point up:request:aborted or up:request:offline
      // have already been emitted by up.Request.
      return this.onRequestSettledWithError(response)
    }
  }

  onRequestSettledWithResponse(response) {
    this.response = response

    // Allow listeners to inspect the response and either prevent the fragment change
    // or manipulate change options. An example for when this is useful is a maintenance
    // page with its own layout, that cannot be loaded as a fragment and must be loaded
    // with a full page load.
    this.request.assertEmitted('up:fragment:loaded', {
      callback: this.options.onLoaded,
      response: this.response,
      renderOptions: this.options,
      log: ['Loaded fragment from HTTP %s response to %s', this.response.status, this.request.description]
    })

    // Listeners to up:fragment:loaded may have changed renderOptions.fail
    // to force success or failure options.
    response.fail = this.options.fail

    if (response.ok) {
      return this.updateContentFromResponse(this.options)
    } else {
      up.puts('up.render()', 'Rendering failed response using fail-prefixed options (https://unpoly.com/failed-responses)')
      let renderResult = this.updateContentFromResponse(this.deriveFailOptions())
      renderResult.ok = false
      return renderResult
    }
  }

  onRequestSettledWithError(error) {
    if (up.error.offline.is(error)) {
      this.request.emit('up:fragment:offline', {
        callback: this.options.onOffline,
        response: this.response,
        renderOptions: this.options,
        retry: () => up.render(this.options),
        log: ['Cannot load fragment from %s: %s', this.request.description, error.reason]
      })
    }

    // Even if an { onOffline } callback retries, we still fail the initial render() call.
    // We also cannot check if the user has retried, since { onOffline } might render a
    // notification and retry some time later (async).
    throw error
  }


  updateContentFromResponse(finalRenderOptions) {
    // The response might carry some updates for our change options,
    // like a server-set location, or server-sent events.
    this.augmentOptionsFromResponse(finalRenderOptions)

    if (up.fragment.shouldRevalidate(this.request, this.response, finalRenderOptions)) {
      // Copy the given options, as we're going to override the { onFinished } prop.
      let originalRenderOptions = u.copy(finalRenderOptions)
      finalRenderOptions.onFinished = (renderResult) => this.revalidate(renderResult, originalRenderOptions)
    }

    return new up.Change.FromContent(finalRenderOptions).execute()
  }

  async revalidate(renderResult, originalRenderOptions) {
    let target = originalRenderOptions.target
    if (/:(before|after)/.test(target)) {
      up.warn('up.render()', 'Cannot revalidate cache when prepending/appending (target %s)', target)
    } else {
      up.puts('up.render()', 'Revalidating cached response for target "%s"', target)
      let verifyResult = await up.reload(renderResult.target, {
        ...originalRenderOptions,
        layer: renderResult.layer,
        scroll: false,
        focus: 'keep',
        transition: false, // oferring something like { verifyTransition } would mean we need to delay { onFinished } even further
        cache: false, // this implies { revalidate: false }
        confirm: false,
        feedback: false,
        abort: false,
      })

      // A well-behaved server will respond with "304 Not Modified" if the reload
      // produced the same E-tag or Last-Modified timestamp. In that case we keep
      // the original up.RenderResult.
      if (!verifyResult.isNone()) {
        renderResult = verifyResult
      }
    }

    // Call the original { onFinished } callback provided by the user.
    originalRenderOptions.onFinished?.(renderResult)
  }

  augmentOptionsFromResponse(renderOptions) {
    const responseURL = this.response.url
    let serverLocation = responseURL

    let hash = this.request.hash
    if (hash) {
      renderOptions.hash = hash
      serverLocation += hash
    }

    const isReloadable = (this.response.method === 'GET')

    if (isReloadable) {
      // Remember where we got the fragment from so we can up.reload() it later.
      renderOptions.source = this.improveHistoryValue(renderOptions.source, responseURL)
    } else {
      // Keep the source of the previous fragment (e.g. the form that was submitted into failure).
      renderOptions.source = this.improveHistoryValue(renderOptions.source, 'keep')
      // Since the current URL is not retrievable over the GET-only address bar,
      // we can only provide history if a location URL is passed as an option.
      renderOptions.history = !!renderOptions.location
    }

    renderOptions.location = this.improveHistoryValue(renderOptions.location, serverLocation)
    renderOptions.title = this.improveHistoryValue(renderOptions.title, this.response.title)
    renderOptions.eventPlans = this.response.eventPlans

    let serverTarget = this.response.target
    if (serverTarget) {
      renderOptions.target = serverTarget
    }

    renderOptions.acceptLayer = this.response.acceptLayer
    renderOptions.dismissLayer = this.response.dismissLayer
    renderOptions.document = this.response.text

    // There are some cases where the user might send us an empty body:
    //
    // - HTTP status `304 Not Modified` (especially when reloading)
    // - HTTP status `204 No Content`
    // - Header `X-Up-Target: :none`
    // - Header `X-Up-Accept-Layer` or `X-Up-Dismiss-Layer`, although the server
    //   may send an optional body in case the response is used on the root layer.
    if (!renderOptions.document) {
      renderOptions.target = ':none'
    }

    // If the server has provided an update to our context via the X-Up-Context
    // response header, merge it into our existing { context } option.
    renderOptions.context = u.merge(renderOptions.context, this.response.context)

    renderOptions.cspNonces = this.response.cspNonces
    renderOptions.time ??= this.response.lastModified
    renderOptions.etag ??= this.response.etag
  }

  static {
    u.memoizeMethod(this.prototype, [
      'getRequestAttrs',
    ])
  }
}
