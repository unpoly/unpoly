import * as u from '../../util.js'
import { CannotMatch } from '../../error.js'
import { expandTargets, mutate } from '../../fragment.js'
import { refineOption } from '../../history.js'
import { layerStack, optionToString, type Layer } from '../../layer.js'
import { printToStandard } from '../../log.js'
import { assertAssetsOK } from '../../script.js'
import type * as t from '../types.js'
import { type LayerPlan } from './layer_plan.js'
import { OpenLayerPlan } from './open_layer_plan.js'
import { UpdateLayerPlan } from './update_layer_plan.js'
import { ResponseDoc } from './response_doc.js'

// Renders content that is already known (a string, an element or a response text), with
// renderFromContent(). Also computes the preflight props for renderFromURL(), before the request
// is sent, with preflightPropsFromContent().

// Returns an up.RenderResult, or a promise when preloading local content.
// Kept `any`: RenderJob returns this as a RenderResult, which also hides that renderFromURL()
// resolves with an up.Request when preloading.
export function renderFromContent(options: t.RenderOptions): any {
  // Preloading from local content is a no-op.
  if (options.preload) {
    // TODO: This is not an async method? So just return undefined?
    return Promise.resolve()
  }

  let layers = getLayers(options)
  let responseDoc = getResponseDoc(options, layers)
  // This changes the options that the plans copy below.
  improveOptionsFromResponseDoc(options, responseDoc)
  let plans = getPlans(options, layers)

  // A plan that throws up.CannotMatch in match() is not applicable, and we try the next plan.
  let plan = seekPlan(plans, (plan) => { plan.match(responseDoc); return plan })
    || cannotMatchTarget('Could not find common target in current page and response', plans, layers, options)

  // Group compilation and emission of up:fragment:inserted into a mutation block.
  // This allows up.SelectorTracker to only sync once after the mutation, and
  // ignore any events in between.
  return mutate(() => {
    onPlanApplicable(plan, plans[0], responseDoc, options)
    // Once a plan has started to change the page, we cannot try another plan on top of it.
    // Hence any error from here on propagates, including an up.CannotMatch.
    return plan.render(responseDoc)
  })
}

// Returns information about the change that is most likely before the request was dispatched.
// This might change postflight if the response does not contain the desired target.
// With { optional: true }, returns an empty object instead of throwing when no target matches.
export function preflightPropsFromContent(options: t.RenderOptions, opts?: { optional?: false }): t.PreflightProps
export function preflightPropsFromContent(options: t.RenderOptions, opts?: { optional?: boolean }): Partial<t.PreflightProps>
export function preflightPropsFromContent(options: t.RenderOptions, opts: { optional?: boolean } = {}): Partial<t.PreflightProps> {
  // Don't change the caller's options (see getLayers()).
  options = { ...options }

  let layers = getLayers(options)
  let plans = getPlans(options, layers)
  return seekPlan(plans, (plan) => plan.getPreflightProps()) || (opts.optional ? {} : cannotMatchTarget('Could not find target in current page', plans, layers, options))
}

// The layer lookup normalizes the options in place, e.g. it sets a { baseLayer }.
// The plans copy the options later, and need them normalized.
// renderFromContent() gets options that belong to this render pass, and changes them anyway, so it passes them as they are.
// preflightPropsFromContent() is a query, so it passes a copy. That copy is only defensive:
// RenderJob has normalized the success options already, and deriveFailOptions() returns a new object.
function getLayers(options: t.RenderOptions): (Layer | 'new')[] {
  return filterLayers(layerStack.getAll(options))
}

function getPlans(options: t.RenderOptions, layers: (Layer | 'new')[]): LayerPlan[] {
  // First seek { target } in all layers, then seek { fallback } in all layers.
  return [
    ...expandIntoPlans(layers, options.target, options),
    ...expandIntoPlans(layers, options.fallback, options),
  ]
}

function isRenderableLayer(layer: Layer | 'new'): boolean {
  return (layer === 'new') || layer.isAlive()
}

function filterLayers(layers: (Layer | 'new')[]): (Layer | 'new')[] {
  return u.filterList(layers, isRenderableLayer)
}

function expandIntoPlans(layers: (Layer | 'new')[], targets: t.RenderTarget | boolean | undefined, options: t.RenderOptions): LayerPlan[] {
  // An abstract selector like :main may expand into multiple
  // concrete selectors, like ['main', '.content'].
  return layers.flatMap((layer) => expandTargetsInLayer(targets, layer, options).map((target) => {
    // Any plans we add will inherit all properties from @options
    const props = { ...options, target, layer, defaultPlacement: defaultPlacement(options) }
    // TypeScript doesn't narrow props.layer through the layer variable.
    return layer === 'new' ? new OpenLayerPlan(props) : new UpdateLayerPlan(props as t.ResolvedRenderOptions)
  }))
}

function expandTargetsInLayer(targets: t.RenderTarget | boolean | undefined, layer: Layer | 'new', options: t.RenderOptions): string[] {
  return expandTargets(targets, { layer, mode: options.mode, origin: options.origin })
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

// Returns what fn() returns for the first plan that doesn't throw up.CannotMatch.
// fn() must not change the page, so we can try the next plan.
function seekPlan<T>(plans: LayerPlan[], fn: (plan: LayerPlan) => T): T | undefined {
  for (let plan of plans) {
    try {
      // A return statement stops iteration of a vanilla for loop,
      // but would not stop an u.each() or Array#forEach().
      return fn(plan)
    } catch (error) {
      // Re-throw any unexpected type of error, but ignore up.CannotMatch to try the next plan.
      if (!(error instanceof CannotMatch)) {
        throw error
      }
    }
  }
}
