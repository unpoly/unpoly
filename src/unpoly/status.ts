import * as u from './util.js'
import * as e from './element.js'
import { OptionsParser } from './element/options_parser.js'
import { newConfig } from './util/config.js'
import { on } from './event.js'
import { getDisablePreviewFn } from './form.js'
import { matchSelectorMap } from './fragment.js'
// Not through framework.js, which may not be evaluated yet when we create a Registry below.
import { Registry } from './framework/registry.js'
import { layerStack, type Layer } from './layer.js'
import { printToStandard } from './log.js'
import { type UpRequest } from './network.js'
import { FocusCapsule } from './viewport.js'
import type * as t from './status/types.js'
export type * from './status/types.js'
import { LinkCurrentURLs } from './status/link_current_urls.js'
import { Preview } from './status/preview.js'

// A nav remembers the locations its links were last compared with.
interface NavElement extends Element {
  upNavLocations?: string[]
}

// A link remembers its parsed URLs, and the area it expands to with [up-expand].
interface NavLink extends Element {
  upCurrentURLs?: LinkCurrentURLs
  upExpandedPair?: Element[]
}

interface NavUpdateOptions {
  // The links in the navs have changed.
  newLinks: boolean
  // A layer's location has changed.
  anyLocationChanged: boolean
}


export const statusConfig = newConfig('up.status.config', (): t.StatusConfig => ({
  currentClasses: ['up-current'],
  activeClasses: ['up-active'],
  loadingClasses: ['up-loading'],
  revalidatingClasses: ['up-revalidating'],
  navSelectors: ['[up-nav]', 'nav'],
  noNavSelectors: ['[up-nav=false]'],
}))

export let namedPreviewFns = new Registry<t.PreviewFn>('preview')

const SELECTOR_LINK = 'a, [up-href]'

function linkCurrentURLs(link: NavLink): LinkCurrentURLs {
  // Check if we have computed the URLs before.
  // Computation is sort of expensive (multiplied by number of links),
  // so we cache the results in a link property
  return link.upCurrentURLs ||= new LinkCurrentURLs(link)
}

function getNavLocations(nav: Element): string[] {
  let layerRef = e.stringAttr(nav, 'up-layer') || 'origin'
  let layers = layerStack.getAll(layerRef, { origin: nav })
  return u.compact(layers.map(getMatchableLayerLocation))
}

function updateNav(nav: NavElement, links: u.List<Element>, { newLinks, anyLocationChanged }: NavUpdateOptions): void {
  // Only look up current layer locations when either:
  //
  // (1) the location changed (anyLocationChanged = true) or
  // (2) we haven't cached previous locations
  //
  // Otherwise we re-use the previous locations.
  let currentLocations = (!anyLocationChanged && nav.upNavLocations) || getNavLocations(nav)

  // We only process when either:
  //
  // (1) We have unprocessed links (newLinks = true)
  // (2) The location for this nav's [up-layer] setting changed
  if (newLinks || !u.isEqual(nav.upNavLocations, currentLocations)) {
    for (let link of links) {
      const isCurrent = linkCurrentURLs(link).isAnyCurrent(currentLocations)
      for (let currentClass of statusConfig.currentClasses) {
        link.classList.toggle(currentClass, isCurrent)
      }
      e.setAttrPresence(link, 'aria-current', 'page', isCurrent)
    }

    // Remember which locations we last processed
    nav.upNavLocations = currentLocations
  }
}

function updateNavsAround(root: Element, opts: NavUpdateOptions): void {
  const navSelector = statusConfig.selector('navSelectors')
  const fullNavs = e.around(root, navSelector)

  for (let fullNav of fullNavs) {
    let links = e.subtree(fullNav, SELECTOR_LINK)
    updateNav(fullNav, links, opts)
  }
}

function getMatchableLayerLocation(layer: Layer): string | undefined {
  return u.matchableURL(layer.location)
}


function findActivatableAreas(element: NavLink): Element[] {
  return element.upExpandedPair || [element]
}

export function runPreviews(request: UpRequest, renderOptions: u.PlainObject): () => void {
  // Previews run while the request is in flight, before it evicts its layers.
  let bindLayer = request.bindLayer!
  let focusCapsule = FocusCapsule.preserve(bindLayer)
  let revertPreviews = bindLayer.asCurrent(() => doRunPreviews(request, renderOptions))
  focusCapsule?.autoVoid()
  return () => {
    bindLayer.asCurrent(revertPreviews)
    focusCapsule?.restore(bindLayer, { preventScroll: true })
  }
}

function doRunPreviews(request: UpRequest, renderOptions: u.PlainObject): () => void {
  let { fragment, fragments, origin } = request
  let cleaner = u.cleaner()
  let previewForFragment = (fragment?: Element): Preview => new Preview({ fragment, request, renderOptions, cleaner })

  // Some preview effects only run once per render pass.
  // The { fragment } for these previews will be the first fragment,
  // or null if there is no first fragment (when opening a layer).
  let singlePreview = previewForFragment(fragment)
  singlePreview.run(resolvePreviewFns(renderOptions.preview))
  singlePreview.run(getPlaceholderPreviewFn(renderOptions.placeholder))
  singlePreview.run(getFeedbackClassesPreviewFn(renderOptions.feedback, fragments))
  singlePreview.run(getDisablePreviewFn(renderOptions.disable, origin))

  // Other fragment effects run once per targeted fragment.
  // This is useful for batched validations, where we may update multiple fragments,
  // but each with individual preview effects.
  for (let fragment of fragments) {
    let eachPreview = previewForFragment(fragment)
    eachPreview.run(matchSelectorMap(fragment, renderOptions.previewMap))
    eachPreview.run(matchSelectorMap(fragment, renderOptions.placeholderMap).flatMap(getPlaceholderPreviewFn))
  }

  return cleaner.clean
}

function getPlaceholderPreviewFn(placeholder: any): t.PreviewFn | undefined {
  if (!placeholder) return

  return function(preview) {
    preview.showPlaceholder(placeholder)
  }
}

export function resolvePreviewFns(value: any): t.PreviewFn[] {
  if (u.isFunction(value)) {
    return [value]
  } else if (u.isString(value)) {
    return resolvePreviewString(value)
  } else if (u.isArray(value)) {
    return value.flatMap(resolvePreviewFns)
  } else {
    return []
  }
}

function resolvePreviewString(str: string): t.PreviewFn[] {
  return u.map(u.parseScalarJSONPairs(str), ([name, parsedOptions]) => {
    let previewFn = namedPreviewFns.get(name)

    return function(preview, runOptions) {
      printToStandard('[up-preview]', 'Showing preview %o', name)
      return previewFn(preview, parsedOptions || runOptions)
    }
  })
}

function getActiveElements({ origin, activeElements }: u.PlainObject): Element[] {
  activeElements ||= u.wrapList(origin)
  // If the link area was grown with [up-expand], we highlight the [up-expand] container.
  return u.flatMap(activeElements, findActivatableAreas)
}

function getFeedbackClassesPreviewFn(feedbackOption: boolean | undefined, fragments: Element[]): t.PreviewFn | undefined {
  if (!feedbackOption) return

  return function(preview) {
    const { renderOptions } = preview

    if (renderOptions.expiredResponse) {
      preview.addClassBatch(fragments, statusConfig.revalidatingClasses)
    } else {
      preview.addClassBatch(getActiveElements(renderOptions), statusConfig.activeClasses)
      preview.addClassBatch(fragments, statusConfig.loadingClasses)
    }
  }
}

export function statusOptions(element: Element, options?: u.PlainObject, parserOptions?: e.OptionsParserOptions): u.PlainObject {
  options = u.newOptions(options)
  const parser = new OptionsParser(element, options, parserOptions)
  parser.booleanOrString('disable')
  parser.boolean('feedback')
  parser.string('preview')
  parser.booleanOrString('revalidatePreview')
  parser.string('placeholder')
  return options
}

export function install(): void {
  on('up:compilers:before', (_event, newFragment) => {
    updateNavsAround(newFragment, { newLinks: true, anyLocationChanged: false })
  })

  on('up:layer:location:changed up:layer:opened up:layer:dismissed up:layer:accepted', () => {
    updateNavsAround(document.body, { newLinks: false, anyLocationChanged: true })
  })
}

export const api = {
  status: {
    config: statusConfig,
    // showAroundRequest,
    preview: namedPreviewFns.put,
  },
  preview: namedPreviewFns.put,
}
