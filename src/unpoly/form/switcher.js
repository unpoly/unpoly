import { getSimpleTokens, intersect, isEqual, isPresent, sequence, some } from '../util.js'
import { toggle } from '../element.js'
import { fail } from '../error.js'
import { emit } from '../event.js'
import { Params } from './params.js'
import { getSmart, getSubtree, trackSelector } from '../fragment.js'

const BUILTIN_SWITCH_EFFECTS = [
  { attr: 'up-hide-for', toggle(target, active) { toggle(target, !active) } },
  { attr: 'up-show-for', toggle(target, active) { toggle(target, active) } },
  { attr: 'up-disable-for', toggle(target, active) { up.form.setDisabled(target, active) } },
  { attr: 'up-enable-for', toggle(target, active) { up.form.setDisabled(target, !active) } },
]

export class Switcher {

  constructor(root) {
    // The root should either be an individual input, or a container of radio buttons.
    this._root = root
    this._switcheeSelector = root.getAttribute('up-switch') || fail("No switch target given for %o", root)
    this._regionSelector = root.getAttribute('up-switch-region')
  }

  start() {
    // Switch our region once immediately.
    // Don't risk unswitched state showing up in the browser.
    this._switchRegion()

    return sequence(
      this._trackFieldChanges(),
      this._trackNewSwitchees(),
    )
  }

  _trackFieldChanges() {
    let callback = () => this._onFieldChanged()
    return up.migrate.watchForSwitch?.(this._root, callback)
      // Switching effects are client-side and cheap, so we never debounce them.
      // A { delay } meant for requests (from config or [up-watch-delay]) would only make switching lag,
      // and would let an autosubmitting form read its fields before they were switched.
      || up.watch(this._root, { logPrefix: '[up-switch]', includeDisabled: true, delay: 0 }, callback)
  }

  _trackNewSwitchees() {
    let onSwitcheeAdded = (switchee) => this._switchSwitchee(switchee)
    return trackSelector(() => this._findSwitchees(), onSwitcheeAdded)
  }

  _onFieldChanged() {
    this._switchRegion()
  }

  _switchRegion() {
    const fieldTokens = this._buildFieldTokens()
    for (let switchee of this._findSwitchees()) {
      this._switchSwitchee(switchee, fieldTokens)
    }
  }

  _switchSwitchee(switchee, fieldTokens = this._buildFieldTokens()) {
    let previousValues = switchee.upSwitchValues
    if (!isEqual(previousValues, fieldTokens)) {
      switchee.upSwitchValues = fieldTokens
      this.switchSwitcheeNow(switchee, fieldTokens)
    }
  }

  // No _ prefix: specs spy on this name, and _-prefixed members are mangled in the minified build.
  switchSwitcheeNow(switchee, fieldTokens) {
    for (let { attr, toggle } of BUILTIN_SWITCH_EFFECTS) {
      let attrValue = switchee.getAttribute(attr)
      if (attrValue) {
        let activeTokens = this._parseSwitcheeTokens(attrValue)
        let isActive = intersect(fieldTokens, activeTokens).length > 0
        toggle(switchee, isActive)
      }
    }
    let log = ['Switching %o', switchee]
    emit(switchee, 'up:form:switch', { field: this._root, fieldTokens, log })
  }

  _findSwitchees() {
    let scope = this._scope
    return scope ? getSubtree(scope, this._switcheeSelector) : []
  }

  get _scope() {
    if (this._regionSelector) {
      return getSmart(this._regionSelector, { origin: this._root })
    } else {
      return up.form.getRegion(this._root)
    }
  }

  _parseSwitcheeTokens(str) {
    return getSimpleTokens(str, { json: true })
  }

  _buildFieldTokens() {
    let values = Params.fromContainer(this._root, { includeDisabled: true }).values()
    let tokens = [...values]

    let anyPresent = some(values, isPresent)
    tokens.push(anyPresent ? ':present' : ':blank')

    let fields = up.form.fields(this._root)
    if (fields[0]?.matches('[type=radio], [type=checkbox]')) {
      let anyChecked = some(fields, 'checked')
      tokens.push(anyChecked ? ':checked' : ':unchecked')
    }

    return tokens
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  Switcher,
}
