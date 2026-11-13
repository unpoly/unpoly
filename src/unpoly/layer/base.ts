import * as u from '../util.js'
import * as e from '../element.js'
import { Aborted, NotImplemented } from '../error.js'
import {
  emitParsed, EventListenerGroup, on, parseEmitArgs, type EmitProps, type EmittedEvent,
  type EventEmitterOptions, type EventPlan, type EventTypes, type ListenerArgs, type ObservedEvent,
  type UnbindFn,
} from '../event.js'
import { type RenderOptions } from '../fragment.js'
import {
  currentLocation, findMetaTags, getLang, isHistoryEnabled, pushLocation, updateLang,
  updateMetaTags, type HistoryAspect, type LocationChangedEvent,
} from '../history.js'
import { closestLayerElement, mainTargets } from '../layer.js'
import { convertClicks } from '../link.js'
import { newStateCache } from '../viewport.js'
import type * as t from './types.js'
import { type LayerStack } from './layer_stack.js'
import { type Overlay } from './modes/overlay.js'
import { type OverlayFocus } from './overlay_focus.js'

export class Layer {
  // Each subclass has its mode, like ModalLayer.mode = 'modal'.
  declare static mode: t.LayerMode
  // 'up.Layer' for every mode, set in unpoly.ts.
  declare [Symbol.toStringTag]: string
  declare stack: LayerStack
  declare lastScrollTops: u.FIFOCache<string, any>
  declare lastFocusCapsules: u.FIFOCache<string, any>
  // Overlays set the elements that they create. The root layer has none of them.
  declare contentElement?: HTMLElement
  declare boxElement?: HTMLElement
  declare overlayFocus?: OverlayFocus
  declare state?: t.LayerState
  declare _index?: number
  declare _unbindLocationChanged?: UnbindFn
  declare _savedTitle?: string
  declare _savedMetaTags?: u.List<Element>
  declare _savedLocation?: string
  declare _savedLang?: string

  // The root layer sets the element in its constructor, and an overlay sets it when it opens.
  declare element: HTMLElement

  // While an overlay with { history: 'auto' } opens, OpenLayerPlan decides between true and false.
  declare history: boolean | 'auto'

  declare mode: t.LayerMode

  declare context: u.PlainObject

  // Only overlays have these. They are documented with up.Layer in overlay.ts.
  declare origin?: Element
  declare size?: string
  declare position?: string
  declare align?: string

  constructor(options: t.LayerOptions = {}) {
    // Like a default parameter, a default only replaces an undefined option.
    const {
      context = {},
      lastScrollTops = newStateCache(),
      lastFocusCapsules = newStateCache(),
    } = options

    // A layer has no { element } option. The root layer sets its element in its constructor, and
    // an overlay creates its element when it opens.
    // buildLayer() always passes these. The mode configs default { history }.
    this.stack = options.stack!
    this.history = options.history!
    this.mode = options.mode!
    this.context = context
    this.lastScrollTops = lastScrollTops
    this.lastFocusCapsules = lastFocusCapsules
    u.assert(this.mode)
  }

  setupHandlers(): void {
    convertClicks(this)
    this._unbindLocationChanged = on('up:location:changed', (event) => this._onBrowserLocationChanged(event))
  }

  teardownHandlers(): void {
    this._unbindLocationChanged?.()
  }

  mainTargets(): string[] {
    return mainTargets(this.mode)
  }

  sync(): void {
    // no-op so users can blindly sync without knowing the current mode
  }

  accept(value?: any, options?: t.LayerCloseOptions): void
  accept(): void {
    throw new NotImplemented()
  }

  dismiss(value?: any, options?: t.LayerCloseOptions): void
  dismiss(): void {
    throw new NotImplemented()
  }

  peel(options?: t.PeelOptions): void {
    this.stack.peel(this, options)
  }

  evalOption<T>(option: u.ValueOrFunction<T>): T {
    return u.evalOption(option, this)
  }

  isCurrent(): boolean {
    return this.stack.isCurrent(this)
  }

  isFront(): boolean {
    return this.stack.isFront(this)
  }

  isRoot(): boolean {
    return this.stack.isRoot(this)
  }

  isOverlay(): this is Overlay {
    return this.stack.isOverlay(this)
  }

  isAlive(): boolean {
    throw new NotImplemented()
  }

  assertAlive(): void {
    if (!this.isAlive()) {
      // Wind up the call stack. Whoever has closed the layer will also clean up
      // elements, handlers, etc.
      throw new Aborted("Layer is no longer alive")
    }
  }

  get parent(): Layer | undefined {
    return this.stack.parentOf(this)
  }

  get child(): Layer | undefined {
    return this.stack.childOf(this)
  }

  get ancestors(): Layer[] {
    return this.stack.ancestorsOf(this)
  }

  get descendants(): Layer[] {
    return this.stack.descendantsOf(this)
  }

  get subtree(): Layer[] {
    return [this, ...this.descendants]
  }

  get index(): number {
    return this._index ??= this.stack.indexOf(this)
  }

  getContentElement(): HTMLElement {
    return this.contentElement || this.element
  }

  getBoxElement(): HTMLElement {
    return this.boxElement || this.element
  }

  getFocusElement(): HTMLElement {
    return this.getBoxElement()
  }

  getFirstSwappableElement(): HTMLElement {
    throw new NotImplemented()
  }

  contains(element: Element): boolean {
    // Test that the closest parent is the element and not another layer with elements nested
    // into this layer's element.
    return closestLayerElement(element) === this.element
  }

  on<T extends EventTypes>(types: T, ...args: ListenerArgs<ObservedEvent<T>>): UnbindFn
  on(...args: unknown[]): UnbindFn {
    return this._buildEventListenerGroup(args).bind()
  }

  off<T extends EventTypes>(types: T, ...args: ListenerArgs<ObservedEvent<T>>): void
  off(...args: unknown[]): void {
    return this._buildEventListenerGroup(args).unbind()
  }

  _buildEventListenerGroup(args: any[]): EventListenerGroup {
    return EventListenerGroup.fromBindArgs(args, {
      guard: (event: Event) => this._containsEventTarget(event),
      elements: [this.element],
      baseLayer: this
    })
  }

  _containsEventTarget(event: Event): boolean {
    // Since the root layer will receive events emitted on descendant layers
    // we need to manually check whether the event target is contained
    // by this layer.
    return this.contains(event.target as Element)
  }

  wasHitByMouseEvent({ clientX, clientY }: MouseEvent): boolean {
    const hittableElement = document.elementFromPoint(clientX, clientY)
    return !hittableElement || this.contains(hittableElement)
  }

  _parseEmitArgs(args: any[]): EventEmitterOptions {
    return parseEmitArgs(args, { layer: this })
  }

  emit<T extends string>(eventType: T, props?: EmitProps): EmittedEvent<T>
  emit<T extends string>(eventPlan: EventPlan<T>): EmittedEvent<T>
  emit<E extends Event>(event: E, options?: EmitProps): E
  emit<T extends string>(target: EventTarget, eventType: T, props?: EmitProps): EmittedEvent<T>
  emit<E extends Event>(target: EventTarget, event: E, options?: EmitProps): E
  emit(...args: unknown[]): Event {
    return emitParsed(this._parseEmitArgs(args))
  }

  saveHistory(): void {
    // (1) showsLiveHistory() would always return false unless we're the front layer
    // (2) Getters like this.title would always return this._savedTitle unless we're the front layer
    u.assert(this.isFront())

    // (1) Only save the aspects that Unpoly keeps in sync with the browser.
    // (2) An aspect that is not live already holds what this layer rendered.
    //     If the root layer has not rendered it yet, its getter keeps following the browser.
    if (this.showsLiveHistory('title')) this._savedTitle = document.title
    if (this.showsLiveHistory('metaTags')) this._savedMetaTags = findMetaTags()
    if (this.showsLiveHistory('location')) this._savedLocation = currentLocation()
    if (this.showsLiveHistory('lang')) this._savedLang = getLang()
  }

  restoreHistory(): void {
    // Only restore the aspects that Unpoly keeps in sync with the browser.
    // The app may have changed an excluded aspect while an overlay was open.

    // We may not have a #savedLocation when we were opened from an HTML string instead of a URL.
    if (this._savedLocation && this.showsLiveHistory('location')) {
      // We cannot use the `this.title` setter as that does not
      // push a state if `newLocation === this._savedLocation`.
      pushLocation(this._savedLocation)
    }

    if (this._savedTitle && this.showsLiveHistory('title')) {
      document.title = this._savedTitle
    }

    if (this._savedMetaTags && this.showsLiveHistory('metaTags')) {
      updateMetaTags(this._savedMetaTags)
    }

    if (u.isString(this._savedLang) && this.showsLiveHistory('lang')) {
      updateLang(this._savedLang)
    }
  }

  asCurrent<T>(fn: () => T): T {
    return this.stack.asCurrent(this, fn)
  }

  updateHistory(options: RenderOptions): void {
    // (1) The layer always stores the values it rendered.
    // (2) The updaters only change the browser for an aspect that Unpoly keeps in sync (see showsLiveHistory()).
    //     Since up.history.config.enabled can exclude aspects, render options can only narrow the config,
    //     never update an aspect that it excludes.

    // Set unless { location: false }
    if (u.isString(options.location)) {
      this.updateLocation(options.location, { push: true })
    }

    // Set unless { metaTags: false }
    if (u.isList(options.metaTags)) {
      up.migrate?.warnOfHungryMetaTags?.(options.metaTags)
      this._updateMetaTags(options.metaTags)
    }

    // Set unless { title: false }
    if (u.isString(options.title)) {
      this.updateTitle(options.title)
    }

    // Set unless { lang: false }
    if (u.isString(options.lang)) {
      this._updateLang(options.lang)
    }
  }

  // Returns whether Unpoly keeps the given history aspect of the browser in sync with this layer.
  // The aspect is one of 'location', 'title', 'metaTags' or 'lang'.
  showsLiveHistory(aspect: HistoryAspect): boolean {
    return this.history && this.isFront() && isHistoryEnabled(aspect)
  }

  // A layer's title, meta tags, lang or location is what it rendered,
  // unless Unpoly keeps that aspect of the browser in sync with the layer.
  _getHistory<T>(aspect: HistoryAspect, savedValue: T, getLiveValue: () => T): T {
    // (1) Read a live aspect from the browser, so Unpoly-unaware code can change it directly,
    //     e.g. by setting document.title or calling history.pushState().
    // (2) Until the root layer has rendered a value, it shows what the initial page shows.
    if (this.showsLiveHistory(aspect) || (this.isRoot() && savedValue === undefined)) {
      return getLiveValue()
    } else {
      return savedValue
    }
  }

  _onBrowserLocationChanged({ location }: LocationChangedEvent): void {
    if (this.showsLiveHistory('location')) {
      this.updateLocation(location, { push: false })
    }
  }

  get title(): string | undefined {
    return this._getHistory('title', this._savedTitle, () => document.title)
  }

  // No _ prefix: specs spy on this name, and _-prefixed members are mangled in the minified build.
  updateTitle(title: string): void {
    this._savedTitle = title

    if (this.showsLiveHistory('title')) {
      document.title = title
    }
  }

  get metaTags(): u.List<Element> | undefined {
    return this._getHistory('metaTags', this._savedMetaTags, findMetaTags)
  }

  _updateMetaTags(metaTags: u.List<Element>): void {
    this._savedMetaTags = metaTags

    if (this.showsLiveHistory('metaTags')) {
      updateMetaTags(metaTags)
    }
  }

  get lang(): string | undefined {
    return this._getHistory('lang', this._savedLang, getLang)
  }

  _updateLang(lang: string): void {
    this._savedLang = lang

    if (this.showsLiveHistory('lang')) {
      updateLang(lang)
    }
  }

  get location(): string | undefined {
    // (1) When up.history.config.enabled excludes 'location', this returns the location of the
    //     rendered content, not the unchanged browser URL. Hence [up-nav] follows the content.
    // (2) When the location is live, Unpoly-unaware code may use the pushState API directly.
    //     This will implicitly change the front layer's location.
    return this._getHistory('location', this._savedLocation, () => currentLocation())
  }

  // No _ prefix: specs spy on this name, and _-prefixed members are mangled in the minified build.
  updateLocation(newLocation: string, { push }: { push: boolean }): void {
    let prevSavedLocation = this._savedLocation
    let liveLocation = currentLocation()

    // (A) Update _savedLocation before we push a new state below.
    //     Pushing a new state will emit up:location:changed, which will re-call updateLocation()
    // (B) Don't emit up:layer:location:changed before the browser location changed.
    this._savedLocation = newLocation

    // We compare the newLocation with the current browser location, not with _savedLocation.
    // Comparing with _savedLocation would not push a history entry in the following edge case.
    //
    // - We have the root layer at /root and an overlay on /overlay
    // - The overlay makes a request to /root with [up-layer=root]
    // - The render pass will automatically close the overlay and bring the root layer back to front ("peeling").
    // - Because we think a history state is coming, we don't insert a state for the root layer restoration (issue #397).
    // - Because newLocation is also rootLayer._savedLocation, we don't push a new state.
    // - We end up not changing the URL from /overlay to /root, because neither peeling nor the fragment update
    //   has pushed a state.
    if (newLocation !== liveLocation && this.showsLiveHistory('location') && push) {
      pushLocation(newLocation)
    }

    // (A) Only emit up:layer:location:changed after we pushed a new history entry.
    // (B) Don't emit when initially opening an overlay.
    if (newLocation !== prevSavedLocation && this.state !== 'opening') {
      this.emit('up:layer:location:changed', { location: newLocation, previousLocation: prevSavedLocation, log: false })
    }
  }

  selector(part?: string | null): string {
    return (this.constructor as typeof Layer).selector(part)
  }

  static selector(_part?: string | null): string {
    throw new NotImplemented()
  }

  toString(): string {
    throw new NotImplemented()
  }

  affix(...args: [selector: string, attrs?: u.PlainObject]): HTMLElement {
    return e.affix(this.getFirstSwappableElement(), ...args)
  }

  [u.isEqual.key](other: Layer): boolean {
    return (this.constructor === other.constructor) && (this.element === other.element)
  }

  hasFocus(): boolean {
    let focusedElement = document.activeElement
    return focusedElement !== document.body && this.element.contains(focusedElement)
  }

  reset(): void {
    this.context = {}
    this.lastScrollTops = newStateCache()
    this.lastFocusCapsules = newStateCache()
    // Reset the root layer's history, so it falls back to what the browser shows.
    this._savedTitle = undefined
    this._savedMetaTags = undefined
    this._savedLocation = undefined
    this._savedLang = undefined
  }

}

export const api = {
  Layer,
}
