// We would prefer to use Promise.race() here.
// Unfortunately Promise.race() converts *all* non-native thenables to native Promises
// using Promise.resolve(). This way the thenable takes another microtask tick to fulfill,
// and can never win the race.
function raceThenables(promises) {
  return new Promise(function(resolve, reject) {
    var finished = false

    promises.forEach(function(promise) {
      // Pass both callbacks to a single then() call. A separate then(onFulfilled) would
      // return a derived promise that rejects unhandled when the observed promise rejects later.
      promise.then(
        function(value) {
          if (!finished) {
            finished = true
            resolve(value)
          }
        },
        function(reason) {
          if (!finished) {
            finished = true
            reject(reason)
          }
        }
      )
    })
  })
}

window.promiseState = function(promise) {
  let uniqueValue = Symbol('unique')

  function notifyPendingOrResolved(value) {
    if (value === uniqueValue) {
      return Promise.resolve({ state: 'pending' })
    } else {
      return Promise.resolve({ state: 'fulfilled', value: value })
    }
  }

  function notifyRejected(reason) {
    return Promise.resolve({ state: 'rejected', value: reason })
  }

  let race = [promise, Promise.resolve(uniqueValue)]

  return raceThenables(race).then(notifyPendingOrResolved, notifyRejected)
}
