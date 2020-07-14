e = up.element
$ = jQuery

fixturesContainer = undefined

ensureContainerExists = ->
  fixturesContainer ||= e.affix(document.body, '.fixtures')

afterEach ->
  if fixturesContainer
    e.remove(fixturesContainer)
    fixturesContainer = undefined

appendFixture = (args...) ->
  container = ensureContainerExists()
  e.affix(container, args...)

$appendFixture = (args...) ->
  $(appendFixture(args...))

window.fixture = appendFixture
window.$fixture = $appendFixture

# A lot of legacy tests require this jQuery function
$.fn.affix = (args...) -> $(e.affix(this[0], args...))

# TODO: Replace me with makeLayers()
window.fixtureInOverlay = (target, args...) ->
  fragment = e.createFromSelector(target, args...)
  up.layer.open({ fragment }).then ->
    return fragment
