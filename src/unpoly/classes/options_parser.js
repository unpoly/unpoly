const u = up.util
const e = up.element

up.OptionsParser = class OptionsParser {

  constructor(options, element, parserOptions) {
    this.options = options
    this.element = element
    this.fail = parserOptions?.fail
  }

  string(key, keyOptions) {
    this.parse(e.attr, key, keyOptions)
  }

  boolean(key, keyOptions) {
    this.parse(e.booleanAttr, key, keyOptions)
  }

  number(key, keyOptions) {
    this.parse(e.numberAttr, key, keyOptions)
  }

  booleanOrString(key, keyOptions) {
    this.parse(e.booleanOrStringAttr, key, keyOptions)
  }

  json(key, keyOptions) {
    this.parse(e.jsonAttr, key, keyOptions)
  }

  parse(attrValueFn, key, keyOptions = {}) {
    const attrNames = u.wrapList(keyOptions.attr ?? this.attrNameForKey(key))

    // Below we will only set @options[key] = value if value is defined.
    // Setting undefined values would throw of up.RenderOptionsAssembler in up.render().
    let value = this.options[key]

    if (this.element) {
      for (let attrName of attrNames) {
        value ??= attrValueFn(this.element, attrName)
      }
    }

    value ??= keyOptions.default

    let normalizeFn = keyOptions.normalize
    if (normalizeFn) {
      value = normalizeFn(value)
    }

    if (u.isDefined(value)) {
      this.options[key] = value
    }

    let failKey
    if ((keyOptions.fail || this.fail) && (failKey = up.fragment.failKey(key))) {
      const failAttrNames = u.compact(u.map(attrNames, this.deriveFailAttrName))
      const failKeyOptions = {
        ... keyOptions,
        attr: failAttrNames,
        fail: false
      }
      this.parse(attrValueFn, failKey, failKeyOptions)
    }
  }

  deriveFailAttrName(attr) {
    if (attr.indexOf('up-') === 0) {
      return `up-fail-${attr.slice(3)}`
    }
  }

  attrNameForKey(option) {
    return `up-${u.camelToKebabCase(option)}`
  }
}
