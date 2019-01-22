u = up.util

class up.Selector

  CSS_HAS_SUFFIX_PATTERN = new RegExp("\\:has\\(([^\\)]+)\\)$")
  MATCH_FN_NAME = if up.browser.isIE11() then 'msMatchesSelector' else 'matches'

  constructor: (@selector, @filterFn) ->

  matches: (element) ->
    doesMatch = element[MATCH_FN_NAME](@selector)
    doesMatch &&= @filterFn(element) if @filterFn
    doesMatch

  descendants: (root) ->
    matches = root.querySelectorAll(@selector)
    if @filterFn
      matches = u.filter(matches, @filterFn)
    matches

  descendant: (root) ->
    if !@filterFn
     root.querySelector(@selector)
    else
      candidates = root.querySelectorAll(@selector)
      u.find(candidates, @filterFn)

  subtree: (root) ->
    matches = []
    if @matches(root)
      matches.push(root)
    matches.push(@descendants(root)...)
    matches

  closest: (root) ->
    if root.closest && !@filterFn
      return root.closest(@selector)
    else
      return @closestPolyfill(root)

  closestPolyfill: (root) ->
    if @matches(root, @selector)
      root
    else
      @ancestor(root)

  ancestor: (element) ->
    if parentElement = element.parentElement
      if @matches(parentElement)
        parentElement
      else
        @ancestor(parentElement)

  @parse: (selector) ->
    filter = null
    selector = selector.replace CSS_HAS_SUFFIX_PATTERN, (match, descendantSelector) ->
      filter = (element) ->
        element.querySelector(descendantSelector)
      return ''
    new @(selector, filter)
