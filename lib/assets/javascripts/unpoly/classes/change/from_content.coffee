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
    @layerScanners = @options.layerScanners || new Map()
    @origin = @options.origin
    @preview = @options.preview

    # When we're swapping elements in origin's layer, we can be choose a fallback
    # replacement zone close to the origin instead of looking up a selector in the
    # entire layer (where it might match unrelated elements).
    if @origin
      @originLayer = up.layer.get(@origin)

  getPlans: ->
    unless @plans
      if @options.fragment
        # ResponseDoc allows to pass innerHTML as { fragment }, but then it also
        # requires a { target }. We use a target that matches the parsed { fragment }.
        @options.target = @getResponseDoc().rootSelector()

      @plans = []

      # (1) We seek @options.target in all matching layers
      @expandIntoPlans(@layers, @options.target)

      if @options.fallback != false
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
      layerScanner = @getLayerScanner(layer)

      for target in u.wrapList(target)
        if u.isElementish(target)
          target = up.fragment.toTarget(target)
        else if u.isString(target)
          target = layerScanner.fixSelector(target)
        else
          # @buildPlans() might call us with { target: false } or { target: nil }
          # In that case we don't add a plan.
          continue

        # Any plans we add will inherit all properties from @options
        props = u.merge(@options, { target, layer, layerScanner }, variantProps)

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

  getLayerScanner: (layer) ->
    unless scanner = @layerScanners.get(layer)
      scanner = new up.LayerScanner({ layer, @origin, @originLayer })
      @layerScanners.set(layer, scanner)

    return scanner

#  defaultTargets: (layer) ->
#    if layer == 'new'
#      return up.layer.defaultTargets(@options.mode)
#    else
#      return layer.defaultTargets()
#
#  firstDefaultTarget: ->
#    if firstLayer = @layers[0]
#      @defaultTargets(firstLayer)[0]

  execute: ->
    # In up.Change.FromURL we already set an X-Up-Title header as options.title.
    # Now that we process an HTML document
    @options.title = @improveHistoryValue(@options.title, @getResponseDoc().getTitle())

    if @options.saveScroll
      up.viewport.saveScroll()

    return @seekPlan
      attempt: (plan) => plan.execute(@getResponseDoc())
      noneApplicable: => @postflightTargetNotApplicable()

  getResponseDoc: ->
    unless @preview || @responseDoc
      docOptions = u.pick(@options, ['target', 'content', 'fragment', 'document', 'html'])
      up.legacy.fixKey(docOptions, 'html', 'document')

      # If neither doc source is given, we assume content: ''.
      # In this case we also need a target, which unless given we derive
      # from the first plan.
      if !@options.document && !@options.fragment
        docOptions.content ?= ''
        docOptions.target ?= @getPlans()[0]?.bestPreflightSelector()
        #debugger
        #console.log("Got { content }, auto-target is %o", docOptions.target)

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
