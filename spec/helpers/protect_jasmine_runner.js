const u = up.util
const e = up.element
const $ = jQuery

function fail(...args) {
  if (!jasmine.resetting) {
    up.fail(...args)
  }
}

// (1) Chrome allows 200 history changes per 10 seconds
//     Exceeding this limit will fail silently, but sometimes log a warning.
//     https://chromium.googlesource.com/chromium/src.git/+/443bd0ef7014ab4e414d0d3e7d8e5bdbb7473d5b/third_party/blink/renderer/core/frame/navigation_rate_limiter.cc#31
//
// (2) Safari allows 100 history changes per 30 seconds
//     Exceeding this limit will throw `SecurityError: Attempt to use history.replaceState() more than 100 times per 30 second.`
//     https://bugs.webkit.org/show_bug.cgi?id=156115#:~:text=http%20for%20security%20restrictions%20An,updates%20per%20second%20is%20not
const THROTTLE_WINDOW_DURATION = AgentDetector.isSafari() ? 30_000 : 10_000
const THROTTLE_MAX_WINDOW_ACTIONS = AgentDetector.isSafari() ? 100 : 200
const THROTTLE_MAX_SPEC_ACTIONS = 20 // the maximum number of history changes we expect in a spec
const THROTTLE_CLOCK_INACCURACY = 1100

window.safeHistory = new (class {
  constructor() {
    this.logEnabled = false
    this.cursor = -1 // we don't know the initial state
    this.stateIndexes = []
    this.nextIndex = 1000
    this.actionTimes = []
  }

  back() {
    this.log("safeHistory: back(), cursor before is %o, path before is %o", this.cursor, location.pathname)
    this.observeAction()

    if (this.cursor > 0) {
      // This will trigger popstate, which we will handle and update @cursor
      oldBack.call(history)
    } else {
      fail('safeHistory: Tried to go too far back in history (prevented)')
    }
  }

  forward() {
    this.log("safeHistory: forward()")
    this.observeAction()

    if (this.cursor < (this.stateIndexes.length - 1)) {
      // This will trigger popstate, which we will handle and update @cursor
      oldForward.call(history)
    } else {
      fail('safeHistory: Tried to go too far forward in history (prevented)')
    }
  }

  pushState(state, title, url) {
    this.observeAction()
    state ||= { state }
    state._index = this.nextIndex++

    this.log("safeHistory: pushState(%o, %o, %o)", state, title, url)
    oldPushState.call(history, state, title, url)

    if (url && (u.normalizeURL(url) !== u.normalizeURL(location.href))) {
      fail('safeHistory: Browser did now allow history.pushState() to URL %s (Chrome throttling history changes?)', url)
    }

    this.stateIndexes.splice(this.cursor + 1, this.stateIndexes.length, state._index)
    this.cursor++
    this.log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(this.stateIndexes), this.cursor, location.pathname)
  }

  replaceState(state, title, url) {
    this.observeAction()
    state ||= { state }
    state._index = this.nextIndex++

    this.log("safeHistory: replaceState(%o, %o, %o)", state, title, url)
    oldReplaceState.call(history, state, title, url)

    if (url && (u.normalizeURL(url) !== u.normalizeURL(location.href))) {
      fail('safeHistory: Browser did now allow history.replaceState() to URL %s (Chrome throttling history changes?)', url)
    }

    // In case an example uses replaceState to set a known initial URL
    // we can use this to know our initial state.
    if (this.cursor === -1) { this.cursor = 0 }
    this.stateIndexes[this.cursor] = state._index
    this.log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(this.stateIndexes), this.cursor, location.pathname)
  }

  onPopState(event) {
    const { state } = event
    this.log("safeHistory: Got event %o with state %o", event, state)

    if (!state) { return }

    this.log("safeHistory: popped(%o)", state._index)
    this.cursor = this.stateIndexes.indexOf(state._index)

    if (this.cursor === -1) {
      fail('safeHistory: Could not find position of state %o', state)
    }

    this.log("safeHistory: @stateIndexes are now %o, cursor is %o, path is %o", u.copy(this.stateIndexes), this.cursor, location.pathname)
  }

  observeAction() {
    this.log("safeHistory: History API use observed: %o (%o total)", location.href, this.actionTimes.length)
    this.actionTimes.push(new Date())
  }

  async throttle() {
    let notification

    while (this.truncateActionTimes().length > (THROTTLE_MAX_WINDOW_ACTIONS - THROTTLE_MAX_SPEC_ACTIONS)) {
      notification ||= up.element.affix(document.body, 'div', { text: 'Throttling History API usage...', style: { 'position': 'fixed', 'bottom': '5px', 'right': '5px', 'background-color': '#ffcc66', 'padding': '5px' }})
      this.forceLog("safeHistory: Too many uses of the history API. Waiting for throttle window to clear (%o actions left).", this.actionTimes.length)
      await wait(1000)
    }

    notification?.remove()
  }

  truncateActionTimes() {
    const windowEnd = new Date()
    const windowStart = new Date(windowEnd - THROTTLE_WINDOW_DURATION + THROTTLE_CLOCK_INACCURACY)

    this.actionTimes = this.actionTimes.filter((time) => time >= windowStart)

    return this.actionTimes
  }

  log(...args) {
    if (this.logEnabled) {
      console.debug(...args)
    }
  }

  forceLog(...args) {
    console.debug(...args)
  }

  async afterEach() {
    await this.throttle()

    this.cursor = 0
    this.stateIndexes = [this.stateIndexes[this.cursor]]
  }
})

let oldPushState = history.pushState
let oldReplaceState = history.replaceState
let oldBack = history.back
let oldForward = history.forward

history.pushState = (...args) => safeHistory.pushState(...args)
history.replaceState = (...args) => safeHistory.replaceState(...args)
history.back = (...args) => safeHistory.back(...args)
history.forward = (...args) => safeHistory.forward(...args)

window.addEventListener('popstate', (event) => safeHistory.onPopState(event))

// Use a longer timeout than the default 5000
afterEach((async () => await safeHistory.afterEach()), 30000)

const willScrollWithinPage = function(link) {
  const verbatimHREF = link.getAttribute('href')

  const linkURL = u.normalizeURL(verbatimHREF, { hash: false })
  const currentURL = u.normalizeURL(location.href, { hash: false })
  return linkURL === currentURL
}

// Make specs fail if a link was followed without Unpoly.
// This would otherwise navigate away from the spec runner.
beforeEach(function() {
  window.defaultFollowedLinks = []

  up.on('click', 'a[href]', function(event) {
    const link = event.target

    const browserWouldNavigate = !event.defaultPrevented &&
      !link.getAttribute('href').match(/^javascript:/) &&
      !willScrollWithinPage(link)

    if (browserWouldNavigate) {
      console.debug('Preventing browser navigation to preserve test runner (caused by click on link %o)', link)
      window.defaultFollowedLinks.push(link)
      event.preventDefault()
    }
  }) // prevent browsers from leaving the test runner

  jasmine.addMatchers({
    toHaveBeenDefaultFollowed(util, customEqualityTesters) {
      return {
        compare(link) {
          link = e.get(link)
          const used = !!u.remove(window.defaultFollowedLinks, link)
          return { pass: used }
        }
      }
    }
  })
})

afterEach(function() {
  let links = u.presence(window.defaultFollowedLinks)
  if (links) {
    return fail('Unhandled default click behavior for links %o', links)
  }
})

// Make specs fail if a form was followed without Unpoly.
// This would otherwise navigate away from the spec runner.
beforeEach(function() {
  window.defaultSubmittedForms = []

  up.on('submit', 'form', function(event) {
    const form = event.target

    const browserWouldNavigate = !u.contains(form.action, '#') && !event.defaultPrevented

    if (browserWouldNavigate) {
      console.debug('Preventing browser navigation to preserve test runner (caused by submission of form %o)', form)
      window.defaultSubmittedForms.push(form)
      event.preventDefault()
    }
  })

  jasmine.addMatchers({
    toHaveBeenDefaultSubmitted(util, customEqualityTesters) {
      return {
        compare(form) {
          form = e.get(form)
          const used = !!u.remove(window.defaultSubmittedForms, form)
          return { pass: used }
        }
      }
    }
  })
})

afterEach(function() {
  let forms = u.presence(window.defaultSubmittedForms)
  if (forms) {
    fail('Unhandled default click behavior for forms %o', forms)
  }
})

// Add a .default-fallback container to every layer, so we never
// end up swapping the <body> element.
const appendDefaultFallback = (parent) => e.affix(parent, 'default-fallback')

beforeEach(function() {
  up.fragment.config.resetTargets = []
  u.remove(up.layer.config.any.mainTargets, ':layer')
  up.layer.config.any.mainTargets.push('default-fallback')
  up.layer.config.overlay.mainTargets.push(':layer') // this would usually be in config.any, but have removed it
  up.history.config.restoreTargets = ['default-fallback']
  appendDefaultFallback(document.body)
})

afterEach(function() {
  for (let element of document.querySelectorAll('default-fallback')) {
    up.destroy(element, { log: false })
  }
})

// Restore the original <body> (containing the Jasmine runner) in case a spec replaces the <body>
let originalBody = null

beforeAll(function() {
  originalBody = document.body
})

afterEach(function() {
  if (originalBody !== document.body) {
    console.debug("Restoring <body> that was swapped by a spec")
    // Restore the Jasmine test runner that we just nuked
    document.body.replaceWith(originalBody)

    // The body get an .up-destroying class when it was swapped. We must remove it
    // or up.fragment will ignore everything within the body from now on.
    document.body.classList.remove('up-destroying')
    document.body.removeAttribute('aria-hidden')
    document.body.removeAttribute('inert')

    // When the body was swapped while an overlay was open, it has this class.
    document.body.classList.remove('up-scrollbar-away')
  }
})

const findAssets = () => document.head.querySelectorAll('link[rel=stylesheet], script[src]')

beforeAll(function() {
  for (let asset of findAssets()) {
    asset.setAttribute('up-asset', 'false')
  }
})
