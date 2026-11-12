import * as u from '../util.js'
import { fail } from '../error.js'
import { readFieldDisabled } from '../form.js'
import { isBeforeBoot, isEvaling } from '../framework.js'
import { type Layer } from '../layer.js'
import { readData } from '../script.js'
import type * as t from './types.js'

export class UpEventListener {
  declare element: t.ListenerTarget
  declare eventType: string
  declare selector?: t.ListenerSelector
  declare callback: t.ListenerCallback
  declare guard?: (event: Event) => boolean
  declare baseLayer?: Layer
  declare passive?: boolean
  declare once?: boolean
  declare capture?: boolean
  declare beforeBoot: boolean
  declare isDefault: boolean
  declare _key: string

  constructor(attributes: t.EventListenerAttributes) {
    this.element = attributes.element
    this.eventType = attributes.eventType
    this.selector = attributes.selector
    this.callback = attributes.callback
    this.guard = attributes.guard
    this.baseLayer = attributes.baseLayer
    this.passive = attributes.passive
    this.once = attributes.once
    this.capture = attributes.capture

    // Naming the class inside its body would make the build emit a named class expression.
    this._key = (this.constructor as typeof UpEventListener)._buildKey(attributes)
    this.isDefault = isEvaling()

    // We don't usually run up.on() listeners before Unpoly has booted.
    // This is done so incompatible code is not called on browsers that don't support Unpoly.
    // Listeners that do need to run before Unpoly boots can pass { beforeBoot: true } to override.
    // We also default to { beforeBoot: true } for framework events that are emitted
    // before booting.
    this.beforeBoot = attributes.beforeBoot ?? (this.eventType.indexOf('up:framework:') === 0)

    // Need to store the bound nativeCallback function because addEventListener()
    // and removeEventListener() need to see the exact same reference.
    this.nativeCallback = this.nativeCallback.bind(this)
  }

  bind(): void {
    const map = (this.element.upEventListeners ||= {})
    if (map[this._key]) {
      fail('up.on(): The %o callback %o cannot be registered more than once', this.eventType, this.callback)
    }
    map[this._key] = this

    this.element.addEventListener(...this._addListenerArg())
  }

  _addListenerArg(): [string, (event: Event) => void, AddEventListenerOptions] {
    // Avoid setting a default { passive: false } since some browsers have non-false
    // defaults for some event types like `touchstart`.
    // See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
    let options = u.compactObject(u.pick(this, ['once', 'passive', 'capture']))
    return [this.eventType, this.nativeCallback, options]
  }

  unbind(): void {
    let map = this.element.upEventListeners
    if (map) {
      delete map[this._key]
    }
    this.element.removeEventListener(...this._addListenerArg())
  }

  nativeCallback(event: Event): void {
    if (isBeforeBoot() && !this.beforeBoot) {
      return
    }

    // 1. Since we're listing on `document`, event.currentTarget is now `document`.
    // 2. event.target is the element that received an event, which might be a
    //    child of `selector`.
    // 3. There is only a single event bubbling up the DOM, so we are only called once.
    let element: Element | null = event.target as Element
    if (this.selector) {
      let selector = u.evalOption(this.selector)
      element = element.closest(selector)
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
        const data = readData(element)
        args.push(data)
      }

      // Do not allow click events from disabled elements to propagate.
      // The platform only suppresses *trusted* clicks, so a click dispatched by a script is
      // delivered even to a disabled <button>. We use the field accessor outside fields, since
      // "does this element consider itself disabled" is the same question.
      if (this.eventType === 'click' && readFieldDisabled(element)) {
        return
      }

      // The listener's type promises an HTMLElement for `this`, like for its second argument.
      const applyCallback = this.callback.bind(element as HTMLElement, ...args)

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

  static fromElement(attributes: t.EventListenerAttributes): UpEventListener | undefined {
    let map = attributes.element.upEventListeners
    if (map) {
      const key = this._buildKey(attributes)
      return map[key]
    }
  }

  static _buildKey(attributes: t.EventListenerAttributes): string {
    // Give the callback function a numeric identifier so it
    // can become part of the upEventListeners key.
    attributes.callback.upUid ||= u.uid()

    return [
      attributes.eventType,
      attributes.selector,
      attributes.callback.upUid
    ].join('|')
  }

  static allNonDefault(element: t.ListenerTarget): UpEventListener[] {
    let map = element.upEventListeners
    if (map) {
      const listeners = Object.values(map)
      return u.reject(listeners, 'isDefault')
    } else {
      return []
    }
  }
}
