## Working example for this: https://codepen.io/anon/pen/MBVewo
#class up.FocusFollower
#
#  constructor: ->
#    @discardDelay = 80
#    fieldSelector = up.form.fieldSelector()
#    $(document).on('focusin', fieldSelector, @fieldFocused)
#    $(document).on('focusout', fieldSelector, @fieldBlurred)
#    @reset()
#
#  reset: ->
#    clearTimeout(@discardTimer)
#    @field = undefined
#
#  fieldFocused: (event) =>
#    clearTimeout(@discardTimer)
#    @field = event.currentTarget
#
#  fieldBlurred: (event) =>
#    clearTimeout(@discardTimer)
#    @discardTimer = u.timer(@discardDelay, @discardField)
#
#  discardField: =>
#    @field = undefined
#
#  lastField: ->
#    if u.isDetached(@field)
#      @discardField()
#    @field
