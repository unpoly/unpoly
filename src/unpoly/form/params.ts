import * as u from '../util.js'
import * as e from '../element.js'
import { fail } from '../error.js'
import {
  defaultSubmitButton, findFields, formConfig, prepareParamsReadTemp, readFieldDisabled,
  readFieldName, readFieldValue,
} from '../form.js'
import type * as t from './types.js'

// Without FormData#entries(), specs inspect the original entries.
interface InspectableFormData extends FormData { originalArray?: t.ParamEntry[] }

export class Params {
  declare entries: t.ParamEntry[]

  constructor(raw?: t.ParamsLike) {
    this.clear()
    this.addAll(raw)
  }

  clear(): void {
    this.entries = []
  }

  [u.copy.key](): Params {
    return new Params(this)
  }

  toObject(): u.PlainObject {
    const obj: u.PlainObject = {}
    for (let entry of this.entries) {
      const { name, value } = entry
      if (!u.isBasicObjectProperty(name)) {
        if (this._isArrayKey(name)) {
          obj[name] ||= []
          obj[name].push(value)
        } else {
          obj[name] = value
        }
      }
    }
    return obj
  }

  toArray(): t.ParamEntry[] {
    return this.entries
  }

  toFormData(): FormData {
    const formData: InspectableFormData = new FormData()
    for (let entry of this.entries) {
      formData.append(entry.name, entry.value)
    }
    if (!formData.entries) {
      // If this browser cannot inspect FormData with the #entries()
      // iterator, assign the original array for inspection by specs.
      formData.originalArray = this.entries
    }
    return formData
  }

  toQuery(): string {
    let simpleEntries = this.withoutBinaryEntries().entries
    let parts = simpleEntries.map(this._arrayEntryToQuery)
    return parts.join('&')
  }

  toString(): string {
    return this.toQuery()
  }

  _arrayEntryToQuery(entry: t.ParamEntry): string {
    const { value } = entry

    let query = encodeURIComponent(entry.name)
    // There is a subtle difference when encoding blank values:
    // 1. An undefined or null value is encoded to `key` with no equals sign
    // 2. An empty string value is encoded to `key=` with an equals sign but no value
    if (u.isGiven(value)) {
      query += "="
      query += encodeURIComponent(value)
    }
    return query
  }

  _isBinaryEntry({ value }: t.ParamEntry): boolean {
    return value instanceof Blob
  }

  hasBinaryEntries(): boolean {
    return u.some(this.entries, this._isBinaryEntry)
  }

  withoutBinaryEntries(): Params {
    let simpleEntries = u.reject(this.entries, this._isBinaryEntry)
    return new (this.constructor as typeof Params)(simpleEntries)
  }

  toURL(base: string): string {
    let parts = [base, this.toQuery()]
    parts = u.filterList(parts, u.isPresent)
    const separator = u.contains(base, '?') ? '&' : '?'
    return parts.join(separator)
  }

  add(name: string, value: any): void {
    this.entries.push({ name, value })
  }

  addAll(raw: t.ParamsLike): void {
    if (u.isMissing(raw)) {
      // nothing to do
    } else if (raw instanceof this.constructor) {
      this.entries.push(...raw.entries)
    } else if (u.isArray(raw)) {
      // internal use for copying
      this.entries.push(...raw)
    } else if (u.isString(raw)) {
      this._addAllFromQuery(raw)
    } else if (u.isFormData(raw)) {
      this._addAllFromFormData(raw)
    } else if (u.isObject(raw)) {
      this._addAllFromObject(raw)
    } else {
      fail("Unsupported params type: %o", raw)
    }
  }

  keys(): string[] {
    return u.map(this.entries, 'name')
  }

  values(): any[] {
    return u.map(this.entries, 'value')
  }

  _addAllFromObject(object: u.PlainObject): void {
    for (let key in object) {
      const value = object[key]
      // We cannot use up.util.wrapList() because we want to keep null as [null], not []
      const valueElements = u.isArray(value) ? value : [value]
      for (let valueElement of valueElements) {
        this.add(key, valueElement)
      }
    }
  }

  _addAllFromQuery(query: string): void {
    for (let part of query.split('&')) {
      if (part) {
        let [name, value] = part.split('=') as [string, string | null | undefined]
        name = decodeURIComponent(name)
        // There are three forms we need to handle:
        // (1) foo=bar should become { name: 'foo', bar: 'bar' }
        // (2) foo=    should become { name: 'foo', bar: '' }
        // (3) foo     should become { name: 'foo', bar: null }
        if (u.isGiven(value)) {
          value = decodeURIComponent(value)
        } else {
          value = null
        }
        this.add(name, value)
      }
    }
  }

  _addAllFromFormData(formData: FormData): void {
    for (let value of formData.entries()) {
      this.add(...value)
    }
  }

  set(name: string, value: any): void {
    this.delete(name)
    this.add(name, value)
  }

  delete(name: string): void {
    this.entries = u.reject(this.entries, this._matchEntryFn(name))
  }

  _matchEntryFn(name: string): (entry: t.ParamEntry) => boolean {
    return (entry) => entry.name === name
  }

  get(name: string): any {
    if (this._isArrayKey(name)) {
      return this.getAll(name)
    } else {
      return this.getFirst(name)
    }
  }

  getFirst(name: string): any {
    const entry = u.findInList(this.entries, this._matchEntryFn(name))
    return entry?.value
  }

  getAll(name: string): any[] {
    const entries = u.filterList(this.entries, this._matchEntryFn(name))
    return u.map(entries, 'value')
  }

  _isArrayKey(key: string): boolean {
    return u.evalOption(formConfig.arrayParam, key)
  }

  [u.isBlank.key](): boolean {
    return this.entries.length === 0
  }

  static fromForm(form: e.ElementOrSelector, options?: { submitButton?: e.ElementOrSelector | false }): Params
  // The form is resolved in place, so the implementation takes the resolved type. The cast is
  // needed since getOne() returns an HTMLElement.
  static fromForm(form: HTMLFormElement, options: { submitButton?: e.ElementOrSelector | false } = {}): Params {
    form = e.getOne(form) as HTMLFormElement
    let restore = prepareParamsReadTemp(form)

    try {
      // The FormData constructor accepts undefined for no submitter, but throws for false.
      // It also throws for a button that doesn't belong to the form.
      let submitButton = e.getOne(options.submitButton ?? defaultSubmitButton(form)) || undefined

      // We let the browser serialize the form, instead of iterating over up.form.fields():
      //
      // - Only the browser can read the value of a form-associated custom element. The element
      //   reports it through ElementInternals.setFormValue(), which no script can read back.
      // - The browser knows the full serialization rules: files, <select multiple>, the submitter
      //   (including an image button's click coordinates), [dirname], fields in a
      //   <fieldset disabled>, newline normalization, and whatever comes next.
      let params = new this(new FormData(form, submitButton))

      // up.form.fields() also finds elements registered through up.form.config.fieldSelectors.
      // The browser doesn't know they are fields.
      //
      // We recognize the fields the browser already handled by their membership in form.elements,
      // since a FormData entry cannot be mapped back to the element that contributed it.
      // A control that *is* in form.elements but that the browser refuses to serialize (a reset
      // button, an <output>) is therefore not re-added.
      let browserControls = new Set(form.elements)
      for (let field of findFields(form)) {
        if (!browserControls.has(field) && !field.closest('fieldset:disabled')) params.addField(field)
      }
      return params
    } finally {
      restore()
    }
  }

  static fromContainer(container: Element, options?: { includeDisabled?: boolean }): Params {
    return this.fromFields(findFields(container), options)
  }

  static fromFields(fields: e.ElementOrSelector, { includeDisabled }: { includeDisabled?: boolean } = {}): Params {
    const params = new this()
    for (let field of u.wrapList(fields)) {
      params.addField(field, { includeDisabled })
    }
    return params
  }

  // Takes any, since it reads the properties of whichever kind of field it gets (checked, files, ...).
  addField(field: any, { includeDisabled }: { includeDisabled?: boolean } = {}): void {
    field = e.getOne(field) // unwrap jQuery

    // A field is excluded from a form submission if it has no name, or if it is disabled.
    let name = readFieldName(field)
    if (!name || (readFieldDisabled(field) && !includeDisabled && !field.upPreviewDisabled)) return

    let { tagName, type } = field
    let values = []

    if (tagName === 'SELECT') {
      // A <select> can have multiple selected options.
      values = u.map(field.selectedOptions, 'value')
    } else if ((type === 'checkbox') || (type === 'radio')) {
      if (field.checked) values = [readFieldValue(field)]
    } else if (type === 'file') {
      // The value of an input[type=file] is the local path displayed in the form.
      // The actual File objects are in the #files property.
      values = field.files
    } else {
      // A custom control may expose a { name } without a readable { value },
      // in which case it has nothing to contribute.
      let value = readFieldValue(field)
      if (u.isDefined(value)) values = [value]
    }

    for (let value of values) {
      this.add(name, value)
    }
  }

  [u.isEqual.key](other: Params): boolean {
    return (this.constructor === other.constructor) && u.isEqual(this.entries, other.entries)
  }

  static fromURL(url: string): Params {
    const params = new (this)()
    const urlParts = u.parseURL(url)
    let query = urlParts.search
    if (query) {
      query = query.replace(/^\?/, '')
      params.addAll(query)
    }
    return params
  }

  static stripURL(url: string): string {
    return u.normalizeURL(url, { search: false })
  }

  static merge(start: Params, ...objects: t.ParamsLike[]): Params {
    let merged = u.copy(start)

    for (let object of objects) {
      let other = u.wrapValue(this, object)
      // We cannot use iterate over other.entries and call set(), since other.entries
      // might have multiple values for the same array key.
      for (let key of other.keys()) merged.delete(key)
      merged.addAll(other)
    }

    return merged
  }

}

export const api = {
  Params,
}
