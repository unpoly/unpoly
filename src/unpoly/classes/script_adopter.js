const e = up.element
const u = up.util

const STRATEGY_FNS = {
  pass: () => false,
  block: () => true,
  nonce: (item) => this._hasValidNonce(item)
}

up.ScriptAdopter = class ScriptAdopter {

  constructor(cspInfo) {
    this._cspInfo = cspInfo
    this._pageNonce = up.protocol.cspNonce()
  }

  adoptNewFragment(fragment) {
    this._adoptScriptElements(fragment, this._resolveStrategy(up.script.config.allow.scriptElements))
    this._adoptAttributeCallbacks(fragment, this._resolveStrategy(up.script.config.allow.attributeCallbacks))
  }


  adoptDetachedAssets(assets) {
    // (A) These assets are not normally going to be inserted into the page, but may emit up:assets:changed.
    // (B) We need to adopt script[nonce] attributes for the comparison, and in case the user wants to insert manually.
    // (C) We don't block untrusted scripts for the same reason.
    for (let asset of assets) {
      this._adoptScriptElements(asset, 'pass')
    }
  }

  adoptRenderOptionsFromHeader(object) {
    let objectStrategy = this._resolveStrategy(up.script.config.allow.headerCallbacks)

    for (let key of Object.keys(object)) {
      let script = object[key]
      if (/^on[A-Z]$/.test(key) && u.isString(script)) {
        let item = new ObjectPropertyItem(object, key)
        this._processItem(item, objectStrategy)
        object[key] = up.RenderOptions.parseCallback(key, object[key])
      }
    }
  }

  _adoptScriptElements(root, strategy) {
    for (let script of up.script.findScripts(root)) {
      let item = new ScriptElementItem(script)
      this._processItem(item, strategy)
    }
  }

  _adoptAttributeCallbacks(root, strategy) {
    // TODO: It is weird that we keep a list of callback options in RenderOptions, but the list of nonceable attrs is in up.script? Maybe at least move them together?
    for (let attribute of up.script.config.nonceableAttributes) {
      let matches = e.subtree(root, e.attrSelector(attribute))
      for (let element of matches) {
        let item = new AttributeItem(element, attribute)
        this._processItem(item, strategy)
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
    return nonce && ((this._pageNonce === nonce) || this._cspInfo?.nonces?.includes(nonce))
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
      // With a strict-dynamic CSP, it's a good idea to enforce nonces.
      // Otherwise, we would allow *all* scripts as strict-dynamic is viral, and Unpoly is already an allowed script.
      return this._isStrictDynamicCSP() ? 'nonce' : 'pass'
    }
  }

  _isStrictDynamicCSP() {
    return this._cspInfo?.declaration.includes("'strict-dynamic'")
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
