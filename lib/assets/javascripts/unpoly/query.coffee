up.query = do ->

  u = up.util

  s = (selector) ->
    up.Selector.parse(selector)

  first = (root, selector) ->
    s(selector).first(root)

  all = (root, selector) ->
    s(selector).all(root)

  subtree = (root, selector) ->
    s(selector).subtree(root)

  closest = (element, selector) ->
    s(selector).closest(element)

  matches = (element, selector) ->
    s(selector).matches(element)

  ancestor = (element, selector) ->
    s(selector).ancestor(element)

  ###**
  If given a jQuery collection, returns the first native DOM element in the collection.
  If given a string, returns the first element matching that string.
  If given any other argument, returns the argument unchanged.

  @function up.query.element
  @param {jQuery|Element|String} object
  @return {Element}
  @internal
  ###
  element = (object) ->
    if u.isJQuery(object)
      object[0]
    else if u.isString(object)
      first(object)
    else
      object

  first: first
  all: all
  subtree: subtree
  closest: closest
  matches: matches
  ancestor: ancestor
  element: element
