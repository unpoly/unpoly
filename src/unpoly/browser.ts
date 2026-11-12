import * as u from './util.js'
import { Aborted } from './error.js'
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
export const assertConfirmed = mockable(function assertConfirmed(options: { confirm?: string | false }): true {
  const confirmed = !u.isString(options.confirm) || !options.confirm || window.confirm(options.confirm)
  if (!confirmed) {
    throw new Aborted('User canceled action')
  }
  return true
})
