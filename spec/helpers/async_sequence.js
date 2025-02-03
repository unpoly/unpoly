/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const u = up.util
const $ = jQuery

const LOG_ENABLED = false

const unstubbedSetTimeout = window.setTimeout

window.asyncSpec = (...args) => (function(originalDone) {

  const done = function() {
    // For some reason Jasmine ignores done() calls if its own clock is stubbed
    jasmine.clock().uninstall()
    return originalDone()
  }

  const fail = function(...args) {
    // For some reason Jasmine ignores done() calls if its own clock is stubbed
    jasmine.clock().uninstall()
    return originalDone.fail(...args)
  }

  const plan = args.pop()

  const queue = []

  // The position in `queue` that we're currently running.
  let playbackCursor = 0
  // The position in `queue` after which `next()` will insert a new task.
  // We track it separately of playbackCursor because
  // (1) Most specs insert many tasks before starting playback
  // (2) At runtime a task may insert more than one new task
  let insertCursor = 0

  const log = function(...args) {
    if (LOG_ENABLED) {
      args[0] = `[asyncSpec] ${args[0]}`
      return console.debug(...args)
    }
  }

  // task is an array:
  // task[0] timing (delay in ms)
  // task[1] block (the callback to run)
  // task[2] callStyle (async or sync)
  const insertAtCursor = function(task) {
    log('Inserting task at index %d: %o', insertCursor, task)
    // We insert at pointer instead of pushing to the end.
    // This way tasks can insert additional tasks at runtime.
    queue.splice(insertCursor, 0, task)
    return insertCursor++
  }

  const next = (block) => insertAtCursor([0, block, 'sync'])

  next.next = next // alternative API

  next.after = (delay, block) => insertAtCursor([delay, block, 'sync'])

  next.await = (block) => insertAtCursor([0, block, 'async'])

  next.fail = fail

  // Call example body
  plan.call(this, next)

  const runBlockSyncAndPoke = function(block, previousValue) {
    try {
      log('runBlockSync')
      const value = block(previousValue)
      return pokeQueue(value)
    } catch (error) {
      fail(error)
      throw error
    }
  }

  const runBlockAsyncThenPoke = function(blockOrPromise, previousValue) {
    log('runBlockAsync')

    // On plan-level people will usually pass a function returning a promise.
    // During runtime people will usually pass a promise to delay the next step.
    const promise = u.isPromise(blockOrPromise) ? blockOrPromise : blockOrPromise(previousValue)
    promise.then((value) => pokeQueue(value))
    return promise.catch((e) => fail(e))
  }

  var pokeQueue = function(previousValue) {
    let entry
    if (entry = queue[playbackCursor]) {
      log('Playing task at index %d', playbackCursor)
      playbackCursor++
      insertCursor = playbackCursor

      const timing = entry[0]
      const block = entry[1]
      const callStyle = entry[2]

      log('Task is %s after %d ms: %o', callStyle, timing, block)

      switch (timing) {
        case 'now':
          return runBlockSyncAndPoke(block, previousValue)
        default:
          var fun = () => // Move the block behind the microtask queue of that frame
          Promise.resolve().then(function() {
            if (callStyle === 'sync') {
              return runBlockSyncAndPoke(block, previousValue)
            } else { // async
              return runBlockAsyncThenPoke(block, previousValue)
            }
          })

          // Also move to the next frame
          return unstubbedSetTimeout(fun, timing)
      }
    } else {
      log('calling done()')
      return done()
    }
  }

  pokeQueue()

})

