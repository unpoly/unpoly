up.store ||= {}

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
