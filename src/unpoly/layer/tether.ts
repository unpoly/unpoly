import * as u from '../util.js'
import * as e from '../element.js'
import { fail } from '../error.js'
import { isAlive } from '../fragment.js'
import { closest } from '../viewport.js'

// Where a popup sits relative to its anchor (`position`), and how it lines up with the anchor (`align`).
interface TetherOptions {
  anchor: HTMLElement
  align: string
  position: string
}

export class Tether {
  declare _anchor: HTMLElement
  declare _align: string
  declare _position: string
  declare _alignAxis: 'horizontal' | 'vertical'
  declare _viewport: HTMLElement
  declare parent: HTMLElement
  declare _syncOnScroll: boolean
  declare _element: HTMLElement
  declare _syncTimer: ReturnType<typeof setTimeout>
  declare offsetLeft: number
  declare offsetTop: number

  constructor(options: TetherOptions) {
    this._anchor = options.anchor
    this._align = options.align
    this._position = options.position

    this._alignAxis = (this._position === 'top') || (this._position === 'bottom') ? 'horizontal' : 'vertical'

    this._viewport = closest(this._anchor)
    // The document viewport is <html> on some browsers, and we cannot attach children to that.
    this.parent = this._viewport === e.getRoot() ? document.body : this._viewport

    // If the offsetParent is within the viewport (or is the viewport) we can simply
    // `position: absolute` and it will move as the viewport scrolls, without JavaScript.
    // If not however, we have no choice but to move it on every scroll event.
    this._syncOnScroll = !this._viewport.contains(this._anchor.offsetParent)
  }

  start(element: HTMLElement): void {
    this._element = element
    this._element.style.position = 'absolute'
    this._setOffset(0, 0)
    this.sync()
    this._changeEventSubscription('on')
  }

  stop(): void {
    this._changeEventSubscription('off')
  }

  _changeEventSubscription(fn: 'on' | 'off'): void {
    let doScheduleSync = this._scheduleSync.bind(this)
    // up.on() and up.off() take the same arguments, but TypeScript can't call the union of their
    // overloads. So we type both as up.off().
    up[fn as 'off'](window, 'resize', doScheduleSync)
    if (this._syncOnScroll) { up[fn as 'off'](this._viewport, 'scroll', doScheduleSync) }
  }

  _scheduleSync(): void {
    // Not queueTask(), which doesn't return a timer ID we could clear.
    clearTimeout(this._syncTimer)
    this._syncTimer = setTimeout(() => this.sync())
  }

  isAlive(): boolean {
    // return !this.parent.isConnected || !this._anchor.isConnected
    return isAlive(this.parent) && isAlive(this._anchor)
  }

  sync(): void {
    const elementBox = this._element.getBoundingClientRect()

    // A computed margin is never blank.
    const elementMargin = {
      top:    e.computedStyleNumber(this._element, 'margin-top')!,
      right:  e.computedStyleNumber(this._element, 'margin-right')!,
      bottom: e.computedStyleNumber(this._element, 'margin-bottom')!,
      left:   e.computedStyleNumber(this._element, 'margin-left')!
    }

    const anchorBox = this._anchor.getBoundingClientRect()

    let left
    let top

    switch (this._alignAxis) {
      case 'horizontal': { // position is 'top' or 'bottom'
        switch (this._position) {
          case 'top':
            top = anchorBox.top - elementMargin.bottom - elementBox.height
            break
            // element
            // -------
            // margin
            // -------
            // anchor
          case 'bottom':
            top = anchorBox.top + anchorBox.height + elementMargin.top
            break
        }
            // anchor
            // ------
            // margin
            // ------
            // element
        switch (this._align) {
          case 'left':
            // anchored to anchor's left, grows to the right
            left = anchorBox.left + elementMargin.left
            break
            // mg | element
            // ------------
            // anchor
          case 'center':
            // anchored to anchor's horizontal center, grows equally to left/right
            left = anchorBox.left + (0.5 * (anchorBox.width - elementBox.width))
            break
            // e l e m e n t
            // -------------
            //    anchor
          case 'right':
            // anchored to anchor's right, grows to the left
            left = (anchorBox.left + anchorBox.width) - elementBox.width - elementMargin.right
            break
            // element | mg
            // ------------
            //       anchor
        }
        break
      }
      case 'vertical': { // position is 'left' or 'right'
        switch (this._align) {
          case 'top':
            // anchored to the top, grows to the bottom
            top = anchorBox.top + elementMargin.top
            break
            //  margin | anchor
            // --------|
            // element |
          case 'center':
            // anchored to anchor's vertical center, grows equally to left/right
            top = anchorBox.top + (0.5 * (anchorBox.height - elementBox.height))
            break
            //  ele |
            //  men | anchor
            //    t |
          case 'bottom':
            // anchored to the bottom, grows to the top
            top = (anchorBox.top + anchorBox.height) - elementBox.height - elementMargin.bottom
            break
            // element |
            // ------- |
            //  margin | anchor
        }
        switch (this._position) {
          case 'left':
            left = anchorBox.left - elementMargin.right - elementBox.width
            break
            // element | margin | anchor
          case 'right':
            left = anchorBox.left + anchorBox.width + elementMargin.left
            break
          // anchor | margin | element
        }
        break
      }
    }

    if (u.isDefined(left) && u.isDefined(top)) {
      this._moveTo(left, top)
    } else {
      fail('Invalid tether constraints: %o', this._describeConstraints())
    }
  }

  _describeConstraints(): { position: string, align: string } {
    return { position: this._position, align: this._align }
  }

  _moveTo(targetLeft: number, targetTop: number): void {
    const elementBox = this._element.getBoundingClientRect()
    this._setOffset(
      (targetLeft - elementBox.left) + this.offsetLeft,
      (targetTop - elementBox.top) + this.offsetTop
    )
  }

  _setOffset(left: number, top: number): void {
    this.offsetLeft = left
    this.offsetTop = top
    e.setInlineStyle(this._element, { left, top }, 'px')
  }
}
