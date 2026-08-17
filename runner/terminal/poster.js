// Runs in the BROWSER (bundled via spec/helpers/terminal_reporter.js). This is the
// browser half of the terminal runner: it posts structured events to the Node side
// over window.__postToTerminal, captures console output and a DOM snapshot for
// failing specs, and disables Unpoly's CSS log styling. It only activates when the
// terminal harness is driving (specs.drivenByTerminal, set in spec/specs.js).
//
// Everything here is data collection/serialization; all formatting happens in Node.

import { formatLogArgs } from './log_value.mjs'
import { snapshotDom } from './dom_snapshot.js'

if (specs.drivenByTerminal) {
  install()
}

function install() {
  let currentLog = []
  let capturing = false
  let pendingDom = null

  installConsoleCapture()

  // Note: we deliberately leave up.log.config.format at its default (true). Some
  // specs assert on the exact arguments Unpoly passes to console.warn/debug (the
  // "%c…" styled form), so flipping format here would break them. Our console
  // wrapper serializes those args with formatLogArgs(), which strips the %c/CSS
  // and interpolates %s/%o — so the terminal output is clean either way.

  // reset_up.js dispatches this right before it tears the DOM down, so it's our
  // last chance to snapshot fixtures/overlays for a failed spec.
  document.addEventListener('specs:reset', () => {
    capturing = false
    let spec = jasmine.currentSpec
    if (spec && spec.failedExpectations && spec.failedExpectations.length) {
      pendingDom = snapshotDom()
    }
  })

  jasmine.getEnv().addReporter({
    suiteStarted: (result) => post({ type: 'suiteStarted', description: result.description }),
    suiteDone: (result) => post({
      type: 'suiteDone',
      description: result.description,
      failedExpectations: mapExpectations(result.failedExpectations),
    }),
    specStarted: () => { currentLog = []; pendingDom = null; capturing = true },
    specDone: (result) => {
      capturing = false
      let failure
      if (result.status === 'failed') {
        // A spec that passed its expectations and then died in teardown has no
        // snapshot yet — reset_up.js's checks ("Overlays survived reset!") are the
        // usual cause, and the element they complain about is still on the page. Grab
        // it now, flagged, because by this point the other afterEach hooks have run
        // and #fixtures is already gone.
        failure = pendingDom
          ? { log: currentLog.slice(), dom: pendingDom, domAt: 'failure' }
          : { log: currentLog.slice(), dom: snapshotDom(), domAt: 'teardown' }
      }
      return post({
        type: 'specDone',
        fullName: result.fullName,
        description: result.description,
        status: result.status,
        failedExpectations: mapExpectations(result.failedExpectations),
        failure,
      })
    },
    jasmineDone: (result) => post({
      type: 'jasmineDone',
      overallStatus: result.overallStatus,
      incompleteReason: result.incompleteReason,
      failedExpectations: mapExpectations(result.failedExpectations),
    }),
  })

  function installConsoleCapture() {
    for (let level of ['log', 'debug', 'info', 'warn', 'error']) {
      let original = console[level]
      console[level] = function(...args) {
        if (capturing) {
          try { currentLog.push(`${level}: ${formatLogArgs(args)}`) } catch { /* ignore */ }
        }
        return original.apply(console, args)
      }
    }
  }

  function mapExpectations(failedExpectations) {
    return (failedExpectations || []).map((failure) => ({
      message: failure.message,
      stack: failure.stack,
    }))
  }

  function post(event) {
    // Returning the promise lets Jasmine await delivery (ordering + backpressure).
    return window.__postToTerminal(event)
  }
}
