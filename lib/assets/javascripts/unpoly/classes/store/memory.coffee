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
    @data[key] = undefined

  keys: =>
    Object.keys(@data)

  values: =>
    u.values(@data)
