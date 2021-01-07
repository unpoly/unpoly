e = up.element
u = up.util

class up.Selector

  constructor: (@selector, @filters = []) ->

  matches: (element) ->
    e.matches(element, @selector) && @passesFilter(element)

  closest: (element) ->
    if @matches(element)
      return element
    else if (parentElement = element.parentElement)
      @closest(parentElement)

  passesFilter: (element) ->
    return u.every @filters, (filter) -> filter(element)

  descendants: (root) ->
    results = e.all(root, @selector)
    return u.filter results, (element) => @passesFilter(element)

  subtree: (root) ->
    results = []
    if @matches(root)
      results.push(root)
    results.push(@descendants(root)...)
    results
