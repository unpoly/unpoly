import { pluckKey } from '../util.js'
import { getSubtree } from '../fragment.js'

export class DestructorPass {

  constructor(fragment, options) {
    this._fragment = fragment
    this._options = options
  }

  run() {
    for (let cleanable of this._selectCleanables()) {
      // In the case of [up-keep] elements we may run on a clone that matches .up-can-clean
      // but has no { upDestructors } property.
      let registry = pluckKey(cleanable, 'upDestructors')
      registry?.clean(cleanable)
    }
  }

  _selectCleanables() {
    // fragment functions usually ignore elements that are being destroyed
    const selectOptions = { ...this._options, destroying: true }
    return getSubtree(this._fragment, '.up-can-clean', selectOptions)
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  DestructorPass,
}
