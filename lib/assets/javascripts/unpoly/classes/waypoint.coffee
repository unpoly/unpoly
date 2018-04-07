u = up.util

class up.Waypoint extends up.Record

  fields: ->
    [
      'name',
      'url',
      'params',
      'data',
      'scrollTops'
    ]

  defaults: ->
    params: {}
    data: {}

  copyInContext: (options = {}) =>
    @copy
      params: up.params.merge(copy.params, options.params)
      data: u.merge(copy.data, options.data || {})

  restoreURL: =>
    up.params.buildURL(@url, @params)
