u = up.util
e = up.element

stringAttr = (element, attr) ->
  element.getAttribute(attr)

class up.OptionParser

  constructor: (@options, @element, @parserOptions = {}) ->

  string: (key, keyOptions) ->
    @parse(stringAttr, key, keyOptions)

  boolean: (key, keyOptions) ->
    @parse(e.booleanAttr, key, keyOptions)

  booleanOrString: (key, keyOptions) ->
    @parse(e.booleanOrStringAttr, key, keyOptions)

  json: (key, keyOptions) ->
    @parse(e.jsonAttr, key, keyOptions)

  parse: (attrValueFn, key, keyOptions = {}) ->
    attrs = u.wrapList(keyOptions.attr ? @attrNameForKey(key))

    for attr in attrs
      @options[key] ?= attrValueFn(@element, attr)

    @options[key] ?= keyOptions.default

    if keyOptions.fail ? @parserOptions.fail
      failKey = u.prefixCamelCase(key, 'fail')
      failAttrs = u.compact(u.map(attrs, @deriveFailAttrName))
      failKeyOptions = u.merge(keyOptions,
        attr: failAttrs,
        fail: false,
        default: undefined
      )
      @parse(attrValueFn, failKey, failKeyOptions)

  deriveFailAttrName: (attr) ->
    if attr.indexOf('up-') == 0
      return "up-fail-#{attr.slice(3)}"

  attrNameForKey: (option) ->
    "up-#{u.camelToKebabCase(option)}"
