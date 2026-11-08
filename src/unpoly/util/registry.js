const u = up.util

up.Registry = class Registry {
  constructor(valueDescription, normalize = u.identity) {
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
    return this._data[name] || up.fail("Unknown %s %o", this._valueDescription, name)
  }

  reset() {
    this._data = u.pickBy(this._data, 'isDefault')
  }

}
