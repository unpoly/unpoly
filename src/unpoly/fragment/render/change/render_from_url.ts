import * as u from '../../../util.js'
import { Offline } from '../../../error.js'
import { render, toFailKey } from '../../../fragment.js'
import { canPushState, isHistoryEnabled } from '../../../history.js'
import { printToStandard } from '../../../log.js'
import {
  loadPage, makeRequest, UpResponse, type RequestOptions, type UpRequest,
} from '../../../network.js'
import type * as t from '../../types.js'
import { Change } from './change.js'
import { preflightPropsFromContent } from './render_from_content.js'
import { ChangeFromResponse } from './render_from_response.js'
import { type RenderResult } from '../render_result.js'

// The options for the request of a ChangeFromURL: the render options plus the preflight props
// of the success and fail options.
type RequestAttrs = t.RenderOptions & t.PreflightProps & { url: string }

export class ChangeFromURL extends Change<t.RenderOptions & { url: string }> {
  declare request: UpRequest

  // Fulfills with a request for { preload: true }.
  async execute(): Promise<RenderResult | UpRequest> {
    let newPageReason = this._newPageReason()
    if (newPageReason) {
      printToStandard('up.render()', newPageReason)
      // A full page load only uses the request options among the render options (and ignores { target }).
      loadPage(this.options as RequestOptions)
      // Prevent our caller from executing any further code, since we're already
      // navigating away from this JavaScript environment.
      return u.unresolvablePromise()
    }

    let requestAttrs = this._getRequestAttrs()
    let request = this.request = makeRequest(requestAttrs)
    this.options.onRequestKnown?.(request)

    if (this.options.preload) return request

    // RenderJob always sets { handleAbort }.
    this.options.handleAbort!({ request, ...requestAttrs })
    request.runPreviews(this.options)

    // Use always() since _onRequestSettled() will decide whether the promise
    // will be fulfilled or rejected.
    return await u.always(request, (responseOrError) => this._onRequestSettled(responseOrError))
  }

  _newPageReason(): string | undefined {
    // Rendering content from cross-origin URLs is out of scope for Unpoly.
    // We still allow users to call up.render() with a cross-origin URL, but
    // we will then make a full-page request.
    if (u.isCrossOrigin(this.options.url)) {
      return 'Loading cross-origin content in new page'
    }

    // Unpoly may have been booted without suppport for history.pushState.
    // E.g. when the initial page was loaded from a POST response.
    // In this case we make a full page load in hopes to reboot with
    // pushState support. We don't need to when we would not change the browser URL anyway.
    if (this.options.history && !canPushState() && isHistoryEnabled('location')) {
      return 'Loading content in new page to restore history support'
    }
  }

  // - Includes the render options
  // - Includes the preflight props of the actual Change instance
  // - Includes the preflight props for fail-prefixed options
  _getRequestAttrs(): RequestAttrs {
    const successAttrs = this._preflightPropsForRenderOptions(this.options)
    // This is empty when the fail options match no target.
    const failAttrs = this._preflightPropsForRenderOptions(this.deriveFailOptions(), { optional: true })

    return {
      ...this.options, // contains preflight keys relevant for the request, e.g. { url, method }
      ...successAttrs, // contains meta information for an successful update, e.g. { layer, mode, context, target }
      ...u.withRenamedKeys(failAttrs, toFailKey), // contains meta information for a failed update, e.g. { failTarget },
    }
  }

  _preflightPropsForRenderOptions(renderOptions: t.RenderOptions): t.PreflightProps
  _preflightPropsForRenderOptions(renderOptions: t.RenderOptions, getPreflightPropsOptions: { optional: boolean }): Partial<t.PreflightProps>
  _preflightPropsForRenderOptions(renderOptions: t.RenderOptions, getPreflightPropsOptions?: { optional: boolean }): Partial<t.PreflightProps> {
    // preflightPropsFromContent() will return meta information about the change that is most
    // likely before the request was dispatched.
    // This might change postflight if the response does not contain the desired target.
    return preflightPropsFromContent(renderOptions, getPreflightPropsOptions)
  }

  _onRequestSettled(response: UpResponse | Error): RenderResult {
    if (response instanceof UpResponse) {
      return this._onRequestSettledWithResponse(response)
    } else {
      // Value is up.Aborted, up.Offline or another fatal error that can never
      // be used as a fragment update. At this point up:request:aborted or up:request:offline
      // have already been emitted by up.Request.
      return this._onRequestSettledWithError(response)
    }
  }

  _onRequestSettledWithResponse(response: UpResponse): RenderResult {
    return new ChangeFromResponse({ ...this.options, response }).execute()
  }

  _onRequestSettledWithError(error: Error): never {
    if (error instanceof Offline) {
      let log = ['Cannot load fragment from %s: %s', error.request, error.reason]
      this.request.emit('up:fragment:offline', {
        callback: this.options.onOffline,
        renderOptions: this.options,
        retry: (retryOptions: t.RenderOptions) => render({ ...this.options, ...retryOptions }),
        log,
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
