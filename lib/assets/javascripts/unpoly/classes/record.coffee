u = up.util

class up.Record extends up.Class

  @keys: ->
    # Return an array of property names
    # Defaults to the keys of @defaults(), if that returns an object.
    if defaults = @defaults()
      Object.keys(defaults)
    else
      []

  @defaults: ->
    return undefined

  constructor: (options) ->
    u.assign(this, @constructor.defaults(), @attributes(options))

  attributes: (source = @) ->
    u.only(source, @constructor.keys()...)

  "#{u.copy.key}": ->
    @variant()

  variant: (changes = {}) ->
    attributesWithChanges = u.merge(@attributes(), changes)
    new @constructor(attributesWithChanges)

  "#{u.isEqual.key}": (other) ->
    @constructor == other.constructor && u.isEqual(@attributes(), other.attributes())
