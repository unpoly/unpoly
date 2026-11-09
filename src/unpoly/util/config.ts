import { queueTask, upperCaseFirst } from '../util.js'
import { unionSelector } from '../element.js'
import type { PlainObject } from '../util.js'

/**
Returns a selector for a config property. See `up.util.Config#selectorFn()`.
@internal
*/
export type SelectorFn = (condition?: string) => string

/**
Returns whether an element matches the selector of a config property. See `up.util.Config#matchesFn()`.
@internal
*/
export type MatchesFn = (element: Element, condition?: string) => boolean

export class Config {
  // The settings are the keys of the object returned by the blueprint function.
  // TODO(types): A namespace could declare its settings, e.g. `Config & NetworkSettings`.
  [key: string]: any

  declare _label: string
  declare _blueprintFn: () => PlainObject
  declare _knownKeys: string[]


  constructor(label: string, blueprintFn: () => PlainObject = (() => ({}))) {
    this._label = label
    this._blueprintFn = blueprintFn
    this._knownKeys = []
    this.reset()
    // Our private properties and the blueprint's keys.
    this._knownKeys.push(...Object.keys(this))

    document.addEventListener('up:framework:reset', () => this.reset())
    // We check one task after booting, to also see settings made by up:framework:boot or
    // up:framework:booted listeners, or by compilers on the initial page.
    document.addEventListener('up:framework:boot', () => queueTask(() => this.logUnknownKeys()))
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
        up.log.error(this._label, 'Ignoring unknown setting %s. Fix its name or remove it.', key)
      }
    }
  }

  reset(): void {
    Object.assign(this, this._blueprintFn())
  }

  matches(element: Element, prop: string, condition?: string): boolean {
    return element?.matches(this.selector(prop, condition))
  }

  matchesFn(prop: string): MatchesFn {
    return (element, condition) => this.matches(element, prop, condition)
  }

  selector(prop: string, condition = ''): string {
    let includes = this[prop]
    let excludes = this['no' + upperCaseFirst(prop)]
    return unionSelector(includes, excludes, condition)
  }

  selectorFn(prop: string): SelectorFn {
    return (condition) => this.selector(prop, condition)
  }

  selectorFns(prop: string): [SelectorFn, MatchesFn] {
    return [this.selectorFn(prop), this.matchesFn(prop)]
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  Config,
}
