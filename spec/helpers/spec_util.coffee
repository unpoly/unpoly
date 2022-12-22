u = up.util
e = up.element
$ = jQuery

up.specUtil = do ->

  ###**
  Returns whether the given element has been detached from the DOM
  (or whether it was never attached).

  @function up.util.isDetached
  @internal
  ###
  isDetached = (element) ->
    element = e.get(element)
    !element.isConnected

  isAttached = (element) ->
    !isDetached(element)

  isVisible = (element) ->
    $(element).is(':visible')

  isHidden = (element) ->
    $(element).is(':hidden')

  ###**
  @function up.util.promiseTimer
  @internal
  ###
  promiseTimer = (ms) ->
    timeout = undefined
    promise = new Promise (resolve, reject) ->
      timeout = u.timer(ms, resolve)
    promise.cancel = -> clearTimeout(timeout)
    promise


  isDetached: isDetached
  isAttached: isAttached
  isVisible: isVisible
  isHidden: isHidden
  promiseTimer: promiseTimer



