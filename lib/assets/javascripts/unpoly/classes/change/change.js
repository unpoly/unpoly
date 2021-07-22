/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

up.Change = class Change extends up.Class {

  constructor(options) {
    super();
    this.options = options;
  }

  notApplicable(reason) {
    return up.error.notApplicable(this, reason);
  }

  execute() {
    throw up.error.notImplemented();
  }

  onFinished() {
    return (typeof this.options.onFinished === 'function' ? this.options.onFinished() : undefined);
  }

  // Values we want to keep:
  // - false (no update)
  // - string (forced update)
  // Values we want to override:
  // - true (do update with defaults)
  improveHistoryValue(existingValue, newValue) {
    if ((existingValue === false) || u.isString(existingValue)) {
      return existingValue;
    } else {
      return newValue;
    }
  }
};

