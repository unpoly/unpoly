/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e = up.element;

up.Change.DestroyFragment = class DestroyFragment extends up.Change.Removal {

  constructor(options) {
    super(options);
    this.layer = up.layer.get(options) || up.layer.current;
    this.element = this.options.element;
    this.animation = this.options.animation;
    this.log = this.options.log;
  }

  execute() {
    // Destroying a fragment is a sync function.
    //
    // A variant of the logic below can also be found in up.Change.UpdateLayer.
    // Updating (swapping) a fragment also involves destroying the old version,
    // but the logic needs to be interwoven with the insertion logic for the new
    // version.

    // Save the parent because we emit up:fragment:destroyed on the parent
    // after removing @element.
    this.parent = this.element.parentNode;

    // The destroying fragment gets an .up-destroying class so we can
    // recognize elements that are being destroyed but are still playing out their
    // removal animation.
    up.fragment.markAsDestroying(this.element);

    if (up.motion.willAnimate(this.element, this.animation, this.options)) {
      // If we're animating, we resolve *before* removing the element.
      // The destroy animation will then play out, but the destroying
      // element is ignored by all up.fragment.* functions.
      this.emitDestroyed();
      return this.animate().then(() => this.wipe()).then(() => this.onFinished());
    } else {
      // If we're not animating, we can remove the element before emitting up:fragment:destroyed.
      this.wipe();
      this.emitDestroyed();
      return this.onFinished();
    }
  }

  animate() {
    return up.motion.animate(this.element, this.animation, this.options);
  }

  wipe() {
    return this.layer.asCurrent(() => {
      up.syntax.clean(this.element, { layer: this.layer });

      if (up.browser.canJQuery()) {
        // jQuery elements store internal attributes in a global cache.
        // We need to remove the element via jQuery or we will leak memory.
        // See https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery
        return jQuery(this.element).remove();
      } else {
        return e.remove(this.element);
      }
    });
  }

  emitDestroyed() {
    // Emits up:fragment:destroyed.
    return up.fragment.emitDestroyed(this.element, { parent: this.parent, log: this.log });
  }
};
