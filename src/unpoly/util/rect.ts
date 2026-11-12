import type * as u from '../util.js'

export class Rect {
  declare left: number
  declare top: number
  declare width: number
  declare height: number

  // Also takes a DOMRect, whose properties are getters on its prototype.
  constructor({ left, top, width, height }: u.RectLike) {
    this.left = left
    this.top = top
    this.width = width
    this.height = height
  }

  get bottom(): number {
    return this.top + this.height
  }

  get right(): number {
    return this.left + this.width
  }

  grow(padding: number): void {
    this.left -= padding
    this.top -= padding
    this.width += padding * 2
    this.height += padding * 2
  }

  static fromElement(element: Element): Rect {
    return new (this)(element.getBoundingClientRect())
  }

  static fromElementAsFixed(element: Element): Rect {
    // We create a clone with `position: fixed` instead of temporarily setting the position: fixed.
    // This avoids re-layouting any elements below `element` in the DOM.
    // The clone should be rendered on its own compositing layer.
    let fixedClone = element.cloneNode(true) as HTMLElement
    element.after(fixedClone)
    fixedClone.style.position = 'fixed'
    let rect = this.fromElement(fixedClone)
    fixedClone.remove()
    return rect
  }

}
