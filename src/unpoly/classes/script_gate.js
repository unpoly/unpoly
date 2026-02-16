const e = up.element
const u = up.util

function logBlocked(scriptElementOrCallbackString) {
  up.puts('up.script', 'Blocked script: %o', scriptElementOrCallbackString)
}

up.ScriptGate = class ScriptGate {

  constructor(cspInfo) {
    this._cspInfo = cspInfo
    this._pageNonce = up.protocol.cspNonce()
  }

  evalCallback(nonceableCallback, evalEnv, policy) {
    // There are multiple reasons why we explicitly check if a callback is allowed,
    // instead of relying on the document's CSP checks:
    //
    // (A) The user might have configured a rejecting script policy in up.script.config.policy.
    //     This policy might be stricter than the CSP, e.g. to prevent callbacks entirely.
    // (B) While we proactively block scripts in new fragments, we may have unprocessed scripts
    //     from the initial page load, or from an attacker that has some control over the HTML.
    // (C) We might have a nonced callback, meaning we need to execute using a <script nonce> element.
    //     With a viral strict-dynamic CSP the browser will happily let Unpoly execute *any* <script>,
    //     even if a nonce is missing or incorrect. In this case we want to explicitly check for
    //     a valid nonce. Otherwise an attacker could set an [up-on-loaded] callback with an incorrect nonce,
    //     trigger <script nonce> execution and run arbitrary JavaScript.
    if (!this._satisfiesPolicy(policy, nonceableCallback.nonce)) {
      return nonceableCallback.unsafeEval(...evalEnv)
    } else {
      logBlocked(nonceableCallback.script)
    }
  }

  adoptNewFragment(fragment) {
    this._adoptScriptElements(fragment, up.script.config.policy.bodyScript)
    this._adoptAttrCallbacks(fragment, up.script.config.policy.attrCallback)
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

  _adoptAttrCallbacks(root, policy) {
    // TODO: It is weird that we keep a list of callback options in RenderOptions, but the list of nonceable attrs is in up.script? Maybe at least move them together?
    for (let attribute of up.script.config.nonceableAttributes) {
      let matches = e.subtree(root, e.attrSelector(attribute))
      for (let element of matches) {
        let item = new AttributeItem(element, attribute, policy)
        this._processItem(item, policy)
      }
    }
  }

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

  _satisfiesPolicy(policy, itemNonce) {
    policy ??= up.script.config.policy.default

    if (policy === 'auto') policy = this._resolveAutoPolicy()

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

  _resolveAutoPolicy() {
    // (A) With a strict-dynamic CSP, it's a good idea to enforce nonces in the new content.
    //     Otherwise, we would allow *all* scripts as strict-dynamic is viral, and Unpoly is already an allowed script.
    // (B) Don't assume 'nonce' when we see a <meta name="csp-nonce">. The user might want to provide
    //     a nonce for Unpoly callbacks, but still use a hostname-based allowlist.
    if (this._isStrictDynamicCSP()) {
      return 'nonce'
    } else {
      return 'pass'
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
    up.script.block(this._element)
  }

}
