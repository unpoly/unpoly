import * as e from '../../element.js'
import { fail } from '../../error.js'
import { Layer } from '../base.js'
import type { LayerMode, LayerOptions } from '../base.js'

/**
The root layer's element. It remembers that the root layer's handlers are bound to it.
@internal
*/
export type RootLayerElement = HTMLElement & { upHandlersApplied?: boolean }

export class RootLayer extends Layer {

  static mode: LayerMode = 'root'

  declare element: RootLayerElement

  constructor(options: LayerOptions) {
    super(options)
    // Let's talk about our choice of @element for the root layer.
    //
    // 1. We don't want to use `document`, since that is for our global event bus.
    //    For instance, take a look how CloseLayer emits the up:layer:dismiss
    //    event first on `@layer.element`, then on `document`.
    //    Also `document` is not really an element, just an event target.
    // 2. We might want but cannot use <body> element. Since Unpoly boots before
    //    the DOM is ready, document.body is still undefined. We also cannot delay
    //    booting until the DOM is ready, since by then all user-defined event listeners
    //    and compilers will have registered.
    // 3. That leaves the <html> element, which is available before the DOM is ready
    //    on Chrome, Firefox, IE11, Safari.
    // 4. A nice benefit of using <html> is that up.fragment.get('html', layer: 'root')
    //    will yield a result.
    // 5. Also it's nice that elements in the <head> also belong to the root layer.
    //    Otherwise they would not belong to any layer.
    this.element = e.getRoot()
    this.setupHandlers()
  }

  getFirstSwappableElement(): HTMLElement {
    return document.body
  }

  static selector(): string {
    return 'html'
  }

  setupHandlers(): void {
    // When we reset the framework during tests, we might re-initialize this
    // layer with the same <html> element. In this case we do not want to
    // setup handlers more than once.
    if (!this.element.upHandlersApplied) {
      this.element.upHandlersApplied = true
      super.setupHandlers()
    }
  }

  isAlive(): boolean {
    return true
  }

  accept(): void {
    this._cannotCloseRoot()
  }

  dismiss(): void {
    this._cannotCloseRoot()
  }

  _cannotCloseRoot(): never {
    fail('Cannot close the root layer')
  }

  toString(): string {
    return "root layer"
  }
}
