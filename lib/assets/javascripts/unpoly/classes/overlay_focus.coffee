e = up.element

class up.OverlayFocus

  constructor: (@layer) ->

  moveToFront: ->
    return if @enabled
    @enabled = true

    console.debug("--- setup on #{@layer.toString()}")

    @untrapFocus = up.on('focusin', (event) => @onFocus(event))
    @unsetAttrs = e.setTemporaryAttrs(@layer.boxElement,
      'tabindex': '0'      # make element focusable
      'role': 'dialog'     # make screen readers speak "dialog field" as we focus the element
      'aria-modal': 'true' # tell modern screen readers to make all other elements inert
      # 'aria-label': 'dialog'
    )
    @focusBeforeElement = e.affix(@layer.boxElement, 'beforebegin', 'up-focus-trap[tabindex=0]',)
    @focusAfterElement = e.affix(@layer.boxElement, 'afterend', 'up-focus-trap[tabindex=0]')

    # page = document.querySelector('.page')
    # page.setAttribute('inert', '')
    # page.setAttribute('aria-hidden', 'true')

  moveToBack: ->
    @teardown()

  teardown: ->
    return unless @enabled
    @enabled = false

    console.debug("--- teardown on #{@layer.toString()}")

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

  focusStart: (focusOptions = { reveal: true }) ->
    # Focusing the overlay element with its [role=dialog] will read out
    # "dialog field" in many screen readers.
    up.viewport.focus(@layer.boxElement, focusOptions)

  focusEnd: ->
    # The end will usually be the dismiss button, if there is one.
    # Otherwise it will be the last focusable element.
    # We focus on the box element since focusing on the layer container
    # would include the viewport, which is focusable due to scroll bars.
    @focusLastDescendant(@layer.boxElement) || @focusStart()

  focusLastDescendant: (element) ->
    # don't use forEach since we need to interrupt the loop with `return`
    for child in u.reverse(element.children)
      if child != @focusEndElement
        if up.viewport.tryFocus(child, reveal: true) || @focusLastDescendant(child)
          return true
