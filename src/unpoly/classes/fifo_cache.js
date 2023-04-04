up.FIFOCache = class FIFOCache {

  constructor({ capacity = 10, normalizeKey = u.identity } = {}) {
    this.map = new Map()
    this.capacity = capacity
    this.normalizeKey = normalizeKey
  }

  get(key) {
    key = this.normalizeKey(key)
    return this.map.get(key)
  }

  set(key, value) {
    if (this.map.size === this.capacity) {
      let oldestKey = this.map.keys().next().value
      this.map.delete(oldestKey)
    }

    key = this.normalizeKey(key)
    this.map.set(key, value)
  }

  clear() {
    this.map.clear()
  }

}
