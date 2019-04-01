#= require ../namespace

u = up.util
e = up.element

class up.Change.Plan

  @NOT_APPLICABLE: 'n/a'

  constructor: (@options) ->

  notApplicable: ->
    throw up.Change.Plan.NOT_APPLICABLE
