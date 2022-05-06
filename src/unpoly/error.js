up.error = (function() {

  const u = up.util

  function build(message, props = {}) {
    if (u.isArray(message)) {
      message = u.sprintf(...message)
    }
    const error = new Error(message)
    u.assign(error, props)
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

  const failed = errorInterface('up.Failed')

  // Emulate the exception that aborted fetch() would throw
  const aborted = errorInterface('AbortError', (message) => {
    return build(message || 'Aborted')
  })

  const notImplemented = errorInterface('up.NotImplemented')

  const notApplicable = errorInterface('up.NotApplicable', (change, reason) => {
    return build(`Cannot apply change: ${change} (${reason})`)
  })

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
    throw up.error.failed(args)
  }

  return {
    fail,
    failed,
    aborted,
    notApplicable,
    notImplemented,
    emitGlobal
  }
})()

up.fail = up.error.fail
