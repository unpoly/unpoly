u = up.util

class up.FieldObserver

  # Although (depending on the browser) we only need/receive either input or change,
  # we always bind to both events in case another script manually triggers it.
  CHANGE_EVENTS = ['input', 'change']

  constructor: (@field, options) ->
    @delay = options.delay
    @callback = options.callback

  start: =>
    # Don't use undefined since an unchecked checkbox actually has an undefined value
    @scheduledValue = null
    @processedValue = @readFieldValue()
    @currentTimer = undefined
    @currentCallback = undefined
    for event in CHANGE_EVENTS
      @field.addEventListener(event, @check)

  stop: =>
    for event in CHANGE_EVENTS
      @field.removeEventListener(event, @check)
    @cancelTimer()

  cancelTimer: =>
    clearTimeout(@currentTimer)
    @currentTimer = undefined

  scheduleTimer: =>
    @currentTimer = u.setTimer @delay, =>
      @currentTimer = undefined
      @requestCallback()

  isNewValue: (value) =>
    value != @processedValue && (@scheduledValue == null || @scheduledValue != value)

  requestCallback: =>
    if @scheduledValue != null && !@currentTimer && !@currentCallback
      @processedValue = @scheduledValue
      @scheduledValue = null
      @currentCallback = => @callback.call(@field, @processedValue, @field)
      # If the callback returns a promise x, Promise.resolve(x) will wait for it
      callbackDone = Promise.resolve(@currentCallback())
      u.always callbackDone, =>
        # Don't use undefined since an unchecked checkbox actually has an undefined value
        @currentCallback = undefined
        @requestCallback()

  readFieldValue: =>
    params = up.Params.fromField(@field)
    console.debug("! params from field %o are %o", @field, params)
    u.map(params, 'value')[0]

  check: =>
    console.debug("! check()")
    value = @readFieldValue()
    console.debug("! current value is: %o", value)
    if @isNewValue(value)
      @scheduledValue = value
      @cancelTimer()
      @scheduleTimer()
