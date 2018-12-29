(function() {
  var u = up.util

  up.Rect = function(props) {
    u.assign(this, u.only(props, 'left', 'top', 'width', 'height'))
  }

  up.Rect.prototype = {
    get bottom() {
      return this.top + this.height
    },
    get right() {
      return this.left + this.width
    }
  }

  up.Rect.fromElement = function(element) {
    return new up.Rect(element.getBoundingClientRect())
  }

})()
