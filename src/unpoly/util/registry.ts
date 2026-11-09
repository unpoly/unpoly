import { identity, pickBy } from '../util.js'
import { fail } from '../error.js'
// Unlike other classes in util/, Registry imports a feature namespace. framework.ts is evaluated
// after Registry (and after up.motion and up.status, which use it), so the import is only safe
// because put() reads isEvaling() when it runs: in an install() or later, when every module has
// been evaluated. Don't call put() at a module's top level: isEvaling() would then return false
// without an error, and the entry would not be kept as a default between specs.
import { isEvaling } from '../framework.js'

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
    object.isDefault = isEvaling()
    this._data[key] = object
  }

  get(name: string): T {
    return this._data[name] || fail("Unknown %s %o", this._valueDescription, name)
  }

  reset(): void {
    this._data = pickBy(this._data, 'isDefault')
  }

}
