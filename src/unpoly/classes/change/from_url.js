const u = up.util

up.Change.FromURL = class FromURL extends up.Change {

  async execute() {
    let newPageReason = this._newPageReason()
    if (newPageReason) {
      up.puts('up.render()', newPageReason)
      up.network.loadPage(this.options)
      // Prevent our caller from executing any further code, since we're already
      // navigating away from this JavaScript environment.
      return u.unresolvablePromise()
    }

    this.request = up.request(this._getRequestAttrs())
    // Used by up.RenderJob to delay aborting until a new request instance is known

    console.debug("onRequest() will abort? %o", this.options.onRequest)

    this.options.onRequest?.(this.request)

    // await queueMicrotask(u.noop)
    // await queueMicrotask(u.noop)
    // await queueMicrotask(u.noop)
    // await queueMicrotask(u.noop)
    // await queueMicrotask(u.noop)

    if (this.options.preload) {
      return this.request
    }

    if (!this.request.fromCache) {
      this._considerPreviews()
    }

    // Use always() since _onRequestSettled() will decide whether the promise
    // will be fulfilled or rejected.
    return await u.always(this.request, responseOrError => this._onRequestSettled(responseOrError))
  }

  async _considerPreviews() {
    console.debug("u.waitMicrotasks(10) before")
    await u.waitMicrotasks(4)
    console.debug("u.waitMicrotasks(10) after")

    if (!this.request._isSettled()) {
      console.debug("considerPreviews: request is NOT settled")

      // TODO: Don't do this work if we're rendering a cached request
      up.form.disableWhile(this.request, this.options)
      up.feedback.showAroundRequest(this.request, this.options)
    } else {
      console.debug("considerPreviews: request WAS settled")
    }
  }

  _newPageReason() {
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
    if (this.options.history && !up.browser.canPushState()) {
      return 'Loading content in new page to restore history support'
    }
  }

  _getRequestAttrs() {
    const successAttrs = this._preflightPropsForRenderOptions(this.options)
    const failAttrs = this._preflightPropsForRenderOptions(this.deriveFailOptions(), { optional: true })

    return {
      ...this.options, // contains preflight keys relevant for the request, e.g. { url, method }
      ...successAttrs, // contains meta information for an successful update, e.g. { layer, mode, context, target }
      ...u.renameKeys(failAttrs, up.fragment.failKey) // contains meta information for a failed update, e.g. { failTarget }
    }
  }

  // This is required by up.RenderJob to handle { abort: 'target' }.
  getPreflightProps() {
    return this._getRequestAttrs()
  }

  _preflightPropsForRenderOptions(renderOptions, getPreflightPropsOptions) {
    const preflightChange = new up.Change.FromContent({ ...renderOptions, preflight: true })
    // #getPreflightProps() will return meta information about the change that is most
    // likely before the request was dispatched.
    // This might change postflight if the response does not contain the desired target.
    return preflightChange.getPreflightProps(getPreflightPropsOptions)
  }

  _onRequestSettled(response) {
    if (response instanceof up.Response) {
      return this._onRequestSettledWithResponse(response)
    } else {
      // Value is up.AbortError, up.Offline or another fatal error that can never
      // be used as a fragment update. At this point up:request:aborted or up:request:offline
      // have already been emitted by up.Request.
      return this._onRequestSettledWithError(response)
    }
  }

  _onRequestSettledWithResponse(response) {
    return new up.Change.FromResponse({ ...this.options, response }).execute()
  }

  _onRequestSettledWithError(error) {
    if (error instanceof up.Offline) {
      this.request.emit('up:fragment:offline', {
        callback: this.options.onOffline,
        renderOptions: this.options,
        retry: (retryOptions) => up.render({ ...this.options, ...retryOptions }),
        log: ['Cannot load fragment from %s: %s', this.request.description, error.reason],
      })
    }

    // `error` might also be an `up.Aborted`. In that case we do *not* emit `up:fragment:aborted`
    // event here. This is already done by `up.fragment.abort()`.

    // (1) Even if an { onOffline } callback retries, we still fail the initial render() call
    //    We cannot check if the user has retried, since { onOffline } might render a
    //    notification and retry some time later (async).
    //
    // (2) up.Offline errors also run { onError } callbacks.
    throw error
  }

  static {
    u.memoizeMethod(this.prototype, {
      _getRequestAttrs: true,
    })
  }
}
