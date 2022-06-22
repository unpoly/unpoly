up.error = (function() {

  const u = up.util

  function build(message, props = {}) {
    if (u.isArray(message)) {
      message = u.sprintf(...message)
    }
    const error = new Error(message)
    Object.assign(error, props)
    return error
  }

  // Custom error classes is hard when we transpile to ES5.
  // Hence we create a class-like construct.
  // See https://webcodr.io/2018/04/why-custom-errors-in-javascript-with-babel-are-broken/
  function errorInterface(name, init = build) {
    const fn = function(...args) {
      const error = init(...args)
      error.name = name
      return error
    }

    fn.is = error => error.name === name

    fn.async = (...args) => Promise.reject(fn(...args))

    return fn
  }

  const cannotTarget = errorInterface('up.CannotTarget')

  const failed = errorInterface('up.Failed')

  // Emulate the exception that aborted fetch() would throw
  const aborted = errorInterface('AbortError', (message) => {
    return build(message || 'Aborted')
  })

  const notImplemented = errorInterface('up.NotImplemented')

  const cannotApply = errorInterface('up.CannotApply', (change, reason) => {
    return build(`Cannot apply change: ${change} (${reason})`)
  })

  const cannotParseSelector = errorInterface('up.CannotParseSelector')

  function emitGlobal(error) {
    // Emit an ErrorEvent on window.onerror for exception tracking tools
    const { message } = error
    up.emit(window, 'error', { message, error, log: false })
  }

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
  function fail(...args) {
    // Yes, we pass the message plus all substitution vars as an array in the first arg slot.
    throw up.error.failed(args)
  }

  function isCritical(error) {
    return (typeof error !== 'object') || ((error.name !== 'AbortError') && !(error instanceof up.RenderResult) && !(error instanceof up.Response))
  }

  /*-
  Registers an empty rejection handler in case the given promise
  rejects with an uncritical error.

  This prevents browsers from printing "Uncaught (in promise)" to the error
  console when the promise is rejected.

  This is helpful for event handlers where it is clear that no rejection
  handler will be registered:

  ```js
  up.on('submit', 'form[up-target]', (event, form) => {
    promise = up.submit(form)
    up.error.muteUncriticalRejection(promise)
  })
  ```

  Uncriticial errors include:

  - `AbortError`
  - A failed `up.Response`
  - A failed `up.RenderResult`

  Other types of errors will not be muted.

  @function up.error.muteUncriticalRejection
  @param {Promise} promise
  @return {Promise}
  @internal
  */
  function muteUncriticalRejection(promise) {
    return promise.catch(function(reason) {
      if (isCritical(reason)) {
        throw reason
      }
    })
  }

  return {
    fail,
    failed,
    aborted,
    cannotApply,
    notImplemented,
    cannotTarget,
    emitGlobal,
    isCritical,
    muteUncriticalRejection,
    cannotParseSelector
  }
})()

up.fail = up.error.fail
