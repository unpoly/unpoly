/*-
@module up.framework
*/

up.framework = (function() {

  // Event                          up.framework.readyState   document.readyState
  // ------------------------------------------------------------------------------------------------------
  // Browser starts parsing HTML    -                         loading
  // Unpoly script is running       evaling                   loading (if sync) or interactive (if defered)
  // ... submodules are running     evaling                   loading (if sync) or interactive (if defered)
  // User scripts are running       configuring               loading (if sync) or interactive (if defered)
  // DOMContentLoaded               configuring => booting    interactive
  // Initial page is compiling      booting                   interactive
  // Document resources loaded      booted                    complete
  let readyState = 'evaling' // evaling => configuring => booting => booted

  /*-
  Resets Unpoly to the state when it was booted.
  All custom event handlers, animations, etc. that have been registered
  will be discarded.

  Emits event [`up:framework:reset`](/up:framework:reset).

  @function up.framework.reset
  @internal
  */
  function emitReset() {
    up.emit('up:framework:reset', {log: false})
  }

  /*-
  This event is [emitted](/up.emit) when Unpoly is [reset](/up.framework.reset) during unit tests.

  @event up:framework:reset
  @internal
  */

  /*-
  Boots the Unpoly framework.

  **This is called automatically** by including the Unpoly JavaScript files.

  Unpoly will not boot if the current browser is [not supported](/up.browser.isSupported).
  This leaves you with a classic server-side application on legacy browsers.

  TODO: Make public
  TODO: Update docs to explain when this is needed

  @function up.boot
  @internal
  */
  function boot() {
    if (readyState !== 'configuring') {
      // In an app with a lot of async script the user may attempt to boot us twice.
      console.error('Unpoly has already booted')
      return
    }

    // This is called synchronously after all Unpoly modules have been parsed
    // and executed. We cannot delay booting until the DOM is ready, since by then
    // all user-defined event listeners and compilers will have registered.
    // Note that any non-async scripts after us will delay DOMContentLoaded.
    let supportIssue = up.browser.supportIssue()
    if (!supportIssue) {
      // Change the state in case any user-provided compiler calls up.boot().
      // up.boot() is a no-op unless readyState === 'configuring'.
      readyState = 'booting'
      up.emit('up:framework:boot', { log: false })
      readyState = 'booted'
    } else {
      console.error("Unpoly cannot boot: %s", supportIssue)
    }
  }

  function mustBootManually() {
    let unpolyScript = document.currentScript

    // If we're is loaded via <script async>, there are no guarantees
    // when we're called or when subsequent scripts that configure Unpoly
    // have executed
    if (unpolyScript?.async) {
      return true
    }

    // If we're loaded with <script up-boot="manual"> the user explicitly
    // requested to boot Unpoly manually.
    if (unpolyScript?.getAttribute('up-boot') === 'manual') {
      return true
    }

    // If we're loaded this late, someone loads us dynamically.
    // We don't know when subsequent scripts that configure Unpoly
    // have executed.
    if (document.readyState === 'complete') {
      return true
    }
  }

  function onEvaled() {
    up.emit('up:framework:evaled', { log: false })

    if (mustBootManually()) {
      console.debug('Call up.boot() after you have configured Unpoly')
    } else {
      // (1) On DOMContentLoaded we know that all non-[async] scripts have executed.
      // (2) Deferred scripts execute after the DOM was parsed (document.readyState === 'interactive'),
      //     but before DOMContentLoaded. That's why we must *not* boot synchonously when
      //     document.readyState === 'interactive'. We must wait until DOMContentLoaded, when we know that
      //     subsequent users scripts have executed and (possibly) configured Unpoly.
      // (3) There are no guarantees when [async] scripts execute. These must boot Unpoly manually.
      document.addEventListener('DOMContentLoaded', boot)
    }

    // After this line user scripts may run and configure Unpoly, add compilers, etc.
    readyState = 'configuring'
  }

  function startExtension() {
    if (readyState !== 'configuring') {
      throw new Error('Unpoly extensions must be loaded before booting')
    }
    readyState = 'evaling'
  }

  function stopExtension() {
    readyState = 'configuring'
  }

  return {
    onEvaled,
    boot,
    startExtension,
    stopExtension,
    reset: emitReset,
    get evaling() { return readyState === 'evaling' },
    get booted() { return readyState === 'booted' },
  }
})()

up.boot = up.framework.boot
