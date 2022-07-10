u = up.util
$ = jQuery

LOG_ENABLED = false

unstubbedSetTimeout = window.setTimeout

window.asyncSpec = (args...) ->
  (originalDone) ->

    done = ->
      # For some reason Jasmine ignores done() calls if its own clock is stubbed
      jasmine.clock().uninstall()
      originalDone()

    fail = (args...) ->
      # For some reason Jasmine ignores done() calls if its own clock is stubbed
      jasmine.clock().uninstall()
      originalDone.fail(args...)

    plan = args.pop()

    queue = []

    # The position in `queue` that we're currently running.
    playbackCursor = 0
    # The position in `queue` after which `next()` will insert a new task.
    # We track it separately of playbackCursor because
    # (1) Most specs insert many tasks before starting playback
    # (2) At runtime a task may insert more than one new task
    insertCursor = 0

    log = (args...) ->
      if LOG_ENABLED
        args[0] = "[asyncSpec] #{args[0]}"
        console.debug(args...)

    # task is an array:
    # task[0] timing (delay in ms)
    # task[1] block (the callback to run)
    # task[2] callStyle (async or sync)
    insertAtCursor = (task) ->
      log('Inserting task at index %d: %o', insertCursor, task)
      # We insert at pointer instead of pushing to the end.
      # This way tasks can insert additional tasks at runtime.
      queue.splice(insertCursor, 0, task)
      insertCursor++

    next = (block) ->
      insertAtCursor [0, block, 'sync']

    next.next = next # alternative API

    next.after = (delay, block) ->
      insertAtCursor [delay, block, 'sync']

    next.await = (block) ->
      insertAtCursor  [0, block, 'async']

    next.fail = fail

    # Call example body
    plan.call(this, next)

    runBlockSyncAndPoke = (block, previousValue) ->
      try
        log('runBlockSync')
        value = block(previousValue)
        pokeQueue(value)
      catch error
        fail(error)
        throw error

    runBlockAsyncThenPoke = (blockOrPromise, previousValue) ->
      log('runBlockAsync')

      # On plan-level people will usually pass a function returning a promise.
      # During runtime people will usually pass a promise to delay the next step.
      promise = if u.isPromise(blockOrPromise) then blockOrPromise else blockOrPromise(previousValue)
      promise.then (value) -> pokeQueue(value)
      promise.catch (e) -> fail(e)

    pokeQueue = (previousValue) ->
      if entry = queue[playbackCursor]
        log('Playing task at index %d', playbackCursor)
        playbackCursor++
        insertCursor = playbackCursor

        timing = entry[0]
        block = entry[1]
        callStyle = entry[2]

        log('Task is %s after %d ms: %o', callStyle, timing, block)

        switch timing
          when 'now'
            runBlockSyncAndPoke(block, previousValue)
          else
            fun = ->
              # Move the block behind the microtask queue of that frame
              Promise.resolve().then ->
                if callStyle == 'sync'
                  runBlockSyncAndPoke(block, previousValue)
                else # async
                  runBlockAsyncThenPoke(block, previousValue)

            # Also move to the next frame
            unstubbedSetTimeout(fun, timing)
      else
        log('calling done()')
        done()

    pokeQueue()
