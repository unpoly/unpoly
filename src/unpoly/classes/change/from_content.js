const u = up.util

up.Change.FromContent = class FromContent extends up.Change {

  constructor(options) {
    super(options)

    // If we're rendering a fragment from a { url }, options.layer will already
    // be an array of up.Layer objects, set by up.Change.FromURL. It looks up the
    // layer eagerly because in case of { layer: 'origin' } (default for navigation)
    // the { origin } element may get removed while the request was in flight.
    // From that given array we need to remove layers that have been closed while
    // the request was in flight.
    //
    // If we're rendering a framgent from local content ({ document, fragment, content }),
    // options.layer will be a layer name like "current" and needs to be looked up.
    this.layers = u.filter(up.layer.getAll(this.options), this.isRenderableLayer)

    // Only extract options required for step building, since #execute() will be called with an
    // postflightOptions argument once the response is received and has provided refined
    // options.
    this.origin = this.options.origin
    this.preview = this.options.preview
    this.mode = this.options.mode

    // When we're swapping elements in origin's layer, we can be choose a fallback
    // replacement zone close to the origin instead of looking up a selector in the
    // entire layer (where it might match unrelated elements).
    if (this.origin) {
      this.originLayer = up.layer.get(this.origin)
    }
  }

  isRenderableLayer(layer) {
    return (layer === 'new') || layer.isOpen()
  }

  getPlans() {
    let plans = []

    if (this.options.fragment) {
      // ResponseDoc allows to pass innerHTML as { fragment }, but then it also
      // requires a { target }. We use a target that matches the parsed { fragment }.
      this.options.target ||= this.getResponseDoc().rootSelector()
    }

    // First seek { target } in all layers, then seek { fallback } in all layers.
    this.expandIntoPlans(plans, this.layers, this.options.target)
    this.expandIntoPlans(plans, this.layers, this.options.fallback)

    return plans
  }

  expandIntoPlans(plans, layers, targets) {
    for (let layer of layers) {
      // An abstract selector like :main may expand into multiple
      // concrete selectors, like ['main', '.content'].
      for (let target of this.expandTargets(targets, layer)) {
        // Any plans we add will inherit all properties from @options
        const props = { ...this.options, target, layer, defaultPlacement: this.defaultPlacement() }
        const change = layer === 'new' ? new up.Change.OpenLayer(props) : new up.Change.UpdateLayer(props)
        plans.push(change)
      }
    }
  }

  expandTargets(targets, layer) {
    return up.fragment.expandTargets(targets, { layer, mode: this.mode, origin: this.origin })
  }

  execute() {
    // Preloading from local content is a no-op.
    if (this.options.preload) {
      return Promise.resolve()
    }

    return this.seekPlan(this.executePlan.bind(this)) || this.cannotMatchPostflightTarget()
  }

  executePlan(matchedPlan) {
    let result = matchedPlan.execute(
      this.getResponseDoc(),
      this.onPlanApplicable.bind(this, matchedPlan)
    )

    result.options = this.options
    return result
  }

  onPlanApplicable(plan) {
    let primaryPlan = this.getPlans()[0]
    if (plan !== primaryPlan) {
      up.puts('up.render()', 'Could not match primary target "%s". Updating a fallback target "%s".', primaryPlan.target, plan.target)
    }
  }

  getResponseDoc() {
    if (this.preview) return

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
    if (this.defaultPlacement() === 'content') {
      // When processing { content }, ResponseDoc needs a { target }
      // to create a matching element.
      docOptions.target = this.firstExpandedTarget(docOptions.target)
    }

    return new up.ResponseDoc(docOptions)
  }

  defaultPlacement() {
    if (!this.options.document && !this.options.fragment) {
      return 'content'
    }
  }

  // When the user provided a { content } we need an actual CSS selector for
  // which up.ResponseDoc can create a matching element.
  firstExpandedTarget(target) {
    return this.expandTargets(target || ':main', this.layers[0])[0]
  }

  // Returns information about the change that is most likely before the request was dispatched.
  // This might change postflight if the response does not contain the desired target.
  getPreflightProps(opts = {}) {
    const getPlanProps = plan => plan.getPreflightProps()
    return this.seekPlan(getPlanProps) || opts.optional || this.cannotMatchPreflightTarget()
  }

  cannotMatchPreflightTarget() {
    this.cannotMatchTarget('Could not find target in current page')
  }

  cannotMatchPostflightTarget() {
    this.cannotMatchTarget('Could not find common target in current page and response')
  }

  cannotMatchTarget(reason) {
    let message

    if (this.getPlans().length) {
      const planTargets = u.uniq(u.map(this.getPlans(), 'target'))
      const humanizedLayerOption = up.layer.optionToString(this.options.layer)
      message =  [reason + " (tried selectors %o in %s)", planTargets, humanizedLayerOption]
    } else if (this.layers.length) {
      if (this.options.failPrefixForced) {
        message = 'No target selector given for failed responses (https://unpoly.com/failed-responses)'
      } else {
        message = 'No target selector given'
      }
    } else {
      // At this point this.layers is an empty array. This can be caused by:
      //
      // - A { layer } option pointing to a non-existing layer, e.g. { layer: 'parent' } when we're on the root layer.
      // - A detached { origin } option for which we cannot look up a layer.
      message = 'Could not find a layer to render in. You may have passed a non-existing layer reference, or a detached element.'
    }

    throw new up.CannotMatch(message)
  }

  seekPlan(fn) {
    for (let plan of this.getPlans()) {
      try {
        // A return statement stops iteration of a vanilla for loop,
        // but would not stop an u.each() or Array#forEach().
        return fn(plan)
      } catch (error) {
        // Re-throw any unexpected type of error
        if (!(error instanceof up.CannotMatch)) {
          throw error
        }
      }
    }
  }

  static {
    u.memoizeMethod(this.prototype, [
      'getPlans',
      'getResponseDoc',
      'getPreflightProps',
    ])
  }

}
