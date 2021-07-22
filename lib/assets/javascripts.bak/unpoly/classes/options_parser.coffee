u = up.util
e = up.element

class up.OptionsParser

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
    attrNames = u.wrapList(keyOptions.attr ? @attrNameForKey(key))

    # Below we will only set @options[key] = value if value is defined.
    # Setting undefined values would throw of up.RenderOptionsAssembler in up.render().
    value = @options[key]

    if @element
      for attrName in attrNames
        value ?= attrValueFn(@element, attrName)

    value ?= keyOptions.default

    if normalizeFn = keyOptions.normalize
      value = normalizeFn(value)

    @options[key] = value if u.isDefined(value)

    if (keyOptions.fail || @fail) && failKey = up.fragment.failKey(key)
      failAttrNames = u.compact(u.map(attrNames, @deriveFailAttrName))
      failKeyOptions = u.merge(keyOptions,
        attr: failAttrNames,
        fail: false
      )
      @parse(attrValueFn, failKey, failKeyOptions)

  deriveFailAttrName: (attr) ->
    if attr.indexOf('up-') == 0
      return "up-fail-#{attr.slice(3)}"

  attrNameForKey: (option) ->
    "up-#{u.camelToKebabCase(option)}"
