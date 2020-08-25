#= require ./change

u = up.util
e = up.element

class up.Change.FromContent extends up.Change

  constructor: (options) ->
    # Only extract options required for step building, since #execute() will be called with an
    # postflightOptions argument once the response is received and has provided refined
    # options.
    super(options)
    up.layer.normalizeOptions(@options)
    @layers = up.layer.getAll(@options)
    @origin = @options.origin
    @preview = @options.preview

    # When we're swapping elements in origin's layer, we can be choose a fallback
    # replacement zone close to the origin instead of looking up a selector in the
    # entire layer (where it might match unrelated elements).
    if @origin
      @originLayer = up.layer.get(@origin)

  getPlans: ->
    unless @plans
      @plans = []
      addFallbackPlans = (@options.fallback != false)

      if @options.fragment
        # ResponseDoc allows to pass innerHTML as { fragment }, but then it also
        # requires a { target }. We use a target that matches the parsed { fragment }.
        @options.target = @getResponseDoc().rootSelector()

      # (1) We seek @options.target in all matching layers
      @expandIntoPlans(@layers, @options.target)

      if addFallbackPlans
        # (2) In case fallback is a selector or array of selectors, we seek the fallback
        # in all matching layers. If fallback is true or undefined, this won't add plans.
        @expandIntoPlans(@layers,  @options.fallback)

        # (3) We try to update the closest zone around the origin. If no origin is
        # given, this will update the layer's main selectors.
        @expandIntoPlans(@layers, ':main')

        # (4) In case nothing from the above matches, we close all layers and swap the
        # body. The assumption is that the server has returned an unexpected response like
        # an error message or a login screen (if a session expired) and we want to display
        # this rather than fail the update.
        @addResetPlans()

    return @plans

  addResetPlans: ->
    @expandIntoPlans([up.layer.root], up.fragment.config.resetTargets, { peel: true, keep: false })

  expandIntoPlans: (layers, givenTarget, variantProps) ->
    for layer in layers
      for target in @expandTargets(layer, givenTarget)
        # Any plans we add will inherit all properties from @options
        props = u.merge(@options, { target, layer  }, variantProps)

        if layer == 'new'
          change = new up.Change.OpenLayer(props)
          @plans.push(change)
        else
          change = new up.Change.UpdateLayer(props)
          @plans.push(change)

  expandTargets: (layer, givenTarget) ->
    if givenTarget == ':main'
      targets = @mainTargets(layer)
    else
      targets = u.wrapList(givenTarget)

    # Use u.map() instead of Array#map() because sometimes targets is a jQuery
    # collection which an incompatible #map() implementation.
    targets = u.map targets, (target) =>
      if target == ':layer'
        return @firstSwappableTarget(layer)
      if u.isElementish(target)
        return up.fragment.toTarget(target)
      else if u.isString(target)
        return up.fragment.resolveTarget(target, { layer, @origin })
      else
        # @buildPlans() might call us with { target: false } or { target: nil }
        # In that case we don't add a plan.
        return

    return u.compact(targets)

  mainTargets: (layer) ->
    if layer == 'new'
      return up.layer.mainTargets(@options.mode)
    else
      return layer.mainTargets()

  firstSwappableTarget: (layer) ->
    # We cannot target the topmost content child if the layer hasn't been opened yet.
    unless layer == 'new'
      return up.fragment.toTarget(layer.getFirstSwappableElement())

  execute: ->
    return @seekPlan
      attempt: (plan) => plan.execute(@getResponseDoc())
      noneApplicable: => @postflightTargetNotApplicable()

  getResponseDoc: ->
    unless @preview || @responseDoc
      docOptions = u.pick(@options, ['target', 'content', 'fragment', 'document', 'html'])
      up.legacy.fixKey(docOptions, 'html', 'document')

      # If neither doc source is given, we assume { content }.
      # Note that { content } might be missing, to allow people to open a new layer
      # using up.layer.open().
      if !@options.document && !@options.fragment
        docOptions.content ?= ''

        # When processing { content }, ResponseDoc needs a { target } to create a matching
        # element. We pick the target from the first plan, since it might either be empty
        # OR it's a pseudo-selector like :main, which needs resolving.
        docOptions.target = @getPlans()[0]?.bestPreflightSelector()

      @responseDoc = new up.ResponseDoc(docOptions)

    return @responseDoc

  # Returns information about the change that is most likely before the request was dispatched.
  # This might change postflight if the response does not contain the desired target.
  requestAttributes: (opts = {}) ->
    @seekPlan
      attempt: (plan) -> plan.requestAttributes()
      noneApplicable: =>
        opts.optional or @preflightTargetNotApplicable(opts)

  preflightTargetNotApplicable: ->
    if @hasPlans()
      up.fail("Could not find target in current page (tried selectors %o)", @planTargets())
    else
      @failFromEmptyPlans()

  postflightTargetNotApplicable: ->
    if @options.inspectResponse
      toastOpts = { action: { label: 'Open response', callback: @options.inspectResponse } }

    if @hasPlans()
      up.fail(["Could not match targets in old and new content (tried selectors %o)", @planTargets()], toastOpts)
    else
      @failFromEmptyPlans(toastOpts)

  hasPlans: ->
    return @getPlans().length

  failFromEmptyPlans: (toastOpts) ->
    if @layers.length
      up.fail(['No target for change %o', @options], toastOpts)
    else
      up.fail('Layer %o does not exist', @options.layer)

  planTargets: ->
    return u.uniq(u.map(@getPlans(), 'target'))

  seekPlan: (opts) ->
#    unprintedMessages = []

    for plan in @getPlans()
      # opts.before?(plan)
      try
        return opts.attempt(plan)
      catch error
#        if up.error.notApplicable.is(error)
#          unprintedMessages.push(error.message)
#        else
        unless up.error.notApplicable.is(error)
          # Re-throw any unexpected type of error
          throw error

#    # If we're about to explode with a fatal error we print everything that we tried.
#    unprintedMessages.forEach (message) -> up.puts('up.render()', message)

    return opts.noneApplicable?()
