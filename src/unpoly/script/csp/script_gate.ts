import { isString } from '../../util.js'
import type { PlainObject } from '../../util.js'
import { attrSelector, subtree } from '../../element.js'
import { fail } from '../../error.js'
import { Blocked } from '../../error/blocked.js'
import { NotImplemented } from '../../error/not_implemented.js'
import { RenderOptions } from '../../fragment/render/render_options.js'
import { printToStandard, printToWarn } from '../../log.js'
import { block, config, cspNonce, findScripts, isScript } from '../../script.js'
import { CSPInfo } from './csp_info.js'
import { NonceableCallback } from './nonceable_callback.js'
import type { EvalEnv } from './nonceable_callback.js'

/**
A value that `up.script.config.evalCallbackPolicy` or `up.script.config.scriptElementPolicy` can be set to.
@internal
*/
export type PolicyString = 'pass' | 'block' | 'nonce' | 'auto'

/**
Something that may carry a nonce, like a `<script>` element or an `[up-on-…]` attribute.
@internal
*/
interface PolicyItem {
  readNonce(): string | undefined
  writeNonce(nonce: string): void
  logBlockedDescriptor(): any[]
  block(): void
}

// Options in an X-Up-Open-Layer header that start with "on", but take a selector instead of a callback.
const NON_CALLBACK_KEYS = ['onAcceptedReload', 'onDismissedReload']

export class ScriptGate {
  declare _evalCallbackPolicy: EvalCallbackPolicy
  declare _scriptElementPolicy: BodyScriptElementPolicy
  declare _detachedAssetPolicy: DetachedAssetPolicy

  constructor(cspInfo = CSPInfo.none()) {
    // Only parse the page nonce once for adopting multiple items.
    // TODO: Consider moving page none parsing to CSPInfo
    let pageNonce = cspNonce()

    this._evalCallbackPolicy = new EvalCallbackPolicy(pageNonce, cspInfo)
    this._scriptElementPolicy = new BodyScriptElementPolicy(pageNonce, cspInfo)
    this._detachedAssetPolicy = new DetachedAssetPolicy(pageNonce, cspInfo)
  }

  warnOfUnsafeCSP(): void {
    if (config.cspWarnings) {
      this._evalCallbackPolicy.warnOfUnsafeCSP()
      this._scriptElementPolicy.warnOfUnsafeCSP()
    }
  }

  evalCallback(nonceableCallback: NonceableCallback, evalEnv: EvalEnv): any {
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
    if (policy.passesItem(nonceableCallback.nonce)) {
      try {
        return nonceableCallback.unsafeEval(evalEnv)
      } catch (error) {
        if (error instanceof EvalError) {
          throw new Blocked(error.message)
        } else {
          throw error
        }
      }
    } else {
      // We don't rewrite the callback string in the DOM.
      throw new Blocked('Blocked callback: ' + nonceableCallback.script)
    }
  }

  adoptNewFragment(fragment: Element): void {
    this._adoptScriptElements(fragment)
    this._adoptAttrCallbacks(fragment)
  }

  adoptDetachedHeadAsset(asset: Element): void {
    if (!isScript(asset)) return

    // (A) These assets are not normally going to be inserted into the page, but may emit up:assets:changed.
    // (B) We need to adopt script[nonce] attributes for the comparison, and in case the user wants to insert manually.
    // (C) We don't block untrusted scripts for the same reason.
    let item = new ScriptElementItem(asset as HTMLScriptElement)
    this._detachedAssetPolicy.processItem(item)
  }

  adoptRenderOptionsFromHeader(object: PlainObject): void {
    let policy = this._evalCallbackPolicy

    for (let key of Object.keys(object)) {
      let script = object[key]

      // Any other on* key is a callback, so a mistyped key fails with "Unknown callback".
      if (/^on[A-Z]/.test(key) && !NON_CALLBACK_KEYS.includes(key) && isString(script)) {
        let item = new ObjectPropertyItem(object, key)
        policy.processItem(item)
        object[key] = RenderOptions.parseCallback(key, object[key])
      }
    }
  }

  _adoptScriptElements(root: Element): void {
    const policy = this._scriptElementPolicy

    for (let script of findScripts(root)) {
      let item = new ScriptElementItem(script)
      policy.processItem(item)
    }
  }

  _adoptAttrCallbacks(root: Element): void {
    const policy = this._evalCallbackPolicy

    // TODO: It is weird that we keep a list of callback options in RenderOptions, but the list of nonceable attrs is in up.script? Maybe at least move them together?
    for (let attribute of config.nonceableAttributes) {
      let matches = subtree(root, attrSelector(attribute))
      for (let element of matches) {
        let item = new AttributeItem(element, attribute, policy)
        policy.processItem(item)
      }
    }
  }

}

class Policy {
  declare pageNonce: string | undefined
  declare cspInfo: CSPInfo
  declare _validNonces: Set<string>

  constructor(pageNonce: string | undefined, cspInfo: CSPInfo) {
    this.pageNonce = pageNonce

    // TODO: Consider moving nonce checking to CSPInfo
    this.cspInfo = cspInfo

    this._validNonces = new Set(cspInfo.nonces)
    // (A) Allow the page nonce for up.script.evalCallback(), which checks an already adopted callback.
    // (B) Allow the page nonce for developers who do keep their nonces stable across sessions.
    if (pageNonce) this._validNonces.add(pageNonce)
  }

  isValidNonce(nonce: string | undefined): boolean {
    return this._validNonces.has(nonce)
  }

  tryRewriteNonce(allowedItem: PolicyItem, nonce = allowedItem.readNonce()): void {
    // (A) Only rewrite nonces if we know a better nonce from <meta name="csp-nonce">. Don't set "undefined".
    // (B) Even with "pass" we only want to adopt valid nonces. Otherwise we might accidentally allow a
    //     script with disallowed hostname in a host-based CSPs that also has nonces for callbacks.
    if (this.pageNonce && this.isValidNonce(nonce)) {
      allowedItem.writeNonce(this.pageNonce)
    }
  }

  warnOfUnsafeCSP(): void {
    throw new NotImplemented()
  }

  processItem(item: PolicyItem): void {
    // We need the nonce twice below. Only read it once for performance.
    let nonce = item.readNonce()
    let blocked = !this.passesItem(nonce)

    if (blocked) {
      // (A) Script elements need to be blocked on adoption, as inserting a script immediately executes them.
      // (B) Callback strings will get another check during execution. We still block them during adoption for debuggability.
      // Only a ConfigurablePolicy, which has a log() method, can block an item.
      (this as any).log(...item.logBlockedDescriptor())
      item.block()
    } else {
      this.tryRewriteNonce(item, nonce)
    }
  }

  passesItem(_itemNonce: string | undefined): boolean {
    throw new NotImplemented()
  }

}

class DetachedAssetPolicy extends Policy {

  constructor(...args: ConstructorParameters<typeof Policy>) {
    super(...args)
  }

  passesItem(_itemNonce: string | undefined): boolean {
    return true
  }

}

class ConfigurablePolicy extends Policy {
  declare _configProp: string
  declare policyString: PolicyString

  constructor(configProp: string, pageNonce: string | undefined, cspInfo: CSPInfo) {
    // Page nonce and CSP info must be known for #resolveAuto()
    super(pageNonce, cspInfo)

    this._configProp = configProp

    let policyString = config[configProp]
    if (policyString === 'auto') policyString = this.resolveAuto()
    if (policyString === 'nonce' && !this.pageNonce) {
      this.warn('Enforcing nonces requires a <meta name="csp-nonce">.')
      policyString = 'block'
    }
    this.policyString = policyString
  }

  resolveAuto(): PolicyString {
    throw new NotImplemented()
  }

  passesItem(itemNonce: string | undefined): boolean {
    switch (this.policyString) {
      // Always pass. Script must pass CSP.
      // Bad idea for a strict-dynamic CSP, which allows everything.
      case 'pass': return true

      // Always block, regardless of CSP.
      case 'block': return false

      // Block any non-nonced scripts.
      // Nonces will be checked in processItem().
      case 'nonce': return this.isValidNonce(itemNonce)

      default: fail('Unknown policy: %s = %o', this.configExpression(), this.policyString)
    }
  }

  log(...descriptorArgs: any[]): void {
    printToStandard(this.configExpression(), ...descriptorArgs)
  }

  warn(...descriptorArgs: any[]): void {
    printToWarn(this.configExpression(), ...descriptorArgs)
  }

  configExpression(): string {
    return 'up.script.config.' + this._configProp
  }

}

class EvalCallbackPolicy extends ConfigurablePolicy {

  constructor(...args: [string | undefined, CSPInfo]) {
    super('evalCallbackPolicy', ...args)
  }

  resolveAuto(): PolicyString {
    // When the user inserted a <meta name="csp-nonce">, we assume their intent is to
    // enforce nonces for any callback.
    if (this.pageNonce) {
      return 'nonce'
    } else {
      return 'pass'
    }
  }

  warnOfUnsafeCSP(): void {
    if (this.policyString === 'pass' && this.cspInfo.isUnsafeEval()) {
      this.warn(`An 'unsafe-eval' CSP allows arbitrary [up-on...] callbacks. Consider setting ${this.configExpression()} = 'nonce'.`)
    }
  }

}

class BodyScriptElementPolicy extends ConfigurablePolicy {

  constructor(...args: [string | undefined, CSPInfo]) {
    super('scriptElementPolicy', ...args)
  }

  resolveAuto(): PolicyString {
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

  warnOfUnsafeCSP(): void {
    if (this.policyString === 'pass' && this.cspInfo.isStrictDynamic()) {
      this.warn(`A 'strict-dynamic' CSP allows arbitrary <script> elements in new fragments. Consider setting ${this.configExpression()} = 'nonce'.`)
    }
  }

}


class StringCallbackItem implements PolicyItem {
  declare _cacheCallback: NonceableCallback | undefined

  readNonce(): string | undefined {
    return this._getCallback().nonce
  }

  writeNonce(nonce: string): void {
    let callback = this._getCallback()
    callback.nonce = nonce
    this.writeCallbackString(callback.toCallbackString())
  }

  _getCallback(): NonceableCallback {
    return this._cacheCallback ||= NonceableCallback.fromCallbackString(this.readCallbackString())
  }

  logBlockedDescriptor(): any[] {
    throw new NotImplemented()
  }

  block(): void {
    this.writeCallbackString('/* blocked */')
  }

  readCallbackString(): string {
    throw new NotImplemented()
  }

  writeCallbackString(_newString: string): void {
    throw new NotImplemented()
  }

}

class AttributeItem extends StringCallbackItem {
  declare _element: Element
  declare _attribute: string

  constructor(element: Element, attribute: string) {
    super()
    this._element = element
    this._attribute = attribute
  }

  logBlockedDescriptor(): any[] {
    return ['Blocked callback attribute: %s', attrSelector(this._attribute, this.readCallbackString())]
  }

  readCallbackString(): string {
    return this._element.getAttribute(this._attribute)
  }

  writeCallbackString(newString: string): void {
    this._element.setAttribute(this._attribute, newString)
  }

}

class ObjectPropertyItem extends StringCallbackItem {
  declare _object: PlainObject
  declare _key: string

  constructor(object: PlainObject, key: string) {
    super()
    this._object = object
    this._key = key
  }

  logBlockedDescriptor(): any[] {
    return ['Blocked string callback: { %s: %o }', this._key, this.readCallbackString()]
  }

  readCallbackString(): string {
    return this._object[this._key]
  }

  writeCallbackString(newString: string): void {
    this._object[this._key] = newString
  }

}

class ScriptElementItem implements PolicyItem {
  declare _element: HTMLScriptElement

  constructor(element: HTMLScriptElement) {
    this._element = element
  }

  readNonce(): string {
    return this._element.nonce
  }

  writeNonce(nonce: string): void {
    // Set an attribute (instead of the property), so the change is reflected in the DOM explorer for easier debugging
    this._element.setAttribute('nonce', nonce)
  }

  logBlockedDescriptor(): any[] {
    return ['Blocked <script> element: %o', this._element]
  }

  block(): void {
    block(this._element)
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  ScriptGate,
}
