const u = up.util

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

  static fromElement(element) {
    return new (this)(element.getBoundingClientRect())
  }

}