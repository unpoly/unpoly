// Save the original function before it gets mocked by jasmine.clock()
let originalSetTimeout = window.setTimeout

function waitTime(ms = 0) {
  return new Promise(function(resolve) {
    originalSetTimeout(resolve, ms)
  })
}

jasmine.waitTime = waitTime

async function waitMicrotasks(count = 1) {
  for (let i = 0; i < count; i++) {
    await Promise.resolve()
  }
}

jasmine.waitMicrotasks = waitMicrotasks

async function waitTasks(count = 1) {
  for (let i = 0; i < count; i++) {
    await waitTime(0)
  }
}

jasmine.waitTasks = waitTasks

async function waitIdle(timeout) {
  return new Promise(function(resolve) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(resolve, { timeout })
    } else {
      // https://bugs.webkit.org/show_bug.cgi?id=285049
      setTimeout(resolve)
    }
  })
}

jasmine.waitIdle = waitIdle

// Waits until the browser has traversed history after history.back() or history.forward(),
// then waits one more task for Unpoly to react to the change.
//
// The browser traverses asynchronously, and on a busy machine the popstate event
// can arrive later than any fixed delay we would choose.
async function waitPopstate() {
  await new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }))
  await waitTasks(1)
}

jasmine.waitPopstate = waitPopstate

window.wait = waitTime
