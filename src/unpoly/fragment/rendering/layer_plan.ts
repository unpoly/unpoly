import * as u from '../../util.js'
import { emit, type EventPlan } from '../../event.js'
import { type Layer } from '../../layer.js'
import { type UpResponse } from '../../network.js'
import { type HungrySteps } from '../../radio.js'
import type * as t from '../types.js'
import { updateSteps } from './update_steps.js'
import { RenderResult } from './render_result.js'
import { type ResponseDoc } from './response_doc.js'

// A plan to add new content to a layer: by updating it (UpdateLayerPlan) or by opening it (OpenLayerPlan).
// renderFromContent() calls match() on its plans in order, then render() on the first one that matches the response.
export abstract class LayerPlan {
  declare options: t.RenderOptions

  // Set by subclasses.
  declare layer: Layer
  declare target: string
  declare _acceptLayer: any
  declare _dismissLayer: any
  declare _eventPlans: EventPlan[]
  declare _response?: UpResponse

  constructor(options: t.RenderOptions) {
    this.options = options
    this._acceptLayer = options.acceptLayer
    this._dismissLayer = options.dismissLayer
    this._eventPlans = options.eventPlans || []
    this._response = options.response
  }

  // The props that renderFromURL() needs to send a request, before we have a response.
  abstract getPreflightProps(): t.PreflightProps

  // Finds the new content in the response. Throws up.CannotMatch when it isn't there,
  // so renderFromContent() knows that this plan is not applicable, and can try the next plan.
  // Must not change the page, as a later plan may still render instead, and renderFromContent()
  // calls it outside of mutate(). (UpdateLayerPlan emits up:fragment:hungry here, whose
  // listeners decide whether a hungry element is updated.)
  abstract match(responseDoc: ResponseDoc): void

  // Renders the matched content into this.layer.
  abstract _renderOwnLayer(responseDoc: ResponseDoc): t.PartialRenderResult[]

  // The [up-hungry] steps for this render pass, on this.layer and on other layers.
  abstract _getHungrySteps(): HungrySteps

  // Renders the content that match() found. From here on the plan changes the page,
  // so any error propagates instead of trying the next plan.
  render(responseDoc: ResponseDoc): RenderResult {
    // OpenLayerPlan creates its overlay here, so this.layer is only set after this call.
    this._prepareLayer()

    // If our layer ends up being closed during rendering, we still want to render
    // [up-hungry][up-if-layer=any] elements on other layers.
    let renderOtherLayersOnce = u.memoize(() => this._renderOtherLayers(responseDoc))

    // TODO: Can this be a try ... catch ?
    let unbindClosing = this.layer.on('up:layer:accepting up:layer:dismissing', renderOtherLayersOnce)
    try {
      let partialResults = [
        ...this._renderOwnLayer(responseDoc),
        ...renderOtherLayersOnce(),
      ]

      return new RenderResult({
        target: this.target,
        layer: this.layer,
        renderOptions: this.options,
        partialResults,
      })
    } finally {
      unbindClosing()
    }
  }

  // Runs first in render(), before we listen to this.layer closing.
  _prepareLayer(): void {
  }

  _renderOtherLayers(responseDoc: ResponseDoc): t.PartialRenderResult[] {
    // We execute steps on other layers after this layer. However, if the render pass ends up
    // closing this layer (e.g. by reaching a close condition or X-Up-Accept-Layer), we execute them
    // before the layer closes (see render()). This way we can:
    //
    // (1) ... use the discarded content for hungry elements on other layers that have [up-if-layer=any].
    // (2) ... see updated hungry elements on other layers in onDismissed/onAccepted handlers.
    let steps = this._getHungrySteps().other
    return updateSteps(responseDoc, steps)
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
