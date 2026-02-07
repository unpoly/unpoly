const e = up.element
const u = up.util

up.NonceAdopter = class NonceAdopter {

  constructor(responseNonces) {
    this._responseNonces = responseNonces
    this._pageNonce = up.protocol.cspNonce()
  }

  _isAdoptable(nonce) {
    return nonce && this._pageNonce && this._responseNonces?.includes(nonce)
  }

  adoptRenderOptions(json) {
    for (let key of Object.keys(json)) {
      let script = json[key]
      if (/^on[A-Z]$/.test(key) && u.isString(script) && script.startsWith('nonce-')) {
        this._adoptScript(script, (adoptedScript) => json[key] = adoptedScript)
      }
    }
  }

  adoptElementSubtree(root) {
    for (let script of up.script.findScripts(root, '[nonce]')) {
      this._adoptNonce(script.nonce, (pageNonce) => script.nonce = pageNonce)
    }

    for (let attribute of up.script.config.nonceableAttributes) {
      for (let match of e.subtree(root, `[${attribute}^="nonce-"]`)) {
        let attributeValue = match.getAttribute(attribute)
        this._adoptScript(attributeValue, (newValue) => match.setAttribute(attribute, newValue))
      }
    }
  }

  _adoptNonce(nonce, updateFn) {
    if (this._isAdoptable(nonce)) {
      updateFn(this._pageNonce)
    }
  }

  _adoptScript(script, updateFn) {
    let callback = up.NonceableCallback.fromString(script)
    if (this._isAdoptable(callback.nonce)) {
      updateFn(callback.toString(this._pageNonce))
    }
  }

}
