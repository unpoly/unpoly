e = up.element

class up.OverlayFocus

  constructor: (@layer) ->

  moveToFront: ->
    return if @enabled
    @enabled = true

    @untrapFocus = up.on('focusin', (event) => @onFocus(event))
    @unsetAttrs = e.setTemporaryAttrs(@layer.element,
      'tabindex': '0'      # make element focusable
      'role': 'dialog'     # make screen readers speak "dialog field" as we focus the element
      'aria-modal': 'true' # tell modern screen readers to make all other elements inert
      # 'aria-label': 'dialog'
    )
    @focusTrapBefore = e.affix(@layer.element, 'beforebegin', 'up-focus-trap[tabindex=0]',)
    @focusTrapAfter = e.affix(@layer.element, 'afterend', 'up-focus-trap[tabindex=0]')

    # page = document.querySelector('.page')
    # page.setAttribute('inert', '')
    # page.setAttribute('aria-hidden', 'true')

  moveToBack: ->
    @teardown()

  teardown: ->
    return unless @enabled
    @enabled = false

    @untrapFocus()
    # Remove [aria-modal] attribute to not confuse screen readers with multiple
    # mutually exclusive [aria-modal] layers.
    @unsetAttrs()

    e.remove(@focusTrapBefore)
    e.remove(@focusTrapAfter)

  onFocus: (event) ->
    target = event.target

    # Ignore focus events triggered by this method.
    return if @processingFocusEvent
    @processingFocusEvent = true

    if target == @focusTrapBefore
      # User shift-tabbed from the first focusable element in the overlay.
      # Focus pierced through the layer the the beginning.
      # We want to wrap around and focus the end of the overlay.
      @focusEnd()
    else if target == @focusTrapAfter || !@layer.contains(target)
      # User tabbed from the last focusable element in the overlay
      # OR user moved their virtual cursor on an element outside the layer.
      # We want to to trap focus and focus the start of the overlay.
      @focusStart()

    @processingFocusEvent = false

  focusStart: (focusOptions) ->
    # Focusing the overlay element with its [role=dialog] will read out
    # "dialog field" in many screen readers.
    up.focus(@layer.element, focusOptions)

  focusEnd: ->
    # The end will usually be the dismiss button, if there is one.
    # Otherwise it will be the last focusable element.
    # We focus on the box element since focusing on the layer container
    # would include the viewport, which is focusable due to scroll bars.
    @focusLastDescendant(@layer.getBoxElement()) || @focusStart()

  focusLastDescendant: (element) ->
    # Don't use forEach since we need to break out of the loop with `return`
    for child in u.reverse(element.children)
      if up.viewport.tryFocus(child) || @focusLastDescendant(child)
        return true
