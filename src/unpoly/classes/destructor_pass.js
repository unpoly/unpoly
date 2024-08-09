const u = up.util

up.DestructorPass = class DestructorPass {

  constructor(fragment, options) {
    this._fragment = fragment
    this._options = options
  }

  run() {
    for (let cleanable of this._selectCleanables()) {
      // In the case of [up-keep] elements we may run on a clone that is [up-keep]
      // but has no { upDestructors } property.
      let registry = u.pluckKey(cleanable, 'upDestructors')
      registry?.clean(cleanable)
    }
  }

  _selectCleanables() {
    // fragment functions usually ignore elements that are being destroyed
    const selectOptions = { ...this._options, destroying: true }
    return up.fragment.subtree(this._fragment, '.up-can-clean', selectOptions)
  }

}
