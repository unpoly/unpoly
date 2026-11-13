import * as u from '../../../util.js'
import { Offline } from '../../../error.js'
import { render, toFailKey } from '../../../fragment.js'
import { canPushState, isHistoryEnabled } from '../../../history.js'
import { printToStandard } from '../../../log.js'
import {
  loadPage, makeRequest, UpResponse, type RequestOptions, type UpRequest,
} from '../../../network.js'
import type * as t from '../../types.js'
import { preflightPropsFromContent } from './render_from_content.js'
import { renderFromResponse } from './render_from_response.js'
import { RenderOptions } from '../render_options.js'
import { type RenderResult } from '../render_result.js'

// The options for the request of renderFromURL(): the render options plus the preflight props
// of the success and fail options.
type RequestAttrs = t.RenderOptions & t.PreflightProps & { url: string }

// Fulfills with a request for { preload: true }.
export async function renderFromURL(options: t.RenderOptions & { url: string }): Promise<RenderResult | UpRequest> {
  let reason = newPageReason(options)
  if (reason) {
    printToStandard('up.render()', reason)
    // A full page load only uses the request options among the render options (and ignores { target }).
    loadPage(options as RequestOptions)
    // Prevent our caller from executing any further code, since we're already
    // navigating away from this JavaScript environment.
    return u.unresolvablePromise()
  }

  let requestAttrs = getRequestAttrs(options)
  let request = makeRequest(requestAttrs)
  options.onRequestKnown?.(request)

  if (options.preload) return request

  // RenderJob always sets { handleAbort }.
  options.handleAbort!({ request, ...requestAttrs })
  request.runPreviews(options)

  // Use always() since onRequestSettled() will decide whether the promise
  // will be fulfilled or rejected.
  return await u.always(request, (responseOrError) => onRequestSettled(responseOrError, options, request))
}

function newPageReason(options: t.RenderOptions & { url: string }): string | undefined {
  // Rendering content from cross-origin URLs is out of scope for Unpoly.
  // We still allow users to call up.render() with a cross-origin URL, but
  // we will then make a full-page request.
  if (u.isCrossOrigin(options.url)) {
    return 'Loading cross-origin content in new page'
  }

  // Unpoly may have been booted without suppport for history.pushState.
  // E.g. when the initial page was loaded from a POST response.
  // In this case we make a full page load in hopes to reboot with
  // pushState support. We don't need to when we would not change the browser URL anyway.
  if (options.history && !canPushState() && isHistoryEnabled('location')) {
    return 'Loading content in new page to restore history support'
  }
}

// - Includes the render options
// - Includes the preflight props of the success options
// - Includes the preflight props for fail-prefixed options
function getRequestAttrs(options: t.RenderOptions & { url: string }): RequestAttrs {
  // preflightPropsFromContent() will return meta information about the change that is most
  // likely before the request was dispatched.
  // This might change postflight if the response does not contain the desired target.
  const successAttrs = preflightPropsFromContent(options)
  // This is empty when the fail options match no target.
  const failAttrs = preflightPropsFromContent(RenderOptions.deriveFailOptions(options), { optional: true })

  return {
    ...options, // contains preflight keys relevant for the request, e.g. { url, method }
    ...successAttrs, // contains meta information for an successful update, e.g. { layer, mode, context, target }
    ...u.withRenamedKeys(failAttrs, toFailKey), // contains meta information for a failed update, e.g. { failTarget },
  }
}

function onRequestSettled(response: UpResponse | Error, options: t.RenderOptions, request: UpRequest): RenderResult {
  if (response instanceof UpResponse) {
    return renderFromResponse({ ...options, response })
  } else {
    // Value is up.Aborted, up.Offline or another fatal error that can never
    // be used as a fragment update. At this point up:request:aborted or up:request:offline
    // have already been emitted by up.Request.
    return onRequestSettledWithError(response, options, request)
  }
}

function onRequestSettledWithError(error: Error, options: t.RenderOptions, request: UpRequest): never {
  if (error instanceof Offline) {
    let log = ['Cannot load fragment from %s: %s', error.request, error.reason]
    request.emit('up:fragment:offline', {
      callback: options.onOffline,
      renderOptions: options,
      retry: (retryOptions: t.RenderOptions) => render({ ...options, ...retryOptions }),
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
