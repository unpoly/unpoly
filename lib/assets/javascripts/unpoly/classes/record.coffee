u = up.util

class up.Record

  fields: ->
    throw 'Return an array of property names'

  defaults: ->
    {}

  constructor: (options) ->
    attributes = u.merge(@defaults(), @attributes(options))
    u.assign(this, attributes)

  attributes: (source = @) =>
    u.only(source, @fields()...)

  copy: (changes = {}) =>
    attributesWithChanges = u.merge(@attributes(), changes)
    new @constructor(attributesWithChanges)
