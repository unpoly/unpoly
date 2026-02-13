const e = up.element
const u = up.util

function logBlocked(scriptElementOrCallbackString) {
  up.puts('up.script', 'Blocking script: %o', scriptElementOrCallbackString)
}

up.ScriptGate = class ScriptGate {

  constructor(cspInfo) {
    this._cspInfo = cspInfo
    this._pageNonce = up.protocol.cspNonce()
  }

  verifyAndRunCallback(nonceableCallback, ...runArgs) {
    if (!this._satisfiesPolicy(nonceableCallback.policy, nonceableCallback.nonce)) {
      return nonceableCallback.runUnsafe(...runArgs)
    } else {
      logBlocked(nonceableCallback.script)
    }
  }

  adoptNewFragment(fragment) {
    this._adoptScriptElements(fragment, up.script.config.policy.bodyScript)
    this._adoptAttributeCallbacks(fragment, up.script.config.policy.attributeCallback)
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
    let policy = up.script.config.policy.headerCallback

    for (let key of Object.keys(object)) {
      let script = object[key]
      if (/^on[A-Z]$/.test(key) && u.isString(script)) {
        let item = new ObjectPropertyItem(object, key)
        this._processItem(item, policy)
        object[key] = up.RenderOptions.parseCallback(key, object[key], policy)
      }
    }
  }

  _adoptScriptElements(root, policy) {
    for (let script of up.script.findScripts(root)) {
      let item = new ScriptElementItem(script, policy)
      this._processItem(item, policy)
    }
  }

  _adoptAttributeCallbacks(root, policy) {
    // TODO: It is weird that we keep a list of callback options in RenderOptions, but the list of nonceable attrs is in up.script? Maybe at least move them together?
    for (let attribute of up.script.config.nonceableAttributes) {
      let matches = e.subtree(root, e.attrSelector(attribute))
      for (let element of matches) {
        let item = new AttributeItem(element, attribute, policy)
        this._processItem(item, policy)
      }
    }
  }

  // _processItem(item, policy) {
  //   // We need the nonce twice below. Only read it once for performance.
  //   let nonce = item.readNonce()
  //
  //   if (this._satisfiesPolicy(policy, nonce)) {
  //     // We always process nonced scripts by either rewriting or blocking them.
  //     if (nonce) {
  //       if (this._isValidNonce(nonce)) {
  //         item.writeNonce(this._pageNonce)
  //       } else {
  //         item.block()
  //       }
  //     } else {
  //       // Allow nonce-less item that fulfills policy
  //     }
  //   } else {
  //     item.block()
  //   }
  // }

  _processItem(item, policy) {
    // We need the nonce twice below. Only read it once for performance.
    let nonce = item.readNonce()
    let blocked = !this._satisfiesPolicy(policy, nonce)

    if (blocked) {
      // (A) Script elements need to be blocked on adoption, as inserting a script immediately executes them.
      // (B) Callback strings will get another check during execution. We still block them during adoption for debuggability.
      item.block()
    } else if (nonce) {
      item.writeNonce(this._pageNonce)
    }
  }

  // TODO: The method names sounds like it would already do the check. Should it do the check?
  _satisfiesPolicy(policy = up.script.config.policy.default, itemNonce) {
    if (policy === 'auto') {
      // With a strict-dynamic CSP, it's a good idea to enforce nonces.
      // Otherwise, we would allow *all* scripts as strict-dynamic is viral, and Unpoly is already an allowed script.
      policy = this._isStrictDynamicCSP() ? 'nonce' : 'pass'
    }

    switch (policy) {
      // Always pass. Script must pass CSP.
      // Bad idea for a strict-dynamic CSP, which allows everything.
      case 'pass': return true

      // Always block, regardless of CSP.
      case 'block': return false

      // Block any non-nonced scripts.
      // Nonced scripts will be validated (or blocked) in _processItem().
      case 'nonce': return this._isValidNonce(itemNonce)

      default: up.fail('Unknown script policy: %o', policy)
    }
  }

  _isValidNonce(nonce) {
    return nonce && ((this._pageNonce === nonce) || this._cspInfo?.nonces?.includes(nonce))
  }

  _isStrictDynamicCSP() {
    return this._cspInfo?.declaration.includes("'strict-dynamic'")
  }

}

class StringCallbackItem {

  constructor(policy) {
    this.policy = policy
  }

  readNonce() {
    return this._getCallback().nonce
  }

  writeNonce(nonce) {
    let callback = this._getCallback()
    callback.nonce = nonce
    this.writeCallbackString(callback.toString())
  }

  _getCallback() {
    return this._cacheCallback ||= up.NonceableCallback.fromString(this.readCallbackString(), this.policy)
  }

  block() {
    logBlocked(this._getCallback().script)
    this.writeCallbackString('/* blocked */')
  }

  readCallbackString() {
    throw new up.NotImplemented()
  }

  writeCallbackString(_newString) {
    throw new up.NotImplemented()
  }

}

class AttributeItem extends StringCallbackItem {

  constructor(element, attribute, policy) {
    super(policy)
    this._element = element
    this._attribute = attribute
  }

  readCallbackString() {
    return this._element.getAttribute(this._attribute)
  }

  writeCallbackString(newString) {
    this._element.setAttribute(this._attribute, newString)
  }


}

class ObjectPropertyItem extends StringCallbackItem {

  constructor(object, key, policy) {
    super(policy)
    this._object = object
    this._key = key
  }

  readCallbackString() {
    return this._object[this._key]
  }

  writeCallbackString(newString) {
    this._object[this._key] = newString
  }

}

class ScriptElementItem {

  constructor(element) {
    this._element = element
  }

  readNonce() {
    return this._element.nonce
  }

  writeNonce(nonce) {
    this._element.nonce = nonce
  }

  block() {
    logBlocked(this._element)
    this._element.type = 'up-blocked-script'
  }

}
