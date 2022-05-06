const u = up.util

up.store ||= {}

up.store.Memory = class Memory {

  constructor() {
    this.data = {}
  }

  clear() {
    this.data = {}
  }

  get(key) {
    return this.data[key]
  }

  set(key, value) {
    this.data[key] = value
  }

  remove(key) {
    delete this.data[key]
  }

  keys() {
    return Object.keys(this.data)
  }

  size() {
    return this.keys().length
  }

  values() {
    return Object.values(this.data)
  }
}
