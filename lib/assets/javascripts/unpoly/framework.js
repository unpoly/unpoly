/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/***
@module up.framework
*/

up.framework = (function() {
  const u = up.util;

  let booting = true;

  /***
  Resets Unpoly to the state when it was booted.
  All custom event handlers, animations, etc. that have been registered
  will be discarded.

  Emits event [`up:framework:reset`](/up:framework:reset).

  @function up.framework.reset
  @internal
  */
  const emitReset = () => up.emit('up:framework:reset', {log: false});

  /***
  This event is [emitted](/up.emit) when Unpoly is [reset](/up.framework.reset) during unit tests.

  @event up:framework:reset
  @internal
  */

  /***
  Boots the Unpoly framework.

  **This is called automatically** by including the Unpoly JavaScript files.

  Unpoly will not boot if the current browser is [not supported](/up.browser.isSupported).
  This leaves you with a classic server-side application on legacy browsers.

  @function up.boot
  @internal
  */
  const boot = function() {
    // This is called synchronously after all Unpoly modules have been parsed
    // and executed. We cannot delay booting until the DOM is ready, since by then
    // all user-defined event listeners and compilers will have registered.
    // Note that any non-async scripts after us will delay DOMContentLoaded.
    if (up.browser.isSupported()) {
      // Some Unpoly modules will use the up:framework:boot event to:
      //
      // - Snapshot their state before user-defined compilers, handlers, etc. have
      //   been registered. We need to know this state for when we up.reset() later.
      // - Run delayed initialization that could not run at load time due to
      //   circular dependencies.
      up.emit('up:framework:boot', {log: false});
      booting = false;

      // From here on, all event handlers (both Unpoly's and user code) want to
      // work with the DOM, so wait for the DOM to be ready.
      return up.event.onReady(() => // By now all non-sync <script> tags have been loaded and called, including
      // those after us. All user-provided compilers, event handlers, etc. have
      // been registered.
      //
      // The following event will cause Unpoly to compile the <body>.
      up.emit('up:app:boot', {log: 'Booting user application'}));
    } else {
      return (typeof console.log === 'function' ? console.log("Unpoly doesn't support this browser. Framework was not booted.") : undefined);
    }
  };

  const startExtension = () => booting = true;

  const stopExtension = () => booting = false;

  return u.literal({
    boot,
    startExtension,
    stopExtension,
    reset: emitReset,
    get_booting() { return booting; }
  });
})();
