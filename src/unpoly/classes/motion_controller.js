const u = up.util
const e = up.element

up.MotionController = class MotionController {

  constructor(name) {
    this.activeClass = `up-${name}`
    this.dataKey = `up-${name}-finished`
    this.selector = `.${this.activeClass}`
    this.finishEvent = `up:${name}:finish`
    this.finishCount = 0
    this.clusterCount = 0
  }

  /***
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
    const mutedAnimator = () => up.log.muteUncriticalRejection(startMotion())

    // Callers can pass an options hash `memory` in which we store a { trackMotion }
    // property. With this we can prevent tracking the same motion multiple times.
    // This is an issue when composing a transition from two animations, or when
    // using another transition from within a transition function.
    memory.trackMotion = memory.trackMotion ?? up.motion.isEnabled()
    if (memory.trackMotion === false) {
      // Since we don't want recursive tracking or finishing, we could run
      // the animator() now. However, since the else branch is async, we push
      // the animator into the microtask queue to be async as well.
      return u.microtask(mutedAnimator)
    } else {
      memory.trackMotion = false
      return this.finish(cluster).then(() => {
        let promise = this.whileForwardingFinishEvent(cluster, mutedAnimator)
        promise = promise.then(() => this.unmarkCluster(cluster))
        // Attach the modified promise to the cluster's elements
        this.markCluster(cluster, promise)
        return promise
      })
    }
  }

  /***
  Finishes all animations in the given elements' ancestors and
  descendants, then calls `motion.start()`.

  Also listens to `this.finishEvent` on the given elements.
  When this event is observed, calls `motion.finish()`.

  @function startMotion
  @param {Element|List<Element>} cluster
  @param {up.Motion} motion
  @param {Object} [memory.trackMotion=true]
  */
  startMotion(cluster, motion, memory = {}) {
    const start = () => motion.start()
    const finish = () => motion.finish()
    const unbindFinish = up.on(cluster, this.finishEvent, finish)
    let promise = this.startFunction(cluster, start, memory)
    promise = promise.then(unbindFinish)
    return promise
  }

  /***
  @function finish
  @param {List<Element>} [elements]
    If no element is given, finishes all animations in the documnet.
    If an element is given, only finishes animations in its subtree and ancestors.
  @return {Promise} A promise that fulfills when animations have finished.
  */
  finish(elements) {
    this.finishCount++
    if ((this.clusterCount === 0) || !up.motion.isEnabled()) { return Promise.resolve(); }
    elements = this.expandFinishRequest(elements)
    const allFinished = u.map(elements, this.finishOneElement.bind(this))
    return Promise.all(allFinished)
  }

  expandFinishRequest(elements) {
    if (elements) {
      return u.flatMap(elements, el => e.list(e.closest(el, this.selector), e.all(el, this.selector)))
    } else {
      // If no reference elements were given, we finish every matching
      // element on the screen.
      return e.all(this.selector)
    }
  }

  isActive(element) {
    return element.classList.contains(this.activeClass)
  }

  finishOneElement(element) {
    // Animating code is expected to listen to this event, fast-forward
    // the animation and resolve their promise. All built-ins like
    // `up.animate`, `up.morph`, or `up.scroll` behave that way.
    this.emitFinishEvent(element)

    // If animating code ignores the event, we cannot force the animation to
    // finish from here. We will wait for the animation to end naturally before
    // starting the next animation.
    return this.whenElementFinished(element)
  }

  emitFinishEvent(element, eventAttrs = {}) {
    eventAttrs = { target: element, log: false, ...eventAttrs }
    return up.emit(this.finishEvent, eventAttrs)
  }

  whenElementFinished(element) {
    // There are some cases related to element ghosting where an element
    // has the class, but not the data value. In that case simply return
    // a resolved promise.
    return element[this.dataKey] || Promise.resolve()
  }

  markCluster(cluster, promise) {
    this.clusterCount++
    for (let element of cluster) {
      element.classList.add(this.activeClass)
      element[this.dataKey] = promise
    }
  }

  unmarkCluster(cluster) {
    this.clusterCount--
    for (let element of cluster) {
      element.classList.remove(this.activeClass)
      delete element[this.dataKey]
    }
  }

  whileForwardingFinishEvent(cluster, fn) {
    if (cluster.length < 2) { return fn(); }
    const doForward = (event) => {
      if (!event.forwarded) {
        for (let element of cluster) {
          if (element !== event.target && this.isActive(element)) {
            this.emitFinishEvent(element, { forwarded: true })
          }
        }
      }
    }

    // Forward the finish event to the ghost that is actually animating
    const unbindFinish = up.on(cluster, this.finishEvent, doForward)
    // Our own pseudo-animation finishes when the actual animation on $ghost finishes
    return fn().then(unbindFinish)
  }

  reset() {
    this.finish().then(() => {
      this.finishCount = 0
      this.clusterCount = 0
    })
  }
}
