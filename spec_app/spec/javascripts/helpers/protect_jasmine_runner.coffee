beforeEach ->
  up.dom.config.fallbacks = ['.default-fallback']
  up.history.config.popTargets = ['.default-fallback']
  $element = $('<div class="default-fallback"></div>')
  $element.appendTo(document.body)

afterEach ->
  up.destroy('.default-fallback', log: false)

