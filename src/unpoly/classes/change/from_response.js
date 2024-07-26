const u = up.util

up.Change.FromResponse = class FromResponse extends up.Change {

  constructor(options) {
    super(options)

    this._response = options.response
    this._request = this._response.request
  }

  execute() {
    if (up.fragment.config.skipResponse(this._loadedEventProps())) {
      this._skip()
    } else {
      // Allow listeners to inspect the response and either prevent the fragment change
      // or manipulate change options. An example for when this is useful is a maintenance
      // page with its own layout, that cannot be loaded as a fragment and must be loaded
      // with a full page load.
      this._request.assertEmitted('up:fragment:loaded', {
        ...this._loadedEventProps(),
        callback: this.options.onLoaded, // One callback is used for both success and failure. There is no { onFailLoaded }.
        log: ['Loaded fragment from %s', this._response.description],
        skip: () => this._skip()
      })
    }

    // Listeners to up:fragment:loaded may have changed renderOptions.fail
    // to force success or failure options.
    let fail = u.evalOption(this.options.fail, this._response) ?? !this._response.ok

    if (fail) {
      throw this._updateContentFromResponse(this.deriveFailOptions())
    }

    return this._updateContentFromResponse(this.options)
  }

  _skip() {
    up.puts('up.render()', 'Skipping ' + this._response.description)
    this.options.target = ':none'
    this.options.failTarget = ':none'
  }

  _updateContentFromResponse(finalRenderOptions) {
    if (finalRenderOptions.failPrefixForced) {
      up.puts('up.render()', 'Rendering failed response using fail-prefixed options (https://unpoly.com/failed-responses)')
    }

    // The response might carry some updates for our change options,
    // like a server-set location, or server-sent events.
    this._augmentOptionsFromResponse(finalRenderOptions)

    // When up.Change.FromContent eventually compiles fragments, the { meta } object
    // will be passed as a third argument to compilers.
    finalRenderOptions.meta = this._compilerPassMeta()

    let result = new up.Change.FromContent(finalRenderOptions).execute()
    result.finished = this.finish(result, finalRenderOptions)
    return result
  }

  async finish(renderResult, originalRenderOptions) {
    renderResult = await renderResult.finished

    if (up.fragment.shouldRevalidate(this._request, this._response, originalRenderOptions)) {
      renderResult = await this._revalidate(renderResult, originalRenderOptions)
    }

    return renderResult
  }

  async _revalidate(renderResult, originalRenderOptions) {
    // This is an explicit target passed as `{ render }` option.
    // It may be `undefined` if the user has not given an explicit selector and relies on a fallback.
    // If its is given, it may still contain ':before' or ':after'.
    let inputTarget = originalRenderOptions.target

    // This is the target that we ended up rendering.
    // It may be a fallback target. It is always defined.
    // It never contains ':before' or ':after'.
    let effectiveTarget = renderResult.target

    if (/:(before|after)/.test(inputTarget)) {
      up.warn('up.render()', 'Cannot revalidate cache when prepending/appending (target %s)', inputTarget)
    } else {
      up.puts('up.render()', 'Revalidating cached response for target "%s"', effectiveTarget)
      let verifyResult = await up.reload(effectiveTarget, {
        ...originalRenderOptions,
        preferOldElements: renderResult.fragments, // ensure we match the same fragments when initial render pass matched around { origin } and { origin } has been detached
        layer: renderResult.layer, // if the original render opened a layer, we now update it
        onFinished: null, // the earlier onFinished handler will already be honored by the up.RenderJob that called us
        scroll: false,
        focus: 'keep',
        transition: false, // offerring something like { verifyTransition } would mean we need to delay { onFinished } even further
        cache: false, // this implies { revalidate: false }
        confirm: false,
        feedback: false,
        abort: false,
        preview: false,
        expiredResponse: this._response, // flag will be forwarded to up:fragment:loaded
        // The guardEvent was already plucked from render options in up.RenderJob#guardRender().
      })

      // A well-behaved server will respond with "304 Not Modified" if the reload
      // produced the same E-tag or Last-Modified timestamp. In that case we keep
      // the original up.RenderResult.
      //
      // In this case the up.RenderJob from up.reload() has already seen that the result has no content,
      // and will *not* have called { onResult } a second time. We will however return the original
      // render result so it can be passed to up.RenderJob#finished() callbacks.
      if (!verifyResult.none) {
        renderResult = verifyResult
      }
    }

    return renderResult
  }

  _loadedEventProps() {
    const { expiredResponse } = this.options

    return {
      request: this._request,
      response: this._response,
      renderOptions: this.options,
      revalidating: !!expiredResponse,
      expiredResponse,
    }
  }

  _compilerPassMeta() {
    // (1) We avoid exposing values that would prevent garbage collection
    //    by compilers holding a reference to their meta arg in their closure.
    //
    // (3) We avoid exposing values that we cannot provide for the initial page load.
    //     That includes the request and response.
    //
    // (3) Another property { layer } will be assigned by up.hello().
    let meta = { revalidating: !!this.options.expiredResponse }
    up.migrate.processCompilerPassMeta?.(meta, this._response)
    return meta
  }

  _augmentOptionsFromResponse(renderOptions) {
    // Also see preprocessing of server response in up.Request#extractResponseFromXHR().

    const responseURL = this._response.url
    let serverLocation = responseURL

    let hash = this._request.hash
    if (hash) {
      renderOptions.hash = hash
      serverLocation += hash
    }

    const isReloadable = (this._response.method === 'GET')

    if (isReloadable) {
      // Remember where we got the fragment from so we can up.reload() it later.
      renderOptions.source = this.improveHistoryValue(renderOptions.source, responseURL)
    } else {
      // Keep the source of the previous fragment (e.g. the form that was submitted into failure).
      renderOptions.source = this.improveHistoryValue(renderOptions.source, 'keep')
      // Since the current URL is not retrievable over the GET-only address bar,
      // we can only provide history if an *explicit* location URL is passed as an option.
      renderOptions.history = !!renderOptions.location
    }

    renderOptions.location = this.improveHistoryValue(renderOptions.location, serverLocation)
    renderOptions.title = this.improveHistoryValue(renderOptions.title, this._response.title)
    renderOptions.eventPlans = this._response.eventPlans

    let serverTarget = this._response.target
    if (serverTarget) {
      renderOptions.target = serverTarget
    }

    renderOptions.acceptLayer = this._response.acceptLayer
    renderOptions.dismissLayer = this._response.dismissLayer
    renderOptions.document = this._response.text

    if (this._response.none) {
      renderOptions.target = ':none'
    }

    // If the server has provided an update to our context via the X-Up-Context
    // response header, merge it into our existing { context } option.
    renderOptions.context = u.merge(renderOptions.context, this._response.context)

    renderOptions.cspNonces = this._response.cspNonces
    renderOptions.time ??= this._response.lastModified
    renderOptions.etag ??= this._response.etag
  }

  static {
    u.memoizeMethod(this.prototype, {
      _loadedEventProps: true,
    })
  }
}
