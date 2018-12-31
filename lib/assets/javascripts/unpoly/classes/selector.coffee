u = up.util

class up.Selector

  CSS_HAS_SUFFIX_PATTERN = new RegExp("\\:has\\(([^\\)]+)\\)$")

  constructor: (@selector, @filterFn) ->

  matches: (element) ->
    doesMatch = if element.matches then element.matches(@selector) else element.msMatchesSelector(@selector)
    doesMatch &&= @filterFn(element) if @filterFn
    doesMatch

  descendants: (root) ->
    matches = root.querySelectorAll(@selector)
    if @filterFn
      matches = u.select(matches, @filterFn)
    matches

  descendant: (root) ->
    if !@filterFn
     root.querySelector(@selector)
    else
      candidates = root.querySelectorAll(@selector)
      u.detect(candidates, @filterFn)

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
