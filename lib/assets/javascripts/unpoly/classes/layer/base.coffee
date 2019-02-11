#= require ../../layer

class up.layer.Base

  constructor: ->
    @url = null
    @title = null
    @history = null

  open: (element, options) ->
    throw "implement me. or is it that constructor that opens?"

  contains: (element) ->
    @element.contains(element)

class up.layer.Root extends up.layer.Base

  throw "macht das überhaupt sinn die root als layer zu führen?"

  constructor: ->
    super()
    @element = document.documentElement
    @history = true

class up.layer.Modal extends up.layer.Base


up.layer.dialog 'modal', up.layer.Modal
