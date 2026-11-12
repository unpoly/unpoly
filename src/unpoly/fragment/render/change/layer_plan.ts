import * as u from '../../../util.js'
import { emit, type EventPlan } from '../../../event.js'
import { type Layer } from '../../../layer.js'
import { type UpResponse } from '../../../network.js'
import type * as t from '../../types.js'
import { Change } from './change.js'

// A change that adds new content to a layer: by updating it (UpdateLayerPlan) or by opening it (OpenLayerPlan).
export class LayerPlan extends Change {
  // Set by subclasses.
  declare layer: Layer
  declare _acceptLayer: any
  declare _dismissLayer: any
  declare _eventPlans: EventPlan[]
  declare _response?: UpResponse

  constructor(options: t.RenderOptions) {
    super(options)
    this._acceptLayer = options.acceptLayer
    this._dismissLayer = options.dismissLayer
    this._eventPlans = options.eventPlans || []
    this._response = options.response
  }

  // TODO: Consider moving this to up.Layer
  // { location: true } only makes sense with a response, and refineOption() replaces it with the response URL.
  handleLayerChangeRequests(newElements: Element[], newLocation: string | false | undefined): void {
    if (this.layer.isOverlay()) {
      // TODO: Can we do this with "close"? Please recheck

      // The server may send an HTTP header `X-Up-Accept-Layer: value`
      this._tryAcceptLayerFromServer()
      this.layer.assertAlive()

      // A close condition { acceptLocation: '/path' } might have been
      // set when the layer was opened.
      this.layer.tryAcceptForLocation(newLocation, this._response)
      this.layer.assertAlive()

      this.layer.tryAcceptForElements(newElements, this._response)
      this.layer.assertAlive()

      // The server may send an HTTP header `X-Up-Dismiss-Layer: value`
      this._tryDismissLayerFromServer()
      this.layer.assertAlive()

      // A close condition { dismissLocation: '/path' } might have been
      // set when the layer was opened.
      this.layer.tryDismissForLocation(newLocation, this._response)
      this.layer.assertAlive()

      this.layer.tryDismissForElements(newElements, this._response)
      this.layer.assertAlive()
    }

    // On the server we support up.layer.emit('foo'), which sends:
    //
    //     X-Up-Events: [{ layer: 'current', type: 'foo'}]
    //
    // We must set the current layer to @layer so { layer: 'current' } will emit on
    // the layer that is being updated, instead of the front layer.
    //
    // A listener to such a server-sent event might also close the layer.
    this.layer.asCurrent(() => {
      for (let eventPlan of this._eventPlans) {
        emit({ ...eventPlan, response: this._response })
        this.layer.assertAlive()
      }
    })
  }

  _tryAcceptLayerFromServer(): void {
    // When accepting without a value, the server will send X-Up-Accept-Layer: null
    if (u.isDefined(this._acceptLayer)) {
      this.layer.accept(this._acceptLayer, { response: this._response })
    }
  }

  _tryDismissLayerFromServer(): void {
    // When dismissing without a value, the server will send X-Up-Dismiss-Layer: null
    if (u.isDefined(this._dismissLayer)) {
      this.layer.dismiss(this._dismissLayer, { response: this._response })
    }
  }

}
