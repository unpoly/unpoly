import * as u from '../../../util.js'
import { CannotMatch } from '../../../error.js'
import { expandTargets, mutate } from '../../../fragment.js'
import { refineOption } from '../../../history.js'
import { layerStack, optionToString, type Layer } from '../../../layer.js'
import { printToStandard } from '../../../log.js'
import { assertAssetsOK } from '../../../script.js'
import type * as t from '../../types.js'
import { type LayerPlan } from './layer_plan.js'
import { OpenLayerPlan } from './open_layer_plan.js'
import { UpdateLayerPlan } from './update_layer_plan.js'
import { type RenderResult } from '../render_result.js'
import { ResponseDoc } from '../response_doc.js'

// Renders content that is already known (a string, an element or a response text), with
// renderFromContent(). Also computes the preflight props for ChangeFromURL, before the request
// is sent, with preflightPropsFromContent().

function getPlans(options: t.RenderOptions, layers: (Layer | 'new')[]): LayerPlan[] {
  let plans: LayerPlan[] = []

  // First seek { target } in all layers, then seek { fallback } in all layers.
  expandIntoPlans(plans, layers, options.target, options)
  expandIntoPlans(plans, layers, options.fallback, options)

  return plans
}

function isRenderableLayer(layer: Layer | 'new'): boolean {
  return (layer === 'new') || layer.isAlive()
}

function filterLayers(layers: (Layer | 'new')[]): (Layer | 'new')[] {
  return u.filterList(layers, isRenderableLayer)
}

function expandIntoPlans(plans: LayerPlan[], layers: (Layer | 'new')[], targets: t.RenderTarget | boolean | undefined, options: t.RenderOptions): void {
  for (let layer of layers) {
    // An abstract selector like :main may expand into multiple
    // concrete selectors, like ['main', '.content'].
    for (let target of expandTargetsInLayer(targets, layer, options)) {
      // Any plans we add will inherit all properties from @options
      const props = { ...options, target, layer, defaultPlacement: defaultPlacement(options) }
      // TypeScript doesn't narrow props.layer through the layer variable.
      const change = layer === 'new' ? new OpenLayerPlan(props) : new UpdateLayerPlan(props as t.ResolvedRenderOptions)
      plans.push(change)
    }
  }
}

function expandTargetsInLayer(targets: t.RenderTarget | boolean | undefined, layer: Layer | 'new', options: t.RenderOptions): string[] {
  return expandTargets(targets, { layer, mode: options.mode, origin: options.origin })
}

// Returns an up.RenderResult, or a promise when preloading local content.
// Kept `any`: RenderJob returns this as a RenderResult, which also hides that ChangeFromURL
// resolves with an up.Request when preloading.
export function renderFromContent(options: t.RenderOptions): any {
  // Preloading from local content is a no-op.
  if (options.preload) {
    // TODO: This is not an async method? So just return undefined?
    return Promise.resolve()
  }

  let layers = filterLayers(layerStack.getAll(options))
  let responseDoc = getResponseDoc(options, layers)
  // This changes the options that the plans copy below.
  improveOptionsFromResponseDoc(options, responseDoc)
  let plans = getPlans(options, layers)

  // Set by the onApplicable callback below, once a plan starts to change the page.
  let planApplied = false

  let executePlan = (matchedPlan: LayerPlan): RenderResult => {
    // Group compilation and emission of up:fragment:inserted into a mutation block.
    // This allows up.SelectorTracker to only sync once after the mutation, and
    // ignore any events in between.
    return mutate(() =>
      matchedPlan.execute(responseDoc, () => {
        onPlanApplicable(matchedPlan, plans[0], responseDoc, options)
        // From here on the plan changes the page.
        planApplied = true
      })
    )
  }

  return seekPlan(plans, executePlan, () => planApplied)
    || cannotMatchTarget('Could not find common target in current page and response', plans, layers, options)
}

function isApplicablePlanError(error: any, planApplied: boolean): boolean {
  // (1) Only an up.CannotMatch means "this plan doesn't fit, try the next one".
  // (2) Once a plan has started to change the page, we cannot try another plan on top of it.
  return !(error instanceof CannotMatch) || planApplied
}

// Final preparations before elements are being changed.
function onPlanApplicable(plan: LayerPlan, primaryPlan: LayerPlan, responseDoc: ResponseDoc, options: t.RenderOptions): void {
  if (plan !== primaryPlan) {
    printToStandard('up.render()', 'Could not match primary target "%s". Updating a fallback target "%s".', primaryPlan.target, plan.target)
  }

  let { assets } = responseDoc
  if (assets) {
    assertAssetsOK(assets, plan.options)
  }

  // Used by up.RenderJob.
  // Pass the props of the plan we are rendering. preflightPropsFromContent() would use the first
  // plan that matches the current page, which may not be in the response when we render a fallback.
  // RenderJob always sets { handleAbort }.
  options.handleAbort!(plan.getPreflightProps())
}

// Preflight runs before there is a response, so only renderFromContent() calls this.
function getResponseDoc(options: t.RenderOptions, layers: (Layer | 'new')[]): ResponseDoc {
  const docOptions = u.pick(options, [
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
  if (defaultPlacement(options) === 'content') {
    // When processing { content }, ResponseDoc needs a { target }
    // to create a matching element.
    docOptions.target = firstExpandedTarget(docOptions.target, layers, options)
  }

  // With content, { target } is a selector string by now (see above).
  return new ResponseDoc(docOptions as t.ResponseDocOptions)
}

function improveOptionsFromResponseDoc(options: t.RenderOptions, responseDoc: ResponseDoc): void {
  if (options.fragment) {
    // ResponseDoc allows to pass innerHTML as { fragment }, but then it also
    // requires a { target }. We use a target that matches the parsed { fragment }.
    options.target ||= responseDoc.rootSelector()
  }

  options.title = refineOption(options.title, responseDoc.title)
  options.metaTags = refineOption(options.metaTags, responseDoc.metaTags)
  options.lang = refineOption(options.lang, responseDoc.lang)
}

function defaultPlacement(options: t.RenderOptions): string | undefined {
  if (!options.document && !options.fragment) {
    return 'content'
  }
}

// When the user provided a { content } we need an actual CSS selector for
// which up.ResponseDoc can create a matching element.
function firstExpandedTarget(target: t.RenderTarget | undefined, layers: (Layer | 'new')[], options: t.RenderOptions): string {
  // When the user passes a closed layer as { layer } option, we expand the target with the root
  // layer instead of having up.fragment.expandTargets() throw. In many cases we get the same result.
  let layer = layers[0] || layerStack.root
  return expandTargetsInLayer(target || ':main', layer, options)[0]
}

// Returns information about the change that is most likely before the request was dispatched.
// This might change postflight if the response does not contain the desired target.
// With { optional: true }, returns an empty object instead of throwing when no target matches.
export function preflightPropsFromContent(options: t.RenderOptions, opts?: { optional?: false }): t.PreflightProps
export function preflightPropsFromContent(options: t.RenderOptions, opts?: { optional?: boolean }): Partial<t.PreflightProps>
export function preflightPropsFromContent(options: t.RenderOptions, opts: { optional?: boolean } = {}): Partial<t.PreflightProps> {
  // Don't change the caller's options: the layer lookup normalizes them in place.
  options = { ...options }

  let layers = filterLayers(layerStack.getAll(options))
  let plans = getPlans(options, layers)
  const getPlanProps = (plan: LayerPlan) => plan.getPreflightProps()
  return seekPlan(plans, getPlanProps) || (opts.optional ? {} : cannotMatchTarget('Could not find target in current page', plans, layers, options))
}

function cannotMatchTarget(reason: string, plans: LayerPlan[], layers: (Layer | 'new')[], options: t.RenderOptions): never {
  if (plans.length) {
    const planTargets = u.uniq(u.map(plans, 'target'))
    // normalizeLayerOptions() always sets a { layer }.
    const humanizedLayerOption = optionToString(options.layer!)
    throw new CannotMatch([reason + " (tried selectors %o in %s)", planTargets, humanizedLayerOption])
  } else if (layers.length === 0) {
    cannotMatchLayer()
  } else if (options.didForceFailOptions) {
    throw new CannotMatch('No target selector given for error responses (https://unpoly.com/learn/error-responses)')
  } else {
    throw new CannotMatch('No target selector given')
  }
}

function cannotMatchLayer(): never {
  throw new CannotMatch('Could not find a layer to render in. You may have passed an unmatchable layer reference, or a detached element.')
}

// Without an isPlanApplied() function no plan ever changes the page, as in preflight, which only
// asks the plans for their props.
function seekPlan<T>(plans: LayerPlan[], fn: (plan: LayerPlan) => T, isPlanApplied?: () => boolean): T | undefined {
  for (let plan of plans) {
    try {
      // A return statement stops iteration of a vanilla for loop,
      // but would not stop an u.each() or Array#forEach().
      return fn(plan)
    } catch (error) {
      // Re-throw any unexpected type of error, but ignore up.CannotMatch to try the next plan.
      if (isApplicablePlanError(error, !!isPlanApplied?.())) {
        throw error
      }
    }
  }
}
