import { UpError } from './error/error.js'

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
Registers an empty rejection handler in case the given promise
rejects with an uncritical error.

This prevents browsers from printing "Uncaught (in promise)" to the error
console when the promise is rejected.

This is helpful for event handlers where you know that no rejection
handler will be registered:

```js
up.on('submit', 'form[up-target]', (event, form) => {
  promise = up.submit(form)
  up.error.muteUncriticalRejection(promise)
})
```

Uncritical errors include:

- `AbortError`
- A failed `up.Response`
- A failed `up.RenderResult`

Other types of errors will not be muted.

@function up.error.muteUncriticalRejection
@param {Promise} promise
@return {Promise}
@internal
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
