u = up.util

class up.ViewportObstruction

  constructor: (@obstructedTop = 0, @obstructedBottom = 0) ->
    @viewportHeight = u.clientSize().height

  firstVisibleRow: (scrollPos = 0) ->
    scrollPos + @obstructedTop

  lastVisibleRow: (scrollPos = 0) ->
    scrollPos + @viewportHeight - obstruction.bottom - 1

  @none: ->
    new @()

  @measure: ->
    obstruction = new @()

    measureBottomOfTopObstructor = (obstructor) ->
      $obstructor = $(obstructor)
      $obstructor.offset().top + $obstructor.outerHeight()

    measureTopOfBottomObstructor = (obstructor) ->
      obstruction.viewportHeight - $(obstructor).offset().top

    $topObstructors = $(config.fixedTop.join(', '))
    $bottomObstructors = $(config.fixedBottom.join(', '))

    fixedTopBottoms = u.map($topObstructors, measureBottomOfTopObstructor)
    fixedBottomTops = u.map($bottomObstructors, measureTopOfBottomObstructor)

    top: Math.max(0, fixedTopBottoms...)
    bottom: Math.max(0, fixedBottomTops...)
