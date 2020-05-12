e = up.element

# We want to set background-layers to [aria-hidden][inert] for accessibility reasons.
# However, doing so can be non-trivial because layer elements may be nested within each
# other:
#
#     +-------------------------------------+
#     | root                                |
#     |                                     |
#     | +---------------------------------+ |
#     | | div(i)                          | |
#     | +---------------------------------+ |
#     |                                     |
#     | +---------------------------------+ |
#     | | div                             | |
#     | | +--------+ +-------+ +--------+ | |
#     | | | div(i) | | popup | | div(i) | | |
#     | | +--------+ +-------- +--------+ | |
#     | +---------------------------------+ |
#     |                                     |
#     | +---------------------------------+ |
#     | | div(i)                          | |
#     | +---------------------------------+ |
#     |                                     |
#     | +---------------------------------+ |
#     | | modal                           | |
#     | | +-------------------------------+ |
#     | | | div                           | |
#     | | +-------------------------------+ |
#     | +---------------------------------+ |
#     |                                     |
#     +-------------------------------------+
#
# In the example above, when making the root layer inert, only the containers marked
# with (i) should be made inert.
class up.LayerInertness

  constructor: (@layer) ->
    @isInert = false

  toggle: (newInert) ->
    return if newInert == @isInert

    if newInert
      @changedElements = []
      @layerSelector = up.layer.anySelector()
      @traverse(@layer.getInertnessElement())
    else
      for changedElement in @changedElements
        @toggleElement(changedElement, false)
      @changedElements = undefined

    @isInert = newInert

  traverse: (element) ->
    console.debug("%o has layers (%o): %o", element, @layerSelector, element.querySelector(@layerSelector))

    if element.querySelector(@layerSelector)
      for child in element.children
        # Traverse the child unless it is a layer.
        # If child is a layer, we don't want to change its inertness.
        unless e.matches(child, @layerSelector)
          @traverse(child)
    else if !element.hasAttribute('inert')
      @changedElements.push(element)
      # By making element inert, we also make its descendants inert.
      @toggleElement(element, true)

  toggleElement: (element, newInert) ->
    e.toggleAttr(element, 'aria-hidden', true, newInert) # legacy agents
    e.toggleAttr(element, 'inert', '', newInert) # modern agents


#class up.LayerAccessibility
#
#  constructor: (@layer) ->
#    # @layer.on('up:layer:opened', (event) => @onOpened(event))
#    # @layer.on('up:layer:closing', (event) => @onClosing(event))
#
#  onOpened: ->
#    if parent = @layer.parent
#      parent.accessibility.moveToBackground()
#    @moveToForeground()
#
#  onClosing: ->
#    @moveToBackground() # lose dialog and make inert during close animation
#    if parent = @layer.parent
#      parent.accessibility.moveToForeground()
#
#  moveToBackground: ->
#    @traverse(@layer.getInertnessElement())
#    @removeDialogRole()
#
#  moveToForeground: ->
#    @restoreDialogRole()
#    @undoInertness()
