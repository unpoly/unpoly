u = up.util
$ = jQuery

up.testUtil = do ->

  ###**
  Returns whether the given element has been detached from the DOM
  (or whether it was never attached).

  @function up.util.isDetached
  @internal
  ###
  isDetached = (element) ->
    element = up.element.get(element)
    # This is by far the fastest way to do this
    not jQuery.contains(document.documentElement, element)

  ###**
  @function up.util.promiseTimer
  @internal
  ###
  promiseTimer = (ms) ->
    timeout = undefined
    promise = new Promise (resolve, reject) ->
      timeout = u.setTimer(ms, resolve)
    promise.cancel = -> clearTimeout(timeout)
    promise


  isDetached: isDetached
  promiseTimer: promiseTimer



