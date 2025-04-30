// Save the original function before it gets mocked by jasmine.clock()
let originalSetTimeout = window.setTimeout

function waitTime(ms) {
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

jasmine.waitAnimationFrame = waitAnimationFrame

async function waitMessageChannel() {
  return new Promise(function(resolve) {
    const channel = new MessageChannel()
    channel.port1.onmessage = resolve
    channel.port2.postMessage(0)
  })
}

jasmine.waitMessageChannel = waitMessageChannel

async function waitAnimationFrame() {
  return new Promise(function(resolve) {
    requestAnimationFrame(resolve)
  })
}

jasmine.waitAnimationFrame = waitAnimationFrame

function waitFlex(ms) {
  if (typeof ms === 'undefined') {
    return waitMessageChannel()
  } else {
    return waitTime(ms)
  }
}

jasmine.waitFlex = waitFlex

window.wait = waitFlex

