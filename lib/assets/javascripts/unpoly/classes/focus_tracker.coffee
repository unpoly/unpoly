class up.FocusTracker

  constructor: ->
    @delay = 80
    $(document).on('focusin', up.form.fieldSelector(), @fieldFocused)
    $(document).on('focusout', up.form.fieldSelector(), @fieldBlurred)
    @reset()

  reset: ->
    clearTimeout(@discardTimer)
    @discardTimer = undefined
    @field = undefined

  fieldFocused: (event) =>
    clearTimeout(@discardTimer)
    @field = event.currentTarget

  fieldBlurred: (event) =>
    clearTimeout(@discardTimer)
    @discardTimer = u.setTimer(@delay, @discardField)

  discardField: =>
    @field = undefined

  lastField: ->
    if u.isDetached(@field)
      @discardField()
    @field
