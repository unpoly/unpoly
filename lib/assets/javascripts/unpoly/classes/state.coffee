#= require ./record

u = up.util

class up.State extends up.Record

  fields: ->
    [
      'name',
      'url',
      'method',
      'submitUrl',
      'submitMethod',
      'params',
      'data',
      'focus',
      'scrollTops',
      'mapData',
      'mapParams'
    ]

  defaults: ->
    params: {}
    data: {}
    method: 'GET'

  copyInContext: (options = {}) =>
    @copy
      params: up.params.merge(@params, options.params)
      data: u.deepMerge(@data, options.data)
      scrollTops: u.copy(u.option(options.scrollTops, @scrollTops))

  restoreURL: =>
    up.params.buildURL(@url, @params)

  submitRequestOptions:  =>
    url: @submitUrl || @url
    method: @submitMethod || @method
    params: @params
