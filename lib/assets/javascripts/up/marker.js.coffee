###*
Markers
=======
  
TODO: Write some documentation
  
@class up.marker
###
up.marker = (->
  
  hasContent = ($marker) ->
    $marker.html().trim() != ''

  check = ($element) ->
    up.util.findWithSelf($element, '[up-marker]').each ->
      $marker = $(this)
      unless hasContent($marker)
        $marker.hide()

  ###*
  @method [up-marker]
  ###
  up.bus.on 'fragment:ready', check
  
)()

