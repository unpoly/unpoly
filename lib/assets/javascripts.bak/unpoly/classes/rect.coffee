u = up.util

class up.Rect extends up.Record

  keys: ->
    [
      'left',
      'top',
      'width',
      'height'
    ]

  @getter 'bottom', ->
    @top + @height

  @getter 'right', ->
    @left + @width

  @fromElement: (element) ->
    new @(element.getBoundingClientRect())
