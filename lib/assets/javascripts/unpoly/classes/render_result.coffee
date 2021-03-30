u = up.util
e = up.element

###**
Instances of `up.RenderResult` describe the effects of [rendering](/up.fragment).

@class up.RenderResult
###
class up.RenderResult extends up.Record

  ###**
  An array of fragments that were inserted.

  @property up.RenderResult#fragments
  @param {Array<Element>} fragments
  @stable
  ###

  ###**
  The updated [layer](/up.layer).

  @property up.RenderResult#layer
  @param {up.Layer} layer
  @stable
  ###

  keys: ->
    [
      'fragments',
      'layer',
#      'request',
#      'response'
    ]

#  @getter 'ok', ->
#    if @response
#      @response.ok
#    else
#      true
