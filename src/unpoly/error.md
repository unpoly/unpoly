# up.error

Functions to deal with errors from Unpoly's rendering and network functions.

Functions like `up.render()`, `up.follow()` or `up.request()` return a promise that rejects when they fail.
Some of these rejections are expected, like an aborted request or an error response from the server.
`up.error.muteUncriticalRejection()` lets you ignore the expected rejections, while other errors still reach the error console.

@learn-ref render-lifecycle#handling-errors

@namespace up.error

-----

# up.fail()

Throws a [JavaScript error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
with the given message.

The message may contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions).

### Examples

    up.fail('Division by zero')
    up.fail('Unexpected result %o', result)

@function up.fail
@param {string} message
  A message with details about the error.

  The message can contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions)
  like `%s` or `%o`.
@param {Array<string>} vars...
  A list of variables to replace any substitution marks in the error message.
@internal

-----

# up.error.muteUncriticalRejection()

Ignores the given promise's rejection when it is an expected outcome, like an aborted request or an error response.

When you call a function like `up.follow()` without handling its promise, browsers print
"Uncaught (in promise)" to the error console whenever that promise rejects. This also happens for
routine outcomes, like a request that was [aborted](/learn/aborting-requests)
or a server that responded with an [error code](/learn/error-responses).

This function registers a rejection handler that ignores the following rejections:

- An `AbortError`, like an `up.Aborted` error or a native `DOMException` with the name `'AbortError'`.
  Unpoly rejects with `up.Aborted` when a request or render pass was [aborted](/learn/aborting-requests).
- An `up.RenderResult`, which a rendering function rejects with after it rendered an [error response](/learn/error-responses).
- An `up.Response`, which `up.request()` rejects with when the server responds with an error code.

Any other rejection, like an `up.CannotMatch` or `up.Offline` error, or an exception in your own code,
still rejects the returned promise.

## Example

You can mute the rejection of a promise that you don't handle yourself:

```js
up.on('submit', 'form[up-target]', (event, form) => {
  let promise = up.submit(form)
  up.error.muteUncriticalRejection(promise)
})
```

@learn-ref render-lifecycle#handling-errors

@function up.error.muteUncriticalRejection
@param {Promise} promise
  The promise to mute.

  You may also pass an `up.RenderJob` or an `up.Request`.
@return {Promise}
  A promise that fulfills with the original promise's value, or with `undefined` when the
  original promise rejected with an expected rejection.

  When the original promise rejects with any other value, the returned promise rejects with that value.
@experimental
