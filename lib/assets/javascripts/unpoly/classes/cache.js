/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

/***
@class up.Cache
@internal
*/
up.Cache = class Cache {

  /***
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
    this.alias = this.alias.bind(this);
    this.set = this.set.bind(this);
    this.remove = this.remove.bind(this);
    this.isFresh = this.isFresh.bind(this);
    this.get = this.get.bind(this);
    this.config = config;
    this.store = this.config.store || new up.store.Memory();
  }

  size() {
    return this.store.size();
  }

  maxSize() {
    return u.evalOption(this.config.size);
  }

  expiryMillis() {
    return u.evalOption(this.config.expiry);
  }

  normalizeStoreKey(key) {
    if (this.config.key) {
      return this.config.key(key);
    } else {
      return key.toString();
    }
  }

  isEnabled() {
    return (this.maxSize() !== 0) && (this.expiryMillis() !== 0);
  }

  clear() {
    return this.store.clear();
  }

  log(...args) {
    if (this.config.logPrefix) {
      args[0] = `[${this.config.logPrefix}] ${args[0]}`;
      return up.puts('up.Cache', ...Array.from(args));
    }
  }

  keys() {
    return this.store.keys();
  }
    
  each(fn) {
    return u.each(this.keys(), key => {
      const entry = this.store.get(key);
      return fn(key, entry.value, entry.timestamp);
    });
  }

  makeRoomForAnotherEntry() {
    if (this.hasRoomForAnotherEntry()) {
      return;
    }

    let oldestKey = undefined;
    let oldestTimestamp = undefined;
    this.each(function(key, request, timestamp) {
      if (!oldestTimestamp || (oldestTimestamp > timestamp)) {
        oldestKey = key;
        return oldestTimestamp = timestamp;
      }
    });

    if (oldestKey) {
      return this.store.remove(oldestKey);
    }
  }

  hasRoomForAnotherEntry() {
    const maxSize = this.maxSize();
    return !maxSize || (this.size() < maxSize);
  }
      
  alias(oldKey, newKey) {
    const value = this.get(oldKey, {silent: true});
    if (u.isDefined(value)) {
      return this.set(newKey, value);
    }
  }

  timestamp() {
    return (new Date()).valueOf();
  }

  set(key, value) {
    if (this.isEnabled()) {
      this.makeRoomForAnotherEntry();
      const storeKey = this.normalizeStoreKey(key);
      const entry = {
        timestamp: this.timestamp(),
        value
      };
      return this.store.set(storeKey, entry);
    }
  }

  remove(key) {
    const storeKey = this.normalizeStoreKey(key);
    return this.store.remove(storeKey);
  }

  isFresh(entry) {
    const millis = this.expiryMillis();
    if (millis) {
      const timeSinceTouch = this.timestamp() - entry.timestamp;
      return timeSinceTouch < millis;
    } else {
      return true;
    }
  }

  get(key, options = {}) {
    let entry;
    const storeKey = this.normalizeStoreKey(key);
    if (entry = this.store.get(storeKey)) {
      if (this.isFresh(entry)) {
        if (!options.silent) { this.log("Cache hit for '%s'", key); }
        return entry.value;
      } else {
        if (!options.silent) { this.log("Discarding stale cache entry for '%s'", key); }
        this.remove(key);
        return undefined;
      }
    } else {
      if (!options.silent) { this.log("Cache miss for '%s'", key); }
      return undefined;
    }
  }
};
