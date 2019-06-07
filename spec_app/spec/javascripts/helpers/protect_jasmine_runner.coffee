u = up.util
$ = jQuery

beforeEach ->
  up.layer.config.all.targets = ['.default-fallback']
  up.history.config.popTargets = ['.default-fallback']
  $element = $('<div class="default-fallback"></div>')
  $element.appendTo(document.body)

afterEach ->
  up.destroy('.default-fallback', log: false)

