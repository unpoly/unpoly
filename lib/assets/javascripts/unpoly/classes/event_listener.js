/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.EventListener = class EventListener extends up.Record {

  keys() {
    return [
      'element',
      'eventType',
      'selector',
      'callback',
      'jQuery',
      'guard',
      'baseLayer',
      'passive',
      'once'
    ];
  }

  constructor(attributes) {
    this.nativeCallback = this.nativeCallback.bind(this);
    super(attributes);
    this.key = this.constructor.buildKey(attributes);
    this.isDefault = up.framework.booting;
  }

  bind() {
    const map = (this.element.upEventListeners || (this.element.upEventListeners = {}));
    if (map[this.key]) {
      up.fail('up.on(): The %o callback %o cannot be registered more than once', this.eventType, this.callback);
    }
    map[this.key] = this;

    return this.element.addEventListener(...Array.from(this.addListenerArgs() || []));
  }

  addListenerArgs() {
    const args = [this.eventType, this.nativeCallback];
    if (this.passive && up.browser.canPassiveEventListener()) {
      args.push({ passive: true });
    }
    return args;
  }

  unbind() {
    let map;
    if (map = this.element.upEventListeners) {
      delete map[this.key];
    }
    return this.element.removeEventListener(...Array.from(this.addListenerArgs() || []));
  }

  nativeCallback(event) {
    // Once we drop IE11 support we can forward the { once } option
    // to Element#addEventListener().
    if (this.once) {
      this.unbind();
    }

    // 1. Since we're listing on `document`, event.currentTarget is now `document`.
    // 2. event.target is the element that received an event, which might be a
    //    child of `selector`.
    // 3. There is only a single event bubbling up the DOM, so we are only called once.
    let element = event.target;
    if (this.selector) {
      element = e.closest(element, u.evalOption(this.selector));
    }

    if (this.guard && !this.guard(event)) {
      return;
    }

    if (element) {
      const elementArg = this.jQuery ? up.browser.jQuery(element) : element;
      const args = [event, elementArg];

      // Do not retrieve and parse [up-data] unless the listener function
      // expects a third argument. Note that we must pass data for an argument
      // count of 0, since then the function might take varargs.
      const expectedArgCount = this.callback.length;

      if ((expectedArgCount !== 1) && (expectedArgCount !== 2)) {
        const data = up.syntax.data(element);
        args.push(data);
      }

      const applyCallback = () => this.callback.apply(element, args);

      if (this.baseLayer) {
        // Unpoly will usually set up.layer.current when emitting an event.
        // But Unpoly-unaware code will not set up.layer.current when emitting events.

        // Hence layerInstance.on('click') will use this to set layer.current to layerInstance.
        return this.baseLayer.asCurrent(applyCallback);
      } else {
        return applyCallback();
      }
    }
  }

  static fromElement(attributes) {
    let map;
    if (map = attributes.element.upEventListeners) {
      const key = this.buildKey(attributes);
      return map[key];
    }
  }

  static buildKey(attributes) {
    // Give the callback function a numeric identifier so it
    // can become part of the upEventListeners key.
    if (!attributes.callback.upUid) { attributes.callback.upUid = u.uid(); }

    return [
      attributes.eventType,
      attributes.selector,
      attributes.callback.upUid
    ].join('|');
  }

  static allNonDefault(element) {
    let map;
    if (map = element.upEventListeners || {}) {
      const listeners = u.values(map);
      return u.reject(listeners, 'isDefault');
    } else {
      return [];
    }
  }
};
