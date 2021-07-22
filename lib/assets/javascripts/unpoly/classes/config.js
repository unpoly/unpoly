/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

up.Config = class Config extends up.Class {

  constructor(blueprintFn = (() => ({}))) {
    super();
    this.blueprintFn = blueprintFn;
    this.reset();
  }

  reset() {
    return u.assign(this, this.blueprintFn());
  }
};
//    if options.deep
//      for value in u.values(@)
//        if value instanceof up.Config
//          value.reset()
