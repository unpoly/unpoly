import * as u from '../util.js'
import * as e from '../element.js'

/**
A config object with the settings `S`, like `up.network.config`.

The `Config` class only has the methods. Its constructor copies the settings onto the instance,
which a TypeScript class can't express. So a namespace builds its config with `newConfig()`,
which returns this type.
@internal
*/
export type ConfigWith<S extends object> = Config<S> & S

export class Config<S extends object> {
  declare _label: string
  declare _blueprintFn: () => S
  declare _knownKeys: string[]


  constructor(label: string, blueprintFn: () => S = (() => ({}) as S)) {
    this._label = label
    this._blueprintFn = blueprintFn
    this._knownKeys = []
    this.reset()
    // Our private properties and the blueprint's keys.
    this._knownKeys.push(...Object.keys(this))

    document.addEventListener('up:framework:reset', () => this.reset())
    // We check one task after booting, to also see settings made by up:framework:boot or
    // up:framework:booted listeners, or by compilers on the initial page.
    document.addEventListener('up:framework:boot', () => u.queueTask(() => this.logUnknownKeys()))
  }

  // Logs an error for a setting that doesn't exist, e.g. a misspelled or renamed key.
  // This is an error rather than a warning, because an ignored setting may be a security setting.
  // We only check top-level keys: a nested object like up.layer.config.modal may hold any layer option.
  // We only check once, right after booting. Settings made later are not checked.
  //
  // This method is not private because a spec calls it.
  logUnknownKeys(): void {
    for (let key of Object.keys(this)) {
      if (!this._knownKeys.includes(key)) {
        // Config is evaluated before up.log, which uses it. So we can't import
        // printToError() and reach it through window.up when called.
        up.internal.printToError(this._label, 'Ignoring unknown setting %s. Fix its name or remove it.', key)
      }
    }
  }

  reset(): void {
    // We copy property descriptors instead of values, so the defaults can hold a getter and
    // setter that forward a setting to another config (like up.fragment.config.mainTargets)
    // or to the session storage (like up.log.config.enabled).
    // Note that a defaults key matching an accessor on a Config subclass would shadow that
    // accessor instead of calling its setter.
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(this._blueprintFn()))
  }

  matches(element: Element, prop: u.SelectorKey<S>, condition?: string): boolean {
    return element?.matches(this.selector(prop, condition))
  }

  matchesFn(prop: u.SelectorKey<S>): u.MatchesFn {
    return (element, condition) => this.matches(element, prop, condition)
  }

  selector(prop: u.SelectorKey<S>, condition = ''): string {
    // The settings aren't members of the class, see ConfigWith.
    let includes = (this as any)[prop]
    let excludes = (this as any)['no' + u.upperCaseFirst(prop)]
    return e.unionSelector(includes, excludes, condition)
  }

  selectorFn(prop: u.SelectorKey<S>): u.SelectorFn {
    return (condition) => this.selector(prop, condition)
  }

  selectorFns(prop: u.SelectorKey<S>): [u.SelectorFn, u.MatchesFn] {
    return [this.selectorFn(prop), this.matchesFn(prop)]
  }
}

// Builds a config whose settings TypeScript knows (see ConfigWith).
export function newConfig<S extends object>(label: string, blueprintFn: () => S): ConfigWith<S> {
  return new Config(label, blueprintFn) as ConfigWith<S>
}
