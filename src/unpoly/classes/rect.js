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

}
