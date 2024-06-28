const u = up.util

up.Change.FromContent = class FromContent extends up.Change {

  constructor(options) {
    super(options)

    // Only extract options required for step building, since #execute() will be called with an
    // postflightOptions argument once the response is received and has provided refined
    // options.
    this._origin = this.options.origin
    this._preview = this.options.preview

    // // When we're swapping elements in origin's layer, we can be choose a fallback
    // // replacement zone close to the origin instead of looking up a selector in the
    // // entire layer (where it might match unrelated elements).
    // if (this._origin) {
    //   this.originLayer = up.layer.get(this._origin)
    // }
  }

  _getPlans() {
    let plans = []

    this._lookupLayers()
    this._improveOptionsFromResponseDoc()

    // First seek { target } in all layers, then seek { fallback } in all layers.
    this._expandIntoPlans(plans, this._layers, this.options.target)
    this._expandIntoPlans(plans, this._layers, this.options.fallback)

    return plans
  }

  _isRenderableLayer(layer) {
    return (layer === 'new') || layer.isOpen()
  }

  _lookupLayers() {
    // (1) If we're rendering a fragment from a { url }, options.layer will already
    //     be an array of up.Layer objects, set by up.Change.FromURL. It looks up the
    //     layer eagerly because in case of { layer: 'origin' } (default for navigation)
    //     the { origin } element may get removed while the request was in flight.
    //     From that given array we need to remove layers that have been closed while
    //     the request was in flight.
    //
    // (2) If we're rendering a fragment from local content ({ document, fragment, content }),
    //     options.layer will be a layer name like "current" and needs to be looked up.
    //
    // (3) If we end up having no renderable layers, don't throw here.
    //     seekPlan() and its up.CannotMatch handling may not be active yet.
    this._layers = up.layer.getAll(this.options)
    this._layers = u.filter(this._layers, this._isRenderableLayer)
  }

  _expandIntoPlans(plans, layers, targets) {
    for (let layer of layers) {
      // An abstract selector like :main may expand into multiple
      // concrete selectors, like ['main', '.content'].
      for (let target of this._expandTargets(targets, layer)) {
        // Any plans we add will inherit all properties from @options
        const props = { ...this.options, target, layer, defaultPlacement: this._defaultPlacement() }
        const change = layer === 'new' ? new up.Change.OpenLayer(props) : new up.Change.UpdateLayer(props)
        plans.push(change)
      }
    }
  }

  _expandTargets(targets, layer) {
    return up.fragment.expandTargets(targets, { layer, mode: this.options.mode, origin: this._origin })
  }

  execute() {
    // Preloading from local content is a no-op.
    if (this.options.preload) {
      return Promise.resolve()
    }

    return this._seekPlan(this._executePlan.bind(this)) || this._cannotMatchPostflightTarget()
  }

  _executePlan(matchedPlan) {
    let result = matchedPlan.execute(
      this._getResponseDoc(),
      this._onPlanApplicable.bind(this, matchedPlan)
    )

    result.options = this.options

    return result
  }

  _isApplicablePlanError(error) {
    return !(error instanceof up.CannotMatch)
  }

  // Final preparations before elements are being changed.
  _onPlanApplicable(plan) {
    let primaryPlan = this._getPlans()[0]
    if (plan !== primaryPlan) {
      up.puts('up.render()', 'Could not match primary target "%s". Updating a fallback target "%s".', primaryPlan.target, plan.target)
    }

    let { assets } = this._getResponseDoc()
    if (assets) {
      up.script.assertAssetsOK(assets, plan.options)
    }

    // Used by up.RenderJob
    this.options.onRender?.()
  }

  _getResponseDoc() {
    if (this._preview) return

    const docOptions = u.pick(this.options, [
      'target',
      'content',
      'fragment',
      'document',
      'html',
      'cspNonces',
      'origin',
    ])
    up.migrate.handleResponseDocOptions?.(docOptions)

    // If neither { document } nor { fragment } source is given, we assume { content }.
    if (this._defaultPlacement() === 'content') {
      // When processing { content }, ResponseDoc needs a { target }
      // to create a matching element.
      docOptions.target = this._firstExpandedTarget(docOptions.target)
    }

    return new up.ResponseDoc(docOptions)
  }

  _improveOptionsFromResponseDoc() {
    if (this._preview) return

    let responseDoc = this._getResponseDoc()

    if (this.options.fragment) {
      // ResponseDoc allows to pass innerHTML as { fragment }, but then it also
      // requires a { target }. We use a target that matches the parsed { fragment }.
      this.options.target ||= responseDoc.rootSelector()
    }

    this.options.title = this.improveHistoryValue(this.options.title, responseDoc.title)
    this.options.metaTags = this.improveHistoryValue(this.options.metaTags, responseDoc.metaTags)
    this.options.lang = this.improveHistoryValue(this.options.lang, responseDoc.lang)
  }

  _defaultPlacement() {
    if (!this.options.document && !this.options.fragment) {
      return 'content'
    }
  }

  // When the user provided a { content } we need an actual CSS selector for
  // which up.ResponseDoc can create a matching element.
  _firstExpandedTarget(target) {
    // When the user passes a closed layer as { layer } option, we expand the target with the root
    // layer instead of having up.fragment.expandTargets() throw. In many cases we get the same result.
    let layer = this._layers[0] || up.layer.root
    return this._expandTargets(target || ':main', layer)[0]
  }

  // Returns information about the change that is most likely before the request was dispatched.
  // This might change postflight if the response does not contain the desired target.
  getPreflightProps(opts = {}) {
    const getPlanProps = plan => plan.getPreflightProps()
    return this._seekPlan(getPlanProps) || opts.optional || this._cannotMatchPreflightTarget()
  }

  _cannotMatchPreflightTarget() {
    this._cannotMatchTarget('Could not find target in current page')
  }

  _cannotMatchPostflightTarget() {
    this._cannotMatchTarget('Could not find common target in current page and response')
  }

  _cannotMatchTarget(reason) {
    if (this._getPlans().length) {
      const planTargets = u.uniq(u.map(this._getPlans(), 'target'))
      const humanizedLayerOption = up.layer.optionToString(this.options.layer)
      throw new up.CannotMatch([reason + " (tried selectors %o in %s)", planTargets, humanizedLayerOption])
    } else if (this._layers.length === 0) {
      this._cannotMatchLayer()
    } else if (this.options.failPrefixForced) {
      throw new up.CannotMatch('No target selector given for failed responses (https://unpoly.com/failed-responses)')
    } else {
      throw new up.CannotMatch('No target selector given')
    }
  }

  _cannotMatchLayer() {
    throw new up.CannotMatch('Could not find a layer to render in. You may have passed an unmatchable layer reference, or a detached element.')
  }

  _seekPlan(fn) {
    for (let plan of this._getPlans()) {
      try {
        // A return statement stops iteration of a vanilla for loop,
        // but would not stop an u.each() or Array#forEach().
        return fn(plan)
      } catch (error) {
        // Re-throw any unexpected type of error, but ignore up.CannotMatch to try the next plan.
        if (this._isApplicablePlanError(error)) {
          throw error
        }
      }
    }
  }

  static {
    u.memoizeMethod(this.prototype, {
      _getPlans: true,
      _getResponseDoc: true,
      getPreflightProps: true,
    })
  }

}
