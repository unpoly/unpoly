u = up.util
$ = jQuery

beforeAll ->
  up.on 'click', 'a[href]', (event) ->
    event.preventDefault()
    console.error('Prevented default click behavior on link %o', event.target)

beforeEach ->
  up.layer.config.all.targets = ['.default-fallback']
  up.layer.config.root.targets = [] # no 'body'
  up.layer.config.resetWorld = false
  # TODO: Can we get rid of up.history.config.popTargets ?
  up.history.config.popTargets = ['.default-fallback']
  $element = $('<div class="default-fallback"></div>')
  $element.appendTo(document.body)

afterEach ->
  up.destroy('.default-fallback', log: false)
