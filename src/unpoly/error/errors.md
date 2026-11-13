# up.Error

The base class of all errors thrown by Unpoly.

All errors thrown by Unpoly inherit from `up.Error`, which inherits from the browser's
[`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).
To tell an error from Unpoly apart from an error in your own code, check `instanceof up.Error`:

```js
try {
  await up.render({ url: '/path', target: '.content' })
} catch (error) {
  if (error instanceof up.Error) { // mark: error instanceof up.Error
    console.log('Unpoly could not render: ' + error.message)
  } else {
    throw error
  }
}
```

When you might want to handle a failure, Unpoly throws a subclass like `up.CannotMatch` or `up.Offline`.
Other failures throw a plain `up.Error`.

Rendering functions don't only reject with errors. After rendering an [error response](/learn/error-responses),
they reject with an `up.RenderResult`. When the server responds with an error code, `up.request()` rejects with an `up.Response`.
Neither of them is an `up.Error`.

@learn-ref render-lifecycle#handling-errors

@class up.Error
@parent up.error

-----

# up.Aborted

An error thrown when a request or render pass was [aborted](/learn/aborting-requests).

Unpoly throws `up.Aborted` when it stops work before it is done.
The work may have been superseded by newer work, canceled by the user or your code,
or prevented by an event listener.

Its `{ name }` is `'AbortError'`, like the `DOMException` that `fetch()` and other native APIs throw when they are aborted.
To detect both kinds of aborts, check the error's name:

```js
try {
  await up.render({ url: '/path', target: '.content' })
} catch (error) {
  if (error.name === 'AbortError') { // mark: error.name === 'AbortError'
    console.log('Rendering was aborted: ' + error.message)
  }
}
```

To check for an Unpoly abort only, use `error instanceof up.Aborted`.

An aborted render pass is an expected outcome. To keep it from showing up as "Uncaught (in promise)" in the error console,
pass the promise to `up.error.muteUncriticalRejection()`.

@learn-ref aborting-requests#reacting

@class up.Aborted
@parent up.error

-----

# up.Blocked

An error thrown when Unpoly refuses to run a callback from an HTML attribute, like `[up-on-loaded]`.

Unpoly throws `up.Blocked` when your [callback policy](/learn/script-security#callback-policy)
or [Content Security Policy](/learn/script-security) doesn't allow a callback to run.
See [running callbacks with a strict CSP](/learn/script-security#callback-with-strict-csp) for ways to fix this.

@learn-ref script-security#callback-policy

@class up.Blocked
@parent up.error

-----

# up.CannotMatch

An error thrown when a [target selector](/learn/targeting-fragments) cannot be matched.

Unpoly throws `up.CannotMatch` when it cannot find the fragment or layer it should update,
in the current page or in the server response.
The error message names the selectors that were tried, and the layer in which they were looked up.

To make a target optional, use the [`:maybe`](/learn/targeting-fragments#optional-targets) pseudo-selector.
To render something else when a target is missing, configure a [fallback target](/learn/targeting-fragments#providing-a-fallback-target).
To handle the error in your own code, check `error instanceof up.CannotMatch`.

@learn-ref targeting-fragments#missing-targets

@class up.CannotMatch
@parent up.error

-----

# up.CannotParse

An error thrown when Unpoly cannot process a given selector or response.

Unpoly throws `up.CannotParse` when it is given input in a form it doesn't support,
like a selector syntax it cannot handle, or a response that is not HTML.

@class up.CannotParse
@parent up.error

-----

# up.CannotTarget

An error thrown when Unpoly cannot [derive a target selector](/learn/target-derivation) for an element.

Unpoly throws `up.CannotTarget` when it needs a selector for an element, but cannot build one
that matches the element.
To fix this, give the element an `[id]` attribute, or configure `up.fragment.config.targetDerivers`.

@learn-ref target-derivation

@class up.CannotTarget
@parent up.error

-----

# up.Offline

An error thrown when a request could not reach the server, because of a [network issue or timeout](/learn/network-issues).

Unpoly throws `up.Offline` when the connection is lost, or when a request takes longer than its
[timeout](/api/up.network.config#config.timeout).
Rendering functions also run their [`{ onOffline }`](/learn/network-issues) callback,
where you can retry the request or render something else.

To handle the error in your own code, check `error instanceof up.Offline`.
The `up.Offline#request` property holds the request that could not reach the server.

@learn-ref network-issues

@class up.Offline
@parent up.error

-----

# up.Offline#request

The `up.Request` that could not reach the server.

@property up.Offline#request
@param {up.Request} request
@experimental
