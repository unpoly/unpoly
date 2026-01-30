const u = up.util
const e = up.element

// TODO: Get rid of this class and all utility functions
up.MotionController = class MotionController {

  constructor(name) {
    // TODO: Make finishEvent concrete string everywhere
    this.finishEvent = `up:${name}:finish`
    this._nerfAutoFinishCount = 0
    this._callingRoots = []
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
  @param {List<Element>} cluster
    A list of elements that will be affected by the motion.
  @param {Function(): Promise} startMotion
  @return {Promise}
    A promise that fulfills when the animation ends.
  */
  startFunction(primaryElement, secondaryElement, startMotionFn) {
    if (this._nerfAutoFinishCount === 0) {
      console.debug("[MotionController] auto-finishing primary %o", primaryElement)
      this.finish(primaryElement)
      if (secondaryElement) console.debug("[MotionController] auto-finishing secondary %o", secondaryElement)
      if (secondaryElement) this.finish(secondaryElement)
    }

    // TODO: Get rid of "cluster" concept. Only accept the main element (transitions: the new one)

    try {
      this._nerfAutoFinishCount++
      let nested = u.some(this._callingRoots, (root) => root.contains(primaryElement))
      this._callingRoots.push(primaryElement, secondaryElement)

      // Some motions might reject after starting. E.g. a scrolling animation
      // will reject when the user scrolls manually during the animation. For
      // the purpose of this controller, we just want to know when the animation
      // has settled, regardless of whether it was resolved or rejected.
      let promise = up.error.muteUncriticalRejection(startMotionFn( { nested }))

      if (secondaryElement) {
        // TODO: Remove this listener after the main animation is done
        up.motion.onFinish(primaryElement, () => {
          console.debug("[MotionController] primary %o finished, CO-finishing secondary %o", primaryElement, secondaryElement)
          this.finish(secondaryElement)
        })

        // TODO: I think we also need it the other way around
      }


      return promise
    } finally {
      // Undo our nerfing after the sync phase of the motion fn is over.
      // Any async nested calls will not be nerfed.
      u.remove(this._callingRoots, primaryElement)
      u.remove(this._callingRoots, secondaryElement)
      this._nerfAutoFinishCount--
    }
  }

  /*-
  @function finish
  @param {List<Element>} [elements]
    If no element is given, finishes all animations in the document.
    If an element is given, only finishes animations in its subtree and ancestors.
  @return {Promise} A promise that fulfills when animations have finished.
  */
  finish(element = document.body) {
    // Animating code is expected to listen to this event, fast-forward
    // the animation and resolve their promise. All built-ins like
    // `up.animate()` or `up.morph()` behave that way.
    this._emitFinishEvent(element)
  }

  // TODO: Get rid of eventTAttrs
  _emitFinishEvent(element, eventAttrs = {}) {
    console.debug("[MotionController] emitting %o event on %o", this.finishEvent, element)
    return up.emit(element, this.finishEvent, { ...eventAttrs, log: false })
  }

  // // // TODO: Get rid of forwarding, and also of emitFinishEvent(eventAttrs)
  // _whileForwardingFinishEventOld(cluster, fn) {
  //   if (cluster.length < 2) { return fn() }
  //   const doForward = (event) => {
  //     if (!event.forwarded) {
  //       for (let element of cluster) {
  //         if (element !== event.target && this.isActive(element)) {
  //           this._emitFinishEvent(element, { forwarded: true })
  //         }
  //       }
  //     }
  //   }
  //
  //   // Forward the finish event to the ghost that is actually animating
  //   const unbindFinish = up.on(cluster, this.finishEvent, doForward)
  //   // Our own pseudo-animation finishes when the actual animation on $ghost finishes
  //   return fn().then(unbindFinish)
  // }
  //
  // // // TODO: Get rid of forwarding, and also of emitFinishEvent(eventAttrs)
  // _whileForwardingFinishEvent(cluster, fn) {
  //   if (cluster.length < 2) { return fn() }
  //
  //   const doForwardOnce = u.memoize((event) => {
  //     if (!event.forwarded) {
  //       for (let element of cluster) {
  //         if (element !== event.target) {
  //           this._emitFinishEvent(element, { forwarded: true })
  //         }
  //       }
  //     }
  //   })
  //
  //   const forwardCleaner = u.cleaner()
  //   for (let element of cluster) {
  //     forwardCleaner(up.motion.onFinish(element, doForwardOnce))
  //   }
  //
  //   try {
  //     fn()
  //   } finally {
  //     forwardCleaner.clean()
  //   }
  // }
  //


  async reset() {
    this.finish()
    this._nerfAutoFinishCount = 0
    this._callingRoots = []
  }
}
