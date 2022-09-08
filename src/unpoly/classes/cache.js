const u = up.util

/*-
@class up.Cache
@internal
*/
up.Cache = class Cache {

  /*-
  @constructor up.Cache
  @param {number|Function(): number} [config.size]
    Maximum number of cache entries.
    Set to `undefined` to not limit the cache size.
  @param {number|Function(): number} [config.evictAge]
    The number of milliseconds after which a cache entry
    will be discarded.
  @param {Function(entry): string} [config.key]
    A function that takes an argument and returns a string key
    for storage. If omitted, `toString()` is called on the argument.
  @param {Function(entry): boolean} [config.cacheable]
    A function that takes a potential cache entry and returns whether
    this entry  can be stored in the hash. If omitted, all entries are considered
    cacheable.
  @internal
  */
  constructor(config = {}) {
    this.config = config
    this.store = this.config.store || new up.store.Memory()
  }

  size() {
    return this.store.size()
  }

  maxSize() {
    return u.evalOption(this.config.size)
  }

  evictAge() {
    return u.evalOption(this.config.evictAge)
  }

  normalizeStoreKey(key) {
    if (this.config.key) {
      return this.config.key(key)
    } else {
      return key.toString()
    }
  }

  isEnabled() {
    // If the user has a maximum size or evict age of zero,
    // we no longer store *any* entries.
    return (this.maxSize() !== 0) && (this.evictAge() !== 0)
  }

  clear() {
    this.store.clear()
  }

  keys() {
    return this.store.keys()
  }

  each(fn) {
    u.each(this.keys(), key => {
      const entry = this.store.get(key)
      fn(key, entry.value, entry.createdAt)
    })
  }

  makeRoomForAnotherEntry() {
    if (this.hasRoomForAnotherEntry()) {
      return
    }

    let oldestKey
    let oldestCreatedAt
    this.each(function(key, request, createdAt) {
      if (!oldestCreatedAt || (oldestCreatedAt > createdAt)) {
        oldestKey = key
        oldestCreatedAt = createdAt
      }
    })

    if (oldestKey) {
      this.store.remove(oldestKey)
    }
  }

  hasRoomForAnotherEntry() {
    const maxSize = this.maxSize()
    return !maxSize || (this.size() < maxSize)
  }

  alias(oldKey, newKey) {
    const value = this.get(oldKey)
    if (u.isDefined(value)) {
      this.set(newKey, value)
    }
  }

  set(key, value) {
    if (this.isEnabled()) {
      this.makeRoomForAnotherEntry()
      const storeKey = this.normalizeStoreKey(key)
      const entry = {
        createdAt: new Date(),
        value
      }
      this.store.set(storeKey, entry)
    }
  }

  remove(key) {
    const storeKey = this.normalizeStoreKey(key)
    this.store.remove(storeKey)
  }

  isUsable(entry) {
    const evictAge = this.evictAge()
    if (evictAge) {
      const timeSinceTouch = new Date() - entry.createdAt
      return timeSinceTouch < evictAge
    } else {
      return true
    }
  }

  get(key) {
    const storeKey = this.normalizeStoreKey(key)
    let entry = this.store.get(storeKey)
    if (entry) {
      if (this.isUsable(entry)) {
        return entry.value
      } else {
        this.remove(key)
      }
    }
  }
}
