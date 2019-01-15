u = up.util
e = up.element

class up.MotionController

  constructor: (name) ->
    @activeClass = "up-#{name}"
    @dataKey = "up-#{name}-finished"
    @selector = ".#{@activeClass}"
    @finishEvent = "up:#{name}:finish"
    @finishCount = 0
    @clusterCount = 0

  ###**
  Finishes all animations in the given elements' ancestors and
  descendants, then calls the given function.

  The function is expected to return a promise that is fulfilled when
  the animation ends. The function is also expected to listen to
  `this.finishEvent` and instantly skip to the last frame
  when the event is observed.

  The animation is tracked so it can be
  [`finished`](/up.MotionController.finish) later.

  @method startFunction
  @param {Element|List<Element>} cluster
    A list of elements that will be affected by the motion.
  @param {Function(): Promise} startMotion
  @param {Object} [memory.trackMotion=true]
  @return {Promise}
    A promise that is fulfilled when the animation ends.
  ###
  startFunction: (cluster, startMotion, memory = {}) =>
    cluster = e.list(cluster)

    # Some motions might reject after starting. E.g. a scrolling animation
    # will reject when the user scrolls manually during the animation. For
    # the purpose of this controller, we just want to know when the animation
    # has setteld, regardless of whether it was resolved or rejected.
    mutedAnimator = -> u.muteRejection(startMotion())

    # Callers can pass an options hash `memory` in which we store a { trackMotion }
    # property. With this we can prevent tracking the same motion multiple times.
    # This is an issue when composing a transition from two animations, or when
    # using another transition from within a transition function.
    memory.trackMotion = memory.trackMotion ? up.motion.isEnabled()
    if memory.trackMotion is false
      # Since we don't want recursive tracking or finishing, we could run
      # the animator() now. However, since the else branch is async, we push
      # the animator into the microtask queue to be async as well.
      u.microtask(mutedAnimator)
    else
      memory.trackMotion = false
      @finish(cluster).then =>
        promise = @whileForwardingFinishEvent(cluster, mutedAnimator)
        promise = promise.then => @unmarkCluster(cluster)
        # Attach the modified promise to the cluster's elements
        @markCluster(cluster, promise)
        promise

  ###*
  Finishes all animations in the given elements' ancestors and
  descendants, then calls `motion.start()`.

  Also listens to `this.finishEvent` on the given elements.
  When this event is observed, calls `motion.finish()`.

  @method startMotion
  @param {Element|List<Element>} cluster
  @param {up.Motion} motion
  @param {Object} [memory.trackMotion=true]
  ###
  startMotion: (cluster, motion, memory = {}) ->
    start = -> motion.start()
    finish = -> motion.finish()
    unbindFinish = up.on(cluster, @finishEvent, finish)
    promise = @startFunction(cluster, start, memory)
    promise = promise.then(unbindFinish)
    promise

  ###**
  @method finish
  @param {List<Element>} [elements]
    If no element is given, finishes all animations in the documnet.
    If an element is given, only finishes animations in its subtree and ancestors.
  @return {Promise} A promise that is fulfilled when animations have finished.
  ###
  finish: (elements) =>
    @finishCount++
    return Promise.resolve() if @clusterCount == 0 || !up.motion.isEnabled()
    elements = @expandFinishRequest(elements)
    allFinished = u.map(elements, @finishOneElement)
    Promise.all(allFinished)

  expandFinishRequest: (elements) =>
    if elements
      u.flatMap elements, (el) =>
        e.list(e.closest(el, @selector), e.all(el, @selector))
    else
      # If no reference elements were given, we finish every matching
      # element on the screen.
      e.all(@selector)

  isActive: (element) =>
    element.classList.contains(@activeClass)

  finishOneElement: (element) =>
    # Animating code is expected to listen to this event, fast-forward
    # the animation and resolve their promise. All built-ins like
    # `up.animate`, `up.morph`, or `up.scroll` behave that way.
    @emitFinishEvent(element)

    # If animating code ignores the event, we cannot force the animation to
    # finish from here. We will wait for the animation to end naturally before
    # starting the next animation.
    @whenElementFinished(element)

  emitFinishEvent: (element, eventAttrs = {}) =>
    eventAttrs = u.merge({ target: element, log: false }, eventAttrs)
    up.emit(@finishEvent, eventAttrs)

  whenElementFinished: (element) =>
    # There are some cases related to element ghosting where an element
    # has the class, but not the data value. In that case simply return
    # a resolved promise.
    element[@dataKey] || Promise.resolve()

  markCluster: (cluster, promise) =>
    @clusterCount++
    for element in cluster
      element.classList.add(@activeClass)
      element[@dataKey] = promise

  unmarkCluster: (cluster) =>
    @clusterCount--
    for element in cluster
      element.classList.remove(@activeClass)
      delete element[@dataKey]

  whileForwardingFinishEvent: (cluster, fn) =>
    return fn() if cluster.length < 2
    doForward = (event) =>
      unless event.forwarded
        u.each cluster, (element) =>
          if element != event.target && @isActive(element)
            @emitFinishEvent(element, forwarded: true)

    # Forward the finish event to the ghost that is actually animating
    unbindFinish = up.on(cluster, @finishEvent, doForward)
    # Our own pseudo-animation finishes when the actual animation on $ghost finishes
    fn().then(unbindFinish)

  reset: =>
    @finish().then =>
      @finishCount = 0
      @clusterCount = 0
