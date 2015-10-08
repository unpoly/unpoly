defaults = up.layout.defaults()

up.layout.defaults
  fixedTop: defaults.fixedTop.concat(['.navbar-fixed-top'])
  fixedBottom: defaults.fixedBottom.concat(['.navbar-fixed-bottom'])
  anchoredRight: defaults.anchoredRight.concat(['.navbar-fixed-top', '.navbar-fixed-bottom', '.footer'])
