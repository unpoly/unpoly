#= require ../../layer

class up.layer.Base

  constructor: ->
    @url = null
    @title = null

  contains: (element) ->
    @element.contains(element)

class up.layer.Root extends up.layer.Base

  constructor: ->
    @element = document.documentElement
