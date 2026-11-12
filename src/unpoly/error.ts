export { Aborted } from './error/aborted.js'
export { Blocked } from './error/blocked.js'
export { CannotMatch } from './error/cannot_match.js'
export { CannotParse } from './error/cannot_parse.js'
export { CannotTarget } from './error/cannot_target.js'
import { UpError } from './error/error.js'
export { UpError }
export { NotImplemented } from './error/not_implemented.js'
export { Offline } from './error/offline.js'

/*-
Functions to deal with errors from Unpoly's rendering and network functions.

Functions like `up.render()`, `up.follow()` or `up.request()` return a promise that rejects when they fail.
Some of these rejections are expected, like an aborted request or an error response from the server.
`up.error.muteUncriticalRejection()` lets you ignore the expected rejections, while other errors still reach the error console.

@learn-ref render-lifecycle#handling-errors

@namespace up.error
*/

/*-
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
*/
export function fail(...args: [message: string, ...vars: any[]]): never {
  // Yes, we pass the message plus all substitution vars as an array in the first arg slot.
  throw new UpError(args)
}

// up.Response and up.RenderResult implement this protocol to mark their instances as uncritical.
// An `instanceof` check would have to import them, but util imports this module. Their modules,
// and every namespace they import, would then be evaluated before util.
export function isCritical(error: any): boolean {
  return (typeof error !== 'object') || (error[isCritical.key] ? error[isCritical.key]() : (error.name !== 'AbortError'))
}

isCritical.key = 'up.error.isCritical' as const

/*-
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
*/
// Takes a promise, or a promise-like object like an up.RenderJob.
export function muteUncriticalRejection<T>(promise: Pick<Promise<T>, 'catch'>): Promise<T | void> {
  return promise.catch(throwCritical)
}

export function muteUncriticalSync<T>(block: () => T): T | undefined {
  try {
    return block()
  } catch (e) {
    throwCritical(e)
  }
}

export function throwCritical(value: any): void {
  if (isCritical(value)) {
    throw value
  }
}

export function guard<A extends any[], R>(fn: (...args: A) => R, ...args: A): R | undefined {
  try {
    return fn(...args)
  } catch (error) {
    reportError(error)
  }
}

export function guardPromise<T>(promise: Promise<T>): Promise<T | void> {
  return promise.catch(reportError)
}

export function guardFn<A extends any[], R>(fn: ((...args: A) => R) | undefined): ((...args: A) => R | undefined) | undefined {
  if (fn) {
    return (...args) => guard(() => fn(...args))
  }
}

export const api = {
  error: {
    muteUncriticalRejection,
  },
}
