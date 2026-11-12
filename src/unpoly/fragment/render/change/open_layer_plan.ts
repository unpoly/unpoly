import * as u from '../../../util.js'
import { CannotMatch } from '../../../error.js'
import { assertEmitted } from '../../../event.js'
import { getSmart, hasAutoHistory, setReloadAttrs } from '../../../fragment.js'
import { historyOptions } from '../../../history.js'
import {
  buildLayer, layerStack, type Layer, type Overlay, type PeelOptions,
} from '../../../layer.js'
import { printToStandard } from '../../../log.js'
import { hungrySteps, type HungrySteps } from '../../../radio.js'
import { hello } from '../../../script.js'
import type * as t from '../../types.js'
import { LayerPlan } from './layer_plan.js'
import { UpdateSteps } from './update_steps.js'
import { FragmentFocus } from '../fragment_focus.js'
import { FragmentScrolling } from '../fragment_scrolling.js'
import { RenderOptions } from '../render_options.js'
import { RenderResult } from '../render_result.js'
import { type ResponseDoc } from '../response_doc.js'

export class OpenLayerPlan extends LayerPlan {
  declare layer: Overlay
  declare target: string
  declare _origin?: Element
  declare _baseLayer: Layer
  // Set by _matchPostflight(), which throws when there is no content.
  declare _content: HTMLElement

  // ChangeFromContent has turned { target } into a selector string.
  constructor(options: t.RenderOptions & { target: string }) {
    super(options)
    this.target = options.target
    this._origin = options.origin
    // normalizeLayerOptions() always sets a { baseLayer }.
    this._baseLayer = options.baseLayer!
    // Don't extract too many @properties from @options, since listeners
    // to up:layer:open may modify layer options.
  }

  getPreflightProps(): t.PreflightProps {
    // We assume that the server will respond with our target.
    // Hence this change will always be applicable.

    return {
      // normalizeLayerOptions() sets a { mode } for { layer: 'new' }.
      mode: this.options.mode!,
      context: this._buildLayer().context,
      origin: this.options.origin,

      // The target will always exist in the current page, since
      // we're opening a new layer that will match the target.
      target: this.target,

      // We associate this request to our base layer so up:request events may be emitted on something
      // more specific than the document. This will also abort this request when
      // `up.fragment.abort({ layer })` is called for the base layer.
      bindLayer: this._baseLayer,
      layer: 'new',

      // We associate this request with the base layer's main element. This way the request
      // will be aborted if the base layer receives a major navigation, but not when a
      // minor fragment is updated.
      bindFragments: u.compact([getSmart(':main', { layer: this._baseLayer })]),
      fragments: [],
    }
  }

  execute(responseDoc: ResponseDoc, onApplicable: () => void): RenderResult {
    // Find our target in the responseDoc.
    // If it cannot be matched, up.CannotMatch is thrown and ChangeFromContent will try the next plan.
    this._matchPostflight(responseDoc)

    // If our steps can be matched, ChangeFromContent wants a chance to some final
    // preparations before we start rendering.
    onApplicable()

    // Create the overlay elements, but don't render content yet.
    // This sets this.layer.
    this._createOverlay()

    // If our layer ends up being closed during rendering, we still want to render
    // [up-hungry][up-if-layer=any] elements on other layers.
    let renderOtherLayersOnce = u.memoize(() => this._renderOtherLayers(responseDoc))
    let unbindClosing = this.layer.on('up:layer:accepting up:layer:dismissing', renderOtherLayersOnce)

    try {
      let partialResults = [
        this._renderOverlayContent(responseDoc),
        ...renderOtherLayersOnce(),
      ]

      return new RenderResult({
        layer: this.layer,
        target: this.target,
        renderOptions: this.options,
        partialResults,
      })
    } finally {
      unbindClosing()
    }
  }

  _matchPostflight(responseDoc: ResponseDoc): void {
    if (this.target === ':none') {
      this._content = document.createElement('up-none')
    } else {
      // We throw below when nothing matches.
      this._content = responseDoc.select(this.target)!
    }

    if (!this._content || !this._baseLayer.isAlive()) {
      // An error message will be chosen by ChangeFromContent
      throw new CannotMatch()
    }
  }

  _createOverlay(): void {
    printToStandard('up.render()', `Opening element "${this.target}" in new overlay`)

    this._assertOpenEventEmitted()

    this.layer = this._buildLayer()

    // (1) Make sure that the baseLayer layer doesn't already have a child layer.
    //     This cannot be prevented with { peel: false }, as the layer stack must be a sequence,
    //     not a tree.
    //
    // (2) Only restore the base layer's history if the new overlay does not add one of its own.
    //     Otherwise we would add an intermediate history entries when swapping overlays
    //     with { layer: 'swap' } (issue #397).
    //
    // (3) Layer#peel() dismisses for any intent other than 'accept', including { peel: true } and { peel: false }.
    this._baseLayer.peel({ history: !this.layer.history, intent: this.options.peel as PeelOptions['intent'] })

    // (1) The parent's saved history will be restored when this new overlay is closed.
    // (2) Save the parent's history as long as it is the topmost layer in the stack,
    //     otherwise parent.showsLiveHistory(aspect) becomes false for every aspect.
    this._baseLayer.saveHistory()

    // Don't wait for peeling to finish. Change the stack sync so there is no state
    // when the new overlay is scheduled to be pushed, but not yet in the stack.
    layerStack.layers.push(this.layer)

    this.layer.createElements()
    this.layer.setupHandlers()
  }

  _renderOverlayContent(responseDoc: ResponseDoc): t.PartialRenderResult {
    // The server may trigger multiple signals that may cause the overlay to close immediately:
    //
    // - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    // - Emit an event with X-Up-Events, to which a listener may close the layer
    // - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    //   will close the layer.
    //
    // Note that @handleLayerChangeRequests() also throws an up.Aborted error
    // if any of these options cause the layer to close.
    this.handleLayerChangeRequests([this._content], this._getNewLocation())

    // Preprocess content element before insertion.
    responseDoc.commitElement(this._content)

    // Only if handleLayerChangeRequests() does not abort, we insert the content in the overlay.
    // If it does abort we want to use the content for [up-hungry][up-if-layer=any] elements
    // on background layers.
    this.layer.setContent(this._content)

    // Adopt CSP nonces and fix broken script tags
    responseDoc.finalizeElement(this._content)

    // Change history before compilation, so new fragments see the new location.
    this._handleHistory()

    // Remember where the element came from to support up.reload(element).
    setReloadAttrs({ newElement: this._content, source: this.options.source })

    // Start compilation in the sync phase of postprocessing.
    let compilePromise = this._compileLayer()

    // A11Y: Place the focus on the overlay element and setup a focus circle.
    this._handleFocus()

    // Don't wait for the open animation to finish.
    // Otherwise a popup would start to open and only reveal itself after the animation.
    this._handleScroll()

    // Emit up:layer:opened to indicate that the layer was opened successfully.
    // This is a good time for listeners to manipulate the overlay optics.
    this.layer.state = 'opened'
    this._emitOpenedEvent()

    // In case a listener to up:layer:opened immediately dismisses the new layer,
    // reject the promise returned by up.layer.open().
    this.layer.assertAlive()

    let animatePromise = this.layer.startOpenAnimation()

    return {
      fragments: [this._content],
      finished: Promise.all([compilePromise, animatePromise]),
      verifyFinished: () => this.layer.assertAlive()
    }
  }

  _renderOtherLayers(responseDoc: ResponseDoc): t.PartialRenderResult[] {
    // We execute steps on other layers after this layer. However, if the render pass ends up
    // closing this layer (e.g. by reaching a close condition or X-Up-Accept-Layer), we execute them
    // before the layer closes (see execute()). This way we can:
    //
    // (1) ... use the discarded content for hungry elements on other layers that have [up-if-layer=any].
    // (2) ... see updated hungry elements on other layers in onDismissed/onAccepted handlers.
    let steps = this._getHungrySteps().other
    return new UpdateSteps({ steps }).execute(responseDoc)
  }

  async _compileLayer(): Promise<void> {
    // Compile the entire layer, not just the user content.
    // E.g. [up-dismiss] in the layer elements needs to go through a macro.
    await hello(this.layer.element, {
      ...this.options,
      layer: this.layer,
      dataRoot: this._content
    })
  }

  _buildLayer(): Overlay {
    const beforeNew = (optionsWithLayerDefaults: t.RenderOptions) => {
      return this.options = RenderOptions.finalize(optionsWithLayerDefaults)
    }

    return buildLayer(this.options, beforeNew) as Overlay
  }

  _handleHistory(): void {
    // If the layer is opened with { history } auto, the new overlay will from now
    // on have visible history *if* its initial fragment has auto-history.
    if (this.layer.history === 'auto') {
      this.layer.history = hasAutoHistory([this._content], this.layer)
    }

    // If an ancestor layer was opened with the wish to not affect history, this
    // child layer must not affect it either, regardless of its @history setting.
    this.layer.history &&= this._baseLayer.history

    // For the initial fragment insertion we always update its location, even if the layer
    // does not have visible history ({ history } attribute). This ensures that a
    // layer always has a #location.
    this.layer.updateHistory(this._getEffectiveHistoryOptions())
  }

  _handleFocus(): void {
    this._baseLayer.overlayFocus?.moveToBack()
    this.layer.overlayFocus.moveToFront()

    const fragmentFocus = new FragmentFocus({
      fragment: this._content,
      layer: this.layer,
      autoMeans: ['autofocus', 'layer'],
      inputDevice: this.options.inputDevice,
      focusVisible: this.options.focusVisible,
    })

    fragmentFocus.process(this.options.focus)
  }

  _handleScroll(): void {
    const scrollingOptions = {
      ...this.options,
      fragment: this._content,
      layer: this.layer,
      autoMeans: ['hash', 'layer']
    }
    const scrolling = new FragmentScrolling(scrollingOptions)
    scrolling.process(this.options.scrollMap ?? this.options.scroll)
  }

  _assertOpenEventEmitted(): void {
    // The initial up:layer:open event is emitted on the document, since the layer
    // element has not been attached yet and there is no obvious element it should
    // be emitted on. We don't want to emit it on @layer.parent.element since users
    // might confuse this with the event for @layer.parent itself opening.
    //
    // There is no { onOpen } or [up-on-open] handler to accompany the DOM event.
    assertEmitted('up:layer:open', {
      origin: this._origin,
      baseLayer: this._baseLayer, // sets up.layer.current
      layerOptions: this.options,
      log: "Opening new overlay"
    })
  }

  _emitOpenedEvent(): void {
    this.layer.emit('up:layer:opened', {
      origin: this._origin,
      callback: this.layer.callback('onOpened'),
      log: `Opened new ${this.layer}`
    }
    )
  }

  _getHungrySteps(): HungrySteps {
    return hungrySteps(this._getEffectiveRenderOptions())
  }

  _getEffectiveRenderOptions(): t.RenderOptions {
    return {
      ...this.options,
      layer: this.layer,
      history: this.layer.history,
    }
  }

  _getEffectiveHistoryOptions(): u.PlainObject {
    // For the initial fragment insertion we always update its location, even if the layer
    // does not have visible history ({ history } attribute). This ensures that a
    // layer always has a #location.
    return historyOptions(this.options)
  }

  _getNewLocation(): string | false | undefined {
    // { location: true } only makes sense with a response, and refineOption() replaces it with the response URL.
    return this._getEffectiveRenderOptions().location as string | false | undefined
  }

}
