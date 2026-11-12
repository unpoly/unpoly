declare module '../unpoly.js' {
  interface Up {
    observe: CoreApi['watch']
  }
}

up.form.config.patch(function(config) {
  up.migrate.renamedProperty(config, 'fields', 'fieldSelectors', { label: 'up.form.config' })
  up.migrate.renamedProperty(config, 'submitButtons', 'submitButtonSelectors', { label: 'up.form.config' })
  up.migrate.renamedProperty(config, 'validateTargets', 'groupSelectors', { label: 'up.form.config' })
  up.migrate.renamedProperty(config, 'observeDelay', 'watchInputDelay', { label: 'up.form.config' })
  up.migrate.renamedProperty(config, 'genericButtonSelectors', 'anyButtonSelectors', { label: 'up.form.config' })
})

// Core calls this hook (up.form).
up.migrate.migratedFormGroupSelectors = function(): string[] {
  return up.form.config.groupSelectors.map((originalSelector) => {
    let migratedSelector = originalSelector.replace(/:has\((:origin|&)\)$/, '')
    if (originalSelector !== migratedSelector) {
      up.migrate.warn('Selectors in up.form.config.groupSelectors must not contain ":has(:origin)". The suffix is added automatically where required. Found in "%s".', originalSelector)
    }
    return migratedSelector
  })
}


// An old implementation allowed [up-switch] to be set on individual radio buttons
// instead of on a container for the radio group. Each button got its own up.Switcher.
// The old implementation also listened to `change`, which has a weird caveat for radio
// buttons that happens to make individual Switchers work: It only fires when the radio
// button gets checked, not when it gets unchecked.
// The new implementation uses up.watch(), which only works for a group of radio buttons.
// Core calls this hook (Switcher).
up.migrate.watchForSwitch = function(root, callback) {
  if (root.matches('input[type=radio]')) {
    up.migrate.warn('Using [up-switch] on an individual radio button is deprecated (%o). Use [up-switch] on the container of a radio group instead.', root)
    return up.on(root, 'change', callback)
  }
}

up.migrate.renamedAttribute('up-observe', 'up-watch')

up.migrate.renamedAttribute('up-fieldset', 'up-form-group')

up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-autosubmit]' })

up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-watch]' })

up.observe = function(...args) {
  up.migrate.deprecated('up.observe()', 'up.watch()')

  if (up.util.isList(args[0]) && args[0].length > 1) {
    let list = args.shift()
    up.migrate.warn('Calling up.observe() with a list of multiple elements is no longer supported by up.watch()')
    let unwatchFns = up.util.map(list, (firstArg) => up.watch(firstArg, ...args))
    return up.internal.sequence(unwatchFns)
  }

  return up.watch(...args)
}
