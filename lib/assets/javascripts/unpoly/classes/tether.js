/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.Tether = class Tether {

  constructor(options) {
    this.scheduleSync = this.scheduleSync.bind(this);
    this.sync = this.sync.bind(this);
    if (typeof up.migrate.handleTetherOptions === 'function') {
      up.migrate.handleTetherOptions(options);
    }
    this.anchor = options.anchor;
    this.align = options.align;
    this.position = options.position;

    this.alignAxis = (this.position === 'top') || (this.position === 'bottom') ? 'horizontal' : 'vertical';

    this.viewport = up.viewport.get(this.anchor);
    // The document viewport is <html> on some browsers, and we cannot attach children to that.
    this.parent = this.viewport === e.root ? document.body : this.viewport;

    // If the offsetParent is within the viewport (or is the viewport) we can simply
    // `position: absolute` and it will move as the viewport scrolls, without JavaScript.
    // If not however, we have no choice but to move it on every scroll event.
    this.syncOnScroll = !this.viewport.contains(this.anchor.offsetParent);
  }

  start(element) {
    this.element = element;
    this.element.style.position = 'absolute';
    this.setOffset(0, 0);
    this.sync();
    return this.changeEventSubscription('on');
  }

  stop() {
    return this.changeEventSubscription('off');
  }

  changeEventSubscription(fn) {
    up[fn](window, 'resize', this.scheduleSync);
    if (this.syncOnScroll) { return up[fn](this.viewport, 'scroll', this.scheduleSync); }
  }

  scheduleSync() {
    clearTimeout(this.syncTimer);
    return this.syncTimer = u.task(this.sync);
  }

  isDetached() {
    return e.isDetached(this.parent) || e.isDetached(this.anchor);
  }

  sync() {
    const elementBox = this.element.getBoundingClientRect();

    const elementMargin = {
      top:    e.styleNumber(this.element, 'marginTop'),
      right:  e.styleNumber(this.element, 'marginRight'),
      bottom: e.styleNumber(this.element, 'marginBottom'),
      left:   e.styleNumber(this.element, 'marginLeft')
    };

    const anchorBox = this.anchor.getBoundingClientRect();

    let left = undefined;
    let top = undefined;

    switch (this.alignAxis) {
      case 'horizontal': // position is 'top' or 'bottom'
        top = (() => { switch (this.position) {
          case 'top':
            return anchorBox.top - elementMargin.bottom - elementBox.height;
            // element
            // -------
            // margin
            // -------
            // anchor
          case 'bottom':
            return anchorBox.top + anchorBox.height + elementMargin.top;
        } })();
            // anchor
            // ------
            // margin
            // ------
            // element
        left = (() => { switch (this.align) {
          case 'left':
            // anchored to anchor's left, grows to the right
            return anchorBox.left + elementMargin.left;
            // mg | element
            // ------------
            // anchor
          case 'center':
            // anchored to anchor's horizontal center, grows equally to left/right
            return anchorBox.left + (0.5 * (anchorBox.width - elementBox.width));
            // e l e m e n t
            // -------------
            //    anchor
          case 'right':
            // anchored to anchor's right, grows to the left
            return (anchorBox.left + anchorBox.width) - elementBox.width - elementMargin.right;
        } })();
        break;
            // element | mg
            // ------------
            //       anchor

      case 'vertical': // position is 'left' or 'right'
        top = (() => { switch (this.align) {
          case 'top':
            // anchored to the top, grows to the bottom
            return anchorBox.top + elementMargin.top;
            //  margin | anchor
            // --------|
            // element |
          case 'center':
            // anchored to anchor's vertical center, grows equally to left/right
            return anchorBox.top + (0.5 * (anchorBox.height - elementBox.height));
            //  ele |
            //  men | anchor
            //    t |
          case 'bottom':
            // anchored to the bottom, grows to the top
            return (anchorBox.top + anchorBox.height) - elementBox.height - elementMargin.bottom;
        } })();
            // element |
            // ------- |
            //  margin | anchor
        left = (() => { switch (this.position) {
          case 'left':
            return anchorBox.left - elementMargin.right - elementBox.width;
            // element | margin | anchor
          case 'right':
            return anchorBox.left + anchorBox.width + elementMargin.left;
        } })();
        break;
    }
           // anchor | margin | element

    if (u.isDefined(left) || u.isDefined(top)) {
      return this.moveTo(left, top);
    } else {
      return up.fail('Invalid tether constraints: %o', this.describeConstraints());
    }
  }

  describeConstraints() {
    return { position: this.position, align: this.align };
  }

  moveTo(targetLeft, targetTop) {
    const elementBox = this.element.getBoundingClientRect();
    return this.setOffset(
      (targetLeft - elementBox.left) + this.offsetLeft,
      (targetTop - elementBox.top) + this.offsetTop
    );
  }

  setOffset(left, top) {
    this.offsetLeft = left;
    this.offsetTop = top;
    return e.setStyle(this.element, { left, top });
  }
};
