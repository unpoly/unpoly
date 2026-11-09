import { identity, pickBy } from '../util.js'
import { fail } from '../error.js'

export class Registry<T = any> {
  declare _data: Record<string, T>
  declare _normalize: (value: any) => T
  declare _valueDescription: string

  constructor(valueDescription: string, normalize: (value: any) => T = identity) {
    this._data = {}
    this._normalize = normalize
    this._valueDescription = valueDescription
    this.put = this.put.bind(this)
    document.addEventListener('up:framework:reset', () => this.reset())
  }

  put(key: string, object: any): void {
    object = this._normalize(object)
    object.isDefault = up.framework.evaling
    this._data[key] = object
  }

  get(name: string): T {
    return this._data[name] || fail("Unknown %s %o", this._valueDescription, name)
  }

  reset(): void {
    this._data = pickBy(this._data, 'isDefault')
  }

}
