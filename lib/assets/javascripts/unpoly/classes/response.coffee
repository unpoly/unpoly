#= require ./record

u = up.util

class up.Response extends up.Record

  fields: ->
    ['method', 'url', 'text', 'status', 'request', 'xhr', 'title']

  constructor: (options) ->
    super(options)

  isSuccess: =>
    @status && (@status >= 200 && @status <= 299)

  isError: =>
    !@isSuccess()

  isMaterialError: =>
    @isError() && u.isBlank(@text)
