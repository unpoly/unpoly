@partial up.render/lifecycle-hooks

@param {string} [options.confirm]
  A message the user needs to confirm before any request or changes are made.

  The message will be shown as a [native browser prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt).

  If the user does not confirm, no request is sent and no fragments are updated.
  In that case the render promise rejects with an `up.AbortError`.

@param {Function(Event)} [options.onLoaded]
  A callback that will be run when the server responds with new HTML,
  but before the HTML is rendered.

  The callback argument is a preventable `up:fragment:loaded` event.

  This callback will also run for [failed responses](/failed-responses).

@param {Function(Event)} [options.onOffline]
  A callback that will be run when the fragment could not be loaded
  due to a [disconnect or timeout](/network-issues).

  The callback argument is a preventable `up:fragment:offline` event.

@param {Function(up.RenderResult)} [options.onRendered]
  A function to call when Unpoly has updated fragments.

  This callback may be called zero, one or two times:

  - When the server rendered an [empty response](/skipping-rendering#rendering-nothing), no fragments are updated. `{ onRendered }` is not called.
  - When the server rendered a matching fragment, it will be updated on the page. `{ onRendered }` is called with the [result](/up.RenderResult).
  - When [revalidation](/caching#revalidation) renders a second time, `{ onRendered }` is called again with the final result.

  Also see [Running code after rendering](/render-lifecycle#running-code-after-rendering).

@param {Function(up.RenderResult)} [options.onFinished]
  A function to call when no further DOM changes will be caused by this render pass.

  @include finished-state

  The callback argument is the last `up.RenderResult` that updated a fragment.
  If [revalidation](/caching#revalidation) re-rendered the fragment, it is the result from the
  second render pass. If no revalidation was performed, or if revalidation yielded an [empty response](/caching#when-nothing-changed),
  it is the result from the initial render pass.

  Also see [Awaiting post-processing](/render-lifecycle#postprocessing).

@param {Function(Error)} [options.onError]
  A callback that will be run when any error is thrown during the rendering process.

  The callback is also called when the render pass fails due to [network issues](/network-issues),
  or [aborts](/aborting-requests).

  Also see [Handling errors](/render-lifecycle#handling-errors).
