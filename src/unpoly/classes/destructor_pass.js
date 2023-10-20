const u = up.util

up.DestructorPass = class DestructorPass {

  constructor(fragment, options) {
    this._fragment = fragment
    this._options = options
    this._errorDelay = up.script.errorDelay({ captureAny: true })
  }

  run() {
    for (let cleanable of this._selectCleanables()) {
      let destructors = u.pluckKey(cleanable, 'upDestructors')
      if (destructors) {
        for (let destructor of destructors) {
          this._applyDestructorFunction(destructor, cleanable)
        }
      }
      cleanable.classList.remove('up-can-clean')
    }

    this._errorDelay.flush()
  }

  _selectCleanables() {
    // fragment functions usually ignore elements that are being destroyed
    const selectOptions = { ...this._options, destroying: true }
    return up.fragment.subtree(this._fragment, '.up-can-clean', selectOptions)
  }

  _applyDestructorFunction(destructor, element) {
    this._errorDelay.run(
      () => destructor(element),
      (error) => up.log.error('up.destroy()', 'Error while destroying %o: %o', element, error)
    )
  }
}
