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
    @mode = @options.mode

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

      # First seek { target } in all layers, then seek { fallback } in all layers.
      @expandIntoPlans(@layers, @options.target)
      @expandIntoPlans(@layers, @options.fallback)

    return @plans

  expandIntoPlans: (layers, targets) ->
    for layer in layers
      # An abstract selector like :main may expand into multiple
      # concrete selectors, like ['main', '.content'].
      for target in @expandTargets(targets, layer)
        # Any plans we add will inherit all properties from @options
        props = u.merge(@options, { target, layer, placement: @defaultPlacement() })
        if layer == 'new'
          change = new up.Change.OpenLayer(props)
        else
          change = new up.Change.UpdateLayer(props)
        @plans.push(change)

  expandTargets: (targets, layer) ->
    return up.fragment.expandTargets(targets, { layer, @mode, @origin })

  execute: ->
    executePlan = (plan) => plan.execute(@getResponseDoc())
    return @seekPlan(executePlan) or @postflightTargetNotApplicable()

  getResponseDoc: ->
    unless @preview || @responseDoc
      docOptions = u.pick(@options, ['target', 'content', 'fragment', 'document', 'html'])
      up.migrate.handleResponseDocOptions?(docOptions)

      # If neither { document } nor { fragment } source is given, we assume { content }.
      if @defaultPlacement() == 'content'
        # When processing { content }, ResponseDoc needs a { target }
        # to create a matching element.
        docOptions.target = @firstExpandedTarget(docOptions.target)

      @responseDoc = new up.ResponseDoc(docOptions)

    return @responseDoc

  defaultPlacement: ->
    if !@options.document && !@options.fragment
      return 'content'

  # When the user provided a { content } we need an actual CSS selector for
  # which up.ResponseDoc can create a matching element.
  firstExpandedTarget: (target) ->
    return @expandTargets(target || ':main', @layers[0])[0]

  # Returns information about the change that is most likely before the request was dispatched.
  # This might change postflight if the response does not contain the desired target.
  preflightProps: (opts = {}) ->
    getPlanProps = (plan) -> plan.preflightProps()
    @seekPlan(getPlanProps) or opts.optional or @preflightTargetNotApplicable()

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

  seekPlan: (fn) ->
    for plan in @getPlans()
      try
        # A return statement stops iteration of a vanilla for loop,
        # but would not stop an u.each() or Array#forEach().
        return fn(plan)
      catch error
        # Re-throw any unexpected type of error
        up.error.notApplicable.is(error) or throw error
