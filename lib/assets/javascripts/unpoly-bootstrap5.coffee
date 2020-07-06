# Bootstrap uses the class `active` to highlight the current section
# of a navigation bar.
up.feedback.config.currentClasses.push('active')

up.feedback.config.navs.push('.nav', '.navbar')

# Bootstrap 5 no longer has a selector like ".form-group" to group labels and inputs.
# All the examples now use <div class="mb-3"> (WAT).
## up.form.config.validateTargets.unshift('.form-group:has(&)')

up.viewport.config.fixedTop.push('.navbar.fixed-top')
up.viewport.config.fixedBottom.push('.navbar.fixed-bottom')
up.viewport.config.anchoredRight.push('.navbar.fixed-top')
up.viewport.config.anchoredRight.push('.navbar.fixed-bottom')
