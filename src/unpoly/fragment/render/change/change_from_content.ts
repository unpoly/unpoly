import * as u from '../../../util.js'
import { CannotMatch } from '../../../error.js'
import { expandTargets, mutate } from '../../../fragment.js'
import { refineOption } from '../../../history.js'
import { layerStack, optionToString, type Layer } from '../../../layer.js'
import { printToStandard } from '../../../log.js'
import { assertAssetsOK } from '../../../script.js'
import type * as t from '../../types.js'
import { Change } from './change.js'
import { OpenLayerPlan } from './open_layer.js'
import { UpdateLayerPlan } from './update_layer.js'
import { type RenderResult } from '../render_result.js'
import { ResponseDoc } from '../response_doc.js'

// A way to render: updating a target in an existing layer, or opening a new overlay.
type LayerPlan = OpenLayerPlan | UpdateLayerPlan

// Renders content that is already known (a string, an element or a response text). Also computes
// the preflight props for ChangeFromURL, before the request is sent.
export class ChangeFromContent extends Change {
  declare _origin?: Element
  declare _preflight?: boolean
  declare _layers: (Layer | 'new')[]
  declare _planApplied: boolean

  constructor(options: t.RenderOptions) {
    super(options)

    // Only extract options required for step building, since #execute() will be called with an
    // postflightOptions argument once the response is received and has provided refined
    // options.
    this._origin = options.origin
    this._preflight = options.preflight
    this._layers = layerStack.getAll(options)
  }

  _getPlans(): LayerPlan[] {
    let plans: LayerPlan[] = []

    this._filterLayers()
    this._improveOptionsFromResponseDoc()

    // First seek { target } in all layers, then seek { fallback } in all layers.
    this._expandIntoPlans(plans, this._layers, this.options.target)
    this._expandIntoPlans(plans, this._layers, this.options.fallback)

    return plans
  }

  _isRenderableLayer(layer: Layer | 'new'): boolean {
    return (layer === 'new') || layer.isAlive()
  }

  _filterLayers(): void {
    this._layers = u.filterList(this._layers, this._isRenderableLayer)
  }

  _expandIntoPlans(plans: LayerPlan[], layers: (Layer | 'new')[], targets: t.RenderTarget | boolean | undefined): void {
    for (let layer of layers) {
      // An abstract selector like :main may expand into multiple
      // concrete selectors, like ['main', '.content'].
      for (let target of this._expandTargets(targets, layer)) {
        // Any plans we add will inherit all properties from @options
        const props = { ...this.options, target, layer, defaultPlacement: this._defaultPlacement() }
        // TypeScript doesn't narrow props.layer through the layer variable.
        const change = layer === 'new' ? new OpenLayerPlan(props) : new UpdateLayerPlan(props as t.ResolvedRenderOptions)
        plans.push(change)
      }
    }
  }

  _expandTargets(targets: t.RenderTarget | boolean | undefined, layer: Layer | 'new'): string[] {
    return expandTargets(targets, { layer, mode: this.options.mode, origin: this._origin })
  }

  // Returns an up.RenderResult, or a promise when preloading local content.
  // Kept `any`: RenderJob returns this as a RenderResult, which also hides that ChangeFromURL
  // resolves with an up.Request when preloading.
  execute(): any {
    // Preloading from local content is a no-op.
    if (this.options.preload) {
      // TODO: This is not an async method? So just return undefined?
      return Promise.resolve()
    }

    return this._seekPlan(this._executePlan.bind(this)) || this._cannotMatchPostflightTarget()
  }

  _executePlan(matchedPlan: LayerPlan): RenderResult {
    // Group compilation and emission of up:fragment:inserted into a mutation block.
    // This allows up.SelectorTracker to only sync once after the mutation, and
    // ignore any events in between.
    return mutate(() =>
      matchedPlan.execute(
        // We only execute plans outside of preflight, where there is a response doc.
        this._getResponseDoc()!,
        this._onPlanApplicable.bind(this, matchedPlan)
      )
    )
  }

  _isApplicablePlanError(error: any): boolean {
    // (1) Only an up.CannotMatch means "this plan doesn't fit, try the next one".
    // (2) Once a plan has started to change the page, we cannot try another plan on top of it.
    return !(error instanceof CannotMatch) || this._planApplied
  }

  // Final preparations before elements are being changed.
  _onPlanApplicable(plan: LayerPlan): void {
    let primaryPlan = this._getPlans()[0]
    if (plan !== primaryPlan) {
      printToStandard('up.render()', 'Could not match primary target "%s". Updating a fallback target "%s".', primaryPlan.target, plan.target)
    }

    // Plans only become applicable when executed, which is never in preflight.
    let { assets } = this._getResponseDoc()!
    if (assets) {
      assertAssetsOK(assets, plan.options)
    }

    // Used by up.RenderJob.
    // Pass the props of the plan we are rendering. this.getPreflightProps() would use the first
    // plan that matches the current page, which may not be in the response when we render a fallback.
    // RenderJob always sets { handleAbort }.
    this.options.handleAbort!(plan.getPreflightProps())

    // From here on the plan changes the page.
    this._planApplied = true
  }

  _getResponseDoc(): ResponseDoc | undefined {
    if (this._preflight) return

    const docOptions = u.pick(this.options, [
      'target',
      'content',
      'fragment',
      'document',
      'html',
      'cspInfo',
      'origin',
      'data',
    ])
    up.migrate.handleResponseDocOptions?.(docOptions)

    // If neither { document } nor { fragment } source is given, we assume { content }.
    if (this._defaultPlacement() === 'content') {
      // When processing { content }, ResponseDoc needs a { target }
      // to create a matching element.
      docOptions.target = this._firstExpandedTarget(docOptions.target)
    }

    // With content, { target } is a selector string by now (see above).
    return new ResponseDoc(docOptions as t.ResponseDocOptions)
  }

  _improveOptionsFromResponseDoc(): void {
    if (this._preflight) return

    // Outside of preflight there is a response doc.
    let responseDoc = this._getResponseDoc()!

    if (this.options.fragment) {
      // ResponseDoc allows to pass innerHTML as { fragment }, but then it also
      // requires a { target }. We use a target that matches the parsed { fragment }.
      this.options.target ||= responseDoc.rootSelector()
    }

    this.options.title = refineOption(this.options.title, responseDoc.title)
    this.options.metaTags = refineOption(this.options.metaTags, responseDoc.metaTags)
    this.options.lang = refineOption(this.options.lang, responseDoc.lang)
  }

  _defaultPlacement(): string | undefined {
    if (!this.options.document && !this.options.fragment) {
      return 'content'
    }
  }

  // When the user provided a { content } we need an actual CSS selector for
  // which up.ResponseDoc can create a matching element.
  _firstExpandedTarget(target: t.RenderTarget | undefined): string {
    // When the user passes a closed layer as { layer } option, we expand the target with the root
    // layer instead of having up.fragment.expandTargets() throw. In many cases we get the same result.
    let layer = this._layers[0] || layerStack.root
    return this._expandTargets(target || ':main', layer)[0]
  }

  // Returns information about the change that is most likely before the request was dispatched.
  // This might change postflight if the response does not contain the desired target.
  // With { optional: true }, returns an empty object instead of throwing when no target matches.
  getPreflightProps(opts?: { optional?: false }): t.PreflightProps
  getPreflightProps(opts?: { optional?: boolean }): Partial<t.PreflightProps>
  getPreflightProps(opts: { optional?: boolean } = {}): Partial<t.PreflightProps> {
    const getPlanProps = (plan: LayerPlan): t.PreflightProps => plan.getPreflightProps()
    return this._seekPlan(getPlanProps) || (opts.optional ? {} : this._cannotMatchPreflightTarget())
  }

  _cannotMatchPreflightTarget(): never {
    this._cannotMatchTarget('Could not find target in current page')
  }

  _cannotMatchPostflightTarget(): never {
    this._cannotMatchTarget('Could not find common target in current page and response')
  }

  _cannotMatchTarget(reason: string): never {
    if (this._getPlans().length) {
      const planTargets = u.uniq(u.map(this._getPlans(), 'target'))
      // normalizeLayerOptions() always sets a { layer }.
      const humanizedLayerOption = optionToString(this.options.layer!)
      throw new CannotMatch([reason + " (tried selectors %o in %s)", planTargets, humanizedLayerOption])
    } else if (this._layers.length === 0) {
      this._cannotMatchLayer()
    } else if (this.options.didForceFailOptions) {
      throw new CannotMatch('No target selector given for error responses (https://unpoly.com/learn/error-responses)')
    } else {
      throw new CannotMatch('No target selector given')
    }
  }

  _cannotMatchLayer(): never {
    throw new CannotMatch('Could not find a layer to render in. You may have passed an unmatchable layer reference, or a detached element.')
  }

  _seekPlan<T>(fn: (plan: LayerPlan) => T): T | undefined {
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
