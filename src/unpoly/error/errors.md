# up.Error

The base class of all errors thrown by Unpoly.

Every error class on this page inherits from `up.Error`, which inherits from the browser's
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

Unpoly throws a subclass like `up.CannotMatch` or `up.Offline` when you might want to handle a failure.
It throws a plain `up.Error` for other failures, like when you try to preload an unsafe link.

An error's `{ name }` is the name of its class, like `'up.CannotMatch'`. An `up.Aborted` error is the exception:
its name is `'AbortError'`.

Rendering functions don't only reject with errors. After rendering an [error response](/learn/error-responses),
they reject with an `up.RenderResult`. When the server responds with an error code, `up.request()` rejects with an `up.Response`.
Neither of them is an `up.Error`.

@learn-ref render-lifecycle#handling-errors

@class up.Error
@parent up.error

-----

# up.Aborted

An error thrown when a request or render pass was [aborted](/learn/aborting-requests).

Unpoly throws `up.Aborted` in cases like these:

- A request is aborted, e.g. because another request [targets the same fragment](/learn/aborting-requests#aborting-conflicting-requests),
  or because you called `up.fragment.abort()` or `up.Request#abort()`.
- A preventable event like `up:link:follow` or `up:fragment:loaded` was prevented.
- The user canceled a [confirmation dialog](/learn/confirmation-dialogs).
- An overlay closed while it was being rendered into, or a listener prevented it from closing.

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

A callback is blocked when `up.script.config.evalCallbackPolicy` doesn't allow it,
or when your [Content Security Policy](/learn/script-security) doesn't allow `eval()`.
See [running callbacks with a strict CSP](/learn/script-security#callback-with-strict-csp) for ways to fix this.

@learn-ref script-security#callback-policy

@class up.Blocked
@parent up.error

-----

# up.CannotMatch

An error thrown when a [target selector](/learn/targeting-fragments) cannot be matched.

Rendering functions like `up.render()` reject with `up.CannotMatch` in cases like these:

- The target is missing in the current page or in the server response, and no [fallback target](/learn/targeting-fragments#missing-targets) matched either.
- The server responded with an error code, and no [fail target](/learn/error-responses) was given.
- The given [layer](/api/up.layer) could not be found.

The error message names the selectors that were tried, and the layer in which they were looked up.

To make a target optional, use the [`:maybe`](/learn/targeting-fragments#optional-targets) pseudo-selector.
To render something else when a target is missing, configure a [fallback target](/learn/targeting-fragments#providing-a-fallback-target).

```js
try {
  await up.render({ url: '/path', target: '.content' })
} catch (error) {
  if (error instanceof up.CannotMatch) { // mark: error instanceof up.CannotMatch
    console.log('Could not find .content in the current page or the response')
  }
}
```

@learn-ref targeting-fragments#missing-targets

@class up.CannotMatch
@parent up.error

-----

# up.CannotParse

An error thrown when Unpoly cannot process a given selector or response.

Unpoly throws `up.CannotParse` in cases like these:

- `up.element.createFromSelector()` or `up.element.affix()` is given an attribute selector it doesn't support,
  like `input[type = "text"]` or `[lang="en" i]`.
- A rendering function receives a response that is not HTML.
  You can configure which responses are rendered with `up.fragment.config.renderableResponse`.

@class up.CannotParse
@parent up.error

-----

# up.CannotTarget

An error thrown when Unpoly cannot [derive a target selector](/learn/target-derivation) for an element.

Unpoly throws `up.CannotTarget` in cases like these:

- `up.fragment.toTarget()` cannot derive a selector that matches the given element.
  To fix this, give the element an `[id]` attribute, or configure `up.fragment.config.targetDerivers`.
- You try to render into the `<html>` element. Make a full page load instead.

@learn-ref target-derivation

@class up.CannotTarget
@parent up.error

-----

# up.Offline

An error thrown when a request could not reach the server, because of a [network issue or timeout](/learn/network-issues).

`up.request()` and rendering functions like `up.render()` reject with `up.Offline` when the connection is lost, or when
a request takes longer than its [timeout](/api/up.network.config#config.timeout).
When [revalidating](/learn/caching#revalidation) an expired cache entry fails, `up.RenderJob#finished` rejects with `up.Offline`.

Rendering functions also run their [`{ onOffline }`](/learn/network-issues) callback and emit `up:fragment:offline`,
where you can retry the request or render something else. `up.request()` emits `up:request:offline`.

```js
try {
  await up.render({ url: '/path', target: '.content' })
} catch (error) {
  if (error instanceof up.Offline) { // mark: error instanceof up.Offline
    console.log('Could not load ' + error.request.url)
  }
}
```

@learn-ref network-issues

@class up.Offline
@parent up.error

-----

# up.Offline#request

The `up.Request` that could not reach the server.

@property up.Offline#request
@param {up.Request} request
@experimental
