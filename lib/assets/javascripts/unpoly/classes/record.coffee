u = up.util

class up.Record

  fields: ->
    throw 'Return an array of property names'

  constructor: (options) ->
    u.assign(this, @attributes(options))

  attributes: (source = @) =>
    u.only(source, @fields()...)

  copy: (changes = {}) =>
    attributesWithChanges = u.merge(@attributes(), changes)
    new @constructor(attributesWithChanges)

  isEqual: (other) ->
    @constructor == other.constructor && u.isEqual(@attributes(), other.attributes())
