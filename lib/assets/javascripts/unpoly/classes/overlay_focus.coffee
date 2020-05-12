e = up.element

class up.OverlayFocus

  constructor: (@layer) ->

  moveToFront: ->
    @return if @enabled
    @enabled = true

    console.debug("--- moveToFront(%o)", @layer)
    @untrapFocus = up.on('focusin', (event) => @onFocus(event))
    @unsetAttrs = e.setTemporaryAttrs(@layer.element,
      'aria-modal': 'true'
      'tabindex': '0'
      'role': 'dialog'
    )
    @focusBeforeElement = e.createFromSelector('up-focus-trap[tabindex=0]')
    @layer.element.insertAdjacentElement('beforebegin', @focusBeforeElement)
    @focusAfterElement = e.createFromSelector('up-focus-trap[tabindex=0]')
    @layer.element.insertAdjacentElement('afterEnd', @focusAfterElement)

  moveToBack: ->
    @teardown()

  teardown: ->
    return unless @enabled
    @enabled = false

    @untrapFocus()
    # Remove [aria-modal] attribute to not confuse screen readers with multiple
    # mutually exclusive [aria-modal] layers.
    @unsetAttrs()
    e.remove(@focusBeforeElement)
    e.remove(@focusAfterElement)

  onFocus: (event) ->
    target = event.target

    return if @processingFocusEvent
    @processingFocusEvent = true

    if target == @focusBeforeElement
      # User shift-tabbed from the first focusable element in the overlay.
      # Focus pierced through the layer the the beginning.
      # We want to wrap around and focus the end of the overlay.
      @focusEnd()
    else if target == @focusAfterElement || !@layer.contains(target)
      # User tabbed from the last focusable element in the overlay
      # OR user moved their virtual cursor on an element outside the layer.
      # We want to to trap focus and focus the start of the overlay.
      @focusStart()

    @processingFocusEvent = false

  focusStart: ->
    console.debug("--- focusStart()")
    # Focusing the overlay element with its [role=dialog] will read out
    # "dialog field" in many screen readers.
    @layer.element.focus()

  focusEnd: ->
    console.debug("--- focusEnd()")
    # The end will usually be the dismiss button, if there is one.
    # Otherwise it will be the last focusable element.
    # We focus on the box element since focusing on the layer container
    # would include the viewport, which is focusable due to scroll bars.
    @focusLastDescendant(@layer.getBoxElement()) || @focusStart()

  focusLastDescendant: (element) ->
    console.debug("--- focusLastDescendant(%o)", element)
    # don't use forEach since we need to interrupt the loop with `return`
    for child in u.reverse(element.children)
      if child != @focusEndElement
        console.debug("--- --- trying to focus %o", child)
        if e.tryFocus(child) || @focusLastDescendant(child)
          console.debug("--- --- --- success for %o", child)
          return true
