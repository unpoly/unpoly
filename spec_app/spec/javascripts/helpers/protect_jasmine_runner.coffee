u = up.util
$ = jQuery

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
