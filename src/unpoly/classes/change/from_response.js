const u = up.util

up.Change.FromResponse = class FromResponse extends up.Change {

  constructor(options) {
    super(options)

    this.response = options.response
    this.request = this.response.request
  }

  execute() {
    if (up.fragment.config.skipResponse(this.loadedEventProps())) {
      this.skip()
    } else {
      // Allow listeners to inspect the response and either prevent the fragment change
      // or manipulate change options. An example for when this is useful is a maintenance
      // page with its own layout, that cannot be loaded as a fragment and must be loaded
      // with a full page load.
      this.request.assertEmitted('up:fragment:loaded', {
        ...this.loadedEventProps(),
        callback: this.options.onLoaded, // One callback is used for both success and failure. There is no { onFailLoaded }.
        log: ['Loaded fragment from %s', this.response.description],
        skip: () => this.skip()
      })
    }

    // Listeners to up:fragment:loaded may have changed renderOptions.fail
    // to force success or failure options.
    let fail = u.evalOption(this.options.fail, this.response) ?? !this.response.ok

    if (fail) {
      throw this.updateContentFromResponse(this.deriveFailOptions())
    }

    return this.updateContentFromResponse(this.options)
  }

  skip() {
    up.puts('up.render()', 'Skipping ' + this.response.description)
    this.options.target = ':none'
    this.options.failTarget = ':none'
  }

  updateContentFromResponse(finalRenderOptions) {
    if (finalRenderOptions.failPrefixForced) {
      up.puts('up.render()', 'Rendering failed response using fail-prefixed options (https://unpoly.com/failed-responses)')
    }

    // The response might carry some updates for our change options,
    // like a server-set location, or server-sent events.
    this.augmentOptionsFromResponse(finalRenderOptions)

    // When up.Change.FromContent eventually compiles fragments, the { meta } object
    // will be passed as a third argument to compilers.
    finalRenderOptions.meta = this.compilerPassMeta()

    let result = new up.Change.FromContent(finalRenderOptions).execute()
    result.finished = this.finish(result, finalRenderOptions)
    return result
  }

  async finish(renderResult, originalRenderOptions) {
    renderResult = await renderResult.finished

    if (up.fragment.shouldRevalidate(this.request, this.response, originalRenderOptions)) {
      renderResult = await this.revalidate(renderResult, originalRenderOptions)
    }

    return renderResult
  }

  async revalidate(renderResult, originalRenderOptions) {
    let target = originalRenderOptions.target
    if (/:(before|after)/.test(target)) {
      up.warn('up.render()', 'Cannot revalidate cache when prepending/appending (target %s)', target)
    } else {
      up.puts('up.render()', 'Revalidating cached response for target "%s"', target)
      let verifyResult = await up.reload(renderResult.target, {
        ...originalRenderOptions,
        layer: renderResult.layer, // if the original render opened a layer, we now update it
        onFinished: null, // we're delaying the finish event here
        scroll: false,
        focus: 'keep',
        transition: false, // offerring something like { verifyTransition } would mean we need to delay { onFinished } even further
        cache: false, // this implies { revalidate: false }
        confirm: false,
        feedback: false,
        abort: false,
        expiredResponse: this.response, // flag will be forwarded to up:fragment:loaded
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

  loadedEventProps() {
    const { expiredResponse } = this.options

    return {
      request: this.request,
      response: this.response,
      renderOptions: this.options,
      revalidating: !!expiredResponse,
      expiredResponse,
    }
  }

  compilerPassMeta() {
    // (1) We only expose selected properties as to not prevent GC
    // by compilers holding a reference to their meta arg in their close.
    //
    // (2) Another property { layer } will be assigned by up.hello().
    return u.pick(this.loadedEventProps(), [
      'revalidating',
      'response'
    ])
  }

  augmentOptionsFromResponse(renderOptions) {
    // Also see preprocessing of server response in up.Request#extractResponseFromXHR().

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
      // we can only provide history if an *explicit* location URL is passed as an option.
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
      'loadedEventProps',
    ])
  }
}
