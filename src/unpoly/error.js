up.error = (function() {

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
    throw new up.Error(args)
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
    return promise.catch(throwCritical)
  }

  function muteUncriticalSync(block) {
    try {
      return block()
    } catch (e) {
      throwCritical(e)
    }
  }

  function throwCritical(value) {
    if (isCritical(value)) {
      throw value
    }
  }

  function guard(fn, ...args) {
    try {
      return fn(...args)
    } catch (error) {
      reportError(error)
    }
  }

  function guardFn(fn) {
    return (...args) => guard(() => fn(...args))
  }

  return {
    fail,
    throwCritical,
    muteUncriticalRejection,
    muteUncriticalSync,
    guard,
    guardFn,
  }
})()

up.fail = up.error.fail
