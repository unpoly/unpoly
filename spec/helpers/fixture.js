const u = up.util
const e = up.element
const $ = jQuery

let fixtureContainer = null
const externalFixtures = []

afterEach(function() {
  if (fixtureContainer) {
    up.destroy(fixtureContainer)
    fixtureContainer = null
  }

  let element
  while ((element = externalFixtures.pop())) {
    up.destroy(element)
  }
})

function getCreatedFixtureContainer() {
  fixtureContainer ||= e.affix(document.body, '#fixtures')
  return fixtureContainer
}

function createFixtureFromSelector(...args) {
  let element
  if (u.isElement(args[0])) {
    const container = args.shift()
    element = e.affix(container, ...args)
    registerExternalFixture(element)
  } else {
    element = e.affix(getCreatedFixtureContainer(), ...args)
  }

  return element
}

function createFixtureFromHTML(html) {
  const element = e.createFromHTML(html)
  getCreatedFixtureContainer().append(element)
  return element
}

function collectElements(element) {
  return [element, ...u.flatMap(element.children, collectElements)]
}

function createFixtureListFromHTML(html) {
  let nodes = e.createNodesFromHTML(html)
  let elements = u.filter(nodes, u.isElement)
  let fixtureContainer = getCreatedFixtureContainer()

  return u.flatMap(elements, (element) => {
    fixtureContainer.append(element)
    return collectElements(element)
  })
}

function registerExternalFixture(element) {
  externalFixtures.push(element)
  return element
}

function createJQueryFixture(...args) {
  return $(createFixtureFromSelector(...args))
}

window.fixture = createFixtureFromSelector
window.htmlFixture = createFixtureFromHTML
window.htmlFixtureList = createFixtureListFromHTML
window.$fixture = createJQueryFixture
window.registerFixture = registerExternalFixture

// A lot of legacy tests require this jQuery function
$.fn.affix = function(...args) { return $(e.affix(this[0], ...args)) }

// TODO: Replace me with makeLayers()
window.fixtureInOverlay = function(target, ...args) {
  const fragment = e.createFromSelector(target, ...args) // will be destroyed when the stack is reset
  return up.layer.open({ fragment }).then(() => fragment)
}
