const u = up.util
const e = up.element

const BUILTIN_SWITCH_EFFECTS = [
  { attr: 'up-hide-for', toggle(target, active) { e.toggle(target, !active) } },
  { attr: 'up-show-for', toggle(target, active) { e.toggle(target, active) } },
  { attr: 'up-disable-for', toggle(target, active) { up.form.setDisabled(target, active) } },
  { attr: 'up-enable-for', toggle(target, active) { up.form.setDisabled(target, !active) } },
]

up.Switcher = class Switcher {

  constructor(root) {
    // The root should either be an individual input, or a container of radio buttons.
    this._root = root
    this._switcheeSelector = root.getAttribute('up-switch') || up.fail("No switch target given for %o", root)
    this._regionSelector = root.getAttribute('up-switch-region')
  }

  start() {
    this._switchRegion()

    return u.sequence(
      this._trackFieldChanges(),
      this._trackNewSwitchees(),
    )
  }

  _trackFieldChanges() {
    let callback = () => this._onFieldChanged()
    return up.migrate.watchForSwitch?.(this._root, callback)
      || up.watch(this._root, { logPrefix: '[up-switch]' }, callback)
  }

  _trackNewSwitchees() {
    let filter = (matches) => {
      let scope = this._scope
      return u.filter(matches, (match) => scope.contains(match))
    }

    let onSwitcheeAdded = (switchee) => this._switchSwitchee(switchee)

    return up.fragment.trackSelector(this._switcheeSelector, { filter }, onSwitcheeAdded)
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
    if (!u.isEqual(previousValues, fieldTokens)) {
      switchee.upSwitchValues = fieldTokens
      this._switchSwitcheeNow(switchee, fieldTokens)
    }
  }

  _switchSwitcheeNow(switchee, fieldTokens) {
    for (let { attr, toggle } of BUILTIN_SWITCH_EFFECTS) {
      let attrValue = switchee.getAttribute(attr)
      if (attrValue) {
        let activeTokens = this._parseSwitcheeTokens(attrValue)
        let isActive = u.intersect(fieldTokens, activeTokens).length > 0
        toggle(switchee, isActive)
      }
    }
    let log = ['Switching %o', switchee]
    up.emit(switchee, 'up:form:switch', { field: this._root, fieldTokens, log })
  }

  _findSwitchees() {
    return up.fragment.subtree(this._scope, this._switcheeSelector)
  }

  get _scope() {
    if (this._regionSelector) {
      return up.fragment.get(this._regionSelector, { origin: this._root })
    } else {
      return up.form.getRegion(this._root)
    }
  }

  _parseSwitcheeTokens(str) {
    return u.getSimpleTokens(str, { json: true })
  }

  _buildFieldTokens() {
    let values = up.Params.fromContainer(this._root).values()
    let tokens = [...values]

    let anyPresent = u.some(values, u.isPresent)
    tokens.push(anyPresent ? ':present' : ':blank')

    let fields = up.form.fields(this._root)
    if (fields[0]?.matches('[type=radio], [type=checkbox]')) {
      let anyChecked = u.some(fields, 'checked')
      tokens.push(anyChecked ? ':checked' : ':unchecked')
    }

    return tokens
  }

}
