const u = up.util

up.DestructorPass = class DestructorPass {

  constructor(fragment, options) {
    this.fragment = fragment
    this.options = options
    this.errors = []
  }

  run() {
    for (let cleanable of this.selectCleanables()) {
      let destructors = u.pluckKey(cleanable, 'upDestructors')
      if (destructors) {
        for (let destructor of destructors) {
          this.applyDestructorFunction(destructor, cleanable)
        }
      }
      cleanable.classList.remove('up-can-clean')
    }

    if (this.errors.length) {
      throw new up.Error('Errors while destroying', { errors: this.errors })
    }
  }

  selectCleanables() {
    // fragment functions usually ignore elements that are being destroyed
    const selectOptions = { ...this.options, destroying: true }
    return up.fragment.subtree(this.fragment, '.up-can-clean', selectOptions)
  }

  applyDestructorFunction(destructor, element) {
    try {
      destructor()
    } catch (error) {
      this.errors.push(error)
      up.log.error('up.destroy()', 'While destroying %o: %o', element, error)
      up.error.emitGlobal(error)
    }
  }
}
