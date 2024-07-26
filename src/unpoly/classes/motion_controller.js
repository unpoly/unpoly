const u = up.util
const e = up.element

up.MotionController = class MotionController {

  constructor(name) {
    this._activeClass = `up-${name}`
    this._selector = `.${this._activeClass}`
    this.finishEvent = `up:${name}:finish`

    // Track the number of finish() calls for testing
    this.finishCount = 0

    // Track the number of active clusters. If no clusters are active, we can early return in finish().
    this._clusterCount = 0
  }

  /*-
  Finishes all animations in the given elements' ancestors and
  descendants, then calls the given function.

  The function is expected to return a promise that is fulfilled when
  the animation ends. The function is also expected to listen to
  `this.finishEvent` and instantly skip to the last frame
  when the event is observed.

  The animation is tracked so it can be
  [`finished`](/up.MotionController.finish) later.

  @function startFunction
  @param {Element|List<Element>} cluster
    A list of elements that will be affected by the motion.
  @param {Function(): Promise} startMotion
  @param {Object} [memory.trackMotion=true]
  @return {Promise}
    A promise that fulfills when the animation ends.
  */
  startFunction(cluster, startMotion, memory = {}) {
    cluster = e.list(cluster)

    // Some motions might reject after starting. E.g. a scrolling animation
    // will reject when the user scrolls manually during the animation. For
    // the purpose of this controller, we just want to know when the animation
    // has setteld, regardless of whether it was resolved or rejected.
    const mutedAnimator = () => up.error.muteUncriticalRejection(startMotion())

    // Callers can pass an options hash `{ memory }` in which we store a { trackMotion }
    // property. With this we can prevent tracking the same motion multiple times.
    // This is an issue when composing a transition from two animations, or when
    // using another transition from within a transition function.
    memory.trackMotion = memory.trackMotion ?? up.motion.isEnabled()

    if (memory.trackMotion === false) {
      return mutedAnimator()
    } else {
      memory.trackMotion = false
      this.finish(cluster)
      this._markCluster(cluster)
      let promise = this._whileForwardingFinishEvent(cluster, mutedAnimator)
      promise = promise.then(() => this._unmarkCluster(cluster))
      // Return the original promise that is still running
      return promise
    }
  }

  /*-
  @function finish
  @param {List<Element>} [elements]
    If no element is given, finishes all animations in the document.
    If an element is given, only finishes animations in its subtree and ancestors.
  @return {Promise} A promise that fulfills when animations have finished.
  */
  finish(elements) {
    this.finishCount++
    if ((this._clusterCount === 0) || !up.motion.isEnabled()) { return }
    elements = this._expandFinishRequest(elements)

    for (let element of elements) {
      this._finishOneElement(element)
    }

    return up.migrate.formerlyAsync?.('up.motion.finish()')
  }

  _expandFinishRequest(elements) {
    if (elements) {
      return u.flatMap(elements, el => e.list(el.closest(this._selector), el.querySelectorAll(this._selector)))
    } else {
      // If no reference elements were given, we finish every matching
      // element on the screen.
      return document.querySelectorAll(this._selector)
    }
  }

  isActive(element) {
    return element.classList.contains(this._activeClass)
  }

  _finishOneElement(element) {
    // Animating code is expected to listen to this event, fast-forward
    // the animation and resolve their promise. All built-ins like
    // `up.animate()` or `up.morph()` behave that way.
    this._emitFinishEvent(element)
  }

  _emitFinishEvent(element, eventAttrs = {}) {
    eventAttrs = { target: element, log: false, ...eventAttrs }
    return up.emit(this.finishEvent, eventAttrs)
  }

  _markCluster(cluster) {
    this._clusterCount++
    this._toggleActive(cluster, true)
  }

  _unmarkCluster(cluster) {
    this._clusterCount--
    this._toggleActive(cluster, false)
  }

  _toggleActive(cluster, isActive) {
    for (let element of cluster) {
      element.classList.toggle(this._activeClass, isActive)
    }
  }

  _whileForwardingFinishEvent(cluster, fn) {
    if (cluster.length < 2) { return fn() }
    const doForward = (event) => {
      if (!event.forwarded) {
        for (let element of cluster) {
          if (element !== event.target && this.isActive(element)) {
            this._emitFinishEvent(element, { forwarded: true })
          }
        }
      }
    }

    // Forward the finish event to the ghost that is actually animating
    const unbindFinish = up.on(cluster, this.finishEvent, doForward)
    // Our own pseudo-animation finishes when the actual animation on $ghost finishes
    return fn().then(unbindFinish)
  }

  async reset() {
    await this.finish()
    this.finishCount = 0
    this._clusterCount = 0
  }
}
