u = up.util

##
# Store implementation backed by window.sessionStorage
# ====================================================
#
# This improves plain sessionStorage access in several ways:
#
# - Falls back to in-memory storage if window.sessionStorage is not available (see below).
# - Allows to store other types of values than just strings.
# - Allows to store structured values.
# - Allows to invalidate existing data by incrementing a version number on the server.
#
# On sessionStorage availability
# ------------------------------
#
# All supported browsers have sessionStorage, but the property is `null`
# in private browsing mode in Safari and the default Android webkit browser.
# See https://makandracards.com/makandra/32865-sessionstorage-per-window-browser-storage
#
# Also Chrome explodes upon access of window.sessionStorage when
# user blocks third-party cookies and site data and this page is embedded
# as an <iframe>. See https://bugs.chromium.org/p/chromium/issues/detail?id=357625
#
class up.store.Session

  constructor: (rootKey, options = {}) ->
    @version = u.option(options.version, 1)
    @rootKey = rootKey
    @loadFromSessionStorage()

  clear: =>
    @data = @defaultData()
    @saveToSessionStorage()

  get: (key) =>
    @data[key]

  set: (key, value) =>
    @data[key] = value
    @saveToSessionStorage()

  remove: (key) =>
    @data[key] = undefined
    @saveToSessionStorage()

  keys: =>
    keys = Object.keys(@data)
    u.remove(keys, '_version')
    keys

  loadFromSessionStorage: =>
    try
      if raw = sessionStorage?.getItem(@rootKey)
        parsed = JSON.parse(raw)
        if parsed._version == @version
          @data = parsed
    catch
      # window.sessionStorage not supported (see class comment)
      # or JSON syntax error. We start with a blank object instead.

    @data ||= @defaultData()

  defaultData: =>
    { _version: @version }

  saveToSessionStorage: =>
    json = JSON.stringify(@data)
    try
      sessionStorage?.setItem(@rootKey, json)
    catch
      # window.sessionStorage not supported (see class comment).
      # We do nothing and only keep data in-memory.
