const u = up.util

/*-
@class up.Cache
@internal
*/
up.Cache = class Cache {

  /*-
  @constructor up.Cache
  @param {number|Function(): number} [config.size]
    Maximum number of cache records.
    Set to `undefined` to not limit the cache size.
  @param {number|Function(): number} [config.evictAge]
    The number of milliseconds after which a cache record
    will be discarded.
  @param {Function(record): string} [config.key]
    A function that takes an argument and returns a string key
    for storage. If omitted, `toString()` is called on the argument.
  @param {Function(record): boolean} [config.cacheable]
    A function that takes a potential cache record and returns whether
    this record  can be stored in the hash. If omitted, all records are considered
    cacheable.
  @internal
  */
  constructor(config = {}) {
    this.config = config
    this.map = new Map()
  }

  size() {
    return this.map.size
  }

  maxSize() {
    return u.evalOption(this.config.size)
  }

  evictAge() {
    return u.evalOption(this.config.evictAge)
  }

  normalizeStoreKey(key) {
    return key
  }

  isDisabled() {
    // If the user has a maximum size or evict age of zero,
    // we no longer store *any* records.
    return this.maxSize() === 0 || this.evictAge() === 0
  }

  evict() {
    this.map.clear()
  }

  records() {
    return this.map.values()
  }

  makeRoomForAnotherRecord() {
    const maxSize = this.maxSize()
    const currentSize = this.size()

    // Return if the cache is unbounded or still has space left
    if (!maxSize || currentSize < maxSize) return

    let records = Array.from(this.records())
    records.sort((a, b) => b.createdAt - a.createdAt)

    const overflow = currentSize - maxSize + 1
    for (let i = 0; i < overflow; i++) {
      let key = records.pop().key
      this.map.delete(key)
    }

  }

  alias(oldKey, newKey) {
    // get() returns a value, not the record
    const value = this.get(oldKey)
    if (u.isDefined(value)) {
      this.set(newKey, value)
    }
  }

  set(key, value) {
    if (this.isDisabled()) return

    this.makeRoomForAnotherRecord()
    key = this.normalizeStoreKey(key)
    const createdAt = new Date()
    const record = { key, value, createdAt }
    this.map.set(key, record)
  }

  remove(key) {
    key = this.normalizeStoreKey(key)
    this.map.delete(key)
  }

  isUsable(record) {
    const evictAge = this.evictAge()
    if (!evictAge) return true
    const age = new Date() - record.createdAt
    return age < evictAge
  }

  get(key) {
    const storeKey = this.normalizeStoreKey(key)
    let record = this.map.get(storeKey)
    if (record) {
      if (this.isUsable(record)) {
        return record.value
      } else {
        this.remove(key)
        // return undefined
      }
    }
  }
}
