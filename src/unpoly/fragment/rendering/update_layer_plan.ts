import * as u from '../../util.js'
import * as e from '../../element.js'
import { CannotMatch, CannotTarget } from '../../error.js'
import {
  abortFragment, compressNestedSteps, hasAutoHistory, parseTargetSteps,
} from '../../fragment.js'
import { historyOptions } from '../../history.js'
import { type PeelOptions } from '../../layer.js'
import { printToStandard } from '../../log.js'
import { FocusCapsule, getScrollTops, saveFocus, saveScroll } from '../../viewport.js'
import type * as t from '../types.js'
import { findFragment } from '../matching/fragment_finder.js'
import { LayerPlan } from './layer_plan.js'
import { updateSteps } from './update_steps.js'
import { finalizeRenderOptions } from './render_options.js'
import { type ResponseDoc } from './response_doc.js'

export class UpdateLayerPlan extends LayerPlan {
  declare options: t.ResolvedRenderOptions
  declare _context?: u.PlainObject
  declare _steps: t.RenderStep[]

  constructor(options: t.ResolvedRenderOptions) {
    options = finalizeRenderOptions(options)
    super(options)
    // renderFromContent() passes the layer and an expanded target.
    this.layer = options.layer!
    this.target = options.target!
    this._context = options.context
    // up.fragment.expandTargets() was already called by renderFromContent()
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

  _renderOwnLayer(responseDoc: ResponseDoc): t.PartialRenderResult[] {
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

    // The server may close the layer, or a listener to a server-sent event may close it.
    // Both throw up.Aborted, so we don't insert content into a closed layer.
    this.closeIfRequested(u.map(this._steps, 'newElement'), this._getNewLocation())
    this.emitServerEvents()

    // Change history before compilation, so new fragments see the new location.
    this.layer.updateHistory(this._getEffectiveHistoryOptions())

    return updateSteps(responseDoc, this._steps, this.options)
  }

  _matchPreflight(): void {
    this._matchOldElements()
    this._compressNestedSteps()
  }

  match(responseDoc: ResponseDoc): void {
    // (1) For each step, find a `step.newElement` that matches both in this.layer
    //     and in the response document.
    // (2) Match newElements here instead of relying on updateSteps() to
    //     do it later. This way we will throw up.CannotMatch early, and our caller
    //     renderFromContent() knows that this plan is not applicable. It can then
    //     try a fallback plan.
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
      // Try to find fragments matching step.selector within step.layer.
      // Note that step.oldElement might already have been set by up.radio.hungrySteps().
      step.oldElement ||= findFragment(u.pick(step, ['selector', 'origin', 'layer', 'match', 'preferOldElements'] as const))
      if (step.oldElement === e.getRoot()) throw new CannotTarget('Cannot swap <html>')

      if (step.oldElement) {
        return true
      } else if (!step.maybe) {
        // An error message will be chosen by renderFromContent()
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
    })
  }

}
