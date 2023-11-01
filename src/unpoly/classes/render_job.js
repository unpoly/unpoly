const u = up.util

/*-
A queued render task.

Rendering functions like `up.render()` or `up.submit()` return an `up.RenderJob`.
Callers can inspect the job's [options](/up.RenderJob.prototype.options) or [`await` its completion](/render-hooks#running-code-after-rendering).

See [render hooks](/render-hooks) for examples for awaiting rendering completion
and how to handle errors.

## Example

```
let job = up.render('.foo', url: '/users')
console.log(job.options.target) // logs ".foo"
console.log(job.options.url) // logs "/users"
let renderResult = await job // fragments were updated
console.log(renderResult.fragment) // logs the updated fragment
let finalResult = await job.finished // animations are done and cached content was revlidated
console.log(finalResult.fragment) // logs the revalidated fragment
```

@class up.RenderJob
@parent up.fragment
*/
up.RenderJob = class RenderJob {

  constructor(options) {
    this.options = up.RenderOptions.preprocess(options)
    this._rendered = this._execute()
  }

  /*-
  The [render options](/up.render) for this job.

  @property up.RenderJob#options
  @param {Object} options
  @stable
  */

  async _execute() {
    try {
      let result = await this._makeChange()
      this._handleResult(result)
      return result
    } catch (resultOrError) {
      this._handleResult(resultOrError) || this._handleError(resultOrError)
      throw resultOrError
    }
  }

  _handleResult(result) {
    // There may be multiple reasons why `result` is not an up.RenderResult:
    //
    // (1) There was an error during the request (return value is up.Offline, up.Aborted, etc.)
    // (2) No fragment could be matched (return value is up.CannotMatch)
    // (3) We're preloading (early return value is up.Request)
    if (result instanceof up.RenderResult) {
      let { onRendered, onFinished } = result.options

      // We call result.options.onRendered() instead of this.options.onRendered()
      // as this will call the correct options.onRendered() or onFailRendered()
      // depending on options.failOptions.
      if (!result.none) up.error.guard(() => onRendered?.(result))

      // Run an { onFinished } callback if revalidation succeeds.
      // There is no callback for a failed revalidation.
      //
      // We need to pay attention to not creating unnecessary promises that will fail with unhandled rejections:
      //
      // (1) Only access result.finished through this.finished to avoid creating new promises
      // (2) The then() will create a new chain, and we don't want to fail that

      let guardedOnFinished = function(result) {
        up.error.guard(() => onFinished?.(result))
      }

      // Handling errors with `u.noop` prevents Chrome from logging an `unhandledrejection` event
      // to the error console, hiding details about a failed revalidation. We could fix this by
      // handling errors with `up.error.throwCritical` instead.
      //
      // However, handling errors with `up.error.throwCritical` will cause Safari (not Chrome)
      // to emit an `unhandledrejection` event whenever there is a critical error, even if there are
      // other error handlers registered via `job.finished.catch()`.
      //
      // I think Safari is in the right here, as every individual `then()` chain should require
      // an error handler or log an `unhandledrejection` event when an error is thrown. However I cannot
      // find a solution that has the same behavior in both Safari and Chrome.
      //
      // Although Chrome will fail to log error traces that way, we still log the error name and message
      // in _handleError().
      this.finished.then(guardedOnFinished, u.noop)

      return true
    }
  }

  _handleError(error) {
    let prefix = error instanceof up.Aborted ? 'Rendering was aborted' : 'Error while rendering'
    up.puts('up.render()', `${prefix}: ${error.name}: ${error.message}`)
    up.error.guard(() => this.options.onError?.(error))
  }

  /*-
  A promise that fulfills when fragments were updated, [animations](/up.motion) have concluded and
  cached content was [revalidated](/caching#revalidation).

  The promise will reject when the server responds with a [failed HTTP status](/failed-responses),
  when any request is [aborted](/aborting-requests) or when there is [network issue](/network-issues).

  See [render hooks](/render-hooks) for examples for awaiting rendering completion.

  @property up.RenderJob#finished
  @param {Promise<up.RenderResult>} finished
    The [revalidated](/caching#revalidation) render result.
  @stable
  */
  get finished() {
    return this._awaitFinished()
  }

  async _awaitFinished() {
    try {
      let result = await this._rendered
      return await result.finished
    } catch (error) {
      if (error instanceof up.RenderResult) {
        throw await error.finished
      } else {
        throw error
      }
    }
  }

  _makeChange() {
    this._guardRender()

    if (this.options.url) {
      let onRequest = (request) => this._handleAbortOption(request)
      this.change = new up.Change.FromURL({ ...this.options, onRequest })
    } else if (this.options.response) {
      this.change = new up.Change.FromResponse(this.options)
      this._handleAbortOption(null)
    } else {
      this.change = new up.Change.FromContent(this.options)
      this._handleAbortOption(null)
    }

    return this.change.execute()
  }

  _guardRender() {
    up.browser.assertConfirmed(this.options)

    let guardEvent = u.pluckKey(this.options, 'guardEvent')
    if (guardEvent) {
      // Allow guard event handlers to manipulate render options for the default behavior.
      //
      // Note that we have removed { guardEvent } from options to not recursively define
      // guardEvent.renderOptions.guardEvent. This would cause an infinite loop for event
      // listeners that prevent the default and re-render.
      guardEvent.renderOptions = this.options
      if (up.emit(guardEvent, { target: this.options.origin }).defaultPrevented) {
        throw new up.Aborted(`Rendering was prevented by ${guardEvent.type} listener`)
      }
    }

    up.RenderOptions.assertContentGiven(this.options)
  }

  _handleAbortOption(request) {
    // When preloading up.RenderOptions forces { abort: false }.
    let { abort } = this.options

    if (!abort || !up.network.isBusy()) return

    let { fragments, layer, origin, newLayer } = this.change.getPreflightProps()

    let abortOptions = {
      except: request, // don't abort the request we just made
      logOnce: ['up.render()', 'Change with { abort } option will abort other requests'],
      newLayer,
      origin,
    }

    if (abort === 'target') {
      // Abort requests in the subtree of the targeted fragment
      up.fragment.abort(fragments, abortOptions)
    } else if (abort === 'layer') {
      // Abort requests targeting any fragment in the targeted layer
      up.fragment.abort({ ...abortOptions, layer })
    } else if (abort === 'all' || abort === true) {
      // Abort requests targeting any fragment in any layer
      up.fragment.abort({ ...abortOptions, layer: 'any' })
    } else if (u.isFunction(abort)) {
      // Required by unpoly-migrate to convert { solo: URLPatternString } and { solo: Function(up.Request): boolean }.
      // We don't advertise this variant as aborting arbitrary requests cannot support
      // up:fragment:aborted events or the up.fragment.onAborted() function.
      abort(abortOptions)
    } else {
      // (1) Abort requests in the subtree of a given selector (string)
      // (2) Abort requests targeting a given element
      up.fragment.abort(abort, { ...abortOptions, layer })
    }
  }

  /*-
  An `up.RenderJob` is also a promise for its completion.

  The promise is *fulfilled* with an `up.RenderResult` when a fragment
  was updated from a successful server response.

  The promise will *reject* for responses with a [failed HTTP status](/failed-responses),
  when the request is [aborted](/aborting-requests) or when there is
  [network issue](/network-issues).

  See [render hooks](/render-hooks) for examples for awaiting rendering completion
  and how to handle errors.

  @function up.RenderJob#then
  @param {Function(up.RenderResult)} onFulfilled
  @param {Function(up.RenderResult|Error)} onRejected
  @return {Promise<up.RenderResult>}
    A promise that fulfills with an `up.RenderResult` once the page has been updated.
  @stable
  */
  static {
    // A request is also a promise ("thenable") for its initial render pass.
    u.delegate(this.prototype, ['then', 'catch', 'finally'], function() { return this._rendered })

    u.memoizeMethod(this.prototype, {
      _awaitFinished: true
    })
  }

}
