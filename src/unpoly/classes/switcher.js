const u = up.util
const e = up.element

const BUILTIN_SWITCH_EFFECTS = [
  { attr: 'up-hide-for', toggle(target, active) { e.toggle(target, !active) } },
  { attr: 'up-show-for', toggle(target, active) { e.toggle(target, active) } },
  { attr: 'up-disable-for', toggle(target, active) { up.form.setDisabled(target, active) } },
  { attr: 'up-enable-for', toggle(target, active) { up.form.setDisabled(target, !active) } },
]

up.Switcher = class Switcher {

  constructor(field) {
    this._field = field
    this._switcheeSelector = field.getAttribute('up-switch') || up.fail("No switch target given for %o", field)
    this._scopeSelector = field.getAttribute('up-switch-scope')
  }

  start() {
    this._switchScope()

    return u.sequence(
      this._trackFieldChanges(),
      this._trackNewSwitchees(),
    )
  }

  _trackFieldChanges() {
    return up.watch(this._field, () => this._onFieldChanged())
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
    this._switchScope()
  }

  _switchScope() {
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
    up.emit(switchee, 'up:form:switch', { field: this._field, tokens: fieldTokens, log })
  }

  _findSwitchees() {
    return up.fragment.subtree(this._scope, this._switcheeSelector)
  }

  get _scope() {
    if (this._scopeSelector) {
      return up.fragment.get(this._scopeSelector, { origin: this._field })
    } else {
      return up.form.getScope(this._field)
    }
  }

  _parseSwitcheeTokens(str) {
    return u.getSimpleTokens(str, { json: true })
  }

  _buildFieldTokens() {
    let field = this._field
    let value
    let meta

    if (field.matches('input[type=checkbox]')) {
      if (field.checked) {
        value = field.value
        meta = ':checked'
      } else {
        meta = ':unchecked'
      }
    } else if (field.matches('input[type=radio]')) {
      // TODO: Allow [up-switch] on a container of radio buttons
      const groupName = field.getAttribute('name')
      const checkedButton = this._scope.querySelector(`input[type=radio]${e.attrSelector('name', groupName)}:checked`)
      if (checkedButton) {
        meta = ':checked'
        value = checkedButton.value
      } else {
        meta = ':unchecked'
      }
    } else {
      value = field.value
    }

    const values = []
    if (u.isPresent(value)) {
      values.push(value)
      values.push(':present')
    } else {
      values.push(':blank')
    }
    if (u.isPresent(meta)) {
      values.push(meta)
    }
    return values
  }

}
