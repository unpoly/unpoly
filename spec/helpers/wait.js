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

window.wait = waitTime
