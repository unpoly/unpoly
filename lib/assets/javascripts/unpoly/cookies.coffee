###**
Cookies
=======

class up.cookies
###
up.cookies = (->
  u = up.util

  escape = encodeURIComponent
  unescape = decodeURIComponent

  lastRaw = undefined
  lastParsed = {}

  all = ->
    currentRaw = document.cookie
    if u.isUndefined(lastRaw) || lastRaw != currentRaw
      lastParsed = parse()
      lastRaw = currentRaw
    lastParsed

  parse = ->
    hash = {}
    pairs = u.separatedValues(document.cookie, ';')
    for pair in pairs
      parts = u.separatedValues(pair, '=')
      name = unescape(parts[0])
      value = unescape(parts[1])
      hash[name] = value
    hash

  remove = (name) ->
    set(name, '', 'expires=Thu, 01-Jan-70 00:00:01 GMT; path=/')

  get = (name) ->
    all()[name]

  set = (name, value, meta) ->
    str = escape(name) + '=' + escape(value)
    str += ';' + meta if meta
    document.cookie = str
    lastRaw = undefined

  pop = (name) ->
    value = get(name)
    if u.isPresent(value)
      remove(name)
    value

  all: all
  get: get
  set: set
  remove: remove
  pop: pop
)()
