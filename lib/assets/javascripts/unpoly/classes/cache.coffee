u = up.util

###**
@class up.Cache
@internal
###
class up.Cache

  ###**
  @constructor
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
  @param {Function(entry): boolean} [config.cachable]
    A function that takes a potential cache entry and returns whether
    this entry  can be stored in the hash. If omitted, all entries are considered
    cachable.
  ###
  constructor: (@config = {}) ->
    @store = @config.store || new up.store.Memory()

  size: ->
    @store.size()

  maxSize: =>
    u.evalOption(@config.size)

  expiryMillis: =>
    u.evalOption(@config.expiry)

  normalizeStoreKey: (key) =>
    if @config.key
      @config.key(key)
    else
      key.toString()

  isEnabled: =>
    @maxSize() isnt 0 && @expiryMillis() isnt 0

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
      up.puts('up.Cache', args...)

  keys: =>
    @store.keys()
    
  each: (fn) ->
    u.each @keys(), (key) =>
      entry = @store.get(key)
      fn(key, entry.value, entry.timestamp)

  makeRoomForAnotherEntry: ->
    if @hasRoomForAnotherEntry()
      return

    oldestKey = undefined
    oldestTimestamp = undefined
    @each (key, request, timestamp) ->
      if !oldestTimestamp || oldestTimestamp > timestamp
        oldestKey = key
        oldestTimestamp = timestamp

    if oldestKey
      @store.remove(oldestKey)

  hasRoomForAnotherEntry: ->
    maxSize = @maxSize()
    return !maxSize || @size() < maxSize
      
  alias: (oldKey, newKey) =>
    value = @get(oldKey, silent: true)
    if u.isDefined(value)
      @set(newKey, value)

  timestamp: ->
    (new Date()).valueOf()

  set: (key, value) =>
    if @isEnabled() && @isCachable(key)
      @makeRoomForAnotherEntry()
      storeKey = @normalizeStoreKey(key)
      entry =
        timestamp: @timestamp()
        value: value
      @store.set(storeKey, entry)

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
    storeKey = @normalizeStoreKey(key)
    if @isCachable(key) && (entry = @store.get(storeKey))
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
