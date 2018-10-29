u = up.util

class up.Selector

  CSS_NAME = '-?[_a-zA-Z]+[_a-zA-Z0-9-]*'
  CSS_UNQUOTED_VALUE = '[^\'"\\s\\(\\)\\[\\]]*'
  CSS_QUOTED_VALUE = '(\'[^\']*\'|"[^"]*")'
  CSS_VALUE = "(#{CSS_QUOTED_VALUE}|#{CSS_UNQUOTED_VALUE})"
  CSS_ATTR_OPERATOR = '\\s*(\\=|\\*\\=|\\^\\=|\\$\\=|\\|\\=|\\~\\=)\\s*'

  CSS_ATTR = "\\[#{CSS_NAME}(#{CSS_ATTR_OPERATOR}#{CSS_VALUE})?\\]"
  CSS_CLASS = "\\.#{CSS_NAME}"
  CSS_ID = "\\##{CSS_NAME}"
  CSS_TAG = CSS_NAME

  CSS_NODE = "(#{CSS_TAG}|#{CSS_CLASS}|#{CSS_ID}|#{CSS_ATTR})"
  CSS_NODE_RE = new RegExp(CSS_NODE)

  # CSS_TREE_OPERATOR = '\\s*(\\s+|,|\\>|\\+|\\~)\\s*'
  # CSS_TREE = "(#{CSS_NODE}(#{CSS_TREE_OPERATOR}#{CSS_NODE})*)"

  CSS_HAS_SUFFIX = "\\:has\\(([^\\)]+)\\)$"
  CSS_HAS_SUFFIX_RE = new RegExp(CSS_HAS_SUFFIX)

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

  all: ->
    @descendants(document)

  first: ->
    @descendant(document)

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
    selector = selector.replace CSS_HAS_SUFFIX_RE, (match, descendantSelector) ->
      filter = (element) ->
        element.querySelector(descendantSelector)
      return ''
    new @(selector, filter)
