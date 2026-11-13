import { fail } from '../error.js'
import { isAlive } from '../fragment.js'
import { bodyShifter } from '../viewport.js'
import type * as t from './types.js'
import { Overlay } from './overlay.js'
import { Tether } from './tether.js'

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

  createElements(): void {
    if (!this.origin) {
      fail('Missing { origin } option')
    }

    // We first construct an un-started Tether object so we can
    // ask for its parent element.
    this._tether = new Tether({
      anchor: this.origin as HTMLElement,
      // The popup's mode config defaults both.
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
