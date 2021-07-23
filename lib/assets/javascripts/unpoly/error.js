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

  const invalidSelector = errorInterface('up.InvalidSelector', (selector) => {
    return build(`Cannot parse selector: ${selector}`)
  })

  function emitGlobal(error) {
    // Emit an ErrorEvent on window.onerror for exception tracking tools
    const { message } = error
    up.emit(window, 'error', { message, error, log: false })
  }

  return {
    failed,
    aborted,
    invalidSelector,
    notApplicable,
    notImplemented,
    emitGlobal
  }
})()
