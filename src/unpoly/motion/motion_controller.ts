import * as u from '../util.js'
import { muteUncriticalRejection } from '../error.js'
import { emit } from '../event.js'

/**
Elements that animate together, like the old and new element of a transition.
@internal
*/
export type MotionCluster = Element[]

export class MotionController {
  declare finishEvent: string
  declare _startingCount: number
  declare _playingClusters: MotionCluster[]

  constructor(name: string) {
    // TODO: Make finishEvent concrete string everywhere. We only have a singgle MotionController.
    this.finishEvent = `up:${name}:finish`
    this._resetProps()
  }

  // Whether we're currently starting a motion function.
  // This helps us detect nested calls to up.morph() or up.animate(), e.g. from a transition function.
  get nested(): boolean {
    return this._startingCount > 0
  }

  startFunction(newCluster: MotionCluster, startMotionFn: () => Promise<any>): Promise<any> {
    // Remember that we're currently starting a motion function.
    this._startingCount++

    try {
      this._playingClusters.push(newCluster)
      let promise = muteUncriticalRejection(startMotionFn())
      return promise.finally(() => u.remove(this._playingClusters, newCluster))
    } finally {
      // This must happen sync. We cannot await the promise above, or we will be too late.
      this._startingCount--
    }
  }

  finish(element: Element = document.body): void {
    for (let playingCluster of this._findPlayingClusters(element)) {
      u.remove(this._playingClusters, playingCluster)

      for (let playingElement of playingCluster) {
        this._emitFinishEvent(playingElement)
      }
    }
  }

  _findPlayingClusters(queryElement: Element): MotionCluster[] {
    return this._playingClusters.filter((cluster) => {
      return u.some(cluster, (clusterElement) => queryElement.contains(clusterElement))
    })
  }

  _emitFinishEvent(element: Element): Event {
    return emit(element, this.finishEvent, { log: false })
  }

  _resetProps(): void {
    this._startingCount = 0
    this._playingClusters = []
  }

  reset(): void {
    this.finish()
    this._resetProps()
  }
}
