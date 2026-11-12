import * as u from '../util.js'
import * as e from '../element.js'
import { guard, UpError } from '../error.js'
import { disableContainerTemp, type Params } from '../form.js'
import { getSmart, insertTemp, provideNodes } from '../fragment.js'
import {
  layerStack, open, OVERLAY_VISUAL_KEYS, type Layer, type LayerCloseEvent,
} from '../layer.js'
import { printToStandard } from '../log.js'
import { type UpRequest, type UpResponse } from '../network.js'
import { resolvePreviewFns } from '../status.js'
import type * as t from './types.js'

export class Preview {
  declare fragment?: Element
  declare request: UpRequest
  declare renderOptions: u.PlainObject
  declare _cleaner: u.Cleaner

  constructor({ fragment, request, renderOptions, cleaner }: t.PreviewOptions) {
    this.fragment = fragment
    this.request = request
    this.renderOptions = renderOptions
    this._cleaner = cleaner
  }

  undo(...args: any[]): void {
    if (this.ended) {
      // We might have the idea to immediately undo an effect when the preview has ended,
      // but it might lead to infinite loops in cases like this:
      //
      //    up.preview('broken', function(preview) {
      //      preview.show('#element')
      //      return () => preview.hide('#element')
      //    })
      reportError(new UpError('Preview used after end of request'))
    } else {
      this._cleaner.guard(...args)
    }
  }

  get origin(): Element | undefined {
    return this.request.origin
  }

  get params(): Params {
    return this.request.params
  }

  // A layer, or 'new' when the request opens an overlay.
  get layer(): Layer | 'new' {
    return this.request.layer
  }

  get ended(): boolean {
    return this.request.ended
  }

  get expiredResponse(): UpResponse | undefined {
    return this.renderOptions.expiredResponse
  }

  get revalidating(): boolean {
    return !!this.expiredResponse
  }

  run(value: any, options: u.PlainObject = {}): void {
    for (let fn of resolvePreviewFns(value)) {
      this.undo(guard(fn, this, options))
    }
  }

  revert(): void {
    this._cleaner.clean()
  }

  setAttrs(attrs: u.PlainObject): void
  setAttrs(element: e.ElementOrSelector, attrs: u.PlainObject): void
  setAttrs(...args: unknown[]): void {
    let [element, attrs] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setAttrsTemp(element, attrs))
  }

  addClass(klass: string): void
  addClass(element: e.ElementOrSelector, klass: string): void
  addClass(...args: unknown[]): void {
    let [element, klass] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.addClassTemp(element, klass))
  }

  addClassBatch(elements: Iterable<Element>, classes: string[]): void {
    for (let element of elements) {
      for (let klass of classes) {
        this.addClass(element, klass)
      }
    }
  }

  removeClass(klass: string): void
  removeClass(element: e.ElementOrSelector, klass: string): void
  removeClass(...args: unknown[]): void {
    let [element, klass] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.removeClassTemp(element, klass))
  }

  setStyle(styles: e.StyleProps): void
  setStyle(element: e.ElementOrSelector, styles: e.StyleProps): void
  setStyle(...args: unknown[]): void {
    let [element, styles] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setStyleTemp(element, styles))
  }

  disable(element?: e.ElementOrSelector): void
  disable(...args: unknown[]): void {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(disableContainerTemp(element, { preview: true }))
  }

  insert(tempValue: any): void
  insert(reference: e.ElementOrSelector, tempValue: any): void
  insert(reference: e.ElementOrSelector, position: InsertPosition, tempValue: any): void
  insert(...args: unknown[]): void {
    // (1) tempValue can have on of the following forms:
    //     - A string of HTML
    //     - A CSS selector string matching a template
    //     - An Element node
    //     - A Text node
    //     - A NodeList with mixed Element and Text nodes
    // (2) When tempValue resolves to multiple nodes, it will be wrapped
    //     in an <up-wrapper> container.
    let [reference, position = 'beforeend', tempValue] = this._parseMutatorArgs(args, 'val', u.isAdjacentPosition, 'val')
    this.undo(insertTemp(reference, position, tempValue))
  }

  show(element?: e.ElementOrSelector): void
  show(...args: unknown[]): void {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.showTemp(element))
  }

  hide(element?: e.ElementOrSelector): void
  hide(...args: unknown[]): void {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.hideTemp(element))
  }

  hideContent(parent?: e.ElementOrSelector): void
  hideContent(...args: unknown[]): void {
    let [parent] = this._parseMutatorArgs(args, 'val')
    // Place all children in a wrapper so we can hide text nodes.
    let wrapper = e.wrapChildren(parent)
    e.hide(wrapper)
    this.undo(() => e.unwrap(wrapper))
  }

  showPlaceholder(placeholder: any): void
  showPlaceholder(parent: e.ElementOrSelector, placeholder: any): void
  showPlaceholder(...args: unknown[]): void {
    let [parent, placeholderReference] = this._parseMutatorArgs(args, 'val', 'val')

    // We do not need to wrap a NodeList of mixed Text and Element nodes.
    // Both swapContent() and openLayer() can deal with that.
    let placeholderNodes = provideNodes(placeholderReference, { origin: this.origin })

    printToStandard('[up-placeholder]', 'Showing placeholder %o', placeholderReference)

    if (parent) {
      this.swapContent(parent, placeholderNodes)
    } else if (this.layer === 'new') {
      this.openLayer(placeholderNodes, { closeAnimation: false })
      // Now that the renderOptions have served as defaults for openLayer(),
      // we can disable animations for the upcoming render pass. This way
      // we don't see flickering when another overlay opens with the final content.
      this.renderOptions.openAnimation = false
    }
  }

  swapContent(newContent: any): void
  swapContent(parent: e.ElementOrSelector, newContent: any): void
  swapContent(...args: unknown[]): void {
    let [parent, newContent] = this._parseMutatorArgs(args, 'val', 'val')
    this.hideContent(parent)
    this.insert(parent, newContent)
  }

  openLayer(content: any, options: u.PlainObject = {}): Layer {
    let undoDismissValue = ':undo-preview'

    let onDismiss = ({ value }: LayerCloseEvent) => {
      // Abort the request when the user dismisses the overlay,
      // but not when we ourselves dismiss it when reverting.
      if (value !== undoDismissValue) this.request.abort({ reason: 'Preview overlay dismissed' })
    }

    open({
      ...u.pick(this.renderOptions, [...OVERLAY_VISUAL_KEYS, 'target']),
      ...options,
      content,
      abort: false,
      onDismiss
    })

    // The new overlay is already in the stack. However, this function must be be sync and cannot
    // wait a microtask for (the fulfilled) up.layer.open() promise.
    let overlay = layerStack.front

    this.undo(() => overlay.dismiss(undoDismissValue, { preventable: false }))

    return overlay
  }

  _parseMutatorArgs(args: any[], ...specs: u.ArgSpec[]): any[] {
    let [element, ...rest] = u.parseArgs(args, ...specs)
    // (1) up.fragment.get(undefined) returns undefined
    // (2) up.fragment.get(Element) returns the element
    // (3) this.fragment is undefined when opening a new layer
    element = getSmart(element, { layer: this.layer, origin: this.origin }) || this.fragment
    return [element, ...rest]
  }

}

export const api = {
  Preview,
}
