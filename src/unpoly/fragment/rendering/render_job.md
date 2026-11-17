# up.RenderJob

A queued render task.

Rendering functions like `up.render()` or `up.submit()` return an `up.RenderJob`.
Callers can inspect the job's [render options](/api/up.RenderJob.prototype.renderOptions) or [`await` its completion](/learn/render-lifecycle#running-code-after-rendering).

See [render hooks](/learn/render-lifecycle) for examples of awaiting rendering completion
and how to handle errors.

## Example

```js
let job = up.render('.foo', { url: '/users' })
console.log(job.renderOptions.target) // logs ".foo"
console.log(job.renderOptions.url) // logs "/users"
let renderResult = await job // fragments were updated
console.log(renderResult.fragment) // logs the updated fragment
let finalResult = await job.finished // animations are done and cached content was revalidated
console.log(finalResult.fragment) // logs the revalidated fragment
```

@class up.RenderJob
@parent up.fragment

-----

# up.RenderJob#renderOptions

The [render options](/api/up.render#parameters) for this job.

@property up.RenderJob#renderOptions
@param {Object} renderOptions
@stable

-----

# up.RenderJob#finished

A promise that fulfills when fragments were updated and all [postprocessing steps](/learn/render-lifecycle#postprocessing) have concluded.

The promise will reject when the server responds with an [HTTP error status](/learn/error-responses),
when any request is [aborted](/learn/aborting-requests) or when there is a [network issue](/learn/network-issues).

See [render hooks](/learn/render-lifecycle) for examples for awaiting rendering completion.

@property up.RenderJob#finished
@param {Promise<up.RenderResult>} finished
  The [revalidated](/learn/caching#revalidation) render result.
@stable

-----

# up.RenderJob#then()

An `up.RenderJob` is also a promise for its completion.

The promise is *fulfilled* with an `up.RenderResult` when a fragment
was updated from a successful server response.

The promise will *reject* for responses with an [HTTP error status](/learn/error-responses),
when the request is [aborted](/learn/aborting-requests), or when there is a
[network issue](/learn/network-issues).

See [render hooks](/learn/render-lifecycle) for examples of awaiting rendering completion
and how to handle errors.

@function up.RenderJob#then
@param {Function(up.RenderResult)} onFulfilled
@param {Function(up.RenderResult|Error)} onRejected
@return {Promise<up.RenderResult>}
  A promise that fulfills with an `up.RenderResult` once the page has been updated.
@stable
