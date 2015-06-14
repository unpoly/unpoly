@Trigger = (->
  
  u = up.util
  
  mousedown = ($element, options) ->
    options = u.options(options, view: window, cancelable: true, bubbles: true)
    event = new MouseEvent('mousedown', options)
    dispatch($element, event)
  
  mouseup = ($element, options) ->
    options = u.options(options, view: window, cancelable: true, bubbles: true)
    event = new MouseEvent('mouseup', options)
    dispatch($element, event)
    
  click = ($element, options) ->
    options = u.options(options, view: window, cancelable: true, bubbles: true)
    event = new MouseEvent('click', options)
    dispatch($element, event)
    
  dispatch = ($element, event) ->
    $element.each ->
      this.dispatchEvent(event)
      
  mousedown: mousedown
  mouseup: mouseup
  click: click
  
)()
