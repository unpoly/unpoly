#= require ../../layer

class up.layer.Base

  constructor: ->
    @url = null
    @title = null
    @history = null

  contains: (element) ->
    @element.contains(element)

class up.layer.Root extends up.layer.Base

  constructor: ->
    super()
    @element = document.documentElement
    @history = true
