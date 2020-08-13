up.fragment.config.badTargetClasses.push(
  /^row$/,
  /^col(-xs|-sm|-md|-lg)?(-\d+)?$/
)

# Bootstrap uses the class `active` to highlight the current section
# of a navigation bar.
up.feedback.config.currentClasses.push('active')

up.feedback.config.navs.push('.nav', '.navbar')

up.form.config.validateTargets.unshift('.form-group:has(&)')

up.viewport.config.fixedTop.push('.navbar-fixed-top')
up.viewport.config.fixedBottom.push('.navbar-fixed-bottom')
up.viewport.config.anchoredRight.push('.navbar-fixed-top', '.navbar-fixed-bottom')
