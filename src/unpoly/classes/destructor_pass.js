const u = up.util

up.DestructorPass = class DestructorPass {

  constructor(fragment, options) {
    this._fragment = fragment
    this._options = options
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
  }

  _selectCleanables() {
    // fragment functions usually ignore elements that are being destroyed
    const selectOptions = { ...this._options, destroying: true }
    return up.fragment.subtree(this._fragment, '.up-can-clean', selectOptions)
  }

  _applyDestructorFunction(destructor, element) {
    up.error.guard(() => destructor(element))
  }
}
