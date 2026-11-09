// Adds a method to up.internal.Config that core doesn't declare, so `config.patch()` exists only with unpoly-migrate.
up.internal.Config.prototype.patch = function(patch: (config: any) => void) {
  let doPatch = patch.bind(this, this)
  doPatch()
  document.addEventListener('up:framework:reset', doPatch)
}
