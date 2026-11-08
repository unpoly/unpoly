import { extractOptions, isArray, isElementLike, isGiven, isString, merge } from '../util.js'
import { getOne } from '../element.js'
import { guard } from '../error.js'
import { Aborted } from '../error/aborted.js'
import { Record } from '../util/record.js'

export class EventEmitter extends Record {

  keys() {
    return [
      'target',
      'event',
      'baseLayer',
      'callback',
      'log',
      'ensureBubbles',
    ]
  }

  emit() {
    this._logEmission()

    if (this.baseLayer) {
      this.baseLayer.asCurrent(() => this._dispatchEvent())
    } else {
      this._dispatchEvent()
    }
    return this.event
  }

  _dispatchEvent() {
    this.target.dispatchEvent(this.event)

    if (this.ensureBubbles && !this.target.isConnected) {
      document.dispatchEvent(this.event)
    }

    guard(() => this.callback?.(this.event))
  }

  assertEmitted() {
    const event = this.emit()
    if (event.defaultPrevented) {
      throw new Aborted(`Event ${event.type} was prevented`)
    }
  }

  _logEmission() {
    if (!up.log.config.enabled) { return }

    let message = this.log
    let messageArgs

    if (isArray(message)) {
      [message, ...messageArgs] = message
    } else {
      messageArgs = []
    }

    const { type } = this.event

    if (isString(message)) {
      up.puts(type, message, ...messageArgs)
    } else if (message !== false) {
      up.puts(type, `Event ${type}`)
    }
  }

  static fromEmitArgs(args, defaults = {}) {
    // Event-emitting functions are crazy overloaded:
    //
    // - up.emit([target], eventType, [eventProps])
    // - up.emit([target], eventPlan) # eventPlan must contain { type } property
    // - up.emit([target], event, [emitDetails]) # emitDetails may contain options like { layer } or { callback }
    //
    // Hence the insane argument parsing logic seen below.
    //
    // We begin by removing an options hash from the end of the argument list.
    // This might be an object of event properties, which might or might contain a
    // { type } property for the event type. In case we are passed a pre-built
    // Event object, the hash will contain emission that options that cannot be
    // carried by the event object, such as { layer } or { callback }.
    let options = extractOptions(args)

    // Event-emitting functions may instantiate their up.EventEmitter with preconfigured
    // defaults. E.g. up.Layer#emit() will set the default { layer: this }.
    options = merge(defaults, options)

    // If we are passed an element or layer as a first argument, this is the event
    // target. We remove it from the argument list and store it in options.
    if (isElementLike(args[0])) {
      options.target = getOne(args.shift())
    } else if (args[0] instanceof up.Layer) {
      options.layer = args.shift()
    }

    // Setting a { layer } is a shorthand to (1) emit the event on the layer's
    // element and (2) to set up.layer.current to that layer during emission.
    let layer
    if (isGiven(options.layer)) {
      layer = up.layer.get(options.layer)
      options.target ||= layer.element
      options.baseLayer ||= layer
    }

    // Setting { baseLayer } will fix up.layer.current to that layer during emission.
    // In case we get a layer name like 'root' (instead of an up.Layer object) we look
    // up the actual up.Layer object.
    if (options.baseLayer) {
      options.baseLayer = up.layer.get(options.baseLayer)
    }

    if (isString(options.target)) {
      options.target = up.fragment.get(options.target, { layer: options.layer })
    } else if (!options.target) {
      // If no element is given, we emit the event on the document.
      options.target = document
    }

    if (args[0]?.preventDefault) {
      // In this branch we receive an Event object that was already built:
      // up.emit([target], event, [emitOptions])
      options.event = args[0]
      options.log ??= args[0].log
    } else if (isString(args[0])) {
      // In this branch we receive an Event type and props object.
      // The props object may also include options for the emission, such as
      // { layer }, { target }, { baseLayer } or { log }.
      // up.emit([target], eventType, [eventPropsAndEmitOptions])
      options.event = up.event.build(args[0], options)
    } else {
      // In this branch we receive an object that contains the event type as a { type } property:
      // up.emit([target, { type: 'foo', prop: 'value' }
      options.event = up.event.build(options)
    }

    return new (this)(options)
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  EventEmitter,
}
