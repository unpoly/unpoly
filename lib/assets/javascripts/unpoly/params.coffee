###**
Params
======

class up.params
###
up.params = (($) ->
  u = up.util

  config = u.config
    nest: true

#  throw "make sure everything nests / unnest properly"
#  throw "honor config.nest"
#  throw "fix red tests"

  reset = config.reset

  detectNature = (params) ->
    if u.isMissing(params)
      'missing'
    else if u.isArray(params)
      'array'
    else if u.isString(params)
      'query'
    else if u.isFormData(params)
      'formData'
    else if u.isObject(params)
      'object'
    else
      unknownNature(params)

  unknownNature = (obj) ->
    up.fail("Not a supported params nature: %o", obj)

  ###**
  Returns an array representation of the given `params`.

  Each array element will be an object with `{ name }` and `{ key }` properties.

  If `params` is a nested object, the nesting will be flattened and expressed
  in `{ name }` properties instead.

  @function up.params.toArray
  ###
  toArray = (params) ->
    switch detectNature(params)
      when 'missing'
        # No nesting conversion since we're just returning an empty list
        []
      when 'array'
       # No nesting conversion since we're not changing param type
        params
      when 'query'
        # No nesting conversion since we're converting from one unnested type to another
        buildArrayFromQuery(params)
      when 'formData'
        # Until FormData#entries is implemented in all major browsers we must give up here.
        # However, up.form will prefer to serialize forms as arrays, so we should be good
        # in most cases. We only use FormData for forms with file inputs.
        up.fail('Cannot convert FormData into an array')
      when 'object'
        # We need to flatten the nesting from the given object
        buildArrayFromNestedObject(params)

  ###**
  Returns an object representation of the given `params`.

  The object will have a nested structure if `params` has keys like `foo[bar]` or `baz[]`.

  @function up.params.toArray
  ###
  toObject = (params) ->
    switch detectNature(params)
      when 'missing'
        # No nesting conversion since we're just returning an object
        {}
      when 'array'
        # We must create a nested object from the given, flat array keys.
        buildNestedObjectFromArray(params)
      when 'query'
        # We must create a nested object from the given, flat array keys.
        # We don't want to duplicate the logic to parse a query string, so
        # we're converting to array first.
        buildNestedObjectFromArray(toArray(params))
      when 'formData'
        # Until FormData#entries is implemented in all major browsers we must give up here.
        # However, up.form will prefer to serialize forms as arrays, so we should be good
        # in most cases. We only use FormData for forms with file inputs.
        up.fail('Cannot convert FormData into an object')
      when 'object'
        # No nesting conversion since we're not changing param types.
        params

  toQuery = (params, options = {}) ->
    purpose = options.purpose || 'url'
    query = switch detectNature(params)
      when 'missing'
        ''
      when 'query'
        params
      when 'formData'
        # Until FormData#entries is implemented in all major browsers we must give up here.
        # However, up.form will prefer to serialize forms as arrays, so we should be good
        # in most cases. We only use FormData for forms with file inputs.
        up.fail('Cannot convert FormData into a query string')
      when 'array'
        u.map(params, arrayEntryToQuery).join('&')
      when 'object'
        buildQueryFromNestedObject(params)

    switch purpose
      when 'url'
        query = query.replace(/\+/g, '%20')
      when 'form'
        query = query.replace(/\%20/g, '+')
      else
        up.fail('Unknown purpose %o', purpose)

    query

  ###**
  # Adds the given name (which might have nesting marks like `foo[bar][][baz]`) and
  # string value to the given object. The name is recursively expanded to create
  # an object of nested sub-objects and arrays.
  #
  # Throws an error if the given name indicates a structure that is incompatible
  # with the existing structure in the given object.
  #
  # @function addToNestedObject
  # @internal
  # @param {Object} obj
  # @param {string} name
  # @param {string} value
  ###
  addToNestedObject = (obj, name, value) ->
    # Parse the name:
    # $1: the next names key without square brackets
    # $2: the rest of the key until the end
    match = /^[\[\]]*([^\[\]]+)\]*(.*?)$/.exec(name)

    k = match?[1]
    after = match?[2]

    console.log("!!! k is %o, v is %o, name is %o", k, value, name)

    if u.isBlank(k)
      if u.isGiven(value) && name == "[]"
        return [value]
      else
        return null

    if after == ''
      safeSet(obj, k, value)
    else if after == "["
      safeSet(obj, name, value)
    else if after == "[]"
      assertTypeForNestedKey(obj, k, 'Array', [])
      obj[k].push(value)
    else if match = (/^\[\]\[([^\[\]]+)\]$/.exec(after) || /^\[\](.+)$/.exec(after))
      childKey = match[1]
      assertTypeForNestedKey(obj, k, 'Array', [])
      lastObject = u.last(obj[k])
      # If the last element in the array is an object, we add more properties to that object,
      # but only if that same property hasn't been set on the object before.
      # If we have seen it before (or if the last elementis not an object) we assume the user
      # wants to push a new value into the array.
      if u.isObject(lastObject) && !nestedObjectHasDeepKey(lastObject, childKey)
        addToNestedObject(lastObject, childKey, value)
      else
        obj[k].push addToNestedObject({}, childKey, value)
    else
      assertTypeForNestedKey(obj, k, 'Object', {})
      safeSet(obj, k, addToNestedObject(obj[k], after, value))

    obj

  safeSet = (obj, k, value) ->
    unless Object.prototype.hasOwnProperty(k)
      obj[k] = value

  assertTypeForNestedKey = (obj, k, type, defaultValue) ->
    if value = obj[k]
      unless u["is#{type}"](value)
        up.fail("expected #{type} for params key %o, but got %o", k, value)
    else
      obj[k] = defaultValue

  nestedObjectHasDeepKey = (hash, key) ->
    console.info("nestedParamsObjectHasKey (%o, %o)", hash, key)
    return false if /\[\]/.test(key)

    keyParts = key.split(/[\[\]]+/)

    console.info("has keyParts %o", keyParts)

    for keyPart in keyParts
      console.info("nestedParamsObjectHasKey with keyPart %o and hash %o", keyPart, hash)
      continue if keyPart == ''
      return false unless u.isObject(hash) && hash.hasOwnProperty(keyPart)
      hash = hash[keyPart]

    console.info("nestedParamsObjectHasKey returns TRUE")

    true

  arrayEntryToQuery = (entry) ->
    query = encodeURIComponent(entry.name)
    if u.isGiven(entry.value)
      query += "="
      query += encodeURIComponent(entry.value)
    query

  buildQueryFromNestedObject = (value) ->
    array = buildArrayFromNestedObject(value)
    parts = u.map(array, arrayEntryToQuery)
    parts = u.select(parts, u.isPresent)
    parts.join('&')

  buildArrayFromQuery = (query) ->
    array = []
    for part in query.split('&')
      if u.isPresent(part)
        [name, value] = part.split('=')
        name = decodeURIComponent(name)
        # There are three forms we need to handle:
        # (1) foo=bar should become { name: 'foo', bar: 'bar' }
        # (2) foo=    should become { name: 'foo', bar: '' }
        # (3) foo     should become { name: 'foo', bar: null }
        if u.isGiven(value)
          value = decodeURIComponent(value)
        else
          value = null
        array.push({ name, value })
    array

  buildArrayFromNestedObject = (value, prefix) ->
    if u.isArray(value)
      u.flatMap value, (v) -> buildArrayFromNestedObject(v, "#{prefix}[]")
    else if u.isObject(value)
      entries = []
      for k, v of value
        p = if prefix then "#{prefix}[#{k}]" else k
        entries = entries.concat(buildArrayFromNestedObject(v, p))
      entries
    else if u.isMissing(value)
      [{ name: prefix, value: null }]
    else
      if u.isMissing(prefix)
        throw new Error("value must be a Hash")
      [ { name: prefix, value: value } ]

  buildNestedObjectFromArray = (array) ->
      obj = {}
      for entry in array
        addToNestedObject(obj, entry.name, entry.value)
      obj

  buildURL = (base, params) ->
    parts = [base, toQuery(params)]
    parts = u.select(parts, u.isPresent)
    separator = if u.contains(base, '?') then '&' else '?'
    parts.join(separator)

  ###**
  Adds a new entry with the given `name` and `value` to the given `params`.

  Returns a new params value that includes the added entry.
  When adding to a `FormData`, the value will be modified in place (since we
  cannot copy `FormData` objects).

  @function up.params.add
  ###
  add = (params, name, value) ->
    merge(params, [{ name, value }])

  ###**
  Merges the request params from `otherParams` into `params`.

  Returns a new params value that includes the new entries.
  When adding to a `FormData`, the value will be modified in place (since we
  cannot copy `FormData` objects).

  @function up.params.merge
  ###
  merge = (params, otherParams) ->
    switch detectNature(params)
      when 'missing'
        merge({}, otherParams)
      when 'array'
        otherArray = toArray(otherParams)
        params.concat(otherArray)
      when 'query'
        otherQuery = toQuery(otherParams)
        parts = u.select([params, otherQuery], u.isPresent)
        parts.join('&')
      when 'formData'
        otherObject = toObject(otherParams)
        for name, value of otherObject
          params.append(name, value)
        params
      when 'object'
        u.deepMerge(params, toObject(otherParams))

  $submittingButton = ($form) ->
    submitButtonSelector = 'input[type=submit], button[type=submit], button:not([type])'
    $activeElement = $(document.activeElement)
    if $activeElement.is(submitButtonSelector) && $form.has($activeElement)
      $activeElement
    else
      $form.find(submitButtonSelector).first()

  ###*
  Extracts request params from the given '<form>`.

  @function up.params.fromForm
  @param {Element|jQuery|string} form
  @param {String} [options.nature]
    If set to `'array'`, the params will be extracted in array representation instead of `FormData`.
    The array representation cannot hold values for `<input type="file">` controls.
  @return {Array|FormData}
  ###
  fromForm = (form, options) ->
    options = u.options(options)
    $form = $(form)
    hasFileInputs = $form.find('input[type=file]').length

    # We try to stick with an array representation, whose contents we can inspect.
    # We cannot inspect FormData on IE11 because it has no support for `FormData.entries`.
    # Inspection is needed to generate a cache key (see `up.proxy`) and to make
    # vanilla requests when `pushState` is unavailable (see `up.browser.navigate`).
    params = undefined
    if !hasFileInputs || options.nature == 'array'
      params = $form.serializeArray()
    else
      params = new FormData($form.get(0))

    $button = $submittingButton($form)
    buttonName = $button.attr('name')
    buttonValue = $button.val()
    if u.isPresent(buttonName)
      params = add(params, buttonName, buttonValue)

    params

  ###**
  Returns the [query string](https://en.wikipedia.org/wiki/Query_string) from the given URL.

  The query string is returned without a leading question mark (`?`).

  Returns `undefined` if the given URL has no query component.

  @function up.params.fromURL
  @param {String} url
  @return {string|undefined}
  @experimental
  ###
  fromURL = (url) ->
    urlParts = u.parseUrl(url)
    if query = urlParts.search
      query = query.replace(/^\?/, '')
      query

  up.on 'up:framework:reset', reset

  toArray: toArray
  toObject: toObject
  toQuery: toQuery
  buildURL: buildURL
  add: add
  merge: merge
  fromForm: fromForm
  fromURL: fromURL

)(jQuery)
