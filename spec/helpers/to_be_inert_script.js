const u = up.util
const $ = jQuery

const ACTIVE_SCRIPT_SELECTOR = [
  'script:not([type])',
  'script[type="text/javascript"]',
  'script[type="module"]',
  'script[type="importmap"]',
].join(', ')

beforeEach(function() {
  jasmine.addMatchers({
    toBeInertScript(util, customEqualityTesters) {
      return {
        compare(element) {
          return { pass: element.matches('script') && !element.matches(ACTIVE_SCRIPT_SELECTOR) }
        }
      }
    },

    toBeActiveScript(util, customEqualityTesters) {
      return {
        compare(element) {
          return { pass: element.matches('script') && element.matches(ACTIVE_SCRIPT_SELECTOR) }
        }
      }
    },
  })
})
