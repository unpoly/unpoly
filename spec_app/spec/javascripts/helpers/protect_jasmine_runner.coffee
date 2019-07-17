u = up.util
e = up.element
$ = jQuery

appendDefaultFallback = (parent) ->
  e.affix(parent, '.default-fallback')

beforeAll ->
  up.on 'click', 'a[href]', (event) ->
    event.preventDefault()
    console.error('Prevented default click behavior on link %o', event.target)

beforeEach ->
  up.layer.config.all.targets = ['.default-fallback']
  up.layer.config.root.targets = [] # no 'body'
  up.layer.config.resetWorld = false
  up.history.config.popTargets = ['.default-fallback']
  appendDefaultFallback(document.body)

  up.on 'up:layer:opening', (event) ->
    appendDefaultFallback(event.layer.element.querySelector('.up-overlay-content'))

afterEach ->
  up.destroy('.default-fallback', log: false)
