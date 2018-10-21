u = up.util
q = up.query

class up.FieldObserver2

  # Although (depending on the browser) we only need/receive either input or change,
  # we always bind to both events in case another script manually triggers it.
  CHANGE_EVENTS = ['input', 'change']

  constructor: (fieldOrFields, options) ->
    @fields = q.elements(fieldOrFields)
    @delay = options.delay
    @callback = options.callback
    @batch = options.batch

  start: =>
    @scheduledValues = null
    @processedValues = @readFieldValues()
    @currentTimer = undefined
    @callbackRunning = false
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
    @cancelTimer()
    @currentTimer = u.setTimer @delay, =>
      @currentTimer = undefined
      @requestCallback()

  scheduleValues: (values) =>
    @scheduledValues = values
    @scheduleTimer()

  isNewValues: (values) =>
    !u.isEqual(values, processedValues) && !u.isEqual(@scheduledValues, values)

  requestCallback: =>
    if @scheduledValues != null && !@currentTimer && !@callbackRunning
      diff = @changedValues(@processedValues, @scheduledValues)
      @processedValues = @scheduledValues
      @scheduledValues = null

      callbackReturnValues = []
      if @batch
        callbackReturnValues.push(@callback(diff))
      else
        for name, value of diff
          callbackReturnValues.push(@callback(value, name))

      # Promise.all() will wait for any promises that might be
      # contained in the `callbackReturnValues` array.
      callbacksDone = Promise.all(callbackReturnValues)

      u.always callbacksDone, =>
        @callbackRunning = false
        @requestCallback()

  changedValues: (previous, next) ->
    changes = {}
    keys = Object.keys(previous)
    keys = keys.concat(Object.keys(next))
    keys = u.uniq(keys)
    for key in keys
      previousValue = previous[key]
      nextValue = next[key]
      unless u.isEqual(previousValue, nextValue)
        changes[key] = nextValue
    changes

  readFieldValues: =>
    up.Params.fromFields(@fields).toObject()

  check: =>
    values = @readFieldValues()
    @scheduleValues(values) if @isNewValues(values)
