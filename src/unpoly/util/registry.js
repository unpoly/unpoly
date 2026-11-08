import { identity, pickBy } from '../util.js'
import { fail } from '../error.js'

export class Registry {
  constructor(valueDescription, normalize = identity) {
    this._data = {}
    this._normalize = normalize
    this._valueDescription = valueDescription
    this.put = this.put.bind(this)
    document.addEventListener('up:framework:reset', () => this.reset())
  }

  put(key, object) {
    object = this._normalize(object)
    object.isDefault = up.framework.evaling
    this._data[key] = object
  }

  get(name) {
    return this._data[name] || fail("Unknown %s %o", this._valueDescription, name)
  }

  reset() {
    this._data = pickBy(this._data, 'isDefault')
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  Registry,
}
