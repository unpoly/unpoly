u = up.util
e = up.element

class up.OptionParser

  constructor: (@options, @element, parserOptions) ->
    @fail = parserOptions?.fail

  string: (key, keyOptions) ->
    @parse(e.attr, key, keyOptions)

  boolean: (key, keyOptions) ->
    @parse(e.booleanAttr, key, keyOptions)

  number: (key, keyOptions) ->
    @parse(e.numberAttr, key, keyOptions)

  booleanOrString: (key, keyOptions) ->
    @parse(e.booleanOrStringAttr, key, keyOptions)

  json: (key, keyOptions) ->
    @parse(e.jsonAttr, key, keyOptions)

  parse: (attrValueFn, key, keyOptions = {}) ->
    attrs = u.wrapList(keyOptions.attr ? @attrNameForKey(key))

    if @element
      for attr in attrs
        @options[key] ?= attrValueFn(@element, attr)

    @options[key] ?= keyOptions.default

    if normalizeFn = keyOptions.normalize
      @options[key] = normalizeFn(@options[key])

    if (keyOptions.fail || @fail) && failKey = up.fragment.failKey(key)
      failAttrs = u.compact(u.map(attrs, @deriveFailAttrName))
      failKeyOptions = u.merge(keyOptions,
        attr: failAttrs,
        fail: false
      )
      @parse(attrValueFn, failKey, failKeyOptions)

  deriveFailAttrName: (attr) ->
    if attr.indexOf('up-') == 0
      return "up-fail-#{attr.slice(3)}"

  attrNameForKey: (option) ->
    "up-#{u.camelToKebabCase(option)}"
