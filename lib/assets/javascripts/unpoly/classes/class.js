/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

up.Class = class Class {

  static getter(prop, get) {
    return u.getter(this.prototype, prop, get);
  }

  static accessor(prop, descriptor) {
    return Object.defineProperty(this.prototype, prop, descriptor);
  }

  static delegate(props, targetProp) {
    return u.delegate(this.prototype, props, function() { return this[targetProp]; });
  }

//  @include: (mixin) ->
//    for key in Object.keys(mixin.prototype)
//      descriptor = mixin.getOwnPropertyDescriptor(mixin)
//      Object.defineProperty(@prototype, descritpr)

  static wrap(...args) {
    return u.wrapValue(this, ...Array.from(args));
  }
};
