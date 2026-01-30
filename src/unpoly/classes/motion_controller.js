const u = up.util
const e = up.element

up.MotionController = class MotionController {

  constructor(name) {
    // TODO: Make finishEvent concrete string everywhere. We only have a singgle MotionController.
    this.finishEvent = `up:${name}:finish`
    this._resetProps()
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
  startFunction(newCluster, startMotionFn) {
    const nested = (this._startingCount > 0)

    if (!nested) {
      for (let newClusterElement of newCluster) {
        this.finish(newClusterElement)
      }
    }

    // Remember that we're currently starting a motion function.
    // This helps us detect nested calls to up.morph() or up.animate() later.
    this._startingCount++

    try {
      this._playingClusters.push(newCluster)
      let promise = up.error.muteUncriticalRejection(startMotionFn({ nested }))
      return promise.finally(() => u.remove(this._playingClusters, newCluster))
    } finally {
      // This must happen sync. We cannot await the promise above, or we will be too late.
      this._startingCount--
    }
  }

  finish(element = document.body) {
    for (let playingCluster of this._findPlayingClusters(element)) {
      u.remove(this._playingClusters, playingCluster)

      for (let playingElement of playingCluster) {
        this._emitFinishEvent(playingElement)
      }
    }
  }

  _findPlayingClusters(queryElement) {
    return this._playingClusters.filter((cluster) => {
      return u.some(cluster, (clusterElement) => queryElement.contains(clusterElement))
    })
  }

  _emitFinishEvent(element) {
    return up.emit(element, this.finishEvent, { log: false })
  }

  _resetProps() {
    this._startingCount = 0
    this._playingClusters = []
  }

  reset() {
    this.finish()
    this._resetProps()
  }
}
