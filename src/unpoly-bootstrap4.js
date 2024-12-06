// Bootstrap uses the class `active` to highlight the current section of a navigation bar.
up.status.config.currentClasses.push('active')

// Bootstrap uses the class `active` to force a button's active state.
up.status.config.activeClasses.push('active')

up.status.config.navSelectors.push('.nav', '.navbar')

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
