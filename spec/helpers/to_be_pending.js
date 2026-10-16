// Replaces Jasmine's built-in toBePending() async matcher.
//
// The built-in matcher races the actual value against an already-resolved sentinel promise.
// When the actual value is a non-native thenable (like an up.Request or up.RenderJob),
// Jasmine first converts it with Promise.resolve(), which costs an extra microtask tick.
// The sentinel then always wins, and the assertion passes even for a settled thenable.
//
// promiseState() calls the thenable's own then() method, so a settled thenable is
// reported as settled.
beforeEach(function() {
  jasmine.addAsyncMatchers({
    toBePending() {
      return {
        async compare(actual) {
          let { state } = await promiseState(actual)
          return {
            pass: state === 'pending',
            message: `Expected a promise to be pending, but it was ${state}.`,
          }
        }
      }
    }
  })
})
