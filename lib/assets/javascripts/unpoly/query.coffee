api = {}
['first', 'all', 'subtree', 'closest'].forEach (fn) ->
  api[fn] = (root, selector) ->
    up.Selector.parse(selector)[fn](root)

up.query = api

#up.query = do ->
#
#
#  all = (root, selector) ->
#    up.Selector.parse(selector).all(root)
#
#  first = (root, selector) ->
#    up.Selector.parse(selector).first(root)
#
#  subtree = (root, selector) ->
#    up.Selector.parse(selector).subtree(root)
#
#  closest = (root, selector) ->
#    up.Selector.parse(selector).closest(root)
#
#  is: matches
#  all: all
#  first: first
#  subtree: subtree
#  closest: closest
