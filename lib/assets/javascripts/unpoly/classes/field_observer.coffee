u = up.util
e = up.element

class up.FieldObserver

  constructor: (fieldOrFields, options, @callback) ->
    @fields = e.list(fieldOrFields)
    @delay = options.delay
    @batch = options.batch

  start: =>
    @scheduledValues = null
    @processedValues = @readFieldValues()
    @currentTimer = undefined
    @callbackRunning = false
    @changeEventSubscription('on')

  stop: =>
    @changeEventSubscription('off')
    @cancelTimer()

  changeEventSubscription: (fn) ->
    # Although (depending on the browser) we only need/receive either input or change,
    # we always bind to both events in case another script manually triggers it.
    for field in @fields
      up[fn](field, 'input change', @check)

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
    !u.isEqual(values, @processedValues) && !u.isEqual(@scheduledValues, values)

  requestCallback: =>
    if @scheduledValues != null && !@currentTimer && !@callbackRunning
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
    @scheduleValues(values) if @isNewValues(values)
