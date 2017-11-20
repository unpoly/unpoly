u = up.util

class up.FieldObserver

  # Although (depending on the browser) we only need/receive either input or change,
  # we always bind to both events in case another script manually triggers it.
  CHANGE_EVENTS = 'input change'

  constructor: (@$field, options) ->
    @delay = options.delay
    @callback = options.callback

  start: =>
    # Don't use undefined since an unchecked checkbox actually has an undefined value
    @scheduledValue = null
    @processedValue = @readFieldValue()
    @currentTimer = undefined
    @currentCallback = undefined
    @$field.on(CHANGE_EVENTS, @check)

  stop: =>
    @$field.off(CHANGE_EVENTS, @check)
    @cancelTimer()

  cancelTimer: =>
    clearTimeout(@currentTimer)
    @currentTimer = undefined

  scheduleTimer: =>
    @currentTimer = u.setTimer2 @delay, =>
      @currentTimer = undefined
      @requestCallback()

  isNewValue: (value) =>
    value != @processedValue && (@scheduledValue == null || @scheduledValue != value)

  requestCallback: =>
    if @scheduledValue != null && !@currentTimer && !@currentCallback
      @processedValue = @scheduledValue
      @scheduledValue = null
      @currentCallback = => @callback.call(@$field.get(0), @processedValue, @$field)
      # If the callback returns a promise x, Promise.resolve(x) will wait for it
      callbackDone = Promise.resolve(@currentCallback())
      u.always callbackDone, =>
        # Don't use undefined since an unchecked checkbox actually has an undefined value
        @currentCallback = undefined
        @requestCallback()

  readFieldValue: =>
    u.submittedValue(@$field)

  check: =>
    value = @readFieldValue()
    if @isNewValue(value)
      @scheduledValue = value
      @cancelTimer()
      @scheduleTimer()
