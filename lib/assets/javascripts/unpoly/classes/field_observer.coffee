u = up.util
e = up.element

class up.FieldObserver

  constructor: (fieldOrFields, options, @callback) ->
    @fields = e.list(fieldOrFields)
    @delay = options.delay
    @batch = options.batch

  start: ->
    @scheduledValues = null
    @processedValues = @readFieldValues()
    @currentTimer = undefined
    @callbackRunning = false
    # Although (depending on the browser) we only need/receive either input or change,
    # we always bind to both events in case another script manually triggers it.
    @unbind = up.on(@fields, 'input change', => @check())

  stop: ->
    @unbind()
    @cancelTimer()

  cancelTimer: ->
    clearTimeout(@currentTimer)
    @currentTimer = undefined

  scheduleTimer: ->
    @cancelTimer()
    @currentTimer = u.timer @delay, =>
      @currentTimer = undefined
      @requestCallback()

  scheduleValues: (values) =>
    @scheduledValues = values
    @scheduleTimer()

  isNewValues: (values) =>
    !u.isEqual(values, @processedValues) && !u.isEqual(@scheduledValues, values)

  requestCallback: ->
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

      callbacksDone = u.allSettled(callbackReturnValues)

      callbacksDone.then =>
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

  readFieldValues: ->
    up.Params.fromFields(@fields).toObject()

  check: ->
    values = @readFieldValues()
    @scheduleValues(values) if @isNewValues(values)
