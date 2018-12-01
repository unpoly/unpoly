(function() {
  u = up.util

  up.Rect = function(props) {
    console.debug("new up.Rect(%o)", props)
    u.assign(this, u.only(props, 'left', 'top', 'width', 'height'))
  }

  up.Rect.prototype = {
    get bottom() {
      return this.top + this.height
    },

    // set bottom(newBottom) {
    //   this.height = Math.max(newBottom - this.left, 0)
    // },

    get right() {
      return this.left + this.width
    }

    // set right(newRight) {
    //   this.width = Math.max(newRight - this.left, 0)
    // },

  }

  up.Rect.fromElement = function(element) {
    return new up.Rect(element.getBoundingClientRect())
  }

})()
