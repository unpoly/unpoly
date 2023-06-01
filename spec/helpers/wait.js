// Save the original function before it gets mocked by jasmine.clock()
let originalSetTimeout = window.setTimeout

function wait(ms) {
  return new Promise(function(resolve, reject) {
    originalSetTimeout(resolve, ms)
  })
}

window.wait = wait
