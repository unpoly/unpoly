// The elements whose disabled state the platform itself governs, and for which :disabled is
// therefore the authoritative answer — including an inherited <fieldset disabled>.
const PLATFORM_CONTROLS = 'input, select, textarea, button, fieldset, optgroup, option'

function isDisabled(element) {
  // Deliberately not up.form.readFieldDisabled(): a matcher must be an independent oracle, or a
  // broken reader would make these specs agree with the bug.
  if (element.matches(PLATFORM_CONTROLS) || element.constructor.formAssociated) {
    // The platform's answer wins here. A component claiming to be disabled through an
    // unreflected property does not stop the browser from submitting it.
    return element.matches(':disabled')
  }

  // Nothing else can tell us about an element the platform does not govern, so we ask the
  // element. There is no independent oracle for this case.
  return 'disabled' in element ? !!element.disabled : element.hasAttribute('disabled')
}

beforeEach(function() {
  jasmine.addMatchers({
    toBeDisabled: function(util, customEqualityTesters) {
      return {
        compare: function(element) {
          element = up.element.get(element)
          return {
            pass: !!element && isDisabled(element)
          }
        }
      }
    }
  })
})
