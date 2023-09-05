const u = up.util

up.FIFOCache = class FIFOCache {

  constructor({ capacity = 10, normalizeKey = u.identity } = {}) {
    this._map = new Map()
    this._capacity = capacity
    this._normalizeKey = normalizeKey
  }

  get(key) {
    key = this._normalizeKey(key)
    return this._map.get(key)
  }

  set(key, value) {
    if (this._map.size === this._capacity) {
      let oldestKey = this._map.keys().next().value
      this._map.delete(oldestKey)
    }

    key = this._normalizeKey(key)
    this._map.set(key, value)
  }

  clear() {
    this._map.clear()
  }

}
