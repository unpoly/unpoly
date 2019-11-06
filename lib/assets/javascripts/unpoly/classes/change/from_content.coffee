#= require ./change

u = up.util
e = up.element

class up.Change.FromContent extends up.Change

  constructor: (options) ->
    super(options)
    # Remember the layer that was current when the request was made, so changes
    # with `{ layer: 'new' }` will know what to stack on. The current layer might
    # change until the queued layer change is executed.
    #
    # The `{ currentLayer }` option might also be set from `new up.Change.FromURL()`
    # since the current layer might change between request and response.
    @options.currentLayer ?= up.layer.current
    @extractFlavorFromLayerOption()
    @setDefaultLayer()

  ensurePlansBuilt: ->
    @plans or @buildPlans()
    unless @plans.length
      @notApplicable(['No target for change %o', @options])

  extractFlavorFromLayerOption: ->
    if up.layer.isOverlayFlavor(@options.layer)
      @options.flavor = @options.layer

    # If user passes a { flavor } option without a { layer } option
    # we assume they want to open a new layer.
    if @options.flavor
      @options.layer = 'new'

  setDefaultLayer: ->
    if @options.layer
      return
    else if @options.origin
      # Links update their own layer by default.
      @options.layer = 'origin'
    else
      # If no origin is given, we assume the current layer.
      @options.layer = 'current'

  toTargetList: (target, props) ->
    list = u.wrapList(target)
    list = u.filter(list, u.isGiven)
    list = u.map list, (target) => @toTargetObj(target, props)
    return list

  toTargetObj: (target, props) ->
    base = u.merge(@options, props)

    if u.isFunction(target)
      target = target(base)
    else if u.isElementish(target)
      target = up.element.toSelector(target)

    if u.isString(target)
      target = { target }

    return u.merge(base, target)

  buildPlans: ->
    @plans = []

    @addPlansForTarget(@options.target)

    if @options.fallback != false
      @addPlansForTarget(@options.fallback)

      if @options.layer == 'new'
        @addPlansForTarget(up.layer.defaultTargets(@options.flavor))
      else
        for layer in up.layer.lookupAll(@options)
          @addPlansForTarget(layer.defaultTargets(), { layer })

  addPlansForTarget: (target, props) ->
    for targetObj in @toTargetList(target, props)
      # One target may expand to more than one plan if it has a { layer } option that
      # needs to try multiple layers, like { layer: 'closest' }.
      for layer in up.layer.lookupAll(targetObj)
        ChangeImplementation = if layer == 'new' then up.Change.OpenLayer else up.Change.UpdateLayer
        @plans.push(new ChangeImplementation(u.merge(targetObj, { layer })))

  firstDefaultTarget: ->
    if @options.layer == 'new'
      up.layer.defaultTargets(@options.flavor)[0]
    else
      up.layer.lookupOne(@options).defaultTargets()[0]

  execute: ->
    @buildResponseDoc()

    if @options.saveScroll
      up.viewport.saveScroll()

    shouldExtractTitle = not (@options.title is false || u.isString(@options.title))
    if shouldExtractTitle && (title = @options.responseDoc.title())
      @options.title = title

    return @seekPlan
      attempt: (plan) -> plan.execute()
      debug: true
      noneApplicable: => @postflightTargetNotApplicable()

  buildResponseDoc: ->
    docOptions = u.copy(@options)
    # ResponseDoc allows to pass innerHTML as { content }, but then it also
    # requires a { target }. If no { target } is given we use the first plan's target.
    if docOptions.content && !docOptions.target
      docOptions.target = @firstDefaultTarget()
    @options.responseDoc = new up.ResponseDoc(docOptions)

  preflightLayer: (opts) ->
    @seekPlan
      attempt: (plan) -> plan.preflightLayer()
      noneApplicable: => @preflightTargetNotApplicable(opts)

  preflightTarget: (opts) ->
    @seekPlan
      attempt: (plan) -> plan.preflightTarget()
      noneApplicable: => @preflightTargetNotApplicable(opts)

  preflightTargetNotApplicable: (opts = {}) ->
    if opts.optional
      return
    else if @plans.length
      up.fail("Could not find target in current page (tried selectors %o)", @planTargets())
    else
      up.fail('No target given for change')

  postflightTargetNotApplicable: ->
    if @options.inspectResponse
      toastOpts = { label: 'Open response', callback: @options.inspectResponse }

    if @plans.length
      up.fail(["Could not find matching targets in current page and server response (tried selectors %o)", @planTargets()], toastOpts)
    else
      up.fail('No target given for change', toastOpts)

  planTargets: ->
    return u.map(@plans, 'target')

  seekPlan: (opts) ->
    @ensurePlansBuilt()
    unprintedMessages = []

    console.error("Seeking plan in %o", @plans)

    for plan in @plans
      try
        return opts.attempt(plan)
      catch error
        if error.name == 'up.NotApplicable'
          message = error.message
          if opts.debug
            up.log.debug(message)
          else
            unprintedMessages.push(message)
        else
          # Re-throw any unexpected type of error
          throw error

    # If we're about to explode with a fatal error we print everything
    # we have tried so far, regardless of `opts.debug`.
    unprintedMessages.forEach(up.log.debug)

    return opts.noneApplicable?()
