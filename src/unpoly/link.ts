import './link.sass'
import * as u from './util.js'
import * as e from './element.js'
import { OptionsParser } from './element/options_parser.js'
import { newConfig } from './util/config.js'
import { muteUncriticalRejection, UpError } from './error.js'
import {
  build, emit, fork, getInputDevice, haltEvent, isModified, isSyntheticClick, keyModifiers, on,
} from './event.js'
import { anyButtonSelector, formFieldSelector } from './form.js'
import { getSmart, onFirstIntersect, render, RenderOptions, type RenderJob } from './fragment.js'
import { canPushState, isHistoryEnabled } from './history.js'
import { type Layer } from './layer.js'
import { mockable } from './mockable.js'
import { motionOptions } from './motion.js'
import { isSafeMethod, networkConfig, UpRequest } from './network.js'
import { registerAttrCompiler, registerCompiler, registerMacro } from './script.js'
import { statusOptions } from './status.js'
import { doFocus } from './viewport.js'
import type * as t from './link/types.js'
export type * from './link/types.js'
import { LinkFollowIntent } from './link/link_follow_intent.js'

// A link expanded with [up-expand] remembers the area it expanded to, and the area remembers the link.
interface ExpandedElement extends HTMLElement {
  upExpandedPair?: [area: HTMLElement, link: HTMLElement]
}


let lastTouchstartTarget: EventTarget | null = null
let lastMousedownTarget: EventTarget | null = null
let lastInstantTarget: Element | null = null

const ATTRS_WITH_LOCAL_HTML = '[up-content], [up-fragment], [up-document]'
const ATTRS_SUGGESTING_FOLLOW = `${ATTRS_WITH_LOCAL_HTML}, [up-target], [up-layer], [up-transition], [up-preload]`
const DEFAULT_INTERACTIVE_ELEMENT = 'a[href], button'

export const linkConfig = newConfig('up.link.config', (): t.LinkConfig => ({
  // (1) We want to follow all elements with an [up-follow] attribute.
  //     This can be an <a up-follow href="/path"> or an <span up-follow up-href="/path">
  // (2) Users expect a link to be followable if it uses a signature attribute
  //     like [up-target] or [up-transition], even without an [up-href] attribute.
  // (3) We sometimes allow <a> links without an [href], e.g. <a up-target=".foo" up-content="html">.
  followSelectors: ['[up-follow]', `a:is(${ATTRS_SUGGESTING_FOLLOW})`],

  // (1) We don't want to follow <a href="#anchor"> links without a path. Instead
  //     we will let the browser change the current location's anchor and up.reveal()
  //     on hashchange to scroll past obstructions.
  // (2) We want to follow links with [href=#] only if they have a local source of HTML
  //     through [up-content], [up-fragment] or [up-document].
  //     Many web developers are used to give JavaScript-handled links an [href="#"]
  //     attribute. Also frameworks like Bootstrap only style links if they have an [href].
  // (3) We don't want to handle <a href="javascript:foo()"> links.
  noFollowSelectors: ['[up-follow=false]', 'a[download]', 'a[target]', 'a[href^="javascript:"]', 'a[href^="mailto:"]', 'a[href^="tel:"]', `a[href^="#"]:not(${ATTRS_WITH_LOCAL_HTML})`, e.crossOriginSelector('href'), e.crossOriginSelector('up-href')],

  instantSelectors: ['[up-instant]'],
  noInstantSelectors: ['[up-instant=false]', '[onclick]'],

  preloadSelectors: ['[up-preload]'],
  noPreloadSelectors: ['[up-preload=false]'],

  // (1) Users can explicitly add A11Y behavior to non-interactive elements with [up-clickable]
  // (2) We have some elements like [up-emit] or [up-accept] which may or may not be interactive elements
  // (3) When a link is followable, is should also be clickable. Even a <span up-follow> or a <a up-content>.
  // (4) Prevent unnecessary compilation of elements that are already interactive (a[href], button).
  clickableSelectors: ['[up-clickable]', '[up-follow]', '[up-emit]', '[up-accept]', '[up-dismiss]', `a:is(${ATTRS_SUGGESTING_FOLLOW})`],
  noClickableSelectors: ['[up-clickable=false]', DEFAULT_INTERACTIVE_ELEMENT],

  preloadDelay: 90,
}))

function isPreloadDisabled(link: Element): boolean {
  // (1) Don't preload when we cannot change the browser URL. Following such a link will make a full page load ignoring our cache.
  //     When up.history.config.enabled excludes 'location', we never change the browser URL, so we can preload.
  // (2) Don't preload when the link isn't going to be handled by Unpoly.
  // (3) Don't preload when we're not going to cache the content according to up.network.config.autoCache.
  //     By default this only caches safe links.
  return (!canPushState() && isHistoryEnabled('location')) || !isFollowable(link) || !willCache(link)
}

function willCache(link: Element): boolean | undefined {
  // Instantiate a lightweight request with basic link attributes needed for the cache-check.
  const options = parseRequestOptions(link)
  if (options.url) {
    if (options.cache == null) { options.cache = 'auto' }
    options.basic = true
    const request = new UpRequest(options)
    return request.willCache()
  }
}

function reset(): void {
  lastTouchstartTarget = null
  lastMousedownTarget = null
  lastInstantTarget = null
}

export const follow = mockable(function(link: e.ElementOrSelector, options?: RenderOptions, parserOptions?: e.OptionsParserOptions): RenderJob {
  return render(followOptions(link, options, parserOptions))
})

// TODO(types): Return RequestOptions once the render options have a type.
export function parseRequestOptions(link: Element, options?: u.PlainObject, parserOptions?: e.OptionsParserOptions): any {
  options = u.newOptions(options)
  const parser = new OptionsParser(link, options, { ...parserOptions, fail: false })

  options.url = followURL(link, options)
  options.method = followMethod(link, options)
  parser.json('headers')
  parser.json('params')
  parser.booleanOrString('cache')
  parser.booleanOrString('expireCache')
  parser.booleanOrString('evictCache')
  parser.booleanOrString('revalidate')
  parser.booleanOrString('abort')
  parser.boolean('abortable')
  parser.boolean('background')
  parser.string('contentType')
  parser.booleanOrNumber('lateDelay')
  parser.number('timeout')
  parser.booleanOrString('fail')

  return options
}

export function followOptions(link: e.ElementOrSelector, options?: RenderOptions, parserOptions?: e.OptionsParserOptions): RenderOptions {
  // If passed a selector, up.fragment.get() will prefer a match on the current layer.
  link = effectiveLink(getSmart(link)!)
  options = u.newOptions(options)

  const parser = new OptionsParser(link, options, { fail: true, ...parserOptions })

  parser.include(parseRequestOptions)

  // Fragment options
  options.origin ||= link
  parser.boolean('navigate', { default: true })
  parser.booleanOrString('confirm', { attr: ['up-confirm', 'data-confirm'] })
  parser.string('target')
  parser.booleanOrString('fallback')
  parser.string('match')
  parser.string('document')
  parser.string('fragment')
  parser.string('content')
  parser.boolean('keep', { attr: 'up-use-keep' }) // cannot be [up-keep] because it would affect the link itself
  parser.boolean('hungry', { attr: 'up-use-hungry' }) // cannot be [up-hungry] because it would affect the link itself
  parser.json('data', { attr: 'up-use-data' }) // cannot be [up-data] because it would affect the link itself
  parser.json('dataMap', { attr: 'up-use-data-map' }) // could be [up-data-map], but be consistent with [up-use-data]

  // Lifecycle options
  parser.renderCallback('onLoaded')
  parser.renderCallback('onRendered')
  parser.renderCallback('onFinished')
  parser.renderCallback('onOffline') // not a request option!
  parser.renderCallback('onError') // not a request option!

  // Layer options
  parser.booleanOrString('peel')
  parser.string('layer')
  parser.string('baseLayer')
  parser.json('context')
  parser.string('mode')
  parser.string('align')
  parser.string('position')
  parser.string('class')
  parser.string('size')
  parser.booleanOrString('dismissible')
  parser.renderCallback('onOpened')
  parser.renderCallback('onAccept')
  parser.renderCallback('onAccepted')
  parser.renderCallback('onDismiss')
  parser.renderCallback('onDismissed')
  parser.string('onAcceptedReload')
  parser.string('onDismissedReload')
  parser.string('acceptEvent')
  parser.string('dismissEvent')
  parser.string('acceptFragment')
  parser.string('dismissFragment')
  parser.string('acceptLocation')
  parser.string('dismissLocation')
  parser.booleanOrString('closeAnimation')
  parser.string('closeEasing')
  parser.number('closeDuration')

  // Status effects
  parser.include(statusOptions)

  // Viewport options
  parser.booleanOrString('focus')
  parser.booleanOrString('focusVisible')
  parser.boolean('saveScroll')
  parser.boolean('saveFocus')
  parser.booleanOrNumberOrString('scroll')
  parser.json('scrollMap')
  parser.boolean('revealTop')
  parser.number('revealMax')
  parser.number('revealPadding')
  parser.number('revealSnap')
  parser.string('scrollBehavior')

  // History options
  // { history } is actually a boolean, but we keep the deprecated string
  // variant which should now be passed as { location }.
  parser.booleanOrString('history')
  parser.booleanOrString('location')
  parser.booleanOrString('title')
  parser.boolean('metaTags')
  parser.booleanOrString('lang')

  // Motion options
  parser.include(motionOptions)

  // This is the event that may be prevented to stop the follow.
  // up.form.submit() changes this to be up:form:submit instead.
  // The guardEvent will also be assigned a { renderOptions } property in up.render()
  options.guardEvent ??= build('up:link:follow', { log: ['Following link %o', link] })

  return options
}

// Returns a Promise or an up.RenderJob, which has the API of a Promise.
export function preload(link: e.ElementOrSelector, options?: RenderOptions): Promise<void> | RenderJob {
  // If passed a selector, up.fragment.get() will match in the current layer.
  link = effectiveLink(getSmart(link)!)

  let issue = preloadIssue(link)
  if (issue) {
    return Promise.reject(new UpError(issue))
  }

  // Preloading only serves to fill the cache
  if (!networkConfig.cacheEnabled) return Promise.resolve()

  const guardEvent = build('up:link:preload', { log: ['Preloading link %o', link] })

  return follow(link, {
    // These are forced, so [up-background] or [up-abortable] attributes on the link have no effect.
    // This is intentional: a preload only fills the cache. It should never show the progress bar,
    // and must survive other render passes to be useful.
    abort: false,
    abortable: false,
    background: true,
    cache: true,
    ...options,
    ...RenderOptions.NO_INPUT_INTERFERENCE,
    ...RenderOptions.NO_PREVIEWS,
    guardEvent,
    preload: true, // hint to ChangeFromURL to stop execution after sending the request
  })
}

// A click on an [up-expand] area follows its link.
// Returns that link for an area, and the given element otherwise.
// A link that was expanded with [up-expand] stands for the link inside it.
function effectiveLink(element: ExpandedElement): Element {
  let link = element.upExpandedPair?.[1]
  return link && element.contains(link) ? link : element
}

function preloadIssue(link: Element): string | undefined {
  if (!isSafe(link)) {
    return 'Will not preload an unsafe link'
  }
}

function followMethod(link: Element, options: RenderOptions = {}): string {
  return u.normalizeMethod(options.method || link.getAttribute('up-method') || link.getAttribute('data-method'))
}

function followURL(link: Element, options: RenderOptions = {}): string | null | undefined {
  const url = options.url || link.getAttribute('up-href') || link.getAttribute('href')

  // Developers sometimes make a <a href="#"> to give a JavaScript interaction standard
  // link behavior (like keyboard navigation or default styles). However, we don't want to
  // consider this  a link with remote content, and rather honor [up-content], [up-document]
  // and [up-fragment] attributes.
  if (url !== '#') {
    return url
  }
}

export function isFollowable(link: e.ElementOrSelector): boolean {
  link = getSmart(link)!
  return linkConfig.matches(link, 'followSelectors')
}

export function makeFollowable(link: Element): void {
  if (!isFollowable(link)) {
    link.setAttribute('up-follow', '')
  }
}

function makeClickable(element: HTMLElement): void {
  // We default to a button role, except if the element looks link-ish
  let role = element.matches('a, [up-follow]') ? 'link' : 'button'

  // We set some defaults for interactivity and A11y, but preserve any existing attributes set by the user.
  e.setMissingAttrs(element, {
    tabindex: '0',     // Make them part of the natural tab order
    role,              // Make screen readers pronounce "button" or "link"
    'up-clickable': '' // Get pointer cursor from link.css
  })

  element.addEventListener('keydown', function(event) {
    // (1) Buttons are expected to be triggered using the Space or Enter key
    // (2) Links are expected to be triggered using the Enter key
    // (3) We use the element's current role (instead of the `role` variable above)
    //     to honor any custom [role] attribute set by the user.
    if ((event.key === 'Enter') || (element.role === 'button' && event.key === ' ')) {
      return forkEventAsUpClick(event)
    }
  })
}

// function willJump(link) {
//   let [linkBase, linkHash] = splitLocation(u.normalizeURL(link))
//   let verbatimHREF = link.getAttribute('href')
// }

export function shouldHandleClick(event: Event, link: Element): boolean {
  // Users may configure up.link.config.followSelectors.push('a')
  // and then opt out individual links with [up-follow=false].
  if (event.defaultPrevented) {
    return false
  }

  return isClickTarget(event.target as Element, link)
}

// Returns whether a click on the given target is meant for the given link,
// and not for another interactive element within the link.
function isClickTarget(target: Element, link: Element): boolean {
  // A click within a nested [up-expand] area belongs to that area, but only if:
  // (1) The area works. Only the [up-expand] macro sets an { upExpandedPair },
  //     so an inert area or [up-expand=false] does not take the click.
  // (2) The area is not the element we're testing, e.g. when the area asks about a click on itself.
  // (3) The area is inside the element. closest() may also find an area around it,
  //     but that outer area does not take the click from its content.
  const innerArea: ExpandedElement | null = target.closest('[up-expand]')
  if (innerArea?.upExpandedPair && innerArea !== link && link.contains(innerArea)) {
    return false
  }

  // An element within the link may be a better target that handles the click itself:
  // (1) A nested link or [up-follow] element is always followed on its own.
  // (2) A field always handles its own click.
  // (3) A link's buttons, labels and summaries are part of its content, so clicking them follows the link.
  //     A clickable container like an [up-expand] area leaves them to handle their own clicks.
  const betterTargetSelector = `a, [up-follow], ${link.matches('a') ? formFieldSelector() : interactiveSelector()}`
  const betterTarget = target.closest(betterTargetSelector)
  // The click is meant for the link if:
  // (1) Nothing more specific than the link was clicked.
  // (2) The closest better target is the link itself.
  // (3) closest() walked past the link to an element around it, like an outer [up-expand] area
  //     or a <label> around the link. A better target must lie between the click target and the link.
  return !betterTarget || (betterTarget === link) || !link.contains(betterTarget)
}

// Elements within a clickable container that handle their own clicks.
function interactiveSelector(): string {
  return [formFieldSelector(), anyButtonSelector(), 'label', 'summary'].join()
}

function isInstant(linkOrDescendant: Element): boolean | null {
  const element = linkOrDescendant.closest(linkConfig.selector('instantSelectors'))
  // (1) Allow users to configure up.link.config.instantSelectors.push('a')
  //     but opt out individual links with [up-follow=false].
  // (2) A press on an element that handles its own click is not instant. Otherwise we would
  //     emit up:click on mousedown, ignore it, and then halt the click that the element needs.
  return element && !isInstantDisabled(element) && isClickTarget(linkOrDescendant, element)
}

function isInstantDisabled(link: Element): boolean {
  // (1) We cannot resolve config.noInstantSelectors via a :not() selector because
  //     convertClicks() needs to check if a given link is instant.
  // (2) We cannot implement this as !isFollowable(link) because [up-clickable] can add
  //     instant support for non-followable elements.
  // (3) A link that matches config.instantSelectors, but neither config.followSelectors nor
  //     config.noFollowSelectors, stays instant even though nothing follows it. This is intentional:
  //     users may handle its up:click themselves. The docs ask that instant links are also followable.
  return linkConfig.matches(link, 'noInstantSelectors') || linkConfig.matches(link, 'noFollowSelectors')
}

export function convertClicks(layer: Layer): void {
  layer.on('click', function(event, element) {
    // We never handle events for the right mouse button,
    // or when Shift/CTRL/Meta/ALT is pressed
    if (isModified(event)) {
      return
    }

    // (1) Instant links should not have a `click` event.
    //     This would trigger the browsers default follow-behavior and possibly activate JS libs.
    // (2) A11Y: We also need to check whether the [up-instant] behavior did trigger on mousedown.
    //     Keyboard navigation will not necessarily trigger a mousedown event.
    if (isInstant(element) && lastInstantTarget === element) {
      haltEvent(event)

    // (1) In case mousedown has created a layer over the click coordinates,
    //     Chrome will emit an event with { target: document.body } on click.
    //     Ignore that event and only process if we would still hit the
    //     expect layers at the click coordinates.
    // (2) A click made by JavaScript, e.g. element.click(), has no meaningful coordinates and
    //     may run while another click is being handled. We skip the mouse checks for such clicks.
    } else if (getInputDevice() === 'key' || isSyntheticClick(event) || (layer.wasHitByMouseEvent(event) && !didUserDragAway(event))) {
      // Event is a `PointerEvent` with an { pointerType } property.
      // Its values are 'mouse', 'pen', 'touch' or '' (unknown, meaning synthetic or keyboard).
      forkEventAsUpClick(event)
    }

    // In case the user switches input modes.
    lastMousedownTarget = null
    lastInstantTarget = null
  })

  layer.on('touchstart', { passive: true }, function(event, element) {
    // Remember for isLongPressPossible() on mousedown
    lastTouchstartTarget = element
  })

  layer.on('mousedown', function(event, element) {
    // We never handle events for the right mouse button,
    // or when Shift/CTRL/Meta/ALT is pressed
    if (isModified(event)) {
      return
    }

    // Remember for the didUserDragAway() test on click
    lastMousedownTarget = element

    // (1) Instant links emit up:click on mousedown
    // (2) On touch devices we never act on mousedown as the user may be long-pressing to open the context menu
    // (3) When another script prevented the mousedown, e.g. to keep the focus in a search field,
    //     the press is not instant. A forked up:click would be prevented as well, and we would halt the click.
    //     Like the browser, we still act on the click.
    if (!event.defaultPrevented && isInstant(element) && !isLongPressPossible(event)) {
      // Remember that we already emitted an event so we don't do it again on click
      lastInstantTarget = element

      // A11Y: Keyboard navigation will not necessarily trigger a mousedown event.
      // We also don't want to listen to the enter key, since some screen readers
      // use the enter key for something else.
      forkEventAsUpClick(event)
    }

    // (1) Now that we tested isLongPressPossible() we can reset the last touchstart target for the next press
    // (2) Do it here rather than on click because, when long pressing opens the menu, there won't be a click
    lastTouchstartTarget = null
  })
}

function isLongPressPossible(mousedownEvent: MouseEvent): Element | false | null {
  let mousedownTarget = mousedownEvent.target as Element
  return (lastTouchstartTarget === mousedownTarget) && mousedownTarget.closest('[href]')
}

function didUserDragAway(clickEvent: MouseEvent): boolean | null {
  return lastMousedownTarget && (lastMousedownTarget !== clickEvent.target)
}

function forkEventAsUpClick(originalEvent: MouseEvent | KeyboardEvent): void {
  let forwardedProps = ['clientX', 'clientY', 'button', ...keyModifiers]
  const newEvent = fork(originalEvent, 'up:click', forwardedProps)
  emit(originalEvent.target!, newEvent, { log: false })
}

export function isSafe(link: Element): boolean {
  const method = followMethod(link)
  return isSafeMethod(method)
}

// The condition is 'insert', 'reveal', 'hover' or 'manual'.
function onLoadCondition(condition: string | false, link: Element, callback: t.FollowCallback): void {
  switch (condition) {
    case 'insert':
      callback()
      break
    case 'reveal': {
      let margin = e.numberAttr(link, 'up-intersect-margin')
      onFirstIntersect(link, callback, { margin })
      break
    }
    case 'hover':
      new LinkFollowIntent(link, callback)
      break
    case 'manual':
      // Wait for explicit call of up.deferred.load().
      break
  }
}

export function loadDeferred(link: Element, options?: RenderOptions): RenderJob {
  let guardEvent = build('up:deferred:load', { log: ['Loading deferred %o', link] })

  // These options override up.link.follow() behavior
  let forcedOptions = {
    navigate: false,
    guardEvent,
    ...options,
  }

  // These defaults can be overridden using [up-...] attributes.
  let defaults = {
    target: ':origin',
    // An error response renders nothing and keeps the placeholder, unless the placeholder
    // has an [up-fail-target] or [up-fail=false] attribute.
    failTarget: ':none',
    cache: 'auto',
    revalidate: 'auto',
    feedback: true,
  }

  return follow(link, forcedOptions, { defaults })
}


export function install(): void {
  registerMacro(linkConfig.selectorFn('clickableSelectors'), makeClickable)

  registerAttrCompiler('up-defer', { defaultValue: 'insert' }, function(link, condition) {
    let doLoad: t.FollowCallback = (options) => muteUncriticalRejection(loadDeferred(link, options))
    onLoadCondition(condition, link, doLoad)
  })

  on('up:click', linkConfig.selectorFn('followSelectors'), function(event, link) {
    if (shouldHandleClick(event, link)) {
      haltEvent(event, { log: true })

      // When the user clicks an hyperlink, the browser will focus the link element on `click`.
      // However, for an `[up-instant]` link we will emit `up:click` on `mousedown` and halt the `click` event.
      // Without a `click` event the browser won't focus the link.
      //
      // This also has an unfortunate effect on `input[up-validate]`:
      //
      // - User types into a text field
      // - With focus still on the text field, the user clicks on an `[up-instant]`.
      // - The link is being followed, causing a request for the new fragment.
      // - When the response is received, Unpoly will update the targeted fragment.
      // - This causes the text field (probably being replaced) from losing focus, causing a `change` event,
      //   triggering `[up-validate]` and another server request for the validation.
      // - The link request is probably `{ abort: true }`, but since it happened *before* the
      //   validation request there was nothing to abort.
      // - When the validation response is received, the text field is probably gone, causing error.
      //
      // To preserve behavioral symmetry to standard links, we manually focus the link when it was activated
      // on `mousedown`.
      doFocus(link, { preventScroll: true })

      muteUncriticalRejection(follow(link))
    }
  })

  registerAttrCompiler('up-expand', { defaultValue: 'a, [up-href]', macro: true }, function(area: ExpandedElement, childLinkSelector) {
    let childLink: ExpandedElement | null = e.getOne(area, childLinkSelector)
    if (childLink) {
      // Remember the expander and expandee so we can set .up-active classes efficiently,
      // and so we can hand a click on a non-followable area to the link.
      childLink.upExpandedPair = area.upExpandedPair = [area, childLink]

      // This is our current workaround for expanded areas gaining an .up-current class from the contained link.
      e.addClasses(area, e.upClasses(childLink))

      // [up-nav] only marks elements with a URL as .up-current.
      // We give the area its link's URL, whether or not Unpoly follows the link.
      e.setMissingAttr(area, 'up-href', e.stringAttr(childLink, 'up-href') || e.stringAttr(childLink, 'href'))

      // A click on the area does what a click on the link does.
      // When Unpoly follows the link, the area takes over the link's attributes, so it is followable, instant or
      // preloadable like the link. Following the area then follows the link (see effectiveLink()).
      // Otherwise a click on the area clicks the link (see below), so the browser does whatever the link does.
      if (isFollowable(childLink)) {
        e.setMissingAttrs(area, e.upAttrs(childLink))
        makeFollowable(area)
      }
      // A11y: We could also consider making the area clickable, via makeClickable().
      // However, since the original link is already present within the area,
      // we would not add accessibility benefits. We might also confuse screen readers
      // with a nested link.
    }
  })

  on('up:click', '[up-expand]', function(event, area: ExpandedElement) {
    let childLink = area.upExpandedPair?.[1]
    // (1) A followable area is followed by the [up-follow] handler.
    // (2) A click within the expanded element belongs to that element. This includes the up:click that
    //     childLink.click() emits below, so the area never handles its own forwarded click.
    // (3) We ignore clicks on other links, fields, buttons or labels in the area.
    if (childLink && !isFollowable(area) && !childLink.contains(event.target) && shouldHandleClick(event, area)) {
      haltEvent(event)
      // The browser runs the link's default action within the user's click,
      // so popup blockers allow a link with [target=_blank].
      childLink.click()
    }
  })

  registerCompiler(linkConfig.selectorFn('preloadSelectors'), function(link) {
    // An [up-expand] area preloads its link, so we check whether we can preload that link.
    if (!isPreloadDisabled(effectiveLink(link))) {
      let doPreload: t.FollowCallback = (options) => muteUncriticalRejection(preload(link, options))
      // We need to map several cases here:
      //
      // (1) <a up-preload>              => 'hover'
      // (2) <a up-preload="">           => 'hover'
      // (3) <a up-preload="true">       => 'hover'
      // (4) <a up-preload="up-preload"> => 'hover'
      // (5) <a up-preload="insert">     => 'insert
      // (6) <a up-preload="false">      => do nothing (already excluded by config.noPreloadSelectors)
      // (7) <a>                         => only do something if we have it in config.preloadSelectors
      let condition = e.booleanOrStringAttr(link, 'up-preload')
      if (condition === true || u.isUndefined(condition)) condition = 'hover'
      onLoadCondition(condition, link, doPreload)
    }
  })

  on('up:framework:reset', reset)
}

export const api = {
  link: {
    follow,
    followOptions,
    preload,
    makeFollowable,
    isSafe,
    isFollowable,
    config: linkConfig,
    loadDeferred,
  },
  follow,
  deferred: { load: loadDeferred },
}
