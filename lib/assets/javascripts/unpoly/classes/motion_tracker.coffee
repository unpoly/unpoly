u = up.util

class up.MotionTracker

  constructor: (name) ->
    @activeClass = "up-#{name}"
    @dataKey = "up-#{name}-finished"
    @selector = ".#{@activeClass}"
    @finishEvent = "up:#{name}:finish"
    @finishCount = 0
    @clusterCount = 0

  ###**
  Finishes all animations in the given element cluster's ancestors and descendants,
  then calls the animator.

  The animation returned by the animator is tracked so it can be
  [`finished`](/up.MotionTracker.finish) later.

  @method claim
  @param {jQuery} $cluster
    A list of elements that will be affected by the motion.
  @param {Function(): Promise} startMotion
  @param {Object} [memory.trackMotion=true]
  @return {Promise}
    A promise that is fulfilled when the new animation ends.
  ###
  claim: (cluster, startMotion, memory = {}) =>
    $cluster = $(cluster)

    # Some motions might reject after starting. E.g. a scrolling animation
    # will reject when the user scrolls manually during the animation. For
    # the purpose of this tracker, we just want to know when the animation
    # has setteld, regardless of whether it was resolved or rejected.
    mutedAnimator = -> u.muteRejection(startMotion())

    # Callers can pass an options hash `memory` in which we store a { trackMotion }
    # property. With this we can prevent tracking the same motion multiple times.
    # This is an issue when composing a transition from two animations, or when
    # using another transition from within a transition function.
    memory.trackMotion = u.option(memory.trackMotion, up.motion.isEnabled())
    if memory.trackMotion is false
      # Since we don't want recursive tracking or finishing, we could run
      # the animator() now. However, since the else branch is async, we push
      # the animator into the microtask queue to be async as well.
      u.microtask(mutedAnimator)
    else
      memory.trackMotion = false
      @finish($cluster).then =>
        promise = @whileForwardingFinishEvent($cluster, mutedAnimator)
        promise = promise.then => @unmarkCluster($cluster)
        # Attach the modified promise to the cluster's elements
        @markCluster($cluster, promise)
        promise

  claim2: (element, motion) ->
    element.addEventListener(@finishEvent, motion.finish)
    promise = @claim(element, motion.start)
    promise = promise.then => element.removeEventListener(@finishEvent, motion.finish)
    promise

  ###**
  @method finish
  @param {jQuery} [elements]
    If no element is given, finishes all animations in the documnet.
    If an element is given, only finishes animations in its subtree and ancestors.
  @return {Promise} A promise that is fulfilled when animations have finished.
  ###
  finish: (elements) =>
    @finishCount++
    return Promise.resolve() if @clusterCount == 0 || !up.motion.isEnabled()
    $elements = @expandFinishRequest(elements)
    allFinished = u.map($elements, @finishOneElement)
    Promise.all(allFinished)

  expandFinishRequest: (elements) =>
    if elements
      expanded = u.flatMap elements, (el) => u.selectInDynasty(el, @selector)
      $(expanded)
    else
      $(@selector)

  isActive: (element) =>
    u.hasClass(element, @activeClass)

  finishOneElement: (element) =>
    $element = $(element)

    # Animating code is expected to listen to this event, fast-forward
    # the animation and resolve their promise. All built-ins like
    # `up.animate`, `up.morph`, or `up.scroll` behave that way.
    @emitFinishEvent($element)

    # If animating code ignores the event, we cannot force the animation to
    # finish from here. We will wait for the animation to end naturally before
    # starting the next animation.
    @whenElementFinished($element)

  emitFinishEvent: ($element, eventAttrs = {}) =>
    eventAttrs = u.merge({ $element: $element, message: false }, eventAttrs)
    up.emit(@finishEvent, eventAttrs)

  whenElementFinished: ($element) =>
    # There are some cases related to element ghosting where an element
    # has the class, but not the data value. In that case simply return
    # a resolved promise.
    $element.data(@dataKey) || Promise.resolve()

  markCluster: ($cluster, promise) =>
    @clusterCount++
    $cluster.addClass(@activeClass)
    $cluster.data(@dataKey, promise)

  unmarkCluster: ($cluster) =>
    @clusterCount--
    $cluster.removeClass(@activeClass)
    $cluster.removeData(@dataKey)

  forwardFinishEvent: ($original, $ghost, duration) =>
    @start $original, =>
      doForward = => $ghost.trigger(@finishEvent)
      # Forward the finish event to the $ghost that is actually animating
      $original.on @finishEvent, doForward
      # Our own pseudo-animation finishes when the actual animation on $ghost finishes
      duration.then => $original.off @finishEvent, doForward

  whileForwardingFinishEvent: ($elements, fn) =>
    return fn() if $elements.length < 2
    doForward = (event) =>
      event = event.originalEvent
      unless event.forwarded
        u.each $elements, (element) =>
          $element = $(element)
          if element != event.target && @isActive($element)
            @emitFinishEvent($element, forwarded: true)

    # Forward the finish event to the $ghost that is actually animating
    $elements.on @finishEvent, doForward
    # Our own pseudo-animation finishes when the actual animation on $ghost finishes
    fn().then => $elements.off @finishEvent, doForward

  reset: =>
    @finish().then =>
      @finishCount = 0
      @clusterCount = 0
