// Reports Jasmine status in a way it can be parsed by spec/runner/server

function indentLines(text, spaces) {
  const indent = ' '.repeat(spaces)
  return text.split('\n').map((line) => indent + line).join('\n')
}

function log(data) {
  let parts = []
  if (typeof data === 'string') {
    parts.push(data)
  } else {
    let addPart = (indentLevel, text) => {
      let processedText = indentLines(text, indentLevel)
      parts.push(processedText)
    }
    data(addPart)
  }
  parts[0] =  `[SPECS] ${parts[0]}`
  console.log(parts.join("\n"))
}

function debugInBrowserURL(exampleName) {
  let url = new URL(jasmine.locationBeforeSuite)
  url.searchParams.set('spec', exampleName)
  url.searchParams.delete('terminal')
  return url.toString().replaceAll('+', '%20')
}

// Compare with console_reporter.js in jasmine
const terminalReporter = {
  jasmineStarted(suiteInfo) {
    log('Jasmine started')
  },

  // suiteStarted(result) {
  //   console.log(`[SPECS] Suite started: ${result.fullName}`)
  // },

  // specStarted(result) {
  //   console.log(`[SPECS] Spec started: ${result.fullName}`)
  // },

  specDone(result) {
    switch(result.status) {
      case 'passed': {
        log(`Example passed: ${result.fullName}`)
        break
      }
      case 'failed': {
        log((part) => {
          part(0, `Example failed: ${result.fullName}`)
          result.failedExpectations.forEach((failure, i) => {
            part(4, failure.message)
            if (failure.stack) {
              part(4, failure.stack)
            }
          })
          part(4, `Debug in browser: ${debugInBrowserURL(result.fullName)}`)
        })
        break
      }
      case 'pending': {
        log((part) => {
          part(0, `Example pending: ${result.fullName}`)
          if (result.pendingReason) {
            part(4, `Pending reason: ${result.pendingReason}`)
          }
        })
        break
      }
      case 'excluded': {
        // Do nothing
        break
      }
      default: {
        log(`Example terminated with unknown status '${result.status}': ${result.fullName}`)
      }
    }
  },

  suiteDone: function(result) {
    if (result.failedExpectations.length > 0) {
      log((part) => {
        part(0, `Failure in afterAll(): ${result.fullName}`)
        result.failedExpectations.forEach((failure, i) => {
          part(4, failure.message)
          if (failure.stack) {
            part(4, failure.stack)
          }
        })
      })
    }
  },

  jasmineDone: function(result) {
    // const totalTimeHuman = `${Math.round(0.001 * result.totalTime)}s`

    log((part) => {
      part(0, `Jasmine ${result.overallStatus}`) // 'passed' | 'failed' | 'incomplete'

      // Only focusing specs with fit/describe will cause an incomplete status.
      // Pending specs are not considered incomplete.
      if (result.incompleteReason) {
        part(4, `Incomplete reason: ${result.incompleteReason}`)
      }

      if (result.failedExpectations.length > 0) {
        part((part) => {
          part(4, 'Failure in top-level afterAll()')
          result.failedExpectations.forEach((failure, i) => {
            part(8, failure.message)
            if (failure.stack) {
              part(8, failure.stack)
            }
          })
        })
      }
    })

  }
}

// Attach reporter to Jasmine
if (specs.config.terminal) {
  jasmine.getEnv().addReporter(terminalReporter)
}

