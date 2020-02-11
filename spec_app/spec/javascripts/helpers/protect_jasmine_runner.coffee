u = up.util
e = up.element
$ = jQuery

# Make specs fail if a form was submitted without Unpoly.
# This would otherwise navigate away from the spec runner.
beforeEach ->
  window.defaultSubmittedForms = []

  up.on 'submit', 'form', (event) ->
    window.defaultSubmittedForms.push(event.target)
    event.preventDefault()

  jasmine.addMatchers
    toHaveBeenDefaultSubmitted: (util, customEqualityTesters) ->
      compare: (link) ->
        link = e.get(link)
        used = !!u.remove(window.defaultSubmittedForms, link)
        pass: used

afterEach ->
  if links = u.presence(window.defaultSubmittedForms)
    up.fail('Unhandled default submit behavior for forms %o', links)


# Make specs fail if a link was followed without Unpoly.
# This would otherwise navigate away from the spec runner.
beforeEach ->
  window.defaultClickedLinks = []

  up.on 'click', 'a[href]', (event) ->
    window.defaultClickedLinks.push(event.target)
    event.preventDefault()

  jasmine.addMatchers
    toHaveBeenDefaultFollowed: (util, customEqualityTesters) ->
      compare: (link) ->
        link = e.get(link)
        used = !!u.remove(window.defaultClickedLinks, link)
        pass: used

afterEach ->
  if links = u.presence(window.defaultClickedLinks)
    up.fail('Unhandled default click behavior for links %o', links)


# Add a .default-fallback container to every layer, so we never
# end up swapping the <body> element.
appendDefaultFallback = (parent) ->
  e.affix(parent, 'default-fallback')

beforeEach ->
  up.layer.config.all.targets = ['default-fallback']
  up.fragment.config.targets = [] # no 'body'
  up.history.config.restoreTargets = ['default-fallback']
  appendDefaultFallback(document.body)

  up.on 'up:layer:opening', (event) ->
    appendDefaultFallback(event.layer.element.querySelector('up-overlay-content'))

afterEach ->
  up.destroy('default-fallback', log: false)
