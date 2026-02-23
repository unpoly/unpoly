const e = up.element
const u = up.util

up.ScriptGate = class ScriptGate {

  constructor(cspInfo = up.CSPInfo.none()) {
    // Only parse the page nonce once for adopting multiple items.
    // TODO: Consider moving page none parsing to CSPInfo
    let pageNonce = up.script.cspNonce()

    this._evalCallbackPolicy = new EvalCallbackPolicy(pageNonce, cspInfo)
    this._scriptElementPolicy = new BodyScriptElementPolicy(pageNonce, cspInfo)
    this._detachedAssetPolicy = new DetachedAssetPolicy(pageNonce, cspInfo)
  }

  warnOfUnsafeCSP() {
    if (up.script.config.cspWarnings) {
      this._evalCallbackPolicy.warnOfUnsafeCSP()
      this._scriptElementPolicy.warnOfUnsafeCSP()
    }
  }

  evalCallback(nonceableCallback, evalEnv) {
    const policy = this._evalCallbackPolicy

    // There are multiple reasons why we explicitly check if a callback is allowed,
    // instead of relying on the document's CSP checks:
    //
    // (A) The user might have configured a blocking script policy in up.script.config.evalCallbackPolicy.
    //     This policy might be stricter than the CSP, e.g. to prevent callbacks entirely.
    // (B) While we proactively block scripts in new fragments, we may have unprocessed scripts
    //     from the initial page load, or from an attacker that has some control over the HTML.
    // (C) We might have a nonced callback, meaning we need to execute using a <script nonce> element.
    //     With a viral strict-dynamic CSP the browser will happily let Unpoly execute *any* <script>,
    //     even if a nonce is missing or incorrect. In this case we want to explicitly check for
    //     a valid nonce. Otherwise an attacker could set an [up-on-loaded] callback with an incorrect nonce,
    //     trigger <script nonce> execution and run arbitrary JavaScript.
    if (!policy.passesItem(nonceableCallback.nonce)) {
      return nonceableCallback.unsafeEval(...evalEnv)
    } else {
      // We don't change the DOM in this path. We only refuse to eval and log the refusal.
      policy.log(['Blocked callback: %o', nonceableCallback.script])
    }
  }

  adoptNewFragment(fragment) {
    this._adoptScriptElements(fragment)
    this._adoptAttrCallbacks(fragment)
  }

  adoptDetachedHeadAsset(asset) {
    if (!up.script.isScript(asset)) return

    // (A) These assets are not normally going to be inserted into the page, but may emit up:assets:changed.
    // (B) We need to adopt script[nonce] attributes for the comparison, and in case the user wants to insert manually.
    // (C) We don't block untrusted scripts for the same reason.
    let item = new ScriptElementItem(asset)
    this._detachedAssetPolicy.processItem(item)
  }

  adoptRenderOptionsFromHeader(object) {
    let policy = this._evalCallbackPolicy

    for (let key of Object.keys(object)) {
      let script = object[key]
      if (/^on[A-Z]$/.test(key) && u.isString(script)) {
        let item = new ObjectPropertyItem(object, key)
        policy.processItem(item)
        object[key] = up.RenderOptions.parseCallback(key, object[key])
      }
    }
  }

  _adoptScriptElements(root) {
    const policy = this._scriptElementPolicy

    for (let script of up.script.findScripts(root)) {
      let item = new ScriptElementItem(script)
      policy.processItem(item)
    }
  }

  _adoptAttrCallbacks(root) {
    const policy = this._evalCallbackPolicy

    // TODO: It is weird that we keep a list of callback options in RenderOptions, but the list of nonceable attrs is in up.script? Maybe at least move them together?
    for (let attribute of up.script.config.nonceableAttributes) {
      let matches = e.subtree(root, e.attrSelector(attribute))
      for (let element of matches) {
        let item = new AttributeItem(element, attribute, policy)
        policy.processItem(item)
      }
    }
  }

}

class Policy {

  constructor(pageNonce, cspInfo) {
    this.pageNonce = pageNonce

    // TODO: Consider moving nonce checking to CSPInfo
    this.cspInfo = cspInfo

    this._validNonces = new Set(cspInfo.nonces)
    // (A) Allow the page nonce for up.script.evalCallback(), which checks an already adopted callback.
    // (B) Allow the page nonce for developers who do keep their nonces stable across sessions.
    if (pageNonce) this._validNonces.add(pageNonce)
  }

  isValidNonce(nonce) {
    return this._validNonces.has(nonce)
  }

  tryRewriteNonce(allowedItem, nonce = allowedItem.readNonce()) {
    // (A) Only rewrite nonces if we know a better nonce from <meta name="csp-nonce">. Don't set "undefined".
    // (B) Even with "pass" we only want to adopt valid nonces. Otherwise we might accidentally allow a
    //     script with disallowed hostname in a host-based CSPs that also has nonces for callbacks.
    if (this.pageNonce && this.isValidNonce(nonce)) {
      allowedItem.writeNonce(this.pageNonce)
    }
  }

  warnOfUnsafeCSP() {
    throw new up.NotImplemented()
  }

  processItem(item) {
    // We need the nonce twice below. Only read it once for performance.
    let nonce = item.readNonce()
    let blocked = !this.passesItem(nonce)

    if (blocked) {
      // (A) Script elements need to be blocked on adoption, as inserting a script immediately executes them.
      // (B) Callback strings will get another check during execution. We still block them during adoption for debuggability.
      this.log(...item.logBlockedDescriptor())
      item.block()
    } else {
      this.tryRewriteNonce(item, nonce)
    }
  }

  passesItem(itemNonce) {
    throw new up.NotImplemented()
  }

}

class DetachedAssetPolicy extends Policy {

  constructor(...args) {
    super(...args)
  }

  passesItem(_itemNonce) {
    return true
  }

}

class ConfigurablePolicy extends Policy {

  constructor(configProp, pageNonce, cspInfo) {
    // Page nonce and CSP info must be known for #resolveAuto()
    super(pageNonce, cspInfo)

    this._configProp = configProp

    let policyString = up.script.config[configProp]
    if (policyString === 'auto') policyString = this.resolveAuto()
    if (policyString === 'nonce' && !this.pageNonce) {
      this.warn('Enforcing nonces requires a <meta name="csp-nonce">.')
      policyString = 'block'
    }
    this.policyString = policyString
  }

  resolveAuto() {
    throw new up.NotImplemented()
  }

  passesItem(itemNonce) {
    switch (this.policyString) {
      // Always pass. Script must pass CSP.
      // Bad idea for a strict-dynamic CSP, which allows everything.
      case 'pass': return true

      // Always block, regardless of CSP.
      case 'block': return false

      // Block any non-nonced scripts.
      // Nonces will be checked in processItem().
      case 'nonce': return this.isValidNonce(itemNonce)

      default: up.fail('Unknown policy: %s = %o', this.configExpression(), this.policyString)
    }
  }

  log(...descriptorArgs) {
    up.puts(this.configExpression(), ...descriptorArgs)
  }

  warn(...descriptorArgs) {
    up.warn(this.configExpression(), ...descriptorArgs)
  }

  configExpression() {
    return 'up.script.config.' + this._configProp
  }

}

class EvalCallbackPolicy extends ConfigurablePolicy {

  constructor(...args) {
    super('evalCallbackPolicy', ...args)
  }

  resolveAuto() {
    // When the user inserted a <meta name="csp-nonce">, we assume their intent is to
    // enforce nonces for any callback.
    if (this.pageNonce) {
      return 'nonce'
    } else {
      return 'pass'
    }
  }

  warnOfUnsafeCSP() {
    if (this.policyString === 'pass' && this.cspInfo.isUnsafeEval()) {
      this.warn(`An 'unsafe-eval' CSP allows arbitrary [up-on...] callbacks. Consider setting ${this.configExpression()} = 'nonce'.`)
    }
  }

}

class BodyScriptElementPolicy extends ConfigurablePolicy {

  constructor(...args) {
    super('scriptElementPolicy', ...args)
  }

  resolveAuto() {
    // (A) With a strict-dynamic CSP, it's a good idea to enforce nonces in the new content.
    //     Otherwise, we would allow *all* scripts as strict-dynamic is viral, and Unpoly is already an allowed script.
    // (B) Don't assume 'nonce' when we see a <meta name="csp-nonce">. The user might want to provide
    //     a nonce for Unpoly callbacks, but still use a hostname-based allowlist.
    if (this.cspInfo.isStrictDynamic()) {
      return 'nonce'
    } else {
      return 'pass'
    }
  }

  warnOfUnsafeCSP() {
    if (this.policyString === 'pass' && this.cspInfo.isStrictDynamic()) {
      this.warn(`A 'strict-dynamic' CSP allows arbitrary <script> elements in new fragments. Consider setting ${this.configExpression()} = 'nonce'.`)
    }
  }

}


class StringCallbackItem {

  readNonce() {
    return this._getCallback().nonce
  }

  writeNonce(nonce) {
    let callback = this._getCallback()
    callback.nonce = nonce
    this.writeCallbackString(callback.toString())
  }

  _getCallback() {
    return this._cacheCallback ||= up.NonceableCallback.fromString(this.readCallbackString())
  }

  logBlockedDescriptor() {
    throw new up.NotImplemented()
  }

  block() {
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

  constructor(element, attribute) {
    super()
    this._element = element
    this._attribute = attribute
  }

  logBlockedDescriptor() {
    return ['Blocked callback attribute: %s', e.attrSelector(this._attribute, this.readCallbackString())]
  }

  readCallbackString() {
    return this._element.getAttribute(this._attribute)
  }

  writeCallbackString(newString) {
    this._element.setAttribute(this._attribute, newString)
  }

}

class ObjectPropertyItem extends StringCallbackItem {

  constructor(object, key) {
    super()
    this._object = object
    this._key = key
  }

  logBlockedDescriptor() {
    return ['Blocked string callback: { %s: %o }', this._key, this.readCallbackString()]
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
    // Set an attribute (instead of the property), so the change is reflected in the DOM explorer for easier debugging
    this._element.setAttribute('nonce', nonce)
  }

  logBlockedDescriptor() {
    return ['Blocked <script> element: %o', this._element]
  }

  block() {
    up.script.block(this._element)
  }

}
