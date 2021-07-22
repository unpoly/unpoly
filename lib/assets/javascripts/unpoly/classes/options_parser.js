/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.OptionsParser = class OptionsParser {

  constructor(options, element, parserOptions) {
    this.options = options;
    this.element = element;
    this.fail = parserOptions != null ? parserOptions.fail : undefined;
  }

  string(key, keyOptions) {
    return this.parse(e.attr, key, keyOptions);
  }

  boolean(key, keyOptions) {
    return this.parse(e.booleanAttr, key, keyOptions);
  }

  number(key, keyOptions) {
    return this.parse(e.numberAttr, key, keyOptions);
  }

  booleanOrString(key, keyOptions) {
    return this.parse(e.booleanOrStringAttr, key, keyOptions);
  }

  json(key, keyOptions) {
    return this.parse(e.jsonAttr, key, keyOptions);
  }

  parse(attrValueFn, key, keyOptions = {}) {
    let failKey, normalizeFn;
    const attrNames = u.wrapList(keyOptions.attr != null ? keyOptions.attr : this.attrNameForKey(key));

    // Below we will only set @options[key] = value if value is defined.
    // Setting undefined values would throw of up.RenderOptionsAssembler in up.render().
    let value = this.options[key];

    if (this.element) {
      for (let attrName of attrNames) {
        if (value == null) { value = attrValueFn(this.element, attrName); }
      }
    }

    if (value == null) { value = keyOptions.default; }

    if (normalizeFn = keyOptions.normalize) {
      value = normalizeFn(value);
    }

    if (u.isDefined(value)) { this.options[key] = value; }

    if ((keyOptions.fail || this.fail) && (failKey = up.fragment.failKey(key))) {
      const failAttrNames = u.compact(u.map(attrNames, this.deriveFailAttrName));
      const failKeyOptions = u.merge(keyOptions, {
        attr: failAttrNames,
        fail: false
      }
      );
      return this.parse(attrValueFn, failKey, failKeyOptions);
    }
  }

  deriveFailAttrName(attr) {
    if (attr.indexOf('up-') === 0) {
      return `up-fail-${attr.slice(3)}`;
    }
  }

  attrNameForKey(option) {
    return `up-${u.camelToKebabCase(option)}`;
  }
};
