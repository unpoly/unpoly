u = up.util

up.RenderOptions = do ->

  GLOBAL_DEFAULTS = {
    hungry: true
    keep: true
    source: true
    saveScroll: true
    fail: 'auto'
  }

  PRELOAD_OVERRIDES = {
    solo: false
    confirm: false
    feedback: false
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
    'clearCache',
    'fallback',  # this may produce a different X-Up-Target request header if { target } is missing on page
    'solo',
    'confirm',
    'feedback',
    'origin',
    'baseLayer',
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
    'navigate'      # Also set navigate defaults for fail options
  ])

  CONTENT_KEYS = ['url', 'content', 'fragment', 'document']

  navigateDefaults = (options) ->
    if options.navigate
      up.fragment.config.navigateOptions

  preloadOverrides = (options) ->
    if options.preload
      PRELOAD_OVERRIDES

  preprocess = (options) ->
    up.migrate.handleRenderOptions?(options)

    result = u.merge(
      GLOBAL_DEFAULTS,
      navigateDefaults(options),
      options,
      preloadOverrides(options)
    )

    return result

  assertContentGiven = (options) ->
    unless u.some(CONTENT_KEYS, (contentKey) -> return u.isGiven(options[contentKey]))
      # up.layer.open() should open an empty layer without a content key.
      if options.defaultToEmptyContent
        options.content = ''
      else
        up.fail('up.render() needs either { ' + CONTENT_KEYS.join(', ') + ' } option')

  failOverrides = (options) ->
    overrides = {}
    for key, value of options
      # Note that up.fragment.successKey(key) only returns a value
      # if the given key is prefixed with "fail".
      if unprefixed = up.fragment.successKey(key)
        overrides[unprefixed] = value
    overrides

  deriveFailOptions = (preprocessedOptions) ->
    result = u.merge(
      u.pick(preprocessedOptions, SHARED_KEYS),
      failOverrides(preprocessedOptions)
    )
    return preprocess(result)

  return {
    preprocess,
    assertContentGiven,
    deriveFailOptions,
  }
