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
