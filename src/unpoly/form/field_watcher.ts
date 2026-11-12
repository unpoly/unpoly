import * as u from '../util.js'
import { fail, guard } from '../error.js'
import { on } from '../event.js'
import { getRegion, isField, readFieldName, trackFields, watchOptions } from '../form.js'
import { Params } from './params.js'
import { isAlive } from '../fragment.js'
import { printUserEvent } from '../log.js'

/**
The callback for `up.watch()`. It is called with the new value, the field name and the
options for the change. With `{ batch: true }` it is called once with an object of all
changed values and the options.
*/
export type WatchCallback = u.AnyFunction

/**
Options for an `up.FieldWatcher`. Other options are passed on to the callback.
@internal
*/
export interface FieldWatcherOptions {
  batch?: boolean
  logPrefix?: string
  includeDisabled?: boolean
  event?: string
  delay?: number
  [key: string]: any
}

export class FieldWatcher {
  declare _options: FieldWatcherOptions
  declare _root: Element
  declare _callback: WatchCallback
  declare _batch: boolean | undefined
  declare _logPrefix: string
  declare _includeDisabled: boolean | undefined
  declare _scheduledValues: u.PlainObject | null
  declare _scheduledFieldOptions: u.PlainObject | null
  declare _processedValues: u.PlainObject
  declare _currentTimer: number | null
  declare _callbackRunning: boolean

  constructor(root: Element, options: FieldWatcherOptions, callback: WatchCallback) {
    this._options = options
    this._root = root
    this._callback = callback
    this._batch = options.batch
    this._logPrefix = options.logPrefix ?? 'up.watch()'
    this._includeDisabled = options.includeDisabled

    this._ensureWatchable()
  }

  start(): () => void {
    this._scheduledValues = null
    this._processedValues = this._readFieldValues()
    this._currentTimer = null
    this._callbackRunning = false

    return u.sequence(
      this._trackFields(),
      this._trackAbort(),
      this._trackReset(),
      () => this._abort(),
    )
  }

  _ensureWatchable(): void {
    const failUnwatchable = (message: string) => fail(message, this._logPrefix, this._root)

    if (!this._callback) {
      failUnwatchable('No callback provided for %s (%o)')
    }

    if (this._root.matches('input[type=radio]')) {
      failUnwatchable('Use %s with the container of a radio group, not with an individual radio button (%o)')
    }

    if (isField(this._root) && !readFieldName(this._root)) {
      failUnwatchable('%s can only watch fields with a name (%o)')
    }
  }

  _trackFields(): () => void {
    if (isField(this._root)) {
      return this._watchField(this._root)
    } else {
      return trackFields(this._root, (field) => this._watchField(field))
    }
  }

  _trackAbort(): () => void {
    let guard = ({ target }: Event) => (target as Element).contains(this._region)
    return on('up:fragment:aborted', { guard }, () => this._abort())
  }

  _trackReset(): () => void {
    let guard = ({ target }: Event) => target === this._region
    return on('reset', { guard }, (event) => this._onFormReset(event))
  }

  get _region(): Element {
    return getRegion(this._root)
  }

  _fieldOptions(field: Element): u.PlainObject {
    return watchOptions(field, this._options)
  }

  _watchField(field: Element): () => void {
    let fieldOptions = this._fieldOptions(field)
    let eventType = fieldOptions.event

    // Return a function that unbinds all events when the field is removed from _root.
    // Note that an [up-keep] field may be moved to another root.
    return on(field, eventType, (event) => this._check(event, fieldOptions))
  }

  _abort(): void {
    // This causes the next call to _requestCallback() to return early.
    this._scheduledValues = null
  }

  _scheduleValues(values: u.PlainObject, fieldOptions: u.PlainObject): void {
    this._scheduledValues = values
    this._scheduledFieldOptions = fieldOptions
    let delay = fieldOptions.delay || 0
    clearTimeout(this._currentTimer) // debounce a previously set timer

    this._currentTimer = u.scheduleTimer(delay, () => {
      this._currentTimer = null
      this._requestCallback()
    })
  }

  _isNewValues(values: u.PlainObject): boolean {
    return !u.isEqual(values, this._processedValues) && !u.isEqual(this._scheduledValues, values)
  }

  async _requestCallback(): Promise<void> {
    // When aborted we nullify _scheduledValues to cancel a scheduled callback.
    if (!this._scheduledValues) return

    // We don't run callbacks when a prior async callback is still running.
    // We will call _requestCallback() again once the prior callback terminates.
    if (this._callbackRunning) return

    // When we re-called _requestCallback() after waiting for a prior callback, another
    // debounce delay may have started while waiting for the prior callback.
    // We must not shorten that debounce delay.
    if (this._currentTimer) return

    // If the form was manually detached (not destroyed) while a callback was scheduled,
    // we don't run the callback.
    if (!isAlive(this._region)) return

    // Don't forward { event, delay } because
    // (1) we have already processed them here and
    // (2) those aren't render options.
    // Set and cleared together with _scheduledValues, which we checked above.
    let callbackOptions = u.omit(this._scheduledFieldOptions!, ['event', 'delay'])
    const diff = this._changedValues(this._processedValues, this._scheduledValues)
    this._processedValues = this._scheduledValues
    this._scheduledValues = null
    this._callbackRunning = true
    this._scheduledFieldOptions = null

    const callbackReturnValues = []
    if (this._batch) {
      callbackReturnValues.push(this._runCallback(diff, callbackOptions))
    } else {
      for (let name in diff) {
        const value = diff[name]
        callbackReturnValues.push(this._runCallback(value, name, callbackOptions))
      }
    }

    if (u.some(callbackReturnValues, u.isPromise)) {
      let callbackDone = Promise.allSettled(callbackReturnValues)
      await callbackDone
    }

    this._callbackRunning = false

    // A debounce delay may have finished and returned earlier while a priour async callback was still running.
    this._requestCallback()
  }

  _runCallback(...args: any[]): any {
    return guard(this._callback, ...args)
  }

  _changedValues(previous: u.PlainObject, next: u.PlainObject): u.PlainObject {
    const changes: u.PlainObject = {}
    let keys = Object.keys(previous)
    keys = keys.concat(Object.keys(next))
    keys = u.uniq(keys)
    for (let key of keys) {
      const previousValue = previous[key]
      const nextValue = next[key]
      if (!u.isEqual(previousValue, nextValue)) {
        changes[key] = nextValue
      }
    }
    return changes
  }

  _readFieldValues(): u.PlainObject {
    return Params.fromContainer(this._root, { includeDisabled: this._includeDisabled }).toObject()
  }

  _check(event: Event, fieldOptions: u.PlainObject = {}): void {
    const values = this._readFieldValues()

    if (this._isNewValues(values)) {
      printUserEvent(event)
      this._scheduleValues(values, fieldOptions)
    }
  }

  _onFormReset(event: Event): void {
    // We need to wait 1 task for the reset button to affect field values
    u.queueTask(() => this._check(event))
  }
}
