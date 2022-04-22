/*-
@module up.form
*/

up.migrate.renamedProperty(up.form.config, 'fields', 'fieldSelectors')
up.migrate.renamedProperty(up.form.config, 'submitButtons', 'submitButtonSelectors')
up.migrate.renamedProperty(up.form.config, 'validateTargets', 'groupSelectors')
up.migrate.renamedProperty(up.form.config, 'observeDelay', 'inputDelay')

up.migrate.migratedFormGroupSelectors = function() {
  return up.form.config.groupSelectors.map((originalSelector) => {
    let migratedSelector = originalSelector.replace(/:has\((&|:origin)\)$/, '')
    if (originalSelector !== migratedSelector) {
      up.migrate.warn('Selectors in up.form.config.groupSelectors must not contain ":has(&)". The suffix is added automatically where required. Found in "%s".', originalSelector)
    }
    return migratedSelector
  })
}

up.migrate.renamedAttribute('up-observe', 'up-watch')
up.migrate.renamedAttribute('up-fieldset', 'up-form-group')
up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-autosubmit]' })
up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-watch]' })
