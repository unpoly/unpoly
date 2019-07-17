u = up.util

class up.Record extends up.Class

  keys: ->
    throw 'Return an array of keys'

  defaults: ->
    {}

  constructor: (options) ->
    u.assign(this, @defaults(), @attributes(options))

  attributes: (source = @) ->
    u.pick(source, @keys())

  "#{u.copy.key}": ->
    @variant()

  variant: (changes = {}) ->
    attributesWithChanges = u.merge(@attributes(), changes)
    new @constructor(attributesWithChanges)

  "#{u.isEqual.key}": (other) ->
    @constructor == other.constructor && u.isEqual(@attributes(), other.attributes())
