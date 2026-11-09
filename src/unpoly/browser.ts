import { isString } from './util.js'
import { Aborted } from './error/aborted.js'
import { mockable } from './mockable.js'

/*-
We tunnel some browser APIs through this namespace for easier mocking in tests.

@namespace up.browser
@internal
*/

/*-
Submits the given form with a full page load.

For mocking in specs.

@function up.browser.submitForm
@internal
*/
export const submitForm = mockable(function submitForm(form: HTMLFormElement): void {
  form.submit()
})

/*-
Returns whether this browser supports manipulation of the current URL
via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

When `pushState` is not supported (e.g. through [`up.follow()`](/api/up.follow)), Unpoly will gracefully
fall back to a full page load.

> [NOTE]
> Unpoly will not use `pushState` if the initial page was loaded with a request method other than GET.

@function up.browser.canPushState
@return {boolean}
@internal
*/
export const canPushState = mockable(function canPushState(): boolean {
  // We cannot use pushState if the initial request method is a POST for two reasons:
  //
  // 1. Unpoly replaces the initial state so it can handle the pop event when the
  //    user goes back to the initial URL later. If the initial request was a POST,
  //    Unpoly will wrongly assume that it can restore the state by reloading with GET.
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
  return up.protocol.initialRequestMethod() === 'GET'
})

// Don't memoize so a build may publish window.jQuery after Unpoly was loaded
export function canJQuery(): boolean {
  return !!window.jQuery
}

export function popCookie(name: string): string | undefined {
  let value = document.cookie.match(new RegExp(name+"=(\\w+)"))?.[1]
  if (value) {
    document.cookie = name + '=;Max-Age=0;Path=/'
    return value
  }
}

/*-
@return {boolean}
@function up.browser.ensureConfirmed
@param {string} options.confirm
@param {boolean} options.preload
@internal
*/
export const assertConfirmed = mockable(function assertConfirmed(options: { confirm?: string }): true {
  const confirmed = !isString(options.confirm) || !options.confirm || window.confirm(options.confirm)
  if (!confirmed) {
    throw new Aborted('User canceled action')
  }
  return true
})

export const api = {
  browser: {
    submitForm,
    canPushState,
    canJQuery,
    assertConfirmed,
    popCookie,
  },
}
