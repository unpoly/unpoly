up.Rect = class Rect extends up.Record {

  keys() {
    return [
      'left',
      'top',
      'width',
      'height'
    ]
  }

  get bottom() {
    return this.top + this.height
  }

  get right() {
    return this.left + this.width
  }

  grow(padding) {
    this.left -= padding
    this.top -= padding
    this.width += padding * 2
    this.height += padding * 2
  }

  static fromElement(element) {
    return new (this)(element.getBoundingClientRect())
  }

  static fromElementAsFixed(element) {
    // We create a clone with `position: fixed` instead of temporarily setting the position: fixed.
    // This avoids re-layouting any elements below `element` in the DOM.
    // The clone should be rendered on its own compositing layer.
    let fixedClone = element.cloneNode(true)
    element.after(fixedClone)
    fixedClone.style.position = 'fixed'
    let rect = this.fromElement(fixedClone)
    fixedClone.remove()
    return rect
  }

}
