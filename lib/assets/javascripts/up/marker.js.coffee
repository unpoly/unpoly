###*
@class up.marker
###
up.marker = (->
  
  show = ($element) ->
    if display = $element.attr('up-marker-previous-display')
      $element.css('display', display)
    
  hide = ($element) ->
    display = $element.css('display')
    if display != 'none'
      $element.attr('up-marker-previous-display', display)
      $element.css('display', 'none')
      
  hasContent = ($marker) ->
    $marker.html().trim() != ''
    # content.replace(/\s/g, '') != ''
  
  check = ($element) ->
    console.log("running check")
    up.util.findWithSelf($element, '[up-marker]').each ->
      $marker = $(this)
      if hasContent($marker)
        show($marker)
      else
        hide($marker)
  
  up.bus.on 'fragment:ready', check
  
)()

