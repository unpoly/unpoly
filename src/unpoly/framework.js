/*-
Framework initialization
========================

The `up.framework` module lets you customize Unpoly's [initialization sequence](/install#initialization).

@see up.boot
@see script[up-boot=manual]
@see up.framework.isSupported

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
  Manually boots the Unpoly framework.

  It is not usually necessary to call `up.boot()` yourself. When you load [Unpoly's JavaScript file](/install),
  Unpoly will automatically boot on [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event).
  There are only two cases when you would boot manually:

  - When you load Unpoly with `<script async>`
  - When you explicitly ask to manually boot by loading Unpoly with [`<script up-boot="manual">`](/script-up-boot-manual).

  Before you manually boot, Unpoly should be configured and compilers should be registered.
  Booting will cause Unpoly to [compile](/up.hello) the initial page.

  Unpoly will refuse to boot if the current browser is [not supported](/up.framework.isSupported).
  This leaves you with a classic server-side application on legacy browsers.

  @function up.boot
  @experimental
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
    let issue = supportIssue()
    if (!issue) {
      // Change the state in case any user-provided compiler calls up.boot().
      // up.boot() is a no-op unless readyState === 'configuring'.
      readyState = 'booting'
      up.emit('up:framework:boot', { log: false })
      readyState = 'booted'
    } else {
      console.error("Unpoly cannot boot: %s", issue)
    }
  }

  function mustBootManually() {
    // Since this function runs before the support check, we may be dealing
    // with a browser that does not support `document.currentScript` (e.g. IE11).
    // See https://caniuse.com/document-currentscript
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

  /*-
  Prevent Unpoly from booting automatically.

  By default Unpoly [automatically boots](/install#initialization)
  on [`DOMContentLoaded`](https://developer.mozilla.org/en-US/docs/Web/API/Window/DOMContentLoaded_event).
  To prevent this, add an `[up-boot="manual"]` attribute to the `<script>` element
  that loads Unpoly:

  ```html
  <script src="unpoly.js" up-boot="manual"></script>
  ```
  You may then call `up.boot()` to manually boot Unpoly at a later time.

  @selector script[up-boot=manual]
  @experimental
  */

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

  /*-
  Returns whether Unpoly can boot in the current browser.

  If this returns `false` Unpoly will not automatically [boot](/up.boot)
  and will not [compile](/up.compiler) the initial page.
  This leaves you with a server-side web application without any JavaScript enhancements.

  The support check is very cursory. While it will exclude most legacy browsers
  like Internet Explorer, there may be cases where `up.framework.isSupported()`
  returns `true` on a browser with other support issues.
  To use your own conditions for browser support, [boot manually](/script-up-boot-manual).

  ### Browser support

  Unpoly aims to supports all modern browsers.

  #### Chrome, Firefox, Microsoft Edge

  Unpoly supports recent versions of these [evergreen](https://stephenweiss.dev/evergreen-browsers) browsers.

  #### Safari, Mobile Safari

  Unpolys upports the last two major versions of Safari.

  #### Internet Explorer

  Internet Explorer 11 or lower are [now longer supported](https://github.com/unpoly/unpoly/discussions/340).

  If you need to support Internet Explorer 11, use Unpoly 2.

  @function up.framework.isSupported
  @stable
  */
  function isSupported() {
    return !supportIssue()
  }

  function supportIssue() {
    for (let feature of ['URL', 'Proxy', 'Promise', 'DOMParser', 'FormData']) {
      if (!window[feature]) {
        return `Browser doesn't support the ${feature} API`
      }
    }

    if (document.compatMode === 'BackCompat') {
      return 'Browser is in quirks mode (missing DOCTYPE?)'
    }

    if (isRails()) {
      return 'Unpoly must be loaded before rails-ujs'
    }
  }

  function isRails() {
    return window._rails_loaded || // current rails-ujs integrated with Rails 5.2+
      window.Rails ||              // legacy rails/rails-ujs gem
      window.jQuery?.rails         // legacy rails/jquery-ujs gem
  }


  return {
    onEvaled,
    boot,
    startExtension,
    stopExtension,
    reset: emitReset,
    get evaling() { return readyState === 'evaling' },
    get booted() { return readyState === 'booted' },
    get beforeBoot() { return readyState !== 'booting' && readyState !== 'booted' },
    isSupported,
  }
})()

up.boot = up.framework.boot
