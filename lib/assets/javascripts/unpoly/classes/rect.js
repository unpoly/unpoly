/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

const Cls = (up.Rect = class Rect extends up.Record {
  static initClass() {
  
    this.getter('bottom', function() {
      return this.top + this.height;
    });
  
    this.getter('right', function() {
      return this.left + this.width;
    });
  }

  keys() {
    return [
      'left',
      'top',
      'width',
      'height'
    ];
  }

  static fromElement(element) {
    return new (this)(element.getBoundingClientRect());
  }
});
Cls.initClass();
