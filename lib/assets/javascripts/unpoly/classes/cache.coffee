u = up.util

###**
@class up.Cache
@internal
###
class up.Cache

  ###**
  @constructor
  @param {number|Function() :number} [config.size]
    Maximum number of cache entries.
    Set to `undefined` to not limit the cache size.
  @param {number|Function(): number} [config.expiry]
    The number of milliseconds after which a cache entry
    will be discarded.
  @param {string} [config.logPrefix]
    A prefix for log entries printed by this cache object.
  @param {Function(any): string} [config.key]
    A function that takes an argument and returns a string key
    for storage. If omitted, `toString()` is called on the argument.
  @param {Function(any): boolean} [config.cachable]
    A function that takes a potential cache entry and returns whether
    this entry  can be stored in the hash. If omitted, all entries are considered
    cachable.
  ###
  constructor: (@config = {}) ->
    @store = @config.store || new up.store.Memory()

  maxKeys: =>
    u.evalOption(@config.size)

  expiryMillis: =>
    u.evalOption(@config.expiry)

  normalizeStoreKey: (key) =>
    if @config.key
      @config.key(key)
    else
      key.toString()

  isEnabled: =>
    @maxKeys() isnt 0 && @expiryMillis() isnt 0

  isCachable: (key) =>
    if @config.cachable
      @config.cachable(key)
    else
      true

  clear: =>
    @store.clear()

  log: (args...) =>
    if @config.logPrefix
      args[0] = "[#{@config.logPrefix}] #{args[0]}"
      up.puts(args...)

  keys: =>
    @store.keys()

  makeRoomForAnotherKey: =>
    storeKeys = u.copy(@keys())
    max = @maxKeys()
    if max && storeKeys.length >= max
      oldestKey = undefined
      oldestTimestamp = undefined
      u.each storeKeys, (key) =>
        entry = @store.get(key) # we don't need to call cacheKey here
        timestamp = entry.timestamp
        if !oldestTimestamp || oldestTimestamp > timestamp
          oldestKey = key
          oldestTimestamp = timestamp
      @store.remove(oldestKey) if oldestKey

  alias: (oldKey, newKey) =>
    value = @get(oldKey, silent: true)
    if u.isDefined(value)
      @set(newKey, value)

  timestamp: =>
    (new Date()).valueOf()

  set: (key, value) =>
    if @isEnabled() && @isCachable(key)
      @makeRoomForAnotherKey()
      storeKey = @normalizeStoreKey(key)
      @log("Setting entry %o to %o", storeKey, value)
      timestampedValue =
        timestamp: @timestamp()
        value: value
      @store.set(storeKey, timestampedValue)

  remove: (key) =>
    if @isCachable(key)
      storeKey = @normalizeStoreKey(key)
      @store.remove(storeKey)

  isFresh: (entry) =>
    millis = @expiryMillis()
    if millis
      timeSinceTouch = @timestamp() - entry.timestamp
      timeSinceTouch < millis
    else
      true

  get: (key, options = {}) =>
    if @isCachable(key) && (entry = @store.get(@normalizeStoreKey(key)))
      if @isFresh(entry)
        @log("Cache hit for '%s'", key) unless options.silent
        entry.value
      else
        @log("Discarding stale cache entry for '%s'", key) unless options.silent
        @remove(key)
        undefined
    else
      @log("Cache miss for '%s'", key) unless options.silent
      undefined

  first: (keyOrKeys) =>
    @all(keyOrKeys)[0]

  all: (keys = @keys()) =>
    keys = u.wrapArray(keys)
    matches = u.map keys, (key) =>
      @get(key)
    u.select(matches, u.isPresent)
