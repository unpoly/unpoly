u = up.util

class up.Record extends up.Class

  keys: ->
    throw 'Return an array of keys'

  defaults: (options) ->
    {}

  constructor: (options) ->
    u.assign(this, @defaults(options), @attributes(options))

  attributes: (source = @) ->
    u.pick(source, @keys())

  "#{u.copy.key}": ->
    @variant()

  variant: (changes = {}) ->
    new @constructor(u.merge(@attributes(), changes))

  "#{u.isEqual.key}": (other) ->
    @constructor == other.constructor && u.isEqual(@attributes(), other.attributes())
