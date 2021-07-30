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
  @param {number|Function(): number} [config.expiry]
    The number of milliseconds after which a cache entry
    will be discarded.
  @param {string} [config.logPrefix]
    A prefix for log entries printed by this cache object.
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

  expiryMillis() {
    return u.evalOption(this.config.expiry)
  }

  normalizeStoreKey(key) {
    if (this.config.key) {
      return this.config.key(key)
    } else {
      return key.toString()
    }
  }

  isEnabled() {
    return (this.maxSize() !== 0) && (this.expiryMillis() !== 0)
  }

  clear() {
    this.store.clear()
  }

  log(...args) {
    if (this.config.logPrefix) {
      args[0] = `[${this.config.logPrefix}] ${args[0]}`
      up.puts('up.Cache', ...args)
    }
  }

  keys() {
    return this.store.keys()
  }
    
  each(fn) {
    u.each(this.keys(), key => {
      const entry = this.store.get(key)
      fn(key, entry.value, entry.timestamp)
    })
  }

  makeRoomForAnotherEntry() {
    if (this.hasRoomForAnotherEntry()) {
      return
    }

    let oldestKey
    let oldestTimestamp
    this.each(function(key, request, timestamp) {
      if (!oldestTimestamp || (oldestTimestamp > timestamp)) {
        oldestKey = key
        oldestTimestamp = timestamp
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
    const value = this.get(oldKey, {silent: true})
    if (u.isDefined(value)) {
      this.set(newKey, value)
    }
  }

  timestamp() {
    return (new Date()).valueOf()
  }

  set(key, value) {
    if (this.isEnabled()) {
      this.makeRoomForAnotherEntry()
      const storeKey = this.normalizeStoreKey(key)
      const entry = {
        timestamp: this.timestamp(),
        value
      }
      this.store.set(storeKey, entry)
    }
  }

  remove(key) {
    const storeKey = this.normalizeStoreKey(key)
    this.store.remove(storeKey)
  }

  isFresh(entry) {
    const millis = this.expiryMillis()
    if (millis) {
      const timeSinceTouch = this.timestamp() - entry.timestamp
      return timeSinceTouch < millis
    } else {
      return true
    }
  }

  get(key, options = {}) {
    const storeKey = this.normalizeStoreKey(key)
    let entry = this.store.get(storeKey)
    if (entry) {
      if (this.isFresh(entry)) {
        if (!options.silent) { this.log("Cache hit for '%s'", key); }
        return entry.value
      } else {
        if (!options.silent) { this.log("Discarding stale cache entry for '%s'", key); }
        this.remove(key)
      }
    } else {
      if (!options.silent) { this.log("Cache miss for '%s'", key); }
    }
  }
}
