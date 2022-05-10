u = up.util
e = up.element
$ = jQuery

fixtureContainer = null
externalFixtures = []

afterEach ->
  if fixtureContainer
    up.destroy(fixtureContainer)
    fixtureContainer = null

  while element = externalFixtures.pop()
    up.destroy(element)

createFixture = (args...) ->
  # We cannot directly append to document.body, since that element
  # may be swapped by a fragment update.
  fixtureContainer ||= e.affix(document.body, '.fixtures')
  element = e.affix(fixtureContainer, args...)
  return element

registerExternalFixture = (element) ->
  externalFixtures.push(element)
  return element

createJQueryFixture = (args...) ->
  $(createFixture(args...))

window.fixture = createFixture
window.$fixture = createJQueryFixture
window.registerFixture = registerExternalFixture

# A lot of legacy tests require this jQuery function
$.fn.affix = (args...) -> $(e.affix(this[0], args...))

# TODO: Replace me with makeLayers()
window.fixtureInOverlay = (target, args...) ->
  fragment = e.createFromSelector(target, args...) # will be destroyed when the stack is reset
  up.layer.open({ fragment }).then ->
    return fragment
