// Stateful bridge between the browser's posted events and the pure formatter.
// It tracks the suite hierarchy to build live per-group progress, collects
// failures, and on jasmineDone remaps their stacks and prints the failure list +
// summary. All output goes through the injected `out` sink and all formatting
// through formatter.mjs, so this is testable with canned event arrays.

import * as fmt from './formatter.mjs'
import { formatStack } from './stack.mjs'
import { specsURL } from './urls.mjs'

export function createReceiver({ verbose = false, remapper, serverURL = '', out = process.stdout } = {}) {
  const counts = { passed: 0, failed: 0, pending: 0 }
  const suiteStack = []      // describe descriptions, innermost last
  const failures = []        // raw, resolved on jasmineDone
  let group = null           // current top-level group
  let lastEventAt = Date.now()

  const write = (string) => out.write(string)

  async function handle(event) {
    lastEventAt = Date.now()
    switch (event.type) {
      case 'suiteStarted': onSuiteStarted(event); return
      case 'suiteDone': onSuiteDone(event); return
      case 'specDone': onSpecDone(event); return
      case 'jasmineDone': return await onJasmineDone(event)
      default: return // jasmineStarted etc.
    }
  }

  function onSuiteStarted(event) {
    suiteStack.push(event.description)
    if (suiteStack.length === 1) {
      // Header/summary are printed lazily (see onSpecDone), so a top-level group
      // whose specs are all filtered out prints nothing.
      group = { name: event.description, passed: 0, failed: 0, pending: 0, started: false }
    }
  }

  // Normalizes and collects a failure record for the end-of-run report. Does NOT
  // touch counts — spec failures are already counted in onSpecDone, and afterAll
  // failures are counted by their caller (they aren't specs).
  function recordFailure({ path, fullName, expectations, log, dom }) {
    failures.push({
      path,
      fullName,
      expectations: expectations || [],
      log: log || [],
      dom: dom || null,
    })
  }

  function onSuiteDone(event) {
    if (event.failedExpectations && event.failedExpectations.length) {
      recordFailure({
        path: [...suiteStack, '(afterAll)'],
        fullName: suiteStack.join(' '),
        expectations: event.failedExpectations,
      })
      counts.failed++
      if (group) group.failed++
    }
    if (suiteStack.length === 1 && group) {
      if (group.started) write(fmt.groupSummary(group))
      group = null
    }
    suiteStack.pop()
  }

  function onSpecDone(event) {
    let status = event.status
    if (status !== 'passed' && status !== 'failed' && status !== 'pending') return

    if (group && !group.started) {
      write(fmt.groupHeader(group.name))
      group.started = true
    }
    counts[status]++
    if (group) group[status]++
    write(fmt.mark(status))

    if (status === 'failed') {
      recordFailure({
        path: [...suiteStack, event.description],
        fullName: event.fullName,
        expectations: event.failedExpectations,
        log: event.failure && event.failure.log,
        dom: event.failure && event.failure.dom,
      })
    }
  }

  async function onJasmineDone(event) {
    let index = 0
    for (let raw of failures) {
      index++
      // Report only the first failure. With stopOnFailure there's normally just
      // one; anything after it is a consequence (or a stray callback failure), so
      // we show the first and note the count of any extras.
      let expectations = raw.expectations
      let message = expectations.length ? expectations[0].message : '(failed with no expectation message)'

      let stackExpectation = expectations.find((e) => e.stack)
      let frames = stackExpectation
        ? formatStack(remapper ? await remapper.remapStack(stackExpectation.stack) : stackExpectation.stack, { verbose })
        : []

      write(fmt.failureBlock({
        index,
        path: raw.path.join(' → '),
        message,
        frames,
        extraFailures: Math.max(0, expectations.length - 1),
        log: raw.log,
        dom: raw.dom,
        debugURL: specsURL(serverURL, { spec: raw.fullName }),
      }, { verbose }))
    }

    write(fmt.runSummary(counts, { verbose }))
    return event.overallStatus === 'failed' ? 1 : 0
  }

  return {
    handle,
    silentForMs: () => Date.now() - lastEventAt,
  }
}
