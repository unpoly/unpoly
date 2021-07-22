/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
up.error = (function() {

  const u = up.util;

  const build = function(message, props = {}) {
    if (u.isArray(message)) {
      message = u.sprintf(...Array.from(message || []));
    }
    const error = new Error(message);
    u.assign(error, props);
    return error;
  };

  // Custom error classes is hard when we transpile to ES5.
  // Hence we create a class-like construct.
  // See https://webcodr.io/2018/04/why-custom-errors-in-javascript-with-babel-are-broken/
  const errorInterface = function(name, init = build) {
    const fn = function(...args) {
      const error = init(...Array.from(args || []));
      error.name = name;
      return error;
    };

    fn.is = error => error.name === name;

    fn.async = (...args) => Promise.reject(fn(...Array.from(args || [])));

    return fn;
  };

  const failed = errorInterface('up.Failed');

  // Emulate the exception that aborted fetch() would throw
  const aborted = errorInterface('AbortError', message => build(message || 'Aborted'));

  const notImplemented = errorInterface('up.NotImplemented');

  const notApplicable = errorInterface('up.NotApplicable', (change, reason) => build(`Cannot apply change: ${change} (${reason})`));

  const invalidSelector = errorInterface('up.InvalidSelector', selector => build(`Cannot parse selector: ${selector}`));

  const emitGlobal = function(error) {
    // Emit an ErrorEvent on window.onerror for exception tracking tools
    const {
      message
    } = error;
    return up.emit(window, 'error', { message, error, log: false });
  };

  return {
    failed,
    aborted,
    invalidSelector,
    notApplicable,
    notImplemented,
    emitGlobal
  };
})();
