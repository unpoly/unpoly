import { copy, isEqual, mergeDefined, pick, variant } from '../util.js'

export class Record {

  keys() {
    throw 'Return an array of keys'
  }

  // Return a new object on every call. The constructor copies its top-level properties,
  // but nested values (like an object or array) are shared with the defaults object.
  defaults(_options) {
    return {}
  }

  constructor(options) {
    Object.assign(this, mergeDefined(this.defaults(options), this.attributes(options)))
  }

  attributes(source = this) {
    return pick(source, this.keys())
  }

  [copy.key]() {
    return variant(this)
  }

  [isEqual.key](other) {
    return (this.constructor === other.constructor) && isEqual(this.attributes(), other.attributes())
  }

  // static is(value) {
  //   return value instanceof this
  // }

}

export const api = {
  /** @internal On window.up for the specs. */
  Record,
}
