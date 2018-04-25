u = up.util

class up.MotionTracker

  constructor: (name) ->
    @className = "up-#{name}"
    @dataKey = "up-#{name}-finished"
    @selector = ".#{@className}"
    @finishEvent = "up:#{name}:finish"

  ###**
  Finishes all animations in the given element's ancestors and descendants,
  then calls the animator.

  @method claim
  @param {jQuery} $element
  @param {Function(jQuery): Promise} animator
  @return {Promise} A promise that is fulfilled when the new animation ends.
  ###
  claim: ($element, animator) =>
    @finish($element).then =>
      @start($element, animator)

  ###**
  Calls the given animator to animate the given element.

  The animation returned by the animator is tracked so it can be
  [`finished`](/up.MotionTracker.finish) later.

  No animations are finished before starting the new animation.
  Use [`claim()`](/up.MotionTracker.claim) for that.

  @method claim
  @param {jQuery} $elements
  @param {Function(jQuery): Promise} animator
  @return {Promise} A promise that is fulfilled when the new animation ends.
  ###
  start: ($elements, animator) ->
    promise = @whileForwardingFinishEvent($elements, animator)
    @markElement($elements, promise)
    promise.then => @unmarkElement($elements)
    promise

  ###**
  @method finish
  @param {jQuery} [elements]
    If no element is given, finishes all animations in the documnet.
    If an element is given, only finishes animations in its subtree and ancestors.
  @return {Promise} A promise that is fulfilled when animations have finished.
  ###
  finish: (elements) =>
    $elements = @expandFinishRequest(elements)
    allFinished = u.map($elements, @finishOneElement)
    Promise.all(allFinished)

  expandFinishRequest: (elements) ->
    if elements
      u.selectInDynasty($(elements), @selector)
    else
      $(@selector)

  finishOneElement: (element) =>
    $element = $(element)

    # Animating code is expected to listen to this event, fast-forward
    # the animation and resolve their promise. All built-ins like
    # `up.animate`, `up.morph`, or `up.scroll` behave that way.
    $element.trigger(@finishEvent)

    # If animating code ignores the event, we cannot force the animation to
    # finish from here. We will wait for the animation to end naturally before
    # starting the next animation.
    @whenElementFinished($element)

  whenElementFinished: ($element) =>
    # There are some cases related to element ghosting where an element
    # has the class, but not the data value. In that case simply return
    # a resolved promise.
    $element.data(@dataKey) || Promise.resolve()

  markElement: ($element, promise) =>
    $element.addClass(@className)
    $element.data(@dataKey, promise)

  unmarkElement: ($element) =>
    $element.removeClass(@className)
    $element.removeData(@dataKey)

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
      unless event.forwarded
        u.each $elements.not(event.target), (element) =>
          up.bus.emit(@finishEvent, forwarded: true, $element: $(element))

    # Forward the finish event to the $ghost that is actually animating
    $elements.on @finishEvent, doForward
    # Our own pseudo-animation finishes when the actual animation on $ghost finishes
    fn().then => $elements.off @finishEvent, doForward
