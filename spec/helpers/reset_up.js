const u = up.util

const RESET_MESSAGE = 'Resetting framework for next test'

function logResetting() {
  console.debug(`%c${RESET_MESSAGE}`, 'color: #2244aa')
}

function resetLocation() {
  let didChange = false

  if (location.hash) {
    location.hash = ''
    didChange = true
  }

  // Webkit throttles replaceState() calls (see protect_jasmine_runner.js).
  // Hence we only call it when the history was actually changed.
  if (!up.util.matchURLs(location.href, jasmine.locationBeforeSuite)) {
    up.history.replace(jasmine.locationBeforeSuite)
    didChange = true
  }

  return didChange
}

function resetTitle() {
  if (document.title !== jasmine.titleBeforeSuite) {
    document.title = jasmine.titleBeforeSuite
  }
}

function resetMetaTags() {
  const currentMetaTags = findMetaTags()

  if (!u.isEqual(currentMetaTags, jasmine.metaTagsBeforeSuite)) {
    for (var currentMetaTag of currentMetaTags) {
      currentMetaTag.remove()
    }

    for (let savedMetaTag of jasmine.metaTagsBeforeSuite) {
      document.head.append(savedMetaTag)
    }
  }
}

function resetLang() {
  if (jasmine.langBeforeSuite) {
    document.documentElement.setAttribute('lang', jasmine.langBeforeSuite)
  } else {
    document.documentElement.removeAttribute('lang')
  }
}

const resetAttributes = function() {
  document.body.removeAttribute('class')
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('class')
  document.documentElement.removeAttribute('style')
}

var findMetaTags = () => document.head.querySelectorAll('meta, link:not([rel=stylesheet])')

beforeAll(function() {
  jasmine.titleBeforeSuite = document.title
  jasmine.locationBeforeSuite = location.href
  jasmine.langBeforeSuite = document.documentElement.lang
  jasmine.metaTagsBeforeSuite = findMetaTags()

  // Ignore <meta> and <link> tags from the Jasmine runner
  for (let meta of jasmine.metaTagsBeforeSuite) {
    meta.setAttribute('up-meta', 'false')
  }
})

beforeEach(function() {
  jasmine.locationBeforeExample = location.href
})

afterEach(async function() {
  jasmine.resetting = true

  // Wait 1 more frame for async errors to (correctly) fail the test.
  await jasmine.waitMessageChannel()

  // Ignore errors while the framework is being reset.
  await jasmine.spyOnGlobalErrorsAsync(async function(_globalErrorSpy) {
    logResetting()

    // If the spec has installed the Jasmine clock, uninstall it so
    // the timeout below will actually happen.
    jasmine.clock().uninstall()

    const hadRequests = (jasmine.Ajax.requests.count() > 0)
    const hadLayers = (up.layer.count > 0)
    const waitMore = hadRequests || hadLayers || AgentDetector.isFirefox()

    // Abort all requests so any cancel handlers can run and do async things.
    up.network.abort({ reason: RESET_MESSAGE })

    // Most pending promises will wait for an animation to finish.
    up.motion.finish()

    up.browser.popCookie(up.protocol.config.methodCookie)

    // Wait one more frame so pending callbacks have a chance to run.
    // Pending callbacks might change the URL or cause errors that bleed into
    // the next example.
    if (resetLocation() || waitMore) { await jasmine.waitMessageChannel() }

    up.framework.reset()

    // Resetting the framework may change the location, title, etc. again.
    if (resetLocation() || waitMore) { await jasmine.waitMessageChannel() }

    resetTitle()
    resetMetaTags()
    resetLang()
    resetAttributes()
  })

  // Make some final checks that we have reset successfully
  const overlays = document.querySelectorAll('up-modal, up-popup, up-cover, up-drawer')
  if (overlays.length > 0) {
    throw new Error("Overlays survived reset!")
  }

  if (document.querySelector('up-progress-bar')) {
    throw new Error('Progress bar survived reset!')
  }

  if (document.querySelector('.up-scrollbar-away')) {
    throw new Error('Shifted elements survived reset!')
  }

  // Interrupt active smooth scrolling animnations.
  // Then scroll to the top.
  if (document.scrollingElement.scrollTop !== 0) {
    document.scrollingElement.style.setProperty('overflow-y', 'hidden')
    up.element.paint(document.scrollingElement)
    document.scrollingElement.style.removeProperty('overflow-y')
    up.element.paint(document.scrollingElement)
    document.scrollingElement.scrollTop = 0
  }

  jasmine.resetting = false

  up.puts('specs', 'Framework was reset')
})

