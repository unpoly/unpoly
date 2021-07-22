/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

up.Change.FromURL = class FromURL extends up.Change {

  constructor(options) {
    super(options);

    // Look up layers *before* we make the request.
    // In case of { layer: 'origin' } (default for navigation) the { origin }
    // element may get removed while the request was in flight, making
    // up.Change.FromContent#execute() fail with "layer { origin } does not exist".
    this.options.layer = up.layer.getAll(this.options);

    // Since up.layer.getAll() already normalizes layer options,
    // we don't need to normalize again in up.Change.FromContent.
    this.options.normalizeLayerOptions = false;

    // We keep all failKeys in our successOptions, nothing will use them.
    this.successOptions = this.options;

    // deriveFailOptions() will merge shared keys and (unsuffixed) failKeys.
    this.failOptions = up.RenderOptions.deriveFailOptions(this.successOptions);
  }

  execute() {
    let newPageReason;
    if (newPageReason = this.newPageReason()) {
      up.puts('up.render()', newPageReason);
      up.browser.loadPage(this.options);
      // Prevent our caller from executing any further code, since we're already
      // navigating away from this JavaScript environment.
      return u.unresolvablePromise();
    }

    const promise = this.makeRequest();

    if (this.options.preload) {
      return promise;
    }

    // Use always() since onRequestSettled() will decide whether the promise
    // will be fulfilled or rejected.
    return u.always(promise, responseOrError => this.onRequestSettled(responseOrError));
  }

  newPageReason() {
    // Rendering content from cross-origin URLs is out of scope for Unpoly.
    // We still allow users to call up.render() with a cross-origin URL, but
    // we will then make a full-page request.
    if (u.isCrossOrigin(this.options.url)) {
      return 'Loading cross-origin content in new page';
    }

    // Unpoly may have been booted without suppport for history.pushState.
    // E.g. when the initial page was loaded from a POST response.
    // In this case we make a full page load in hopes to reboot with
    // pushState support.
    if (!up.browser.canPushState()) {
      return 'Loading content in new page to restore history support';
    }
  }

  makeRequest() {
    const successAttrs = this.preflightPropsForRenderOptions(this.successOptions);
    const failAttrs = this.preflightPropsForRenderOptions(this.failOptions, { optional: true });

    const requestAttrs = u.merge(
      this.successOptions, // contains preflight keys relevant for the request, e.g. { url, method, solo }
      successAttrs,    // contains meta information for an successful update, e.g. { layer, mode, context, target }
      u.renameKeys(failAttrs, up.fragment.failKey) // contains meta information for a failed update, e.g. { failTarget }
    );

    this.request = up.request(requestAttrs);

    // The request is also a promise for its response.
    return this.request;
  }

  preflightPropsForRenderOptions(renderOptions, requestAttributesOptions) {
    const preview = new up.Change.FromContent(u.merge(renderOptions, {preview: true}));
    // #preflightProps() will return meta information about the change that is most
    // likely before the request was dispatched.
    // This might change postflight if the response does not contain the desired target.
    return preview.preflightProps(requestAttributesOptions);
  }

  onRequestSettled(response) {
    this.response = response;
    if (!(this.response instanceof up.Response)) {
      // value is up.error.aborted() or another fatal error that can never
      // be used as a fragment update. At this point up:request:aborted or up:request:fatal
      // have already been emitted by up.Request.
      throw this.response;
    } else if (this.isSuccessfulResponse()) {
      return this.updateContentFromResponse(['Loaded fragment from successful response to %s', this.request.description], this.successOptions);
    } else {
      const log = ['Loaded fragment from failed response to %s (HTTP %d)', this.request.description, this.response.status];
      throw this.updateContentFromResponse(log, this.failOptions);
    }
  }
      // Although processResponse() will fulfill with a successful replacement of options.failTarget,
      // we still want to reject the promise that's returned to our API client.

  isSuccessfulResponse() {
    return (this.successOptions.fail === false) || this.response.ok;
  }

  buildEvent(type, props) {
    const defaultProps = { request: this.request, response: this.response, renderOptions: this.options };
    return up.event.build(type, u.merge(defaultProps, props));
  }

  updateContentFromResponse(log, renderOptions) {
    // Allow listeners to inspect the response and either prevent the fragment change
    // or manipulate change options. An example for when this is useful is a maintenance
    // page with its own layout, that cannot be loaded as a fragment and must be loaded
    // with a full page load.
    const event = this.buildEvent('up:fragment:loaded', { renderOptions });
    this.request.assertEmitted(event, { log, callback: this.options.onLoaded });

    // The response might carry some updates for our change options,
    // like a server-set location, or server-sent events.
    this.augmentOptionsFromResponse(renderOptions);

    return new up.Change.FromContent(renderOptions).execute();
  }

  augmentOptionsFromResponse(renderOptions) {
    let hash, serverTarget;
    const responseURL = this.response.url;
    let serverLocation = responseURL;

    if (hash = this.request.hash) {
      renderOptions.hash = hash;
      serverLocation += hash;
    }

    const isReloadable = (this.response.method === 'GET');

    if (isReloadable) {
      // Remember where we got the fragment from so we can up.reload() it later.
      renderOptions.source = this.improveHistoryValue(renderOptions.source, responseURL);
    } else {
      // Keep the source of the previous fragment (e.g. the form that was submitted into failure).
      renderOptions.source = this.improveHistoryValue(renderOptions.source, 'keep');
      // Since the current URL is not retrievable over the GET-only address bar,
      // we can only provide history if a location URL is passed as an option.
      renderOptions.history = !!renderOptions.location;
    }

    renderOptions.location = this.improveHistoryValue(renderOptions.location, serverLocation);
    renderOptions.title = this.improveHistoryValue(renderOptions.title, this.response.title);
    renderOptions.eventPlans = this.response.eventPlans;

    if (serverTarget = this.response.target) {
      renderOptions.target = serverTarget;
    }

    renderOptions.document = this.response.text;

    renderOptions.acceptLayer = this.response.acceptLayer;
    renderOptions.dismissLayer = this.response.dismissLayer;

    // Don't require a target match if the server wants to close the overlay and doesn't send content.
    // However the server is still free to send matching HTML. It would be used if the root layer is updated.
    if (!renderOptions.document && (u.isDefined(renderOptions.acceptLayer) || u.isDefined(renderOptions.dismissLayer))) {
      renderOptions.target = ':none';
    }

    // If the server has provided an update to our context via the X-Up-Context
    // response header, merge it into our existing { context } option.
    return renderOptions.context = u.merge(renderOptions.context, this.response.context);
  }
};
