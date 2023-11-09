// Bootstrap uses the class `active` to highlight the current section
// of a navigation bar.
up.feedback.config.currentClasses.push('active')

up.feedback.config.navSelectors.push('.nav', '.navbar')

up.form.config.groupSelectors.unshift('.form-group')

up.viewport.config.fixedTopSelectors.push('.navbar.fixed-top')
up.viewport.config.fixedBottomSelectors.push('.navbar.fixed-bottom')
up.viewport.config.anchoredRightSelectors.push('.navbar.fixed-top', '.navbar.fixed-bottom')

up.fragment.config.badTargetClasses.push(
  'row',
  /^col(-xs|-sm|-md|-lg|-xl)?(-\d+)?$/,
  /^[mp][tblrxy]?-\d+$/
)

up.layer.config.foreignOverlaySelectors.push(
  '.modal:not(up-modal)',
  '.popover:not(up-popup)',
  '.dropdown-menu:not(up-popup)'
)

require('./unpoly-bootstrap4.sass')
