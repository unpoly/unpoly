#= require ./change

u = up.util
e = up.element

class up.Change.FromContent extends up.Change

  ensurePlansBuilt: ->
    @plans or @buildPlans()
    unless @plans.length
      @notApplicable(['No target for change %o', @options])

  toTargetObjList: (target, props) ->
    list = u.wrapList(target)
    list = u.compact(list)
    list = u.map list, (target) => @toTargetObj(target, props)
    return list

  toTargetObj: (target, props) =>
    base = u.merge(@options, props)

    if u.isElementish(target)
      target = { target: e.toSelector(target) }
    else if u.isString(target)
      target = { target }

    return u.merge(base, target)

  buildPlans: ->
    @plans = []
    @addPlansForTarget(@options.target)
    if @options.fallback != false
      @addPlansForTarget(@options.fallback)
      @addPlansForTarget(@defaultTargetObjs())

  addPlansForTarget: (target, props) ->
    for targetObj in @toTargetObjList(target, props)
      # One target may expand to more than one plan if it has a { layer } option that
      # needs to try multiple layers, like { layer: 'closest' }.
      for layer in up.layer.list(targetObj)
        ChangeClass = if layer == 'new' then up.Change.OpenLayer else up.Change.UpdateLayer
        @plans.push(new ChangeClass(u.merge(targetObj, { layer })))

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
      debug: true
      noneApplicable: => @postflightTargetNotApplicable()

  buildResponseDoc: ->
    docOptions = u.copy(@options)
    # ResponseDoc allows to pass innerHTML as { content }, but then it also
    # requires a { target }. If no { target } is given we use the first plan's target.
    if docOptions.content && !docOptions.target
      docOptions.target = @firstDefaultTarget()
    @options.responseDoc = new up.ResponseDoc(docOptions)

  # Returns the layer that is likely to change.
  # This might change postflight if the response does not contain
  # the desired target.
  preflightLayer: (opts) ->
    @seekPlan
      attempt: (plan) -> plan.preflightLayer()
      noneApplicable: => @preflightTargetNotApplicable(opts)

  # Returns the target selector that is likely to change.
  # This might change postflight if the response does not contain
  # the desired target.
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
      toastOpts = { action: { label: 'Open response', callback: @options.inspectResponse } }

    if @plans.length
      up.fail(["Could not find matching targets in current page and server response (tried selectors %o)", @planTargets()], toastOpts)
    else
      up.fail('No target given for change', toastOpts)

  planTargets: ->
    return u.map(@plans, 'target')

  seekPlan: (opts) ->
    @ensurePlansBuilt()
    unprintedMessages = []

    for plan in @plans
      try
        return opts.attempt(plan)
      catch error
        if up.error.notApplicable.is(error)
          message = error.message
          if opts.debug
            up.puts(message)
          else
            unprintedMessages.push(message)
        else
          # Re-throw any unexpected type of error
          throw error

    # If we're about to explode with a fatal error we print everything
    # we have tried so far, regardless of `opts.debug`.
    unprintedMessages.forEach(up.puts)

    return opts.noneApplicable?()
