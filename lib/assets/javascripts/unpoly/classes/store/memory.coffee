up.store ||= {}

u = up.util

class up.store.Memory

  constructor: ->
    @clear()

  clear: =>
    @data = {}

  get: (key) =>
    @data[key]

  set: (key, value) =>
    @data[key] = value

  remove: (key) =>
    delete @data[key]

  keys: =>
    Object.keys(@data)

  size: =>
    @keys().length

  values: =>
    u.values(@data)
