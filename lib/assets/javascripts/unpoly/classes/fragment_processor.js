/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;

up.FragmentProcessor = class FragmentProcessor extends up.Record {

  keys() { return [
    'fragment',
    'autoMeans',
    'origin',
    'layer'
  ]; }

  process(opt) {
    // Expose this additional method so subclasses can implement default values.
    return this.tryProcess(opt);
  }

  tryProcess(opt) {
    if (u.isArray(opt)) {
      return u.find(opt, opt => this.tryProcess(opt));
    }

    if (u.isFunction(opt)) {
      return this.tryProcess(opt(this.fragment, this.attributes()));
    }

    if (u.isElement(opt)) {
      return this.processElement();
    }

    if (u.isString(opt)) {
      let match;
      if (opt === 'auto') {
        return this.tryProcess(this.autoMeans);
      }

      if (match = opt.match(/^(.+?)-if-(.+?)$/)) {
        return this.resolveCondition(match[2]) && this.process(match[1]);
      }
    }

    return this.processPrimitive(opt);
  }

  resolveCondition(condition) {
    if (condition === 'main') {
      return up.fragment.contains(this.fragment, ':main');
    }
  }

  findSelector(selector) {
    let match;
    const lookupOpts = { layer: this.layer, origin: this.origin };
    // Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    if (match = up.fragment.get(this.fragment, selector, lookupOpts) || up.fragment.get(selector, lookupOpts)) {
      return match;
    } else {
      up.warn('up.render()', 'Could not find an element matching "%s"', selector);
      // Return undefined so { focus: 'auto' } will try the next option from { autoMeans }
      return;
    }
  }
};
