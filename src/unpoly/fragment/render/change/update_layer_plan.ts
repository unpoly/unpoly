import * as u from '../../../util.js'
import * as e from '../../../element.js'
import { CannotMatch, CannotTarget } from '../../../error.js'
import {
  abortFragment, compressNestedSteps, hasAutoHistory, parseTargetSteps,
} from '../../../fragment.js'
import { historyOptions } from '../../../history.js'
import { type PeelOptions } from '../../../layer.js'
import { printToStandard } from '../../../log.js'
import { hungrySteps, type HungrySteps } from '../../../radio.js'
import { FocusCapsule, getScrollTops, saveFocus, saveScroll } from '../../../viewport.js'
import type * as t from '../../types.js'
import { FragmentFinder } from '../../fragment_finder.js'
import { LayerPlan } from './layer_plan.js'
import { UpdateSteps } from './update_steps.js'
import { RenderOptions } from '../render_options.js'
import { RenderResult } from '../render_result.js'
import { type ResponseDoc } from '../response_doc.js'

export class UpdateLayerPlan extends LayerPlan {
  declare options: t.ResolvedRenderOptions
  declare target: string
  declare _context?: u.PlainObject
  declare _steps: t.RenderStep[]

  constructor(options: t.ResolvedRenderOptions) {
    options = RenderOptions.finalize(options)
    super(options)
    // ChangeFromContent passes the layer and an expanded target.
    this.layer = options.layer!
    this.target = options.target!
    this._context = options.context
    // up.fragment.expandTargets() was already called by ChangeFromContent
    this._steps = parseTargetSteps(this.target, this.options)
    // this.uid = Math.random()
  }

  getPreflightProps(): t.PreflightProps {
    // This will throw up.CannotMatch if { target } cannot be found in { layer }.
    this._matchPreflight()

    let fragments = this._getFragments()

    return {
      layer: this.layer,
      bindLayer: this.layer,
      mode: this.layer.mode,
      context: u.merge(this.layer.context, this._context),
      origin: this.options.origin,
      target: this._bestPreflightSelector(),
      fragments,
      bindFragments: fragments,
    }
  }

  _bestPreflightSelector(): string {
    this._matchPreflight()

    const isProbable = (step: t.RenderStep) => !step.maybe || step.oldElement?.isConnected
    let bestSteps = this._steps.filter(isProbable)
    let selectors = u.map(bestSteps, 'selector')
    return selectors.join(', ') || ':none'
  }

  _getFragments(): Element[] {
    this._matchPreflight()

    return u.map(this._steps, 'oldElement')
  }

  execute(responseDoc: ResponseDoc, onApplicable: () => void): RenderResult {
    // (1) For each step, find a `step.newElement` that matches both in this.layer
    //     and in the response document.
    // (2) Match newElements here instead of relying on UpdateSteps to
    //     do it later. This way we will throw up.CannotMatch early, and our caller
    //     ChangeFromContent knows that this plan is not applicable. It can then
    //     try a fallback plan.
    this._matchPostflight(responseDoc)

    // If our steps can be matched, ChangeFromContent wants a chance to some final
    // preparations before we start rendering.
    onApplicable()

    // If our layer ends up being closed during rendering, we still want to render
    // [up-hungry][up-if-layer=any] elements on other layers.
    let renderOtherLayersOnce = u.memoize(() => this._renderOtherLayers(responseDoc))

    // TODO: Can this be a try ... catch ?
    let unbindClosing = this.layer.on('up:layer:accepting up:layer:dismissing', renderOtherLayersOnce)
    try {
      let partialResults = [
        ...this._renderCurrentLayer(responseDoc),
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

  _renderCurrentLayer(responseDoc: ResponseDoc): t.PartialRenderResult[] {
    if (this._steps.length) {
      // Don't log this.target since that does not include hungry elements
      printToStandard('up.render()', `Updating "${this._bestPreflightSelector()}" in ${this.layer}`)
    }

    // Make sure only the first step will have scroll-related options.
    this._coordinateSteps()

    if (this.options.saveScroll) {
      saveScroll({ layer: this.layer })
    }

    if (this.options.saveFocus) {
      // TODO: This creates the same up.FocusCapsule that we already built in _setScrollAndFocusOption()
      saveFocus({ layer: this.layer })
    }

    let { peel } = this.options
    if (peel) {
      // (1) Layer#peel() will manipulate the stack sync.
      //     We don't wait for the peeling animation to finish.
      //
      // (2) Closing a layer will also abort requests targeting that layer.
      //
      // (3) Only restore the base layer's history if the fragment update adds a
      //     history entry (issue #397).
      //
      // (4) Layer#peel() dismisses for any intent other than 'accept', including { peel: true }.
      this.layer.peel({ history: !this._hasHistory(), intent: peel as PeelOptions['intent'] })
    }

    // Unless the user has explicitly opted out of the default { abort: 'target' }
    // by passing { abort: false }, we abort pending requests targeting
    // the elements that we're about to remove.
    if (this.options.abort !== false) {
      abortFragment(this._getFragments(), {
        reason: 'Fragment is being replaced',
        jid: this.options.jid,
      })
    }

    // A key that the server sends with a null value is set to null, not deleted.
    // This is intentional: a null value may be meaningful, and there is no need to delete keys over the protocol.
    Object.assign(this.layer.context, this._context)

    // If the update causes the overlay to close, we don't want to render changes.
    //
    // The server may trigger multiple signals that may cause the layer to close:
    //
    // - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    // - Event an event with X-Up-Events, to which a listener may close the layer
    // - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    //   will close the layer.
    //
    // Note that @handleLayerChangeRequests() also throws an `up.Aborted` error
    // if any of these options cause the layer to close.
    this.handleLayerChangeRequests(
      u.map(this._steps, 'newElement'),
      this._getNewLocation(),
    )

    // Change history before compilation, so new fragments see the new location.
    this.layer.updateHistory(this._getEffectiveHistoryOptions())

    return new UpdateSteps({ steps: this._steps, noneOptions: this.options }).execute(responseDoc)
  }

  _renderOtherLayers(responseDoc: ResponseDoc): t.PartialRenderResult[] {
    // We execute steps on other layers after this layer. However, if the render pass ends up
    // closing this layer (e.g. by reaching a close condition or X-Up-Accept-Layer), we execute them
    // before the layer closes (see execute()). This way we can:
    //
    // (1) ... use the discarded content for hungry elements on other layers that have [up-if-layer=any].
    // (2) ... see updated hungry elements on other layers in onDismissed/onAccepted handlers.
    let otherLayerSteps = this._getHungrySteps().other

    return new UpdateSteps({ steps: otherLayerSteps }).execute(responseDoc)
  }

  _matchPreflight(): void {
    this._matchOldElements()
    this._compressNestedSteps()
  }

  _matchPostflight(responseDoc: ResponseDoc): void {
    this._matchOldElements()
    this._addHungryStepsOnCurrentLayer()
    this._compressNestedSteps()
    this._matchNewElements(responseDoc)
  }

  _addHungryStepsOnCurrentLayer(): void {
    this._steps.push(...this._getHungrySteps().current)
  }

  _matchOldElements(): void {
    this._steps = this._steps.filter((step) => {

      const finder = new FragmentFinder(u.pick(step, ['selector', 'origin', 'layer', 'match', 'preferOldElements'] as const))

      // Try to find fragments matching step.selector within step.layer.
      // Note that step.oldElement might already have been set by up.radio.hungrySteps().
      step.oldElement ||= finder.find()
      if (step.oldElement === e.getRoot()) throw new CannotTarget('Cannot swap <html>')

      if (step.oldElement) {
        return true
      } else if (!step.maybe) {
        // An error message will be chosen by ChangeFromContent
        throw new CannotMatch()
      }
    })
  }

  _matchNewElements(responseDoc: ResponseDoc): void {
    this._steps = responseDoc.selectSteps(this._steps)
  }

  _compressNestedSteps(): void {
    this._steps = compressNestedSteps(this._steps)
  }

  _getHungrySteps(): HungrySteps {
    // Find all [up-hungry] elements matching our layer and fragments.
    return hungrySteps(this._getEffectiveRenderOptions())
  }

  _coordinateSteps(): void {
    // Store the focused element's selector, scroll position and selection range
    // in an up.FocusCapsule for later restoration.
    let focusCapsule = FocusCapsule.preserve(this.layer)
    let oldScrollTops = getScrollTops({ layer: this.layer })

    this._steps.forEach((step, i) => {
      step.focusCapsule = focusCapsule
      step.oldScrollTops = oldScrollTops

      // A { scrollMap } option always overrides a { scroll } option.
      if (step.scrollMap) step.scroll = false

      // We only have a single scroll position and focus, so only scroll/focus for the first step.
      if (i > 0) {
        step.focus = false
        step.scrollMap = undefined
        // The only option we apply to all fragments is { scroll: 'keep' }.
        if (step.scroll !== 'keep') step.scroll = false

        // Data is only applied to the primary target.
        // To override data for secondary or hungry targets, use { dataMap }.
        step.data = undefined
      }
    })
  }

  _hasHistory(): boolean {
    return u.evalAutoOption(this.options.history, this._hasAutoHistory.bind(this))
  }

  _hasAutoHistory(): boolean {
    // We update the history with { history: 'auto' } when at least
    // one targeted fragment has auto-history.
    const oldFragments = u.map(this._steps, 'oldElement')
    return hasAutoHistory(oldFragments, this.layer)
  }

  _getNewLocation(): string | false | undefined {
    return this._getEffectiveHistoryOptions().location
  }

  _getEffectiveRenderOptions(): t.ResolvedRenderOptions {
    return {
      ...this.options,
      layer: this.layer,
      history: this._hasHistory(),
    }
  }

  _getEffectiveHistoryOptions(): u.PlainObject {
    if (this._hasHistory()) {
      return historyOptions(this.options)
    } else {
      return {}
    }
  }

  static {
    u.memoizeMethod(this.prototype, {
      _matchPreflight: true,
      _matchOldElements: true,
      _hasHistory: true,
      _getHungrySteps: true,
    })
  }

}
