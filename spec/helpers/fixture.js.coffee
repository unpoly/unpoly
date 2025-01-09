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

getCreatedFixtureContainer = ->
  fixtureContainer ||= e.affix(document.body, '#fixtures')
  return fixtureContainer

createFixtureFromSelector = (args...) ->
  if u.isElement(args[0])
    container = args.shift()
    element = e.affix(container, args...)
    registerExternalFixture(element)
  else
    element = e.affix(getCreatedFixtureContainer(), args...)

  return element

createFixtureFromHTML = (html) ->
  element = e.createFromHTML(html)
  getCreatedFixtureContainer().append(element)
  return element

collectElements = (element) ->
  [element, u.flatMap(element.children, collectElements)...]

createFixtureListFromHTML = (html) ->
  root = createFixtureFromHTML(html)
  return collectElements(root)

registerExternalFixture = (element) ->
  externalFixtures.push(element)
  return element

createJQueryFixture = (args...) ->
  $(createFixtureFromSelector(args...))

window.fixture = createFixtureFromSelector
window.htmlFixture = createFixtureFromHTML
window.htmlFixtureList = createFixtureListFromHTML
window.$fixture = createJQueryFixture
window.registerFixture = registerExternalFixture

# A lot of legacy tests require this jQuery function
$.fn.affix = (args...) -> $(e.affix(this[0], args...))

# TODO: Replace me with makeLayers()
window.fixtureInOverlay = (target, args...) ->
  fragment = e.createFromSelector(target, args...) # will be destroyed when the stack is reset
  up.layer.open({ fragment }).then ->
    return fragment
