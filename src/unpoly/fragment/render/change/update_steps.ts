import * as u from '../../../util.js'
import * as e from '../../../element.js'
import { fail } from '../../../error.js'
import {
  emitFragmentDestroyed, emitFragmentKept, findKeepPlan, fragmentConfig, markFragmentAsDestroying,
  type KeepPlan, type RenderStep,
} from '../../../fragment.js'
import { animate, swap } from '../../../motion.js'
import { block, clean, hello } from '../../../script.js'
import { getViewportSubtree } from '../../../viewport.js'
import { Addition } from './addition.js'
import { FragmentFocus } from '../fragment_focus.js'
import { FragmentScrolling } from '../fragment_scrolling.js'
import { type ResolvedRenderOptions } from '../render_options.js'
import { type PartialRenderResult } from '../render_result.js'
import { type ResponseDoc } from '../response_doc.js'

/**
What inserting a render step produced, and what remains to be done after all steps were inserted.
@internal
*/
export interface StepInsertion {
  fragments: Element[]
  focusElement?: HTMLElement
  scrollElement?: HTMLElement
  // Compiles the new elements.
  welcome: () => any
  // Starts the transition or animation.
  startMotion?: () => Promise<any>
}

// Swaps the steps' old elements with their new elements. Used by UpdateLayer and OpenLayer.
export class UpdateSteps extends Addition {
  declare _steps: RenderStep[]
  declare _noneOptions: ResolvedRenderOptions
  declare responseDoc: ResponseDoc

  constructor(options: ResolvedRenderOptions & { steps: RenderStep[], noneOptions?: ResolvedRenderOptions }) {
    super(options)

    this._steps = u.copy(u.assert(options.steps)) // we mutate it below
    this._noneOptions = options.noneOptions || {}
  }

  execute(responseDoc: ResponseDoc): PartialRenderResult[] {
    this.responseDoc = responseDoc

    // Fill in `step.newElement` unless it was already done by our caller.
    // This may throw up.CannotMatch for non-optional steps that don't match in `responseDoc`.
    this._steps = responseDoc.selectSteps(this._steps)

    // Now that we know our steps will succeed, we detach them from `responseDoc`.
    // This way they won't be moved by hungry elements later.
    this._steps = responseDoc.commitSteps(this._steps)

    return [
      this._executeSteps(),
      this._assertLayersAlive(),
    ]
  }

  _executeSteps(): PartialRenderResult {
    if (this._steps.length) {
      // (1) Insert all new fragments, in target order (hungry steps last).
      let insertions = this._steps.map((step) => this._insertStep(step))

      return {
        fragments: u.flatMap(insertions, 'fragments'),
        finished: this._completeSteps(insertions),
      }
    } else {
      return this._executeNoSteps()
    }
  }

  // Runs synchronously up to the `await`, so all phases happen in the same task.
  // Being async, an exception here rejects `finished` but not `up.render()`.
  async _completeSteps(insertions: StepInsertion[]): Promise<void> {
    // (2) Compile all new fragments, in target order. Compilers see all fragments of this pass.
    let welcomed = insertions.map((insertion) => insertion.welcome())

    // (3) Focus and scroll after all fragments were inserted and compiled. This way
    //     { focus: 'main-if-lost' } sees focus lost in any fragment, and we scroll with the final layout.
    //     Only the first step has focus and scroll options, except { scroll: 'keep' }.
    this._steps.forEach((step, i) => {
      this._handleFocus(insertions[i].focusElement, step)
      this._handleScroll(insertions[i].scrollElement, step)
    })

    // (4) Start transitions and animations, remove old elements, unwrap wrappers.
    let motions = insertions.map((insertion) => insertion.startMotion?.())

    await Promise.all([...welcomed, ...motions])
  }

  _assertLayersAlive(): PartialRenderResult {
    return {
      verifyFinished: () => {
        // If our layer was closed while animations are running, don't finish
        // and reject with an up.Aborted error.
        for (let step of this._steps) {
          step.layer.assertAlive()
        }
      }
    }
  }

  _insertStep(step: RenderStep): StepInsertion {
    switch (step.placement) {
      case 'swap': {
        let keepPlan = findKeepPlan(step)
        if (keepPlan) {
          return this._insertKeepEverythingStep(step, keepPlan)
        } else {
          return this._insertSwapStep(step)
        }
      }
      case 'content': {
        return this._insertSwapChildrenStep(step)
      }
      case 'before':
      case 'after': {
        return this._insertChildrenStep(step)
      }
      default: {
        fail('Unknown placement: %o', step.placement)
      }
    }
  }

  _executeNoSteps(): PartialRenderResult {
    this._handleFocus(null, this._noneOptions)
    this._handleScroll(null, this._noneOptions)

    return {}
  }

  _insertKeepEverythingStep(step: RenderStep, keepPlan: KeepPlan): StepInsertion {
    // Nothing to mutate in the DOM.
    return {
      fragments: [],
      focusElement: step.oldElement,
      scrollElement: step.oldElement,
      welcome: () => emitFragmentKept(keepPlan),
    }
  }

  _insertSwapStep(step: RenderStep): StepInsertion {
    const parent = step.parentElement ?? step.oldElement.parentNode

    markFragmentAsDestroying(step.oldElement)

    // This needs to happen before up.script.clean() below.
    // Otherwise we would run destructors for elements we want to keep.
    this._preserveDescendantKeepables(step)

    // up.motion decides when the old element leaves the DOM: now, or after the transition.
    // We tell it what to do at that moment. Everything else happens in our phases (see the returned object).
    let startMotion = swap(step.oldElement, step.newElement, step.transition, {
      ...step,
      beforeRemove: () => {
        clean(step.oldElement, { layer: step.layer })
      },
      afterRemove: () => {
        emitFragmentDestroyed(step.oldElement, { parent, log: false })
        step.afterRemove?.()
      }
    })

    // Restore keepable before finalizing. Finalizing will rewrite elements that DOMParser broke,
    // causing a keepPlans's newElement to point to a rewritten element that is now detached.
    // Hence we lose the original position of the keepable.
    this._restoreDescendantKeepables(step)

    return {
      fragments: [step.newElement],
      focusElement: step.newElement,
      scrollElement: step.newElement,
      welcome: () => {
        let compilePromise = this._welcomeElement(step.newElement, step)

        // Remove the .up-keeping classes and emit up:fragment:kept.
        this._finalizeDescendantKeepables(step)

        return compilePromise
      },
      startMotion,
    }
  }

  _insertSwapChildrenStep(step: RenderStep): StepInsertion {
    // Make a copy since it's a live HTMLCollection, and we're going to move these elements.
    let newChildren = [...step.newElement.children]

    let oldWrapper = e.wrapChildren(step.oldElement)
    let newWrapper = e.wrapChildren(step.newElement)

    let wrapperInsertion = this._insertSwapStep({
      ...step,
      placement: 'swap',
      parentElement: step.oldElement.parentNode, // TODO: Test that we get up:fragment:destroyed on the parent, not the wrapper.
      oldElement: oldWrapper,
      newElement: newWrapper,
      // Unwrapping preserves focus.
      afterRemove: () => e.unwrap(newWrapper),
    })

    return {
      ...wrapperInsertion,
      fragments: newChildren,
      // Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
      focusElement: step.oldElement,
    }
  }

  _insertChildrenStep(step: RenderStep): StepInsertion {
    // Make a copy since it's a live HTMLCollection, and we're going to move these elements.
    let newChildren = [...step.newElement.children]

    // We're either appending or prepending. No keepable elements must be honored.

    // Text nodes are wrapped in an <up-wrapper> container so we can
    // animate them and measure their position/size for scrolling.
    // This is not possible for container-less text nodes.
    let wrapper = e.wrapChildren(step.newElement)

    // Note that since we're prepending/appending instead of replacing,
    // newElement will not actually be inserted into the DOM, only its children.
    let position: InsertPosition = step.placement === 'before' ? 'afterbegin' : 'beforeend'
    step.oldElement.insertAdjacentElement(position, wrapper)

    return {
      fragments: newChildren,
      // (A) We never inserted step.newElement, only its children.
      // (B) We focus the first new element child. If it's all text nodes, we focus step.oldElement.
      // (C) Unwrapping preserves focus.
      focusElement: e.leadingElement(wrapper.childNodes) as HTMLElement || step.oldElement,
      // Reveal the element that was being prepended/appended.
      scrollElement: wrapper,
      welcome: () => this._welcomeElement(wrapper, step),
      startMotion: () => animate(wrapper, step.animation, { ...step, onFinished: () => e.unwrap(wrapper) }),
    }
  }

  _welcomeElement(element: Element, step: RenderStep): Promise<Element> {
    // Adopt CSP nonces and fix broken script tags
    this.responseDoc.finalizeElement(element)

    // Set [up-source], [up-etag], [up-time] from request/response.
    this.setReloadAttrs(step)

    // Run macros and compilers. This also snapshots for [up-keep="same-html"].
    return hello(element, step)
  }

  // This will find all [up-keep] descendants in oldElement, overwrite their partner
  // element in newElement and leave a visually identical clone in oldElement for a later transition.
  // Returns an array of keepPlans.
  _preserveDescendantKeepables(step: RenderStep): void {
    const descendantKeepPlans: KeepPlan[] = []

    if (step.keep) {
      for (let keepable of step.oldElement.querySelectorAll('[up-keep]')) {
        let keepPlan = findKeepPlan({ ...step, oldElement: keepable, descendantsOnly: true })
        if (keepPlan) {
          // Replace keepable with its clone so it looks good in a transition
          // between oldElement and newElement.
          const keepableClone = keepable.cloneNode(true) as Element
          keepable.insertAdjacentElement('beforebegin', keepableClone)

          // Mark the original keepable to up.ResponseDoc#finalizeElement() knows to skip it.
          keepable.classList.add('up-keeping')

          // When the newElement from the response has a response, it will be inserted
          // into the DOM during the transition. Only at the end it will be replaced by the keepable.
          // To prevent the execution of these placeholder-scripts, we change their { type }.
          block(keepPlan.newElement)

          // Attaching a viewport to another element will cause it to lose
          // its scroll position, even if both parents are in the same document.
          let viewports = getViewportSubtree(keepPlan.oldElement)
          keepPlan.revivers = u.map(viewports, function(viewport) {
            let cursorProps = e.copyCursorProps(viewport)
            return () => e.copyCursorProps(cursorProps, viewport)
          })

          if (this._willChangeBody()) {
            // Since we're going to swap the entire oldElement and newElement containers afterwards,
            // replace the matching element with keepable so it will eventually return to the DOM.
            keepPlan.newElement.replaceWith(keepable)
          } else {
            // If keepable is a media element, detaching it (or attaching it to another document) would cause it
            // to lose playback state. To avoid this we temporarily move the keepable (keepPlan.oldElement)
            // so it can remain attached while we swap fragment versions. We will move it to its place within
            // the new fragment version once the swap is complete.
            document.body.append(keepable)
          }

          // // Since we're going to swap the entire oldElement and newElement containers afterwards,
          // // replace the matching element with keepable so it will eventually return to the DOM.
          // keepPlan.newElement.replaceWith(keepable)
          descendantKeepPlans.push(keepPlan)
        }
      }
    }

    step.descendantKeepPlans = descendantKeepPlans
  }

  _restoreDescendantKeepables(step: RenderStep): void {
    for (let keepPlan of step.descendantKeepPlans) {
      // Now that we know the final destination of { newElement }, we can replace it with the keepable.
      keepPlan.newElement.replaceWith(keepPlan.oldElement)

      for (let reviver of keepPlan.revivers) {
        reviver()
      }
    }
  }

  _finalizeDescendantKeepables(step: RenderStep): void {
    for (let keepPlan of step.descendantKeepPlans) {
      keepPlan.oldElement.classList.remove('up-keeping')
      emitFragmentKept(keepPlan)
    }
  }

  // Legacy apps might e.g. replace the <body> and an element in the <head>.
  // In that case we cannot use the body as "safe harbor" to remporarily move
  // [up-keep] elements.
  _willChangeBody(): boolean {
    return u.some(this._steps, (step) => step.oldElement.matches('body'))
  }

  _handleFocus(fragment: HTMLElement | null, options: ResolvedRenderOptions): void {
    const fragmentFocus = new FragmentFocus({
      ...options,
      fragment,
      autoMeans: fragmentConfig.autoFocus,
    })
    fragmentFocus.process(options.focus)
  }

  _handleScroll(fragment: HTMLElement | null, options: ResolvedRenderOptions): void {
    const scrolling = new FragmentScrolling({
      ...options,
      fragment,
      autoMeans: fragmentConfig.autoScroll
    })
    scrolling.process(options.scrollMap ?? options.scroll)
  }

}
