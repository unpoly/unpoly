/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

const Cls = (up.LayerStack = class LayerStack extends Array {
  static initClass() {
  
    u.getter(this.prototype, 'count', function() {
      return this.length;
    });
  
    u.getter(this.prototype, 'root', function() {
      return this[0];
  });
  
    u.getter(this.prototype, 'overlays', function() {
      return this.root.descendants;
    });
  
    u.getter(this.prototype, 'current', function() {
      // Event listeners and compilers will push into @currentOverrides
      // to temporarily set up.layer.current to the layer they operate in.
      return u.last(this.currentOverrides) || this.front;
    });
  
    u.getter(this.prototype, 'front', function() {
      return u.last(this);
    });
  }

  constructor() {
    super();
    // When TypeScript transpiles to ES5, there is an issue with this constructor always creating
    // a `this` of type `Array` instead of `LayerStack`. The transpiled code looks like this:
    //
    //     function LayerStack() {
    //       let this = Array.call(this) || this
    //     }
    //
    // And since Array() returns a value, this returns the new this.
    // The official TypeScript recommendation is to use setProtoTypeOf() after calling super:
    // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, up.LayerStack.prototype);
    this.currentOverrides = [];
    this.push(this.buildRoot());
  }

  buildRoot() {
    return up.layer.build({mode: 'root', stack: this});
  }

  remove(layer) {
    return u.remove(this, layer);
  }

  peel(layer, options) {
    // We will dismiss descendants closer to the front first to prevent
    // recursive calls of peel().
    const descendants = u.reverse(layer.descendants);

    // Callers expect the effects of peel() to manipulate the layer stack sync.
    // Because of this we will dismiss alle descendants sync rather than waiting
    // for each descendant to finish its closing animation.
    const dismissOptions = u.merge(options, {preventable: false});
    const dismissDescendant = descendant => descendant.dismiss(':peel', dismissOptions);
    const promises = u.map(descendants, dismissDescendant);

    return Promise.all(promises);
  }

  reset() {
    this.peel(this.root, {animation: false});
    this.currentOverrides = [];
    return this.root.reset();
  }

  isOpen(layer) {
    return layer.index >= 0;
  }

  isClosed(layer) {
    return !this.isOpen(layer);
  }

  parentOf(layer) {
    return this[layer.index - 1];
  }

  childOf(layer) {
    return this[layer.index + 1];
  }

  ancestorsOf(layer) {
    // Return closest ancestors first
    return u.reverse(this.slice(0, layer.index));
  }

  selfAndAncestorsOf(layer) {
    // Order for layer.closest()
    return [layer, ...Array.from(layer.ancestors)];
  }

  descendantsOf(layer) {
    return this.slice(layer.index + 1);
  }

  isRoot(layer) {
    return this[0] === layer;
  }

  isOverlay(layer) {
    return !this.isRoot(layer);
  }

  isCurrent(layer) {
    return this.current === layer;
  }

  isFront(layer) {
    return this.front === layer;
  }

  get(...args) {
    return this.getAll(...Array.from(args || []))[0];
  }

  getAll(...args) {
    return new up.LayerLookup(this, ...Array.from(args)).all();
  }

  sync() {
    return this.map((layer) =>
      layer.sync());
  }

  asCurrent(layer, fn) {
    try {
      this.currentOverrides.push(layer);
      return fn();
    } finally {
      this.currentOverrides.pop();
    }
  }

  reversed() {
    return u.reverse(this);
  }

  dismissOverlays(value = null, options = {}) {
    options.dismissable = false;
    return u.reverse(this.overlays).map((overlay) =>
      overlay.dismiss(value, options));
  }

  // Used by up.util.reverse() and specs
  [u.copy.key]() {
    return u.copyArrayLike(this);
  }
});
Cls.initClass();
