#= require ./update_layer

class up.Change.ResetWorld extends up.Change.UpdateLayer

  constructor: ->
    super(
      layer: 'root',
      target: 'body',
      peel: true,
    )
