e = up.element
u = up.util

class up.Selector

  constructor: (@selectors, @filters = []) ->
    # If the user has set config.mainTargets = [] then a selector :main
    # will resolve to an empty array.
    @unionSelector = @selectors.join(',') || 'match-none'

  matches: (element) ->
    e.matches(element, @unionSelector) && @passesFilter(element)

  closest: (element) ->
    if @matches(element)
      return element
    else if (parentElement = element.parentElement)
      @closest(parentElement)

  passesFilter: (element) ->
    return u.every @filters, (filter) -> filter(element)

  descendants: (root) ->
    # There's a requirement that prior selectors must match first.
    # The background here is that up.fragment.config.mainTargets may match multiple
    # elements in a layer (like .container and body), but up.fragment.get(':main') should
    # prefer to match .container.
    #
    # To respect this priority we do not join @selectors into a single, comma-separated
    # CSS selector, but rather make one query per selector and concatenate the results.
    results = u.flatMap(@selectors, (selector) -> e.all(root, selector))
    return u.filter results, (element) => @passesFilter(element)

  subtree: (root) ->
    results = []
    if @matches(root)
      results.push(root)
    results.push(@descendants(root)...)
    results
