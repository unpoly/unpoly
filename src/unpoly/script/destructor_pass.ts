import * as u from '../util.js'
import { getSubtree } from '../fragment.js'

export class DestructorPass {
  declare _fragment: Element
  declare _options: u.PlainObject

  constructor(fragment: Element, options: u.PlainObject) {
    this._fragment = fragment
    this._options = options
  }

  run(): void {
    for (let cleanable of this._selectCleanables()) {
      // In the case of [up-keep] elements we may run on a clone that matches .up-can-clean
      // but has no { upDestructors } property.
      let registry = u.pluckKey(cleanable, 'upDestructors')
      registry?.clean(cleanable)
    }
  }

  _selectCleanables(): Element[] {
    // fragment functions usually ignore elements that are being destroyed
    const selectOptions = { ...this._options, destroying: true }
    return getSubtree(this._fragment, '.up-can-clean', selectOptions)
  }

}
