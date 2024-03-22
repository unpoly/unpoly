// Save the original function before it gets mocked by jasmine.clock()
let originalSetTimeout = window.setTimeout

function waitTime(ms) {
  return new Promise(function(resolve) {
    originalSetTimeout(resolve, ms)
  })
}

window.wait = waitTime

jasmine.waitTime = waitTime

// function waitMicrotasks(count = 1) {
//   // Awaiting this initial promise is already the first microtask
//   let promise = Promise.resolve()
//
//   for (let i = 1; i < count; i++) {
//     promise = promise.then(() => {})
//   }
//
//   return promise
// }


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
