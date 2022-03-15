/*-
@module up.form
*/

up.migrate.renamedProperty(up.form.config, 'fields', 'fieldSelectors')
up.migrate.renamedProperty(up.form.config, 'submitButtons', 'submitButtonSelectors')
up.migrate.renamedProperty(up.form.config, 'validateTargets', 'groupSelectors')

up.migrate.migratedFormGroupSelectors = function() {
  return up.form.config.groupSelectors.map((originalSelector) => {
    let migratedSelector = originalSelector.replace(/:has\((&|:origin)\)$/, '')
    if (originalSelector !== migratedSelector) {
      up.migrate.warn('Selectors in up.form.config.groupSelectors must not contain ":has(&)". The suffix is added automatically where required. Found in "%s".', originalSelector)
    }
    return migratedSelector
  })
}

const observeDelayMovedWarning = () => up.migrate.warn('up.form.config.observeDelay has been renamed to up.form.config.observeOptions.delay')
Object.defineProperty(up.form.config, 'observeDelay', {
  get() {
    observeDelayMovedWarning()
    return up.form.config.observeOptions.delay
  },
  set(newDelay) {
    observeDelayMovedWarning()
    up.form.config.observeOptions.delay = newDelay
  }
})

up.migrate.renamedAttribute('up-fieldset', 'up-form-group')
up.migrate.renamedAttribute('up-delay', 'up-observe-delay', { scope: '[up-autosubmit]' })
up.migrate.renamedAttribute('up-delay', 'up-observe-delay', { scope: '[up-observe]' })
