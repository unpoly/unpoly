#= require ./record

u = up.util

class up.CompileResult extends up.Record

  fields: ->
    [
      'elements'
      'save'
      'destroy'
    ]

