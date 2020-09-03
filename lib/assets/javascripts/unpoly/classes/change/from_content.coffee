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

      if @options.fragment
        # ResponseDoc allows to pass innerHTML as { fragment }, but then it also
        # requires a { target }. We use a target that matches the parsed { fragment }.
        @options.target = @getResponseDoc().rootSelector()

      targets = u.flatten([@options.target, @options.fallback])
      @expandIntoPlans(@layers, targets)

    return @plans

  expandIntoPlans: (layers, targets) ->
    for layer in layers
      for target in @expandTargets(targets, layer)
        # Any plans we add will inherit all properties from @options
        props = u.merge(@options, { target, layer })
        if layer == 'new'
          change = new up.Change.OpenLayer(props)
        else
          change = new up.Change.UpdateLayer(props)
        @plans.push(change)

  expandTargets: (targets, layer) ->
    expanded = new Set()

    while targets.length
      target = targets.shift

      if target == ':main' || target == true
        targets.unshift @mainTargets(layer)...
      else if target == ':layer' && layer != 'new'
        targets.unshift layer.getFirstSwappableElement()
      else if u.isElementish(target)
        expanded.push up.fragment.toTarget(target)
      else if u.isString(target)
        expanded.push up.fragment.resolveTarget(target, { layer, @origin })
      else
        # @buildPlans() might call us with { target: false } or { target: nil }
        # In that case we don't add a plan.

    expanded

  mainTargets: (layer) ->
    if layer == 'new'
      return up.layer.mainTargets(@options.mode)
    else
      return layer.mainTargets()

#  firstExpandedMainTarget: ->
#    @expandTargets(@layers[0], ':main')[0]

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

      # If neither { document } nor { fragment } source is given, we assume { content }.
      if !@options.document && !@options.fragment
        # { content } might be missing, to allow people to open a new layer
        # using up.layer.open().
        docOptions.content ?= ''

        # When processing { content }, ResponseDoc needs a { target }
        # to create a matching element.
        docOptions.target = @expandTargets(@layers[0], docOptions.target || ':main')[0]

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
    if @hasPlans()
      up.fail("Could not match targets in old and new content (tried selectors %o)", @planTargets())
    else
      @failFromEmptyPlans()

  hasPlans: ->
    return @getPlans().length

  failFromEmptyPlans: ->
    if @layers.length
      up.fail('No target for change %o', @options)
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
