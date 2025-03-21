const u = up.util
const e = up.element

const BUILTIN_SWITCH_EFFECTS = [
  { attr: 'up-hide-for', toggle(target, active) { e.toggle(target, !active) } },
  { attr: 'up-show-for', toggle(target, active) { e.toggle(target, active) } },
  { attr: 'up-disable-for', toggle(target, active) { up.form.setDisabled(target, active) } },
  { attr: 'up-enable-for', toggle(target, active) { up.form.setDisabled(target, !active) } },
]

up.Switcher = class Switcher {

  constructor(switcherElement) {
    this._switcher = switcherElement
    this._switcheeSelector = switcherElement.getAttribute('up-switch') || up.fail("No switch target given for %o", switcherElement)
  }

  start() {
    let cleaner = u.cleaner()

    console.debug("[Switcher] Started (watching field %o)", this._switcher)

    this._switchScope()

    cleaner(
      up.watch(this._switcher, () => this._switchScope())
    )

    cleaner(
      up.on(this._scope, 'up:fragment:inserted', (_event, newFragment) => this._switchScope(newFragment))
    )

    return cleaner.clean
  }

  _switchScope(scope = this._scope) {
    const fieldValues = this._switcherValues()
    console.debug("[Switcher] switchNow(scope: %o) for values %o", scope, fieldValues)
    for (let switchee of this._findSwitchees(scope)) {
      this._switchSwitchee(switchee, fieldValues)
    }
  }

  _switchSwitchee(switchee, fieldValues) {
    console.debug("[Switcher] Processing switchee: %o", switchee)
    // TODO: Emit up:form:switch here and possibly migrate our own effects to it
    for (let { attr, toggle } of BUILTIN_SWITCH_EFFECTS) {
      let attrValue = switchee.getAttribute(attr)
      if (attrValue) {
        let activeValues = this._parseSwitcheeTokens(attrValue)
        let isActive = u.intersect(fieldValues, activeValues).length > 0
        toggle(switchee, isActive)
      }
    }
  }

  _findSwitchees(scope) {
    return up.fragment.subtree(scope, this._switcheeSelector)
  }

  get _scope() {
    return up.form.getScope(this._switcher)
  }

  _parseSwitcheeTokens(str) {
    return u.getSimpleTokens(str, { json: true })
  }

  _switcherValues() {
    let field = this._switcher
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
