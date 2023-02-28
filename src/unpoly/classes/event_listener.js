const u = up.util

up.EventListener = class EventListener extends up.Record {

  keys() {
    return [
      'element',
      'eventType',
      'selector',
      'callback',
      'guard',
      'baseLayer',
      'passive',
      'once',
      'beforeBoot',
    ]
  }

  constructor(attributes) {
    super(attributes)
    this.key = this.constructor.buildKey(attributes)
    this.isDefault = up.framework.evaling

    // We don't usually run up.on() listeners before Unpoly has booted.
    // This is done so incompatible code is not called on browsers that don't support Unpoly.
    // Listeners that do need to run before Unpoly boots can pass { beforeBoot: true } to override.
    // We also default to { beforeBoot: true } for framework events that are emitted
    // before booting.
    this.beforeBoot ??= (this.eventType.indexOf('up:framework:') === 0)

    // Need to store the bound nativeCallback function because addEventListener()
    // and removeEventListener() need to see the exact same reference.
    this.nativeCallback = this.nativeCallback.bind(this)
  }

  bind() {
    const map = (this.element.upEventListeners ||= {})
    if (map[this.key]) {
      up.fail('up.on(): The %o callback %o cannot be registered more than once', this.eventType, this.callback)
    }
    map[this.key] = this

    this.element.addEventListener(...this.addListenerArgs())
  }

  addListenerArgs() {
    // Avoid setting a default { passive: false } since some browsers have non-false
    // defaults for some event types like `touchstart`.
    // See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
    let options = u.compactObject(u.pick(this, ['once', 'passive']))
    return [this.eventType, this.nativeCallback, options]
  }

  unbind() {
    let map = this.element.upEventListeners
    if (map) {
      delete map[this.key]
    }
    this.element.removeEventListener(...this.addListenerArgs())
  }

  nativeCallback(event) {
    if (up.framework.beforeBoot && !this.beforeBoot) {
      return
    }

    // 1. Since we're listing on `document`, event.currentTarget is now `document`.
    // 2. event.target is the element that received an event, which might be a
    //    child of `selector`.
    // 3. There is only a single event bubbling up the DOM, so we are only called once.
    let element = event.target
    if (this.selector) {
      element = element.closest(u.evalOption(this.selector))
    }

    if (this.guard && !this.guard(event)) {
      return
    }

    if (element) {
      const args = [event, element]

      // Do not retrieve and parse [up-data] unless the listener function
      // expects a third argument. Note that we must pass data for an argument
      // count of 0, since then the function might take varargs.
      const expectedArgCount = this.callback.length

      if (expectedArgCount !== 1 && expectedArgCount !== 2) {
        const data = up.syntax.data(element)
        args.push(data)
      }

      const applyCallback = this.callback.bind(element, ...args)

      if (this.baseLayer) {
        // Unpoly will usually set up.layer.current when emitting an event.
        // But Unpoly-unaware code will not set up.layer.current when emitting events.

        // Hence layerInstance.on('click') will use this to set layer.current to layerInstance.
        this.baseLayer.asCurrent(applyCallback)
      } else {
        applyCallback()
      }
    }
  }

  static fromElement(attributes) {
    let map = attributes.element.upEventListeners
    if (map) {
      const key = this.buildKey(attributes)
      return map[key]
    }
  }

  static buildKey(attributes) {
    // Give the callback function a numeric identifier so it
    // can become part of the upEventListeners key.
    attributes.callback.upUid ||= u.uid()

    return [
      attributes.eventType,
      attributes.selector,
      attributes.callback.upUid
    ].join('|')
  }

  static allNonDefault(element) {
    let map = element.upEventListeners
    if (map) {
      const listeners = Object.values(map)
      return u.reject(listeners, 'isDefault')
    } else {
      return []
    }
  }
}
