import { compactObject, evalOption, pick, reject, uid } from '../util.js'
import { fail } from '../error.js'
import { readFieldDisabled } from '../form.js'
import { isBeforeBoot, isEvaling } from '../framework.js'
import { readData } from '../script.js'
import type { Layer } from '../layer/base.js'

/**
An element, document or window that Unpoly listens on. It remembers its listeners,
so `up.off()` can find them.
@internal
*/
export type ListenerTarget = EventTarget & { upEventListeners?: Record<string, EventListener> }

/**
A function registered with `up.on()`. It is called with the event, the element matching
the selector (or the element it listens on) and, if it takes three arguments, the element's data.

The signature is taken from a method, since TypeScript checks method parameters bivariantly, even
under `strictFunctionTypes`. That lets a listener annotate a narrower type than we can infer,
like `(event, link: HTMLAnchorElement)` for a selector that only matches links.
*/
export type ListenerCallback<E = Event> =
  { listener(event: E, element: HTMLElement, data?: any): any }['listener'] & { upUid?: number }

/**
Everything an `up.EventListener` needs to know.
@internal
*/
export interface EventListenerAttributes {
  element: ListenerTarget
  eventType: string
  selector?: string | (() => string)
  callback: ListenerCallback
  guard?: (event: Event) => boolean
  baseLayer?: Layer
  passive?: boolean
  once?: boolean
  capture?: boolean
  beforeBoot?: boolean
}

export class EventListener {
  declare element: ListenerTarget
  declare eventType: string
  declare selector: string | (() => string) | undefined
  declare callback: ListenerCallback
  declare guard: ((event: Event) => boolean) | undefined
  declare baseLayer: Layer | undefined
  declare passive: boolean | undefined
  declare once: boolean | undefined
  declare capture: boolean | undefined
  declare beforeBoot: boolean
  declare isDefault: boolean
  declare _key: string

  constructor(attributes: EventListenerAttributes) {
    this.element = attributes.element
    this.eventType = attributes.eventType
    this.selector = attributes.selector
    this.callback = attributes.callback
    this.guard = attributes.guard
    this.baseLayer = attributes.baseLayer
    this.passive = attributes.passive
    this.once = attributes.once
    this.capture = attributes.capture

    this._key = (this.constructor as typeof EventListener)._buildKey(attributes)
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
    let options = compactObject(pick(this, ['once', 'passive', 'capture']))
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
    let element = event.target as Element
    if (this.selector) {
      let selector = evalOption(this.selector)
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

  static fromElement(attributes: EventListenerAttributes): EventListener | undefined {
    let map = attributes.element.upEventListeners
    if (map) {
      const key = this._buildKey(attributes)
      return map[key]
    }
  }

  static _buildKey(attributes: EventListenerAttributes): string {
    // Give the callback function a numeric identifier so it
    // can become part of the upEventListeners key.
    attributes.callback.upUid ||= uid()

    return [
      attributes.eventType,
      attributes.selector,
      attributes.callback.upUid
    ].join('|')
  }

  static allNonDefault(element: ListenerTarget): EventListener[] {
    let map = element.upEventListeners
    if (map) {
      const listeners = Object.values(map)
      return reject(listeners, 'isDefault')
    } else {
      return []
    }
  }
}
