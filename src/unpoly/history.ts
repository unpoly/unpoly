import * as u from './util.js'
import * as e from './element.js'
import { newConfig } from './util/config.js'
import { muteUncriticalRejection } from './error.js'
import { build, emit, haltEvent, isModified, on } from './event.js'
import { render, type RenderOptions } from './fragment.js'
import { layerStack } from './layer.js'
import { makeFollowable, type ClickEvent } from './link.js'
import { printToStandard, printUserEvent } from './log.js'
import { mockable } from './mockable.js'
import { initialRequestMethod } from './protocol.js'
import { registerMacro } from './script.js'
import { revealHash, revealHashFn, saveFocus, saveScroll } from './viewport.js'
import type * as t from './history/types.js'
export type * from './history/types.js'

export const historyConfig = newConfig('up.history.config', (): t.HistoryConfig => ({
  enabled: true,
  // Prefer restoring the body instead of :main, in case the last fragment update
  // changed the page layout. See https://github.com/unpoly/unpoly/issues/237.
  restoreTargets: ['body'],
  metaTagSelectors: [
    'meta',
    'link[rel=alternate]',
    'link[rel=canonical]',
    'link[rel=icon]',
    '[up-meta]',
    'script[type="application/ld+json"]',
  ],
  noMetaTagSelectors: [
    'meta[http-equiv]',
    '[up-meta=false]',
    // Do not invalidate existing nonced callbacks.
    // New nonced callbacks from the response will validates and then rewritten to match the existing nonce.
    'meta[name=csp-nonce]',
  ],
}))

export let previousLocation: string | undefined
let nextPreviousLocation: string | undefined
let nextTrackOptions: t.HistoryTrackOptions | undefined
let adoptedBases = new u.FIFOCache<string, boolean>({ capacity: 100, normalizeKey: getBase })

function reset(): void {
  previousLocation = undefined
  nextPreviousLocation = undefined
  nextTrackOptions = undefined
  adoptedBases.clear()
  trackCurrentLocation({ reason: null, alreadyHandled: true })
  adoptBase() // make sure we will process the current history entry
}

// Values we want to keep:
// - false (no update)
// - string (forced update)
// - list of elements (forced update of meta tags)
// Values we want to override:
// - true (do update with defaults)
export function refineOption(existingValue: any, newValue: any): any {
  if ((existingValue === false) || u.isString(existingValue) || u.isList(existingValue)) {
    return existingValue
  } else {
    return newValue
  }
}

export function isHistoryEnabled(aspect: t.HistoryAspect): boolean {
  let { enabled } = historyConfig
  return u.isArray(enabled) ? enabled.includes(aspect) : !!enabled
}

export const canPushState = mockable(function canPushState(): boolean {
  // We cannot use pushState if the initial request method is a POST for two reasons:
  //
  // 1. Unpoly replaces the initial state so it can handle the pop event when the
  //    user goes back to the initial URL later. If the initial request was a POST,
  //    Unpoly will wrongly assume that it can restore the state by reloading with GET.
  //
  // 2. Some browsers have a bug where the initial request method is used for all
  //    subsequently pushed states. That means if the user reloads the page on a later
  //    GET state, the browser will wrongly attempt a POST request.
  //    This issue affects Safari 9 and 10 (last tested in 2017-08).
  //    Modern Firefoxes, Chromes and IE10+ don't have this behavior.
  //
  // The way that we work around this is that we don't support pushState if the
  // initial request method was anything other than GET (but allow the rest of the
  // Unpoly framework to work). This way Unpoly will fall back to full page loads until
  // the framework was booted from a GET request.
  return initialRequestMethod() === 'GET'
})

export function historyOptions(options: RenderOptions): u.PlainObject {
  return u.pick(options, [
    'location',
    'title',
    'metaTags',
    'lang'
  ])
}

export function currentLocation(): string {
  return u.normalizeURL(location.href)
}

function withTrackOptions(trackOptions: t.HistoryTrackOptions | undefined, fn: () => void): void {
  try {
    nextTrackOptions = trackOptions
    fn()
  } finally {
    nextTrackOptions = undefined
  }
}

function trackCurrentLocation(trackOptions: t.HistoryTrackOptions): void {
  let { reason, alreadyHandled, pauseTracking } = nextTrackOptions || trackOptions
  if (pauseTracking) return

  // The currentLocation() function normalizes
  let location = currentLocation()

  if (isAdoptedState()) {
    // The user might have refreshed the page, making us lose adoptedBases.
    // However, we can still recognize the { up: true } marker from history.state.
    adoptBase(location)
  } else if (isAdoptedBase(location)) {
    // When the user navigates from an adopted base to a #hash, the browser pushes a history
    // entry with an empty state. We must mark that entry with an { up: true } state
    // so we can recognize it when the user reloads the page.
    adoptState()
  }

  if (nextPreviousLocation !== location) {
    previousLocation = nextPreviousLocation
    nextPreviousLocation = location

    if (reason === 'detect') {
      reason = (getBase(location) === getBase(previousLocation)) ? 'hash' : 'pop'
    }

    let willHandle = !alreadyHandled && isAdoptedBase(location)

    let locationChangedEvent = build('up:location:changed', {
      reason,
      location,
      previousLocation,
      alreadyHandled,
      willHandle,
      log: `New location is ${location}`
    })

    up.migrate.prepareLocationChangedEvent?.(locationChangedEvent)

    if (reason) {
      emit(locationChangedEvent)
      reactToChange(locationChangedEvent)
    }
  }
}

function splitLocation(location?: string): string[] {
  return location?.split(/(?=#)/) || []
}

function getBase(location?: string): string | undefined {
  return splitLocation(location)[0]
}

export function isLocation(url: string, options?: u.NormalizeURLOptions): boolean {
  return u.matchURLs(url, location.href, { hash: true, ...options })
}

export function replace(location: string, trackOptions?: t.HistoryTrackOptions): void {
  placeAdoptedHistoryEntry('replaceState', location, trackOptions)
}

export function pushLocation(location: string, trackOptions?: t.HistoryTrackOptions): void {
  if (isLocation(location)) return
  placeAdoptedHistoryEntry('pushState', location, trackOptions)
}

function placeAdoptedHistoryEntry(method: 'pushState' | 'replaceState', location: string, trackOptions?: t.HistoryTrackOptions): void {
  // When up.history.config.enabled excludes 'location', we do nothing.
  // We don't adopt a URL that we never pushed.
  if (isHistoryEnabled('location')) {
    adoptBase(location)

    withTrackOptions(trackOptions, function() {
      // Call this instead of originalPushState in case someone else has patched history.pushState()
      // Our own tests do this to rate-limit the use of the history API.
      history[method]({ up: true }, '', location)
    })
  }
}

function isAdoptedBase(location: string): boolean {
  // We handle bases (path + query string) that were pushed or replaced via up.history methods.
  // All other bases we assume are pushed by external JS that wants to handle restoration itself.
  return !!adoptedBases.get(location)
}

function adoptBase(location: string = currentLocation()): void {
  location = u.normalizeURL(location)
  adoptedBases.set(location, true)
}

function isAdoptedState(): boolean {
  return history.state?.up
}

function adoptState(): void {
  let { state } = history

  // If we already have history.state.up, don't waste another replaceState() call.
  // We're on a throttling quota after all.
  if (isAdoptedState()) return

  // Add our { up } key to "don't care" states like "", null or {}, but not
  // to other values.
  if (u.isBlank(state) || u.isObject(state)) {
    withTrackOptions({ pauseTracking: true }, function() {
      history.replaceState({ ...state, up: true }, '')
    })
  }
}

function restoreLocation(location: string): void {

  // An up.Offline error (the server could not be reached) is critical and surfaces as an
  // unhandled rejection, while the page keeps its content. This is intentional: losing the
  // connection while restoring is worth reporting, unlike an error status, which we render.
  muteUncriticalRejection(render({
    guardEvent: build('up:location:restore', { location, log: `Restoring location ${location}` }),

    // The browser has already restored the URL, but hasn't changed content
    // four our synthetic history state. We're now fetching the content for the restored URL.
    url: location,
    target: historyConfig.restoreTargets,

    // The browser won't let us prevent the state restoration, so we're
    // rendering whatever the server sends us.
    fail: false,

    history: true,
    // (1) While the browser has already restored the earlier URL, we must still
    //     pass it to render() so the current layer can track the new URL.
    // (2) Since we're passing the current URL, up.history.push() will not add another state.
    // (2) Pass the current URL to ensure that this exact URL is being rendered
    //     and not something derived from the up.Response.
    location,

    // Don't replace elements in a modal that might still be open
    // We will close all overlays and update the root layer.
    peel: true,
    layer: 'root',

    cache: 'auto',
    revalidate: 'auto',

    // We already saved view state in onPop()
    saveScroll: false,
    scroll: ['restore', 'auto'],
    saveFocus: false,
    focus: ['restore', 'auto'],
  }))
}

function reactToChange(event: t.LocationChangedEvent): void {
  if (event.alreadyHandled) {
    return
  }

  if (!event.willHandle) {
    printToStandard('up.history', 'Ignoring history entry owned by foreign script')
    return
  }

  if (event.reason === 'pop') {
    saveFocus({ location: event.previousLocation })
    saveScroll({ location: event.previousLocation })
    restoreLocation(event.location)
  } else if (event.reason === 'hash') {
    // We handle every hashchange, since only we know reveal obstructions.
    revealHash(location.hash, { strong: true })
  }
}


export function findMetaTags(head: ParentNode = document.head): NodeListOf<Element> {
  return head.querySelectorAll(historyConfig.selector('metaTagSelectors'))
}

export function updateMetaTags(newMetaTags: Iterable<Element>): void {
  let oldMetaTags = findMetaTags()
  for (let oldMetaTag of oldMetaTags) {
    // We do not use up.destroy() as meta tags may be inserted/removed
    // multiple times as we open and close an overlay.
    oldMetaTag.remove()
  }

  for (let newMetaTag of newMetaTags) {
    document.head.append(newMetaTag)
  }
}

export function getLang(doc: Document = document): string | undefined {
  // return e.attr(doc.documentElement, 'lang')
  let { documentElement } = doc
  if (documentElement.matches('html')) {
    return doc.documentElement.lang
  }
}

export function updateLang(newLang?: string): void {
  // An empty lang removes the attribute.
  e.setAttrs(e.getRoot(), { lang: newLang || null })
}

function patchHistoryAPI(): void {
  const originalPushState = history.pushState
  history.pushState = function(...args) {
    originalPushState.apply(this, args)
    trackCurrentLocation({ reason: 'push', alreadyHandled: true })
  }

  const originalReplaceState = history.replaceState
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args)
    trackCurrentLocation({ reason: 'replace', alreadyHandled: true })
  }
}

function adoptInitialHistoryEntry(): void {
  // Unpoly replaces the initial page state so it can later restore it when the user
  // goes back to that initial URL. However, if the initial request was a POST,
  // Unpoly will wrongly assume that it can restore the state by reloading with GET.
  if (initialRequestMethod() === 'GET') {
    // Replace the vanilla state of the initial page load with an Unpoly-enabled state
    adoptState()

    // Adopt all #hash navigations to the same URL.
    adoptBase()
  }
}


function onJumpLinkClicked(event: ClickEvent, link: HTMLAnchorElement): void {
  // If other JavaScript already handled this click, do nothing.
  if (event.defaultPrevented) return

  // Don't handle clicks that would open a new tab.
  if (isModified(event)) return

  let [currentBase, currentHash] = splitLocation(layerStack.current.location)
  let [linkBase, linkHash] = splitLocation(u.normalizeURL(link))
  // The listener only matches links with an [href].
  let verbatimHREF = link.getAttribute('href')!

  // (1) If we're not scrolling the page, we must leave the event unprevented
  //     and allow the link to be followed, or handled by other JavaScript.
  // (2) currentBase may be undefined if we're on a layer that was opened from a string.
  let isJumpLink = (currentBase === linkBase) || verbatimHREF.startsWith('#')
  if (!isJumpLink) return

  // By default we will honor a { scroll-behavior } style from CSS.
  // This can be overridden by an [up-scroll-behavior] attribute.
  // Like the attribute for render options, its value is passed on unchecked.
  let behavior = (link.getAttribute('up-scroll-behavior') ?? 'auto') as ScrollBehavior

  // (1) Check if we recognize the link hash, because it matches a fragment or
  //     a well-known anchor like "#top".
  // (2) Scroll with { behavior: 'auto' } (instead of thew default { behavior: 'instant' }
  //     so it picks up any scroll-behavior CSS rule on the viewport element.
  // The link is attached, so it's in a layer.
  let layer = layerStack.get(link)!
  let revealFn = revealHashFn(linkHash, { layer, behavior, focus: true })

  if (revealFn) {
    // (1) Prevent the browser, Unpoly or other JavaScript from following the link.
    // (2) This means we will be responsible to change the hash in the address bar.
    haltEvent(event)

    printUserEvent(event)

    // (1) Because we prevented the event, it is up to us to change the hash.
    // (2) We should not set the location if the layer shows no live location.
    if (linkHash !== currentHash && layer.showsLiveHistory('location')) {
      // We use pushState() instead of setting location.hash so we don't trigger
      // a hashchange event or cause browser scrolling.
      let newHREF = currentBase + linkHash
      pushLocation(newHREF, { reason: 'hash', alreadyHandled: true })
    }

    revealFn()
  } else {
    // (1) At this point revealHash() could not find a matching fragment.
    //     The hash also isn't '#top', which would also have been handled by revealHash().
    // (2) We might be looking at a <a href="#"> that wants to be handled be a script
    //     that is called after this click listener.
  }
}


export function install(): void {
  // Wait until the framework is booted before we (1) patch window.history
  // and (2) replace the current history state.
  on('up:framework:boot', function({ mode }) {
    trackCurrentLocation({ reason: null, alreadyHandled: true }) // no event is emitted while booting
    patchHistoryAPI()
    adoptInitialHistoryEntry()

    // (1) Honor obstructions when the initial URL contains a #hash.
    // (2) Wait until booting because the developer might choose not to boot Unpoly.
    // (3) Don't scroll when the user manually boots later, as the user might already have scrolled elsewhere.
    if (mode === 'auto') {
      // (1) When reloading, Chrome's default scrolling behavior
      //     happens *before* DOMContentLoaded. We fix that as soon as possible.
      // (2) When following a link to another URL with a #hash URL, Chrome's default
      //     scrolling behavior happens *after* DOMContentLoaded. We wait one more task to
      //     fix the scroll position after the browser did its thing.
      revealHash(location.hash, { strong: true, focus: true })
    }
  })

  on(window, 'hashchange, popstate', () => {
    // We do not detect the reason here because we're in  a state where
    // location and previousLocation are the same. This will be fixed by trackCurrentLocation().
    trackCurrentLocation({ reason: 'detect', alreadyHandled: false })
  })

  on('up:click', 'a[href*="#"]', onJumpLinkClicked)

  registerMacro('[up-back]', function(link) {
    if (previousLocation) {
      e.setMissingAttrs(link, {
        'up-href': previousLocation,
        'up-scroll': 'restore'
      })
      link.removeAttribute('up-back')
      makeFollowable(link)
    }
  })

  on('up:framework:reset', reset)
}

export const api = {
  history: {
    config: historyConfig,
    push: pushLocation,
    replace,
    get location() { return currentLocation() },
    get previousLocation() { return previousLocation },
    isLocation,
  },
}
