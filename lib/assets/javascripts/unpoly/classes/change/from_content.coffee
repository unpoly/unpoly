#= require ./change

u = up.util
e = up.element

class up.Change.FromContent extends up.Change

  constructor: (options) ->
    up.layer.normalizeOptions(options)
    super(options)

  ensurePlansBuilt: ->
    @plans or @buildPlans()
    unless @plans.length
      @notApplicable(['No target for change %o', @options])

  toTargetObjList: (targetOrTargets, props) ->
    list = u.wrapList(targetOrTargets)
    list = u.compact(list)
    list = u.map list, (target) => @toTargetObj(target, props)
    return list

  toTargetObj: (target, props) =>
    base = u.merge(@options, props)

    if u.isElementish(target)
      target = { target: e.toSelector(target) }
    else if u.isString(target)
      target = { target: e.resolveSelector(target, base.origin) }

    return u.merge(base, target)

  buildPlans: ->
    @plans = []
    @addPlansForTarget(@options.target)
    if @options.fallback != false
      @addPlansForTarget(@options.fallback, isFallback: true)
      @addPlansForTarget(@defaultTargetObjs(), isFallback: true)

  addPlansForTarget: (targetOrTargets, props = {}) ->
    for targetObj in @toTargetObjList(targetOrTargets, props)
      # One target may expand to more than one plan if it has a { layer } option that
      # needs to try multiple layers, like { layer: 'closest' }.
      for layer in up.layer.list(targetObj)
        changeProps = u.merge(targetObj, { layer })
        @addPlan(layer, changeProps)
        # Only for existing overlays we open will also attempt to place a new element as the
        # new first child of the layer's root element. This mirrors the behavior that we get when
        # opening a layer: The new element does not need to match anything in the current document.
        if props.isFallback && layer.isOverlay?()
          @addPlan(layer, u.merge(changeProps, placement: 'root'))

  addPlan: (layer, props) ->
    ChangeClass = if layer == 'new' then up.Change.OpenLayer else up.Change.UpdateLayer
    change = new ChangeClass(props)
    @plans.push(change)

  defaultTargetObjs: ->
    if @options.layer == 'new'
      return @toTargetObjList(up.layer.defaultTargets(@options.mode))
    else
      return u.flatMap up.layer.list(@options), (layer) =>
        return @toTargetObjList(layer.defaultTargets(), { layer })

  firstDefaultTarget: ->
    @defaultTargetObjs()[0]?.target

  execute: ->
    @buildResponseDoc()

    if @options.saveScroll
      up.viewport.saveScroll()

    # In up.Change.FromURL we already set an X-Up-Title header as options.title.
    # Now that we process an HTML document
    shouldExtractTitle = not (@options.title is false || u.isString(@options.title))
    if shouldExtractTitle && (title = @options.responseDoc.title())
      @options.title = title

    return @seekPlan
      attempt: (plan) -> plan.execute()
      noneApplicable: => @postflightTargetNotApplicable()

  buildResponseDoc: ->
    docOptions = u.copy(@options)
    # ResponseDoc allows to pass innerHTML as { content }, but then it also
    # requires a { target }. If no { target } is given we use the first plan's target.
    if !docOptions.html && !docOptions.target
      docOptions.target = @firstDefaultTarget()
    @options.responseDoc = new up.ResponseDoc(docOptions)

  # Returns information about the change that is most likely before the request was dispatched.
  # This might change postflight if the response does not contain the desired target.
  requestAttributes: (opts = {}) ->
    @seekPlan
      attempt: (plan) -> plan.requestAttributes()
      noneApplicable: =>
        opts.optional or @preflightTargetNotApplicable(opts)

  preflightTargetNotApplicable: ->
    if @plans.length
      up.fail("Could not find target in current page (tried selectors %o)", @planTargets())
    else
      up.fail('No target given for change')

  postflightTargetNotApplicable: ->
    if @options.inspectResponse
      toastOpts = { action: { label: 'Open response', callback: @options.inspectResponse } }

    if @plans.length
      up.fail(["Could not find matching targets in current page and server response (tried selectors %o)", @planTargets()], toastOpts)
    else
      up.fail('No target given for change', toastOpts)

  planTargets: ->
    return u.uniq(u.map(@plans, 'target'))

  seekPlan: (opts) ->
    @ensurePlansBuilt()
    unprintedMessages = []

    for plan in @plans
      try
        return opts.attempt(plan)
      catch error
        if up.error.notApplicable.is(error)
          unprintedMessages.push(error.message)
        else
          # Re-throw any unexpected type of error
          throw error

    # If we're about to explode with a fatal error we print everything that we tried.
    unprintedMessages.forEach (message) -> up.puts('up.change()', message)

    return opts.noneApplicable?()
