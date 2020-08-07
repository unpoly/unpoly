#= require ./change

u = up.util
e = up.element

class up.Change.FromContent extends up.Change

  constructor: (options) ->
    console.log("FromContent ctor")
    # Only extract options required for step building, since #execute() will be called with an
    # postflightOptions argument once the response is received and has provided refined
    # options.
    super(options)
    up.layer.normalizeOptions(@options)
    @layers = up.layer.getAll(@options)

    if @options.fragment
      # ResponseDoc allows to pass innerHTML as { fragment }, but then it also
      # requires a { target }. We use a target that matches the parsed { fragment }.
      @options.target = @getResponseDoc().rootSelector()

  getPlans: ->
    unless @plans
      console.log("--- buildPlans")
      @plans = []

      # When we're swapping elements in origin's layer, we can be choose a fallback
      # replacement zone close to the origin instead of looking up a selector in the
      # entire layer (where it might match unrelated elements).
      if @options.origin
        @options.originLayer = up.layer.get(@options.origin)

      # (1) We seek @options.target in all matching layers
      @expandIntoPlans(@layers, @options.target)

      return if @options.fallback == false

      # (2) In case fallback is a selector or array of selectors, we seek the fallback
      # in all matching layers. If fallback is true or undefined, this won't add plans.
      @expandIntoPlans(@layers,  @options.fallback)

      # (3) We try to update the closest zone around the origin. If no origin is
      # given, this will update the layer's main selectors.
      @expandIntoPlans(@layers, ':closest-zone')

      # (4) In case nothing from the above matches, we close all layers and swap the
      # body. The assumption is that the server has returned an unexpected response like
      # an error message or a login screen (if a session expired) and we want to display
      # this rather than fail the update.
      @expandIntoPlans([up.layer.root], up.fragment.config.resetTargets, { peel: true })

    return @plans

  expandIntoPlans: (layers, target, variantProps) ->
    for layer in layers
      for target in u.wrapList(target)
        if u.isElementish(target)
          target = e.toSelector(target)
        else if u.isString(target)
          target = e.resolveSelector(target, @options.origin)

          console.log("### finalizing target %o, layer is %o, originLayer is %o, same is %o", target, layer, @options.originLayer, layer == @options.originLayer)

          # We cannot reason about zones when there is no known origin from which to climb up,
          # or when we are not updating origin's layer, or when we are opening a new layer.
          if layer != @options.originLayer
            target = target.replace(/\:(closest-)?zone\b/, ':main')

          console.log("#### target after replace is %o", target)
        else
          # @buildPlans() might call us with { target: false } or { target: nil }
          # In that case we don't add a plan.
          continue

        # Any plans we add will inherit all properties from @options
        props = u.merge(@options, { target, layer }, variantProps)

        if layer == 'new'
          change = new up.Change.OpenLayer(props)
          @plans.push(change)
        else
          change = new up.Change.UpdateLayer(props)
          @plans.push(change)

  #        # Only for existing overlays we open will also attempt to place a new element as the
  #        # new first child of the layer's root element. This mirrors the behavior that we get when
  #        # opening a layer: The new element does not need to match anything in the current document.
  #        if props.resetOverlay && props.layer.isOverlay?()
  #          change = new up.Change.UpdateLayer(u.merge(props, placement: 'root'))
  #          @plans.push(change)

#  defaultTargets: (layer) ->
#    if layer == 'new'
#      return up.layer.defaultTargets(@options.mode)
#    else
#      return layer.defaultTargets()
#
#  firstDefaultTarget: ->
#    if firstLayer = @layers[0]
#      @defaultTargets(firstLayer)[0]

  execute: (postflightOptions = {}) ->
    # In up.Change.FromURL we already set an X-Up-Title header as options.title.
    # Now that we process an HTML document

    console.log("--- execute: responseDoc is %o, postflightOptions is %o", @responseDoc, u.copy(postflightOptions))

    u.assign(@options, postflightOptions)
    postflightOptions.responseDoc = @getResponseDoc()
    postflightOptions.title = @improveHistoryValue(@options.title, @getResponseDoc().getTitle())

    console.log('--- execute: build responseDoc')

#    # If no document source is given, we assume the user wants to render empty inner content.
#    # This enables `up.layer.open()` (with no args) to open an empty overlay.
#    if !@options.document && !@options.fragment && !@options.content
#      @options.content = ''

    # The saveScroll option will never be updated in updatedOptions.
    if @options.saveScroll
      up.viewport.saveScroll()

    return @seekPlan
      attempt: (plan) => plan.execute(postflightOptions)
      noneApplicable: => @postflightTargetNotApplicable()

  getResponseDoc: ->
    unless @responseDoc
      docOptions = u.pick(@options, ['target', 'content', 'fragment', 'document', 'html'])
      up.legacy.fixKey(docOptions, 'html', 'document')

      # If neither doc source is given, we assume content: ''
      if !@options.document && !@options.fragment
        docOptions.target ||= @getPlans()[0].bestPreflightSelector()

      console.log("--- buildResponseDoc from opts %o", u.copy(docOptions))

      @responseDoc = new up.ResponseDoc(docOptions)
      console.log("--- responseDoc root is %o", @responseDoc.root)

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
      up.fail(["Could not find matching targets in current page and server response (tried selectors %o)", @planTargets()], toastOpts)
    else
      @failFromEmptyPlans(toastOpts)

  hasPlans: ->
    return @getPlans().length

  failFromEmptyPlans: (toastOpts) ->
    if @layers.length
      up.fail(['No target for change %o', @options], toastOpts)
    else
      # This can happen e.g. if the user tries to replace { layer: 'parent' },
      # but there is no parent layer.
      up.fail(["Layer %o does not exist", @options.layer], toastOpts)

  planTargets: ->
    return u.uniq(u.map(@getPlans(), 'target'))

  seekPlan: (opts) ->
#    unprintedMessages = []

    for plan in @getPlans()
      opts.before?(plan)
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
