###*
Markers
=======
  
TODO: Write some documentation
  
@class up.marker
###
up.marker = (->
  
  u = up.util
  
  hasContent = ($marker) ->
    u.trim($marker.html()) != ''

  check = ($element) ->
    u.findWithSelf($element, '[up-marker]').each ->
      $marker = $(this)
      unless hasContent($marker)
        $marker.hide()

  ###*
  Use this attribute to mark up empty element containers that
  you plan to update with content in the future.

  An element with this attribute is automatically hidden
  if it has no content, and is re-shown if it is updated with
  content.

  This is useful to prevent the element from applying unwanted
  margins to the surrounding page flow.

  @method [up-marker]
  @ujs
  ###
  up.bus.on 'fragment:ready', check
  
)()

