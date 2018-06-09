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
    @store = {}

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
    @store = {}

  log: (args...) =>
    if @config.logPrefix
      args[0] = "[#{@config.logPrefix}] #{args[0]}"
      up.puts(args...)

  keys: =>
    Object.keys(@store)

  makeRoomForAnotherKey: =>
    storeKeys = u.copy(@keys())
    max = @maxKeys()
    if max && storeKeys.length >= max
      oldestKey = null
      oldestTimestamp = null
      u.each storeKeys, (key) =>
        promise = @store[key] # we don't need to call cacheKey here
        timestamp = promise.timestamp
        if !oldestTimestamp || oldestTimestamp > timestamp
          oldestKey = key
          oldestTimestamp = timestamp
      delete @store[oldestKey] if oldestKey

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
      @store[storeKey] =
        timestamp: @timestamp()
        value: value

  remove: (key) =>
    if @isCachable(key)
      storeKey = @normalizeStoreKey(key)
      delete @store[storeKey]

  isFresh: (entry) =>
    millis = @expiryMillis()
    if millis
      timeSinceTouch = @timestamp() - entry.timestamp
      timeSinceTouch < millis
    else
      true

  get: (key, options = {}) =>
    if @isCachable(key) && (entry = @store[@normalizeStoreKey(key)])
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

  all: (keys) ->
    keys = u.wrapArray(keys)
    if keys.length
      matches = u.map keys, (key) =>
        @get(key)
      u.select(matches, u.isPresent)
    else
      u.values(@store)
