/*
Play nice with Rails UJS
========================

Unpoly is mostly a superset of Rails UJS, so we convert attributes like `[data-method]` to `[up-method]´.
*/
(function() {

  function isRailsUJSLoaded() {
    return window.Rails || // rails-ujs gem
      window.jQuery?.rails // jquery-ujs gem
  }

  function swapAttr(element, dataAttr, upAttr) {
    if (element.hasAttribute(dataAttr)) {
      let dataValue = element.getAttribute(dataAttr)
      up.element.setMissingAttr(element, upAttr, dataValue)
      element.removeAttribute(dataAttr)
    }
  }

  function defineMacro(elementSelector, relevantFn) {
    up.macro(`:is([data-confirm], [data-method]):is(${elementSelector})`, function(element) {
      // It would be nicer to test isRailsUJSLoaded() once at up:framework:boot,
      // but this would make it harder to test.
      if (isRailsUJSLoaded() && relevantFn(element)) {
        swapAttr(element, 'data-confirm', 'up-confirm')
        swapAttr(element, 'data-method', 'up-method')
      }
    })
  }

  defineMacro('a[href], [up-href]', (el) => up.link.isFollowable(el))
  defineMacro('form, input[type=submit], button[type=submit], button:not([type])', (el) => up.form.isSubmittable(up.form.get(el)))

})()
