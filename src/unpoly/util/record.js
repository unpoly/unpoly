const u = up.util

up.Record = class Record {

  keys() {
    throw 'Return an array of keys'
  }

  // Return a new object on every call. The constructor copies its top-level properties,
  // but nested values (like an object or array) are shared with the defaults object.
  defaults(_options) {
    return {}
  }

  constructor(options) {
    Object.assign(this, u.mergeDefined(this.defaults(options), this.attributes(options)))
  }

  attributes(source = this) {
    return u.pick(source, this.keys())
  }

  [u.copy.key]() {
    return u.variant(this)
  }

  [u.isEqual.key](other) {
    return (this.constructor === other.constructor) && u.isEqual(this.attributes(), other.attributes())
  }

  // static is(value) {
  //   return value instanceof this
  // }

}
