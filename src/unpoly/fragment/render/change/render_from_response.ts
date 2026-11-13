import * as u from '../../../util.js'
import { CannotParse } from '../../../error.js'
import { fragmentConfig, reload, shouldRevalidate } from '../../../fragment.js'
import { refineOption } from '../../../history.js'
import { UNSET_OVERLAY_VISUALS } from '../../../layer.js'
import { printToStandard, printToWarn } from '../../../log.js'
import { type UpResponse } from '../../../network.js'
import { adoptRenderOptionsFromHeader } from '../../../script.js'
import type * as t from '../../types.js'
import { renderFromContent } from './render_from_content.js'
import { RenderOptions } from '../render_options.js'
import { type RenderResult } from '../render_result.js'

export function renderFromResponse(options: t.RenderOptions): RenderResult {
  // RenderJob and ChangeFromURL only call us with a { response }.
  let response = options.response!
  let loadedProps = loadedEventProps(options, response)

  if (fragmentConfig.skipResponse(loadedProps)) {
    skip(options, response)
  } else {
    // Allow listeners to inspect the response and either prevent the fragment change
    // or manipulate change options. An example for when this is useful is a maintenance
    // page with its own layout, that cannot be loaded as a fragment and must be loaded
    // with a full page load.
    response.request.assertEmitted('up:fragment:loaded', {
      ...loadedProps,
      callback: options.onLoaded, // One callback is used for both success and failure. There is no { onFailLoaded }.
      log: ['Loaded fragment from %s', response],
      skip: () => skip(options, response)
    })

    assertRenderableResponse(response)
  }

  // Listeners to up:fragment:loaded may have changed renderOptions.fail
  // to force success or failure options.
  let fail = u.evalOption(options.fail, response) ?? !response.ok

  // When renderFromContent() eventually compiles fragments, the { meta } object
  // will be passed as a third argument to compilers.
  // We build it from these options, since fail options may not have the { expiredResponse }.
  let meta = helloMeta(options, response)

  if (fail) {
    throw updateContentFromResponse(RenderOptions.deriveFailOptions(options), meta, response)
  }

  return updateContentFromResponse(options, meta, response)
}

function assertRenderableResponse(response: UpResponse): void {
  if (!fragmentConfig.renderableResponse(response)) {
    throw new CannotParse(['Cannot render response with content-type "%s" (configure with up.fragment.config.renderableResponse)', response.contentType])
  }
}

function skip(options: t.RenderOptions, response: UpResponse): void {
  printToStandard('up.render()', 'Skipping %s', response)
  options.target = ':none'
  options.failTarget = ':none'
}

function updateContentFromResponse(finalRenderOptions: t.RenderOptions, meta: u.PlainObject, response: UpResponse): RenderResult {
  if (finalRenderOptions.didForceFailOptions) {
    printToStandard('up.render()', 'Rendering error response using fail-prefixed options (https://unpoly.com/learn/error-responses)')
  }

  // The response might carry some updates for our change options,
  // like a server-set location, or server-sent events.
  augmentOptionsFromResponse(finalRenderOptions, response)

  finalRenderOptions.meta = meta

  // After the initial render pass has finished, consider reloading stale content.
  finalRenderOptions.verifyFinished = (result) => revalidate(result, finalRenderOptions, response)

  return renderFromContent(finalRenderOptions)
}

async function revalidate(renderResult: RenderResult, originalRenderOptions: t.RenderOptions, response: UpResponse): Promise<RenderResult | undefined> {
  if (!shouldRevalidate(response.request, response, originalRenderOptions)) return

  // This is an explicit target passed as `{ target }` option.
  // It may be `undefined` if the user has not given an explicit selector and relies on a fallback.
  // If it is given, it may still contain ':before' or ':after'.
  // It may also be an array or an element. RegExp#test() below coerces it to a string,
  // which joins an array and never matches an element. That is what we want, so we don't check its type.
  let inputTarget = originalRenderOptions.target as string

  // This is the target that we ended up rendering.
  // It may be a fallback target. It is always defined.
  let effectiveTarget = renderResult.target

  if (/:(before|after)/.test(inputTarget)) {
    printToWarn('up.render()', 'Cannot revalidate cache when prepending/appending (target %s)', inputTarget)
  } else {
    printToStandard('up.render()', 'Revalidating cached response for target "%s"', effectiveTarget)
    let revalidateResult = await reload(effectiveTarget, {
      ...originalRenderOptions,
      ...RenderOptions.NO_MOTION, // offering something like { verifyTransition } would mean we need to delay { onFinished } even further
      ...RenderOptions.NO_INPUT_INTERFERENCE,
      ...RenderOptions.NO_PREVIEWS,
      feedback: originalRenderOptions.feedback, // we do want to keep { feedback } for .up-revalidating
      preferOldElements: renderResult.fragments, // ensure we match the same fragments when initial render pass matched around { origin } and { origin } has been detached
      layer: renderResult.layer, // if the original render opened a layer, we now update it
      onFinished: null, // the earlier onFinished handler will already be honored by the up.RenderJob that called us
      expiredResponse: response, // flag will be forwarded to up:fragment:loaded
      preview: revalidatePreview(originalRenderOptions),
      abort: false,
      cache: false, // This implies { revalidate: false }. We will still update the expired cache entry.
      background: true,
      // The guardEvent was already plucked from render options in up.RenderJob#guardRender().
    })

    // A well-behaved server will respond with "304 Not Modified" if the reload
    // produced the same E-tag or Last-Modified timestamp. In that case we keep
    // the original up.RenderResult.
    //
    // In this case the up.RenderJob from up.reload() has already seen that the result has no content,
    // and will *not* have called { onResult } a second time. We will however return the original
    // render result so it can be passed to up.RenderJob#finished() callbacks.
    if (!revalidateResult.none) {
      return revalidateResult
    }
  }
}

function revalidatePreview(options: t.RenderOptions): t.PreviewValue | undefined {
  if (options.revalidatePreview === true) {
    return options.preview
  } else {
    return options.revalidatePreview
  }
}

function loadedEventProps(options: t.RenderOptions, response: UpResponse): t.FragmentLoadedProps {
  const { expiredResponse } = options

  return {
    request: response.request,
    response,
    renderOptions: options,
    revalidating: !!expiredResponse,
    expiredResponse,
  }
}

function helloMeta(options: t.RenderOptions, response: UpResponse): u.PlainObject {
  // (1) We avoid exposing values that would prevent garbage collection
  //    by compilers holding a reference to their meta arg in their closure.
  //
  // (3) We avoid exposing values that we cannot provide for the initial page load.
  //     That includes the request and response.
  //
  // (3) Another property { layer } will be assigned by up.hello().
  let meta = { revalidating: !!options.expiredResponse, ok: response.ok }
  up.migrate.processHelloMeta?.(meta, response)
  return meta
}

function augmentOptionsFromResponse(renderOptions: t.RenderOptions, response: UpResponse): void {
  // Also see preprocessing of server response in up.Request#extractResponseFromXHR().

  const responseURL = response.url

  // The server may send a #hash with X-Up-Location. Otherwise we keep the #hash of the requested URL,
  // like a browser does when it follows a redirect.
  let responseHash = u.parseURL(responseURL).hash
  let hash = responseHash || response.request.hash
  let serverLocation = responseHash ? responseURL : responseURL + (hash || '')
  if (hash) renderOptions.hash = hash

  const isReloadable = (response.method === 'GET')

  if (isReloadable) {
    // Remember where we got the fragment from so we can up.reload() it later.
    renderOptions.source = refineOption(renderOptions.source, responseURL)
  } else {
    // Keep the source of the previous fragment (e.g. the form that was submitted into failure).
    renderOptions.source = refineOption(renderOptions.source, 'keep')
    // Since the current URL is not retrievable over the GET-only address bar,
    // we can only provide history if an *explicit* location URL is passed as an option.
    renderOptions.history = !!renderOptions.location
  }

  let openLayerOptions = response.openLayer
  if (openLayerOptions) {
    // For callback strings like { onAccepted } we need to
    // (1) check up.script.config.allow and possibly block
    // (2) adopt any prefixed nonces
    // (3) parse the string into a function
    adoptRenderOptionsFromHeader(openLayerOptions, response.cspInfo)

    Object.assign(renderOptions, {
      ...UNSET_OVERLAY_VISUALS,              // When we're already opening an overlay, don't adopt its visuals.
      target: undefined,                     // The original target may no longer be appropriate, even if it exists in the response.
      ...fragmentConfig.navigateOptions, // Options like `{ history, focus, scroll }` might no longer work. Also enable a fallback target.
      ...openLayerOptions,                   // Anything explicitly passed as the value of `X-Up-Open-Layer`.
      layer: 'new',                          // Don't accept `X-Up-Open-Layer: { layer: 'parent' }`.
    })
  }

  renderOptions.location = refineOption(renderOptions.location, serverLocation)
  renderOptions.title = refineOption(renderOptions.title, response.title)
  renderOptions.eventPlans = response.eventPlans

  let serverTarget = response.target
  if (serverTarget) {
    renderOptions.target = serverTarget
  }

  renderOptions.acceptLayer = response.acceptLayer
  renderOptions.dismissLayer = response.dismissLayer
  renderOptions.document = response.text

  if (response.none) {
    renderOptions.target = ':none'
  }

  // If the server has provided an update to our context via the X-Up-Context
  // response header, merge it into our existing { context } option.
  renderOptions.context = u.merge(renderOptions.context, response.context)

  renderOptions.cspInfo = response.cspInfo
  renderOptions.time ??= response.lastModified
  renderOptions.etag ??= response.etag
}
