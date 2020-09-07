u = up.util

GLOBAL_DEFAULTS = {
  hungry: true
  keep: true
  focus: 'auto'
  source: true
  saveScroll: true
  fail: 'auto'
}

# These properties are used before the request is sent.
# Hence there cannot be a failVariant.
PREFLIGHT_KEYS = [
  'url',
  'method',
  'origin',
  'headers',
  'params',
  'cache',
  'solo',
  'tentative',
  'confirm',
  'feedback',
  'origin',
  'currentLayer',
  'fail',
]

# These properties are used between success options and fail options.
# There's a lot of room to think differently about what should be shared and what
# should explictely be set separately for both cases. An argument can always be
# that it's either convenient to share, or better to be explicit.
#
# Generally we have decided to share:
#
# - Options that are relevant before the request is sent (e.g. { url } or { solo }).
# - Options that change how we think about the entire rendering operation.
#   E.g. if we always want to see a server response, we set { fallback: true }.
#
# Generally we have decided to not share:
#
# - Layer-related options (e.g. target layer or options for a new layer)
# - Options that change focus. The user might focus a specific element from a success element,
#   like { focus: '.result', failFocus: '.errors' }.
# - Options that change focus. The user might scroll to a specific element from a success element,
#   like { reveal: '.result', failReaveal: '.errors' }.
SHARED_KEYS = PREFLIGHT_KEYS.concat([
  'keep',         # If I want to discard [up-keep] elements, I also want to discard them for the fail case.
  'hungry',       # If I want to opportunistically update [up-hungry] elements, I also want it for the fail case.
  'history',      # Note that regardless of setting, we only set history for reloadable responses (GET).
  'source',       # No strong opinions about that one. Wouldn't one always have a source? Might as well not be an option.
  'saveScroll',   # No strong opinions about that one. Wouldn't one always want to saveScroll? Might as wellnot be an option.
  'fallback',     # If I always want to see the server response, I also want to see it for the fail case
])

# These defaults will be set to both success and fail options
# if { navigate: true } is given.
NAVIGATE_DEFAULTS = {
  solo: true
  feedback: true
  fallback: true
  history: 'auto'
  peel: true
  reveal: true
  transition: 'navigate' # build in lookup
}

# These options will be set to both success and fail options
# if { navigate: false } is given.
NO_NAVIGATE_DEFAULTS = {
  history: false
}

class up.RenderOptionsAssembler
  constructor: (givenOptions) ->
    @navigate = givenOptions.navigate
    @givenSuccessOptions = {}
    @givenFailOptions = {}
    for key, value of givenOptions
      # up.OptionsParser adds undefined values which we ignore here.
      # If a user wants to pass a missing value, they need to pass null.
      if u.isDefined(value)
        # Note that up.fragment.successKey(key) only returns a value
        # if the given key is prefixed with "fail".
        if unprefixed = up.fragment.successKey(key)
          @givenFailOptions[unprefixed] = value
        else
          @givenSuccessOptions[key] = value

#  expandHistoryOption: (options) ->
#    if u.isDefined(options.history)
#      # When the layer is opened, the { history } option defines whether the
#      # layer enables handling of location and title in general.
#      # When updating history, { history } is a shortcut to
#      # change both { title } and { location }.
#      options.title ?= options.history
#      options.location ?= options.history

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
    # @expandHistoryOption(givenOptions)
    u.assign(result, givenOptions)

    # Transform { history: false, title: 'foo'      } to { history: true, title: 'foo', location: false }
    # Transform { history: false, location: '/path' } to { history: true, title: false, location: '/path' }
    if result.history == false
      if result.title && !result.location
        result.history = true
        result.location = false

      if result.location && !result.title
        result.history = true
        result.title = false

    return result

  getSuccessOptions: ->
    unless @successOptions
      @successOptions = @assembleOptions(@givenSuccessOptions)

    return @successOptions

  getFailOptions: ->
    unless @failOptions
      inheritedOptions = u.pick(@givenSuccessOptions, SHARED_KEYS)
      givenOptions = u.merge(inheritedOptions, @givenFailOptions)
      @failOptions = @assembleOptions(givenOptions)

    return @failOptions
