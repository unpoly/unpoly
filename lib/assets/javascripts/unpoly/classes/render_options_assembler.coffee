GLOBAL_DEFAULTS = {
  hungry: true
  keep: true
  focus: 'auto'
	source: true
	saveScroll: true
  fail: (response) -> !response.ok
}

SHARED_KEYS = [
  'url',
  'method',
  'origin',
  'headers',
  'params',
  'cache',
  'solo',
  'confirm',
  'feedback',
  'origin',
  'hungry',
  'history',
  'title',
  'location',
  'source',
  'saveScroll',
  'currentLayer',
]

NAVIGATE_DEFAULTS = {
	solo: true
  feedback: true
  fallback: ':main'
	peel: true
  reveal: true
  transition: 'navigate' # build in lookup
}

NO_NAVIGATE_DEFAULTS = {
  title: false
  location: false
}

class up.RenderOptionsAssembler
  constructor: (givenOptions) ->
    @navigate = givenOptions.navigate
    @givenSuccessOptions = {}
    @givenFailureOptions = {}
    for key, value of givenOptions
      # up.OptionsParser adds undefined values which we ignore here.
      # If a user wants to pass a missing value, they need to pass null.
      if u.isDefined(value)
        # Note that up.fragment.successKey(key) only returns a value
        # if the given key is prefixed with "fail".
        if unprefixed = up.fragment.successKey(key)
          @givenFailureOptions[unprefixed] = value
        else
          @givenSuccessOptions[key] = value

  expandHistoryOption: (options) ->
    if u.isDefined(options.history)
      # When the layer is opened, the { history } option defines whether the
      # layer enables handling of location and title in general.
      # When updating history, { history } is a shortcut to
      # change both { title } and { location }.
      options.title ?= options.history
      options.location ?= options.history

  defaultOptions: ->
    defaults = {}
    u.assign(defaults, GLOBAL_DEFAULTS)
    if @navigate
      u.assign(defaults, NAVIGATE_DEFAULTS)
    else
      u.assign(defaults, NO_NAVIGATE_DEFAULTS)
    defaults

  assembleOptions: (givenOptions) ->
    result = @defaultOptions()
    @expandHistoryOption(givenOptions)
    u.assign(result, givenOptions)
    @expandHistoryOption(result)
    return result

  getSuccessOptions: ->
    unless @successOptions
      @successOptions = @assembleOptions(@givenSuccessOptions)

    return @successOptions

  getFailureOptions: ->
    unless @failureOptions
      inheritedOptions = u.pick(@givenSuccessOptions, SHARED_KEYS)
      givenOptions = u.merge(inheritedOptions, @givenFailureOptions)
      @failureOptions = @assembleOptions(givenOptions)

    return @failureOptions
