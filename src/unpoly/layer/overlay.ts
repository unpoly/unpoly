import * as u from '../util.js'
import * as e from '../element.js'
import { OptionsParser } from '../element/options_parser.js'
import { fail, muteUncriticalSync } from '../error.js'
import { haltEvent, on, onEscape, type UnbindFn } from '../event.js'
import { focusedField, formFieldSelector, Params } from '../form.js'
import { destroy, getAllFragments, isAlive } from '../fragment.js'
import { isWithinForeignOverlay } from '../layer.js'
import { type ClickEvent } from '../link.js'
import { printUserEvent } from '../log.js'
import { animate, isNone, type AnimationFn, type AnimationValue } from '../motion.js'
import { type UpResponse } from '../network.js'
import { readData } from '../script.js'
import { bodyShifter } from '../viewport.js'
import type * as t from './types.js'
import { Layer } from './layer.js'
import { closeLayer } from './close_layer.js'
import { OverlayFocus } from './overlay_focus.js'
import { Tether } from './tether.js'

// A function that closes an overlay, like `up.Layer#accept()` or `up.Layer#dismiss()`.
type CloseFn = (value: any, options?: t.LayerCloseOptions) => void

export abstract class Overlay extends Layer {

  declare class?: string
  declare backdrop: boolean
  // The constructor turns the option (true, false or a string) into an array of methods.
  declare dismissible: string[]
  declare dismissLabel: string
  declare dismissARIALabel: string
  declare openAnimation: t.LayerAnimation
  declare closeAnimation: t.LayerAnimation
  declare openDuration: number
  declare closeDuration: number
  declare openEasing: string
  declare closeEasing: string
  declare trapFocus: boolean
  declare onOpened?: u.AnyFunction
  declare onAccept?: u.AnyFunction
  declare onAccepted?: u.AnyFunction
  declare onDismiss?: u.AnyFunction
  declare onDismissed?: u.AnyFunction
  declare onAcceptedReload?: string
  declare onDismissedReload?: string
  declare acceptEvent?: string
  declare dismissEvent?: string
  // The constructor turns the option (a URL pattern string) into an UpURLPattern.
  declare acceptLocation?: u.UpURLPattern
  declare dismissLocation?: u.UpURLPattern
  declare acceptFragment?: string
  declare dismissFragment?: string
  declare nesting: number
  declare backdropElement?: HTMLElement
  declare viewportElement?: HTMLElement
  declare dismissElement?: HTMLElement
  declare overlayFocus: OverlayFocus
  declare _unbindParentClicked?: UnbindFn
  declare _unbindEscapePressed?: UnbindFn
  declare wasEverVisible?: boolean

  constructor(options: t.LayerOptions) {
    super(options)

    // How the overlay looks and animates (see OVERLAY_VISUAL_KEYS)
    this.position = options.position
    this.align = options.align
    this.size = options.size
    this.origin = options.origin // for tethered anchor element
    this.class = options.class
    this.backdrop = options.backdrop
    this.dismissLabel = options.dismissLabel
    this.dismissARIALabel = options.dismissARIALabel
    this.openAnimation = options.openAnimation
    this.closeAnimation = options.closeAnimation
    this.openDuration = options.openDuration
    this.closeDuration = options.closeDuration
    this.openEasing = options.openEasing
    this.closeEasing = options.closeEasing
    this.trapFocus = options.trapFocus

    // Events and close conditions
    this.onOpened = options.onOpened
    this.onAccept = options.onAccept
    this.onAccepted = options.onAccepted
    this.onDismiss = options.onDismiss
    this.onDismissed = options.onDismissed
    this.onAcceptedReload = options.onAcceptedReload
    this.onDismissedReload = options.onDismissedReload
    this.acceptEvent = options.acceptEvent
    this.dismissEvent = options.dismissEvent
    this.acceptLocation = options.acceptLocation && new u.UpURLPattern(options.acceptLocation)
    this.dismissLocation = options.dismissLocation && new u.UpURLPattern(options.dismissLocation)
    this.acceptFragment = options.acceptFragment
    this.dismissFragment = options.dismissFragment

    // We need to mark the layer as "opening" so its topmost swappable element
    // does not resolve from the :layer pseudo-selector. Since :layer is a part of
    // up.fragment.config.mainTargets and :main is a part of fragment.config.autoHistoryTargets,
    // this would otherwise cause auto-history for *every* overlay regardless of initial target.
    this.state = 'opening'

    if (options.dismissible === true) {
      this.dismissible = ['button', 'key', 'outside']
    } else if (options.dismissible === false) {
      this.dismissible = []
    } else {
      this.dismissible = u.getSimpleTokens(options.dismissible)
    }
  }

  callback(name: string): u.AnyFunction | undefined {
    // Only binds the callback to the layer instance.
    // Note if the callback was created by an UJS attribute like [up-on-accepted], the
    // callback is already bound to the origin element to mimic the behavior of built-in
    // handler attributes like [onclick]. In that case our additional bind() will have
    // no effect.
    //
    // The up.layer.current value within a callback is controlled by the event
    // emission in OpenLayerPlan and closeLayer()
    //
    // The name is a callback property like 'onAccepted', built from a string by closeLayer().
    let fn = (this as u.PlainObject)[name]
    if (fn) {
      return fn.bind(this)
    }
  }

  // Each subclass creates its elements in its own way, and calls createElement() to create the container.
  abstract createElements(): void

  createElement(parentElement: Element): void {
    this.nesting ||= this._suggestVisualNesting()
    const elementAttrs = u.compactObject(u.pick(this, ['align', 'position', 'size', 'class', 'nesting']))
    this.element = this.affixPart(parentElement, null, elementAttrs)
  }

  createBackdropElement(parentElement: Element): void {
    this.backdropElement = this.affixPart(parentElement, 'backdrop')
  }

  createViewportElement(parentElement: Element): void {
    // Give the viewport element an [up-viewport] attribute so it will be found
    // by up.viewport.get().
    this.viewportElement = this.affixPart(parentElement, 'viewport', { 'up-viewport': '' })
  }

  createBoxElement(parentElement: Element): void {
    this.boxElement = this.affixPart(parentElement, 'box')
  }

  createContentElement(parentElement: Element): void {
    this.contentElement = this.affixPart(parentElement, 'content')
  }

  setContent(content: Node): void {
    // Set by createElements().
    this.contentElement!.append(content)
    this.onContentSet()
  }

  // Optional callback used by sub-classes
  onContentSet(): void {
  }

  createDismissElement(parentElement: Element): HTMLElement {
    this.dismissElement = this.affixPart(parentElement, 'dismiss', {
      'up-dismiss': '":button"', // value must be JSON
      'aria-label': this.dismissARIALabel
    })
    // Since the dismiss button already has an accessible [aria-label]
    // we hide the "X" label from screen readers.
    return e.affix(this.dismissElement, 'span[aria-hidden="true"]', { text: this.dismissLabel })
  }

  affixPart(parentElement: Element, part: string | null, options: u.PlainObject = {}): HTMLElement {
    return e.affix(parentElement, this.selector(part), options)
  }

  static selector(part?: string | null): string {
    return u.compact(['up', this.mode, part]).join('-')
  }

  _suggestVisualNesting(): number {
    // An overlay always has a parent. Only an overlay parent can have our mode.
    const parent = this.parent as Overlay
    if (this.mode === parent.mode) {
      return 1 + parent._suggestVisualNesting()
    } else {
      return 0
    }
  }

  setupHandlers(): void {
    super.setupHandlers()

    this.overlayFocus = new OverlayFocus(this)

    if (this._supportsDismissMethod('button')) {
      this.createDismissElement(this.getBoxElement())
    }

    if (this._supportsDismissMethod('outside')) {
      // If this overlay has its own viewport, a click outside the frame will hit
      // the viewport and not the parent element.
      if (this.viewportElement) {
        on(this.viewportElement, 'up:click', (event) => {
          // Don't react when a click into the overlay frame bubbles to the viewportElement
          if (event.target === this.viewportElement) {
            this._onOutsideClicked(event, true)
          }
        })
      } else {
        // Only bind to the parent if there's not already a viewport.
        // This prevents issues with other overlay libs appending elements to document.body,
        // but overlaying this overlay with a huge z-index. Clicking such a foreign overlay
        // would close this layer, as Unpoly considers it to be on the root layer (our parent).2
        this._unbindParentClicked = this.parent!.on('up:click', (event, element) => {
          if (!isWithinForeignOverlay(element)) {
            // When our origin is clicked again, halt the click event
            // We achieve this by halting the click event.
            const originClicked = this.origin && this.origin.contains(element)
            this._onOutsideClicked(event, originClicked)
          }
        })
      }
    }

    if (this._supportsDismissMethod('key')) {
      this._unbindEscapePressed = onEscape((event) => this.onEscapePressed(event))
    }

    // <a up-accept="value">OK</a>
    this.registerAttrCloser('up-accept', (value, closeOptions) => {
      this.accept(value, closeOptions)
    })

    // <a up-dismiss="value">Cancel</a>
    this.registerAttrCloser('up-dismiss', (value, closeOptions) => {
      this.dismiss(value, closeOptions)
    })

    up.migrate.registerLayerCloser?.(this)

    // let { userId } = await up.layer.open({ acceptEvent: 'user:show' })
    // _registerExternalEventCloser() will fill in this and arguments.
    this._registerExternalEventCloser(this.acceptEvent, this.accept)
    this._registerExternalEventCloser(this.dismissEvent, this.dismiss)

    this.on('up:click', 'label[for]', (event, label) => this._onLabelForClicked(event, label))
  }

  _onLabelForClicked(event: Event, label: Element): void {
    // We do our own focus logic when the user clicks an label[for].
    // If an input with the same [id] is on an ancestor layer the browser would
    // focus that (even though label and input are in different forms).
    // The browser always focuses the first input matching the ID from [for].
    // The listener only matches label[for].
    let id = label.getAttribute('for')!
    let fieldSelector = formFieldSelector(e.idSelector(id))

    let fieldsAnywhere = getAllFragments(fieldSelector, { layer: 'any' })
    let fieldsInLayer = getAllFragments(fieldSelector, { layer: this })

    // We would much rather not interfere with label clicking logic,
    // and let the browser do its thing. Hence we only interfere if there
    // are multiple matching inputs, and the first one is not in this layer.
    if (fieldsAnywhere.length > 1 && fieldsInLayer[0] !== fieldsAnywhere[0]) {
      event.preventDefault()

      const field = fieldsInLayer[0]

      field.focus()

      if (field.matches('input[type=checkbox], input[type=radio]')) {
        field.click()
      }
    }
  }

  _onOutsideClicked(event: ClickEvent, halt?: boolean): void {
    printUserEvent(event)
    // We still halt a click we ignore below, or a popup's origin would be followed again.
    if (halt) haltEvent(event)

    // When the user double-clicks a link that opens an overlay right away, the second click
    // lands outside the new overlay. We don't want to dismiss the overlay the user just opened.
    // The up:click event has no { detail }, so we read the click count from the native event.
    // Keyboard activations and element.click() have a { detail } of 0.
    // Without an original event we compare undefined, which is never > 1.
    if (event.originalEvent?.detail > 1) return

    muteUncriticalSync(() =>
      this.dismiss(':outside', { origin: event.target })
    )
  }

  onEscapePressed(event: KeyboardEvent): void {
    // A widget within the overlay may handle Escape itself, e.g. to close a dropdown.
    if (event.defaultPrevented) return

    // All overlays listen to the Escape key being pressed, but only the front layer
    // should react. Note that we're using the *front* layer, not the *current* layer.
    // The current layer might be in the visual background, e.g. if a fragment is being
    // compiled in a background layer.
    if (this.isFront()) {
      let field = focusedField()
      if (field) {
        // Allow screen reader users to get back to a state where they can dismiss the
        // modal with escape.
        (field as HTMLElement).blur()
      } else if (this._supportsDismissMethod('key')) {
        haltEvent(event, { log: true })
        muteUncriticalSync(() =>
          this.dismiss(':key')
        )
      }
    }
  }

  registerAttrCloser(attribute: string, closeFn: CloseFn): void {
    this._registerClickCloser(attribute, closeFn)
    this._registerSubmitCloser(attribute, closeFn)
  }

  _registerClickCloser(attribute: string, closeFn: CloseFn): void {
    // Allow the fallbacks to be both vanilla links and Unpoly [up-follow] links
    this.on('up:click', `[${attribute}]:not(form)`, (event, link) => {
      // Since we're defining this handler on up.Overlay, we will not prevent
      // a link from being followed on the root layer.
      haltEvent(event, { log: true })

      const value = e.jsonAttr(link, attribute)
      this._onAttrCloserActivated(link, value, closeFn)
    })
  }

  _registerSubmitCloser(attribute: string, closeFn: CloseFn): void {
    // Allow the fallbacks to be both vanilla forms and Unpoly [up-submit] forms
    this.on('submit', `[${attribute}]`, (event, element) => {
      // Since we're defining this handler on up.Overlay, we will not prevent
      // a form from being submitted on the root layer.
      haltEvent(event, { log: true })

      // (1) `element` is whichever element carries the attribute, which for the documented
      //     markup is the form itself. Read the form from the event instead, so we cannot
      //     hand a non-form to up.Params.fromForm().
      // (2) The opener is interested in the form's full params, including the button the user
      //     pressed. When nothing submitted the form (a script dispatched the event) there is
      //     no button to attribute, and we must not guess the form's first one.
      const value = Params.fromForm(event.target as HTMLFormElement, { submitButton: event.submitter ?? false })
      this._onAttrCloserActivated(element, value, closeFn)
    })
  }

  _onAttrCloserActivated(origin: Element, value: any, closeFn: CloseFn): void {
    const closeOptions = { origin }
    const parser = new OptionsParser(origin, closeOptions)
    parser.booleanOrString('animation')
    parser.string('easing')
    parser.number('duration')
    parser.booleanOrString('confirm')

    muteUncriticalSync(() => closeFn(value, closeOptions))
  }

  _registerExternalEventCloser(eventTypes: string | undefined, closeFn: CloseFn): UnbindFn | undefined {
    if (!eventTypes) { return }
    return this.on(eventTypes, (event) => {
      event.preventDefault()
      muteUncriticalSync(() =>
        closeFn.call(this, event, { response: event.response })
      )
    })
  }

  tryAcceptForElements(newElements: Element[], response?: UpResponse): void {
    this._tryCloseForElements(this.acceptFragment, this.accept, newElements, response)
  }

  tryDismissForElements(newElements: Element[], response?: UpResponse): void {
    this._tryCloseForElements(this.dismissFragment, this.dismiss, newElements, response)
  }

  _tryCloseForElements(selector: string | undefined, closeFn: CloseFn, newElements: Element[], response?: UpResponse): void {
    // Without a selector we look for "undefined", which matches nothing.
    let match = u.findResult(newElements, (element) => e.subtreeFirst(element, selector!))
    if (match) {
      const closeValue = readData(match)
      muteUncriticalSync(() =>
        closeFn.call(this, closeValue, { response })
      )
    }
  }

  tryAcceptForLocation(newLocation?: string | false, response?: UpResponse): void {
    this._tryCloseForLocation(newLocation, this.acceptLocation, this.accept, response)
  }

  tryDismissForLocation(newLocation?: string | false, response?: UpResponse): void {
    this._tryCloseForLocation(newLocation, this.dismissLocation, this.dismiss, response)
  }

  _tryCloseForLocation(newLocation: string | false | undefined, urlPattern: u.UpURLPattern | undefined, closeFn: CloseFn, response?: UpResponse): void {
    let resolution = newLocation && urlPattern?.recognize(newLocation)
    if (resolution) {
      // resolution now contains named capture groups, e.g. when
      // '/decks/:deckId/cards/:cardId' is matched against
      // '/decks/123/cards/456' resolution is { deckId: 123, cardId: 456 }.
      const closeValue = { ...resolution, location: newLocation }
      muteUncriticalSync(() =>
        closeFn.call(this, closeValue, { response })
      )
    }
  }

  teardownHandlers(): void {
    super.teardownHandlers()
    this._unbindParentClicked?.()
    this._unbindEscapePressed?.()
  }

  destroyElements(options: t.LayerCloseOptions): void {
    const animationProps = this.closeAnimationProps(options)

    const onFinished = () => {
      this.onElementsRemoved() // callback for layer implementations that need to clean up
      options.onFinished?.() // callback for callers of up.layer.dismiss/accept()
    }

    // Do not re-use `options`, or we would call startCloseAnimation(animation: startCloseAnimation)!
    destroy(this.element, {
      ...options,
      ...animationProps,
      onFinished,
      log: false,
    })
  }

  // Optional callback used by sub-classes
  onElementsRemoved(): void {
  }

  _animationFn(boxAnimation: AnimationValue | undefined, backdropAnimation: AnimationValue): AnimationFn | false {
    // If we don't animate the box, we don't animate the backdrop either.
    if (isNone(boxAnimation)) return false

    // Only animate the backdrop element if this layer has a backdrop.
    backdropAnimation = this.backdrop && backdropAnimation

    return (_element, animateOptions) => {
      const boxDone = animate(this.getBoxElement(), boxAnimation, animateOptions)
      const backdropDone = animate(this.backdropElement, backdropAnimation, animateOptions)

      // Promise.all() ignores non-Thenables in the given array
      return Promise.all([boxDone, backdropDone])
    }
  }

  startOpenAnimation(options: t.LayerAnimationOptions = {}): Promise<void> {
    const animationProps = this.openAnimationProps(options)
    const onFinished = () => {
      this.wasEverVisible = true
      options.onFinished?.()
    }

    return animate(this.element, animationProps.animation, { ...animationProps, onFinished })
  }

  openAnimationProps(options: t.LayerAnimationOptions = {}): t.LayerAnimationOptions {
    let boxAnimation = options.animation ?? this.evalOption(this.openAnimation)
    let backdropAnimation = 'fade-in' // _animationFn() will ignore this animation unless the box is also animating
    let animationFn = this._animationFn(boxAnimation, backdropAnimation)

    return {
      animation: animationFn,
      easing: options.easing || this.openEasing,
      duration: options.duration || this.openDuration,
    }
  }

  closeAnimationProps(options: t.LayerAnimationOptions = {}): t.LayerAnimationOptions {
    let boxAnimation =  this.wasEverVisible && (options.animation ?? this.evalOption(this.closeAnimation))
    let backdropAnimation = 'fade-out' // _animationFn() will ignore this animation unless the box is also animating
    let animationFn = this._animationFn(boxAnimation, backdropAnimation)

    return {
      animation: animationFn,
      easing: options.easing || this.closeEasing,
      duration: options.duration ?? this.closeDuration,
    }
  }

  isAlive(): boolean {
    // includes() takes an undefined state and returns false.
    return ['opening', 'opened'].includes(this.state!)
  }

  // Documented in up.Layer
  accept(value: any = null, options: t.LayerCloseOptions = {}): void {
    return this._close('accept', value, options)
  }

  // Documented in up.Layer
  dismiss(value: any = null, options: t.LayerCloseOptions = {}): void {
    return this._close('dismiss', value, options)
  }

  _supportsDismissMethod(method: string): boolean {
    return u.contains(this.dismissible, method)
  }

  _close(verb: 'accept' | 'dismiss', value: any, options: t.LayerCloseOptions): void {
    // The cast allows { confirm: true }, which assertConfirmed() handles like { confirm: false }.
    closeLayer({ ...options, verb, value, layer: this } as t.CloseLayerOptions)
  }

  getFirstSwappableElement(): HTMLElement {
    return this.getContentElement().children[0] as HTMLElement
  }

  toString(): string {
    return `${this.mode} overlay`
  }
}

export class OverlayWithViewport extends Overlay {

  // For stubbing in tests
  static getParentElement(): HTMLElement {
    // Always make a fresh lookup of the <body>, since the <body>
    // might be swapped out with a new element.
    return document.body
  }

  createElements(): void {
    bodyShifter.raiseStack()
    this.createElement((this.constructor as typeof OverlayWithViewport).getParentElement())
    if (this.backdrop) { this.createBackdropElement(this.element) }
    this.createViewportElement(this.element)
    // The calls above set each parent element.
    this.createBoxElement(this.viewportElement!)
    this.createContentElement(this.boxElement!)
  }

  onElementsRemoved(): void {
    bodyShifter.lowerStack()
  }

  sync(): void {
    // A swapping of <body> might have removed this overlay from the DOM, so we
    // attach it again.
    //
    // We also check #isOpen() in case some async code calls #sync() on a layer
    // that was already closed. In that case don't run the code below that might
    // re-attach the overlay.
    if (this.isAlive() && !this.element.isConnected) {
      (this.constructor as typeof OverlayWithViewport).getParentElement().appendChild(this.element)
    }
  }
}

export class ModalLayer extends OverlayWithViewport {
  static mode: t.LayerMode = 'modal'
}

export class DrawerLayer extends OverlayWithViewport {
  static mode: t.LayerMode = 'drawer'
}

export class CoverLayer extends OverlayWithViewport {
  static mode: t.LayerMode = 'cover'
}

export class OverlayWithTether extends Overlay {
  declare _tether: Tether

  constructor(options: t.LayerOptions) {
    super(options)
    // The default alignment follows the axis of the position.
    this.align ??= (this.position === 'top' || this.position === 'bottom') ? 'left' : 'top'
  }

  createElements(): void {
    if (!this.origin) {
      fail('Missing { origin } option')
    }

    // We first construct an un-started Tether object so we can
    // ask for its parent element.
    this._tether = new Tether({
      anchor: this.origin as HTMLElement,
      // The popup's mode config defaults the position, our constructor the alignment.
      align: this.align!,
      position: this.position!
    })
    this.createElement(this._tether.parent)
    this.createContentElement(this.element)
  }

  onContentSet(): void {
    this._tether.start(this.element)
  }

  onElementsRemoved(): void {
    this._tether.stop()
  }

  sync(): void {
    // In case some async code calls #sync() on a layer that was already closed,
    // don't run the code below that might re-attach the overlay.
    if (!this.isAlive()) return

    if (isAlive(this.element) && this._tether.isAlive()) {
      // The fragment update might have moved elements around.
      // This is a good moment to sync our position relative to the anchor.
      this._tether.sync()
    } else {
      // If our tether parent and anchor is gone, the best thing we can
      // do now is to dismiss ourselves and have a consistent layer stack.
      this.dismiss(
        ':detached', {      // custom dismiss value so listeners can distinguish from other dismissals
        animation: false,   // no need to animate since we're already hidden
        preventable: false  // since we're cleaning up a broken stack, don't allow user intervention
      })
    }
  }
}

export class PopupLayer extends OverlayWithTether {
  static mode: t.LayerMode = 'popup'
}
