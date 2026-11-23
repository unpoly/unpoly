import * as u from './util.js'
import * as e from './element.js'
import { fail } from './error.js'
import { layerStack, type LayerReference } from './layer.js'
import type { ClickEvent } from './link.js'
import { printUserEvent } from './log.js'
import { mockable } from './mockable.js'
import { registerDestructor } from './script.js'
import type * as t from './event/types.js'
export type * from './event/types.js'
import { assertEventEmitted, emitEvent, parseEmitArgs } from './event/emission.js'
export { assertEventEmitted, emitEvent, parseEmitArgs }
import { UpEventListener, bindListeners, parseBindArgs, unbindListeners } from './event/listeners.js'
export { UpEventListener, bindListeners, parseBindArgs, unbindListeners }

// A property of a mouse or keyboard event that says whether a modifier key was held.
type ModifierKey = 'metaKey' | 'shiftKey' | 'ctrlKey' | 'altKey'

function reset(): void {
  // Resets the list of registered event listeners to the
  // moment when the framework was booted.
  for (let globalElement of [window, document, e.getRoot(), document.body]) {
    for (let listener of UpEventListener.allNonDefault(globalElement)) {
      listener.unbind()
    }
  }
}

export function on<const T extends t.EventTypes>(types: T, ...args: t.ListenerArgs<t.ObservedEvent<T>>): t.UnbindFunction
export function on<const T extends t.EventTypes>(
  targets: t.ListenerTargets,
  types: T,
  ...args: t.ListenerArgs<t.ObservedEvent<T>>
): t.UnbindFunction
export function on(...args: unknown[]): t.UnbindFunction {
  return bindListeners(parseBindArgs(args))
}

export function onClosest<const T extends t.EventTypes>(
  element: Element,
  types: T,
  callback: t.ListenerCallback<t.ObservedEvent<T>>,
): t.UnbindFunction
export function onClosest<const T extends t.EventTypes>(
  element: Element,
  types: T,
  options: { layer?: LayerReference },
  callback: t.ListenerCallback<t.ObservedEvent<T>>,
): t.UnbindFunction
export function onClosest(...args: unknown[]): t.UnbindFunction {
  let [fragment, eventType, { layer }, callback] = u.parseArgs(args, 'val', 'val', 'options', 'callback')
  layer &&= layerStack.get(layer, { origin: fragment })
  let guard = (event: Event) => {
    let target = event.target as Element
    return target.contains(fragment) && (!layer || layer.contains(target))
  }
  let unsubscribe = on(eventType, { guard }, callback)

  // Since we're binding to an element that is an ancestor of the fragment,
  // we should unregister the event listener when the fragment is removed.
  registerDestructor(fragment, unsubscribe)
  return unsubscribe
}

export function off<const T extends t.EventTypes>(types: T, ...args: t.ListenerArgs<t.ObservedEvent<T>>): void
export function off<const T extends t.EventTypes>(targets: t.ListenerTargets, types: T, ...args: t.ListenerArgs<t.ObservedEvent<T>>): void
export function off(...args: unknown[]): void {
  return unbindListeners(parseBindArgs(args))
}

export function emit<T extends string>(type: T, props?: t.EmitProps): t.EmittedEvent<T>
export function emit<T extends string>(target: t.EmitTarget, type: T, props?: t.EmitProps): t.EmittedEvent<T>
export function emit<T extends string>(plan: t.EventPlan<T>): t.EmittedEvent<T>
export function emit<T extends string>(target: t.EmitTarget, plan: t.EventPlan<T>): t.EmittedEvent<T>
export function emit<E extends Event>(event: E, options?: t.EmitProps): E
export function emit<E extends Event>(target: t.EmitTarget, event: E, options?: t.EmitProps): E
export function emit(...args: unknown[]): Event {
  return emitEvent(parseEmitArgs(args))
}

export function buildEvent<T extends string>(type: T, props?: u.PlainObject): t.EmittedEvent<T>
export function buildEvent<T extends string>(props: u.PlainObject & { type?: T }): t.EmittedEvent<T>
export function buildEvent(...args: unknown[]): Event {
  const props = u.extractOptions(args)
  const type = args[0] || props.type || fail('Missing event type')

  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.assign(event, u.omit(props, ['type', 'target']))

  return event
}

export function assertEmitted(...args: [type: string, props?: t.EmitProps]): void {
  return assertEventEmitted(parseEmitArgs(args))
}

export function onEscape(listener: (event: KeyboardEvent) => unknown): t.UnbindFunction {
  return on('keydown', function(event) {
    if (event.key === 'Escape') {
      return listener(event)
    }
  })
}

export function haltEvent(event: Event, options: { log?: boolean } = {}): void {
  if (options.log) printUserEvent(event)
  event.stopImmediatePropagation()
  event.preventDefault()
}

export const keyModifiers: ModifierKey[] = ['metaKey', 'shiftKey', 'ctrlKey', 'altKey']

export function isModified(event: { button?: number } & Pick<MouseEvent, ModifierKey>): boolean {
  // An up:click from a keyboard event has no { button }.
  return ((event.button ?? 0) > 0) || u.some(keyModifiers, (modifier) => event[modifier])
}

export const isSyntheticClick = mockable(function isSyntheticClick(event: Event): boolean {
  return !event.isTrusted
})

export function forkEvent(originalEvent: Event, newType: string, copyKeys: string[] = []): t.ForkedEvent {
  // The keys may belong to a subclass, like MouseEvent#clientX.
  const newEvent = buildEvent(newType, u.pick(originalEvent as u.PlainObject, copyKeys)) as t.ForkedEvent
  newEvent.originalEvent = originalEvent; // allow users to access other props through event.originalEvent.prop

  (['stopPropagation', 'stopImmediatePropagation', 'preventDefault'] as const).forEach(function(key) {
    const originalMethod = newEvent[key]

    return newEvent[key] = function() {
      originalEvent[key]()
      return originalMethod.call(newEvent)
    }
  })

  // If the source event was already prevented, the forked event should also be.
  if (originalEvent.defaultPrevented) {
    newEvent.preventDefault()
  }

  return newEvent
}

function executeEmitAttr(event: ClickEvent, element: Element): void {
  if (isModified(event)) { return }
  // The listener only matches [up-emit].
  const eventType = e.stringAttr(element, 'up-emit')!
  const eventProps = e.jsonAttr(element, 'up-emit-props')
  const forkedEvent = forkEvent(event, eventType)
  Object.assign(forkedEvent, eventProps)
  emit(element, forkedEvent)
}


let inputDevices: t.InputDevice[] = ['unknown']

export function getInputDevice(): t.InputDevice {
  return u.last(inputDevices)
}

function observeInputDevice(newModality: t.InputDevice): void {
  inputDevices.push(newModality)
  setTimeout(() => inputDevices.pop())
}

export function install(): void {
  e.setEventEmitFunction(emit)

  on('up:click', '[up-emit]', executeEmitAttr)

  on('keydown keyup', { capture: true }, () => observeInputDevice('key'))

  on('pointerdown pointerup', { capture: true }, () => observeInputDevice('pointer'))

  on('up:framework:reset', reset)
}

export const api = {
  event: {
    on,
    onClosest,
    off,
    build: buildEvent,
    emit,
    onEscape,
    halt: haltEvent,
    isModified,
    get inputDevice() { return getInputDevice() },
  },
  on,
  off,
  emit,
}
