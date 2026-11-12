import * as u from '../util.js'
import * as e from '../element.js'
import { fail } from '../error.js'
import { emit } from '../event.js'
import { findFields, getRegion, setContainerDisabled, watch } from '../form.js'
import { getSmart, getSubtree, trackSelector } from '../fragment.js'
import { Params } from './params.js'

// A switchee remembers the field tokens it was last switched with.
interface Switchee extends HTMLElement { upSwitchValues?: string[] }

// What an [up-…-for] attribute does to a switchee.
interface SwitchEffect { attr: string, toggle(target: HTMLElement, active: boolean): void }

const BUILTIN_SWITCH_EFFECTS: SwitchEffect[] = [
  { attr: 'up-hide-for', toggle(target, active) { e.toggle(target, !active) } },
  { attr: 'up-show-for', toggle(target, active) { e.toggle(target, active) } },
  { attr: 'up-disable-for', toggle(target, active) { setContainerDisabled(target, active) } },
  { attr: 'up-enable-for', toggle(target, active) { setContainerDisabled(target, !active) } },
]

export class Switcher {
  declare _root: Element
  declare _switcheeSelector: string
  declare _regionSelector: string | null

  constructor(root: Element) {
    // The root should either be an individual input, or a container of radio buttons.
    this._root = root
    this._switcheeSelector = root.getAttribute('up-switch') || fail("No switch target given for %o", root)
    this._regionSelector = root.getAttribute('up-switch-region')
  }

  start(): () => void {
    // Switch our region once immediately.
    // Don't risk unswitched state showing up in the browser.
    this._switchRegion()

    return u.sequence(
      this._trackFieldChanges(),
      this._trackNewSwitchees(),
    )
  }

  _trackFieldChanges(): () => void {
    let callback = () => this._onFieldChanged()
    return up.migrate.watchForSwitch?.(this._root, callback)
      // Switching effects are client-side and cheap, so we never debounce them.
      // A { delay } meant for requests (from config or [up-watch-delay]) would only make switching lag,
      // and would let an autosubmitting form read its fields before they were switched.
      || watch(this._root, { logPrefix: '[up-switch]', includeDisabled: true, delay: 0 }, callback)
  }

  _trackNewSwitchees(): () => void {
    let onSwitcheeAdded = (switchee: Switchee) => this._switchSwitchee(switchee)
    return trackSelector(() => this._findSwitchees(), onSwitcheeAdded)
  }

  _onFieldChanged(): void {
    this._switchRegion()
  }

  _switchRegion(): void {
    const fieldTokens = this._buildFieldTokens()
    for (let switchee of this._findSwitchees()) {
      this._switchSwitchee(switchee, fieldTokens)
    }
  }

  _switchSwitchee(switchee: Switchee, fieldTokens: string[] = this._buildFieldTokens()): void {
    let previousValues = switchee.upSwitchValues
    if (!u.isEqual(previousValues, fieldTokens)) {
      switchee.upSwitchValues = fieldTokens
      this.switchSwitcheeNow(switchee, fieldTokens)
    }
  }

  // No _ prefix: specs spy on this name, and _-prefixed members are mangled in the minified build.
  switchSwitcheeNow(switchee: HTMLElement, fieldTokens: string[]): void {
    for (let { attr, toggle } of BUILTIN_SWITCH_EFFECTS) {
      let attrValue = switchee.getAttribute(attr)
      if (attrValue) {
        let activeTokens = this._parseSwitcheeTokens(attrValue)
        let isActive = u.intersect(fieldTokens, activeTokens).length > 0
        toggle(switchee, isActive)
      }
    }
    let log = ['Switching %o', switchee]
    emit(switchee, 'up:form:switch', { field: this._root, fieldTokens, log })
  }

  _findSwitchees(): Switchee[] {
    let scope = this._scope
    return scope ? getSubtree(scope, this._switcheeSelector) : []
  }

  get _scope(): Element | undefined {
    if (this._regionSelector) {
      return getSmart(this._regionSelector, { origin: this._root })
    } else {
      return getRegion(this._root)
    }
  }

  _parseSwitcheeTokens(str: string): string[] {
    return u.getSimpleTokens(str, { json: true })
  }

  _buildFieldTokens(): string[] {
    let values = Params.fromContainer(this._root, { includeDisabled: true }).values()
    let tokens = [...values]

    let anyPresent = u.some(values, u.isPresent)
    tokens.push(anyPresent ? ':present' : ':blank')

    let fields = findFields(this._root)
    if (fields[0]?.matches('[type=radio], [type=checkbox]')) {
      let anyChecked = u.some(fields, 'checked')
      tokens.push(anyChecked ? ':checked' : ':unchecked')
    }

    return tokens
  }

}
