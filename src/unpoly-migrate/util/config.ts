// Adds a method to up.internal.Config that core doesn't declare, so `config.patch()` exists only with unpoly-migrate.
declare module '../../unpoly/util/config.js' {
  interface Config<S extends object> {
    patch(fn: (this: ConfigWith<S>, config: ConfigWith<S>) => void): void
  }
}

up.internal.Config.prototype.patch = function(patch) {
  let doPatch = patch.bind(this, this)
  doPatch()
  document.addEventListener('up:framework:reset', doPatch)
}
