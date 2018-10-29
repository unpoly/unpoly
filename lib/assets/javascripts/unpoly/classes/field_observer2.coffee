u = up.util
e = up.element

class up.FieldObserver2

  # Although (depending on the browser) we only need/receive either input or change,
  # we always bind to both events in case another script manually triggers it.
  CHANGE_EVENTS = ['input', 'change']

  constructor: (fieldOrFields, options, @callback) ->
    @fields = e.list(fieldOrFields)
    @delay = options.delay
    @batch = options.batch
    console.debug("FieldObserver for fields %o and delay %o", @fields, @delay)

  start: =>
    @scheduledValues = null
    @processedValues = @readFieldValues()
    @currentTimer = undefined
    @callbackRunning = false
    @changeEventSubscription('addEventListener')

  stop: =>
    @changeEventSubscription('removeEventListener')
    @cancelTimer()

  changeEventSubscription: (fn) ->
    for eventName in CHANGE_EVENTS
      for field in @fields
        field[fn](eventName, @check)

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
    console.debug('--- scheduledValues is now set to %o', @scheduledValues)
    @scheduleTimer()

  isNewValues: (values) =>
    console.debug("-- isNewValues: processedValues = %o, scheduledValues = %o", @processedValues, @scheduledValues)
    !u.isEqual(values, @processedValues) && !u.isEqual(@scheduledValues, values)

  requestCallback: =>
    console.debug("-- requestCallback: scheduledValues = %o, currentTimer = %o, callbackRunning = %o", @scheduledValues, @currentTimer, @callbackRunning)

    if @scheduledValues != null && !@currentTimer && !@callbackRunning
      console.debug(">>> propagating events for %o", @scheduledValues)
      diff = @changedValues(@processedValues, @scheduledValues)
      @processedValues = @scheduledValues
      @scheduledValues = null
      @callbackRunning = true

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
    console.debug("-- check got values %o (new == %o)", values, @isNewValues(values))
    @scheduleValues(values) if @isNewValues(values)
