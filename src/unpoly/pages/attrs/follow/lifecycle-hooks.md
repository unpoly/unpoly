@partial attrs/follow/lifecycle-hooks

@param [up-confirm]
  A message the user needs to confirm before any request or changes are made.

  The message will be shown as a [native browser prompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt).

  If the user does not confirm, no request is sent and no fragments are updated.

@param [up-on-loaded]
  A JavaScript snippet that is executed when the server responds with new HTML,
  but before the HTML is rendered.

  The snippet runs in the following scope:

  | Expression | Value                                         |
  |------------|-----------------------------------------------|
  | `this`     | The link being followed                       |
  | `event`    | A preventable `up:fragment:loaded` event      |

  The snippet will also run for [failed responses](/failed-responses).

@param [up-on-offline]
  A JavaScript snippet that is executed when the fragment could not be loaded
  due to a [disconnect or timeout](/network-issues).

  | Expression | Value                                         |
  |------------|-----------------------------------------------|
  | `this`     | The link being followed                       |
  | `error`    | An `up.Offline` error                         |

@param [up-on-rendered]
  A JavaScript snippet that is executed when Unpoly has updated fragments.

  The snippet runs in the following scope:

  | Expression | Value                                                |
  |------------|------------------------------------------------------|
  | `this`     | The link being followed                              |
  | `result`   | The `up.RenderResult` for the respective render pass |

  The snippet will be called zero, one or two times:

  - When the server rendered an [empty response](/skipping-rendering#rendering-nothing), no fragments are updated. `[up-on-rendered]` is not called.
  - When the server rendered a matching fragment, it will be updated on the page. `[up-on-rendered]` is called with the [result](/up.RenderResult).
  - When [revalidation](/caching#revalidation) renders a second time, `[up-on-rendered]` is called again with the final result.

  Also see [Running code after rendering](/render-lifecycle#running-code-after-rendering).

@param [up-on-finished]
  A JavaScript snippet that is executed when no further DOM changes will be caused by this render pass.

  In particular:

  - [Animations](/up.motion) have concluded and [transitioned](/up-transition) elements were removed from the DOM tree.
  - A [cached response](#up-cache) was [revalidated with the server](/caching#revalidation).
    If the server has responded with new content, this content has also been rendered.

  | Expression | Value                                                                  |
  |------------|------------------------------------------------------------------------|
  | `this`     | The link being followed                                                |
  | `result`   | The `up.RenderResult` for the last render pass that updated a fragment |

  If [revalidation](/caching#revalidation) re-rendered the fragment, `result` describes updates from the
  second render pass. If no revalidation was performed, or if revalidation yielded an [empty response](/caching#when-nothing-changed),
  it is the result from the initial render pass.

  Also see [Awaiting postprocessing](/render-lifecycle#awaiting-postprocessing).

@param [up-on-error]
  A JavaScript snippet that is run when any error is thrown during the rendering process.

  | Expression | Value                                         |
  |------------|-----------------------------------------------|
  | `this`     | The link being followed                       |
  | `error`    | An `Error` object                             |

  The callback is also called when the render pass fails due to [network issues](/network-issues),
  or [aborts](/aborting-requests).

  Also see [Handling errors](/render-lifecycle#handling-errors).
