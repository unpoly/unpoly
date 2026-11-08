up.Config.prototype.patch = function(patch) {
  let doPatch = patch.bind(this, this)
  doPatch()
  document.addEventListener('up:framework:reset', doPatch)
}
