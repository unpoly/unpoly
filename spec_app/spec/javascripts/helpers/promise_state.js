function promiseState(promise) {
  var uniqueValue = window['Symbol'] ? Symbol('unique') : Math.random().toString(36)

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

  var race = [promise, Promise.resolve(uniqueValue)]
  return Promise.race(race).then(notifyPendingOrResolved, notifyRejected)
}
