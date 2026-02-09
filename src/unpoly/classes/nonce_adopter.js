const e = up.element
const u = up.util

const STRATEGY_FNS = {
  pass: () => false,
  block: () => true,
  nonce: (item) => this._hasValidNonce(item)
}

up.ScriptAdopter = class ScriptAdopter {

  constructor({ response, strategy }) {
    this._response = response
    this._strategy = this._resolveStrategy(strategy)
    this._pageNonce = up.protocol.cspNonce()
  }

  adoptNewFragment(root) {
    this._adoptScriptElements(root)
    this._adoptAttributeCallbacks(root)
  }

  adoptRenderOptionsFromHeader(object) {
    let objectStrategy = this._resolveStrategy(up.script.config.allow.headerCallbacks)

    for (let key of Object.keys(object)) {
      let script = object[key]
      if (/^on[A-Z]$/.test(key) && u.isString(script)) {
        let item = new ObjectPropertyItem(object, key)
        this._processItem(item, objectStrategy)
      }
    }
  }

  _adoptScriptElements(root) {
    let scriptElementStrategy = this._resolveStrategy(up.script.config.allow.scriptElements)

    for (let script of up.script.findScripts(root)) {
      let item = new ScriptElementItem(script)
      this._processItem(item, scriptElementStrategy)
    }
  }

  _adoptAttributeCallbacks(root) {
    let attributeStrategy = this._resolveStrategy(up.script.config.allow.attributeCallbacks)

    // TODO: It is weird that we keep a list of callback options in RenderOptions, but the list of nonceable attrs is in up.script? Maybe at least move them together?
    for (let attribute of up.script.config.nonceableAttributes) {
      let matches = e.subtree(root, e.attrSelector(attribute))
      for (let element of matches) {
        let item = new AttributeItem(element, attribute)
        this._processItem(item, attributeStrategy)
      }
    }
  }

  _processItem(item, strategy) {
    if (strategy(item)) {
      this._tryAdoptNonce(item)
    } else {
      item.block()
    }
  }

  _tryAdoptNonce(item) {
    if (this._hasValidNonce(item)) {
      item.writeNonce(this._pageNonce)
    }
  }

  _hasValidNonce(item) {
    let nonce = item.readNonce()
    return nonce && ((this._pageNonce === nonce) || this._response?.cspInfo.nonces?.includes(nonce))
  }

  _resolveStrategy(strategy = up.script.config.allow.default) {
    // Whatever we decide here is still subject to the browser's CSP afterwards.
    // TODO: Document this:
    return u.presence(strategy, u.isFunction)
      || this._resolveAutoStrategy(strategy)
      || STRATEGY_FNS[strategy]
      || up.fail('Unknown script strategy: %o', strategy)
  }

  _resolveAutoStrategy(strategy) {
    if (strategy === 'auto') {
      // When the strategy is a constant `true` and also using strict-dynamic,
      // we enforce a correct nonce. Otherwise we would allow all scripts (as strict-dynamic is viral,
      // and Unpoly is already an allowed script).
      return this._isStrictDynamicCSP() ? 'nonce' : 'pass'
    }
  }

  _isStrictDynamicCSP() {
    return this._response?.cspInfo.declaration.includes("'strict-dynamic'")
  }

}

class StringCallbackItem {

  readNonce() {
    return this._getCallback().nonce
  }

  writeNonce(nonce) {
    let callback = this._getCallback()
    callback.nonce = nonce
    this.writeCallbackString(this._attrName, callback.toString())
  }

  _getCallback() {
    return this._cacheCallback ||= up.NonceableCallback.fromString(this.readCallbackString())
  }

  block() {
    this.writeCallbackString('/* blocked */')
  }

}

class AttributeItem extends StringCallbackItem {

  constructor(element, attribute) {
    super()
    this.element = element
    this.attribute = attribute
  }

  readCallbackString() {
    return this._element.getAttribute(this.attribute)
  }

  writeCallbackString(string) {
    this.element.setAttribute(this.attribute, string)
  }


}

class ObjectPropertyItem extends StringCallbackItem {

  constructor(object, key) {
    super()
    this.object = object
    this.key = key
  }

  readCallbackString() {
    return this.object[this.key]
  }

  writeCallbackString(string) {
    this.object[this.key] = string
  }

}

class ScriptElementItem {

  constructor(element) {
    this.element = element
  }

  readNonce() {
    return this.element.nonce
  }

  writeNonce(nonce) {
    this.element.nonce = nonce
  }

  block() {
    this.element.type = 'up-blocked-script'
  }

}
