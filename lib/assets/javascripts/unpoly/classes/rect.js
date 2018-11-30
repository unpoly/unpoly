up.Rect = function(props) {
  u.merge(this, u.only(props, 'left', 'top', 'width', 'height'))
};

up.Rect.prototype = {
  get bottom() {
    return this.top + this.height;
  },

  get right() {
    return this.left + this.width;
  },

  addPaddingY(padding) {
    this.top -= padding;
    this.height += padding * 2;
  }
};

up.Rect.fromElement = function(element) {
  new up.Rect(element.getBoundingClientRect())
};
