u = up.util
e = up.element

class up.ExtractPlan

  @NOT_APPLICABLE: 'n/a'

  constructor: (@options) ->

  setSource: (element, sourceUrl) ->
    unless sourceUrl is false
      sourceUrl = u.normalizeUrl(sourceUrl) if u.isPresent(sourceUrl)
      element.setAttribute('up-source', sourceUrl)

  notApplicable: ->
    throw up.ExtractPlan.NOT_APPLICABLE
