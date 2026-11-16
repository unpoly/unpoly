import * as u from '../util.js'
import { fail } from '../error.js'
// framework.ts is evaluated after Registry (and after up.motion and up.status, which use it).
// put() reads isEvaling() when it runs: in an install() or later, when every module has been
// evaluated. Don't call put() at a module's top level: isEvaling() would then return false
// without an error, and the entry would not be kept as a default between specs.
import { isEvaling } from '../framework.js'

export class Registry<T extends object> {
  declare _data: Record<string, T | undefined>
  declare _valueDescription: string

  constructor(valueDescription: string) {
    this._data = {}
    this._valueDescription = valueDescription
    this.put = this.put.bind(this)
    document.addEventListener('up:framework:reset', () => this.reset())
  }

  put(name: string, value: T): void {
    // reset() keeps the values registered while Unpoly evaluates.
    this._data[name] = Object.assign(value, { isDefault: isEvaling() })
  }

  get(name: string): T {
    return this._data[name] || fail("Unknown %s %o", this._valueDescription, name)
  }

  reset(): void {
    this._data = u.pickBy(this._data, 'isDefault')
  }

}
