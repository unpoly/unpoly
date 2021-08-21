/*-
Browser support
===============

Unpoly supports all modern browsers.

### Chrome, Firefox, Edge, Safari

Full support.

### Internet Explorer 11

Full support with a `Promise` polyfill like [es6-promise](https://github.com/stefanpenner/es6-promise) (2.4 KB).\
Support may be removed when Microsoft retires IE11 in [June 2022](https://blogs.windows.com/windowsexperience/2021/05/19/the-future-of-internet-explorer-on-windows-10-is-in-microsoft-edge/).

### Internet Explorer 10 or lower

Unpoly will not boot or [run compilers](/up.compiler),
leaving you with a classic server-side application.

@module up.browser
*/
up.browser = (function() {
  const u = up.util

  /*-
  Submits the given form with a full page load.
  
  For mocking in specs.

  @function up.browser.submitForm
  @internal
  */
  function submitForm(form) {
    form.submit()
  }

  function isIE11() {
    return 'ActiveXObject' in window // this is undefined, but the key is set
  }

  /*-
  Returns whether this browser supports manipulation of the current URL
  via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

  When `pushState`  (e.g. through [`up.follow()`](/up.follow)), it will gracefully
  fall back to a full page load.

  Note that Unpoly will not use `pushState` if the initial page was loaded with
  a request method other than GET.

  @function up.browser.canPushState
  @return {boolean}
  @internal
  */
  function canPushState() {
    // We cannot use pushState if the initial request method is a POST for two reasons:
    //
    // 1. Unpoly replaces the initial state so it can handle the pop event when the
    //    user goes back to the initial URL later. If the initial request was a POST,
    //    Unpoly will wrongly assumed that it can restore the state by reloading with GET.
    //
    // 2. Some browsers have a bug where the initial request method is used for all
    //    subsequently pushed states. That means if the user reloads the page on a later
    //    GET state, the browser will wrongly attempt a POST request.
    //    This issue affects Safari 9 and 10 (last tested in 2017-08).
    //    Modern Firefoxes, Chromes and IE10+ don't have this behavior.
    //
    // The way that we work around this is that we don't support pushState if the
    // initial request method was anything other than GET (but allow the rest of the
    // Unpoly framework to work). This way Unpoly will fall back to full page loads until
    // the framework was booted from a GET request.
    return history.pushState && up.protocol.initialRequestMethod() === 'GET'
  }

  /*-
  Returns whether this browser supports promises.

  @function up.browser.canPromise
  @return {boolean}
  @internal
  */
  function canPromise() {
    return !!window.Promise
  }

  const canFormatLog = u.negate(isIE11)

  const canPassiveEventListener = u.negate(isIE11)

  // Don't memoize so a build may publish window.jQuery after Unpoly was loaded
  function canJQuery() {
    return !!window.jQuery
  }

  // IE11: Use the browser.cookies API instead.
  function popCookie(name) {
    let value = document.cookie.match(new RegExp(name+"=(\\w+)"))?.[1]
    if (value) {
      document.cookie = name + '=;Max-Age=0;Path=/'
      return value
    }
  }

  const getJQuery = function() {
    if (!canJQuery()) {
      up.fail('jQuery must be published as window.jQuery')
    }
    return jQuery
  }

  /*-
  @return {boolean}
  @function up.browser.ensureConfirmed
  @param {string} options.confirm
  @param {boolean} options.preload
  @internal
  */
  function assertConfirmed(options) {
    const confirmed = !options.confirm || window.confirm(options.confirm)
    if (!confirmed) {
      throw up.error.aborted('User canceled action')
    }
    return true
  }

  /*-
  Returns whether Unpoly supports the current browser.

  If this returns `false` Unpoly will prevent itself from booting
  and ignores all registered [event handlers](/up.on) and [compilers](/up.compiler).
  This leaves you with a classic server-side application.
  This is usually a better fallback than loading incompatible Javascript and causing
  many errors on load.

  @function up.browser.isSupported
  @stable
  */
  function isSupported() {
    return !supportIssue()
  }

  function supportIssue() {
    if (!canPromise()) {
      return "Browser doesn't support promises"
    }
    if (document.compatMode === 'BackCompat') {
      return 'Browser is in quirks mode (missing DOCTYPE?)'
    }
  }

  return {
    submitForm,
    canPushState,
    canFormatLog,
    canPassiveEventListener,
    canJQuery,
    assertConfirmed,
    isSupported,
    supportIssue,
    popCookie,
    get jQuery() { return getJQuery() },
    isIE11
  }
})()
