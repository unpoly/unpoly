import * as u from '../../util.js'
import * as e from '../../element.js'
import { fail } from '../../error.js'
import {
  emitFragmentDestroyed, emitFragmentKept, findKeepPlan, fragmentConfig, markFragmentAsDestroying,
  setReloadAttrs,
} from '../../fragment.js'
import { type Layer } from '../../layer.js'
import { animate, swap } from '../../motion.js'
import { block, clean, hello } from '../../script.js'
import { getViewportSubtree } from '../../viewport.js'
import type * as t from '../types.js'
import { FragmentFocus } from './fragment_focus.js'
import { FragmentScrolling } from './fragment_scrolling.js'
import { type ResponseDoc } from './response_doc.js'

// What inserting a render step produced, and what remains to be done after all steps were inserted.
interface StepInsertion {
  fragments: Element[]
  focusElement: HTMLElement
  scrollElement: HTMLElement
  // Compiles the new elements.
  welcome: (responseDoc: ResponseDoc) => any
  // Starts the transition or animation.
  startMotion?: () => Promise<any>
}

// A step that we can insert: it has a layer, an old element and a new element.
interface MatchedStep extends t.RenderStep {
  layer: Layer
  oldElement: HTMLElement
  newElement: HTMLElement
}

// Swaps the steps' old elements with their new elements. Used by UpdateLayerPlan, and by LayerPlan
// for the other layers. When there are no steps, we focus and scroll with { noneOptions }.
export function updateSteps(responseDoc: ResponseDoc, steps: t.RenderStep[], noneOptions: t.ResolvedRenderOptions = {}): t.PartialRenderResult[] {
  // Our callers pass steps for a layer, with a matched old element. We match the new elements
  // below, before anything reads them.
  let matchedSteps = steps as MatchedStep[]

  // Fill in `step.newElement` unless it was already done by our caller.
  // This may throw up.CannotMatch for non-optional steps that don't match in `responseDoc`.
  matchedSteps = responseDoc.selectSteps(matchedSteps)

  // Now that we know our steps will succeed, we detach them from `responseDoc`.
  // This way they won't be moved by hungry elements later.
  matchedSteps = responseDoc.commitSteps(matchedSteps)

  return [
    executeSteps(responseDoc, matchedSteps, noneOptions),
    assertLayersAlive(matchedSteps),
  ]
}

function executeSteps(responseDoc: ResponseDoc, steps: MatchedStep[], noneOptions: t.ResolvedRenderOptions): t.PartialRenderResult {
  if (steps.length) {
    // Legacy apps might e.g. replace the <body> and an element in the <head>.
    // In that case we cannot use the body as "safe harbor" to temporarily move
    // [up-keep] elements.
    let willChangeBody = u.some(steps, (step) => step.oldElement.matches('body'))

    // (1) Insert all new fragments, in target order (hungry steps last).
    let insertions = steps.map((step) => insertStep(step, willChangeBody))

    return {
      fragments: u.flatMap(insertions, 'fragments'),
      finished: completeSteps(responseDoc, steps, insertions),
    }
  } else {
    return executeNoSteps(noneOptions)
  }
}

// Runs synchronously up to the `await`, so all phases happen in the same task.
// Being async, an exception here rejects `finished` but not `up.render()`.
async function completeSteps(responseDoc: ResponseDoc, steps: MatchedStep[], insertions: StepInsertion[]): Promise<void> {
  // (2) Compile all new fragments, in target order. Compilers see all fragments of this pass.
  let welcomed = insertions.map((insertion) => insertion.welcome(responseDoc))

  // (3) Focus and scroll after all fragments were inserted and compiled. This way
  //     { focus: 'main-if-lost' } sees focus lost in any fragment, and we scroll with the final layout.
  //     Only the first step has focus and scroll options, except { scroll: 'keep' }.
  steps.forEach((step, i) => {
    handleFocus(insertions[i].focusElement, step)
    handleScroll(insertions[i].scrollElement, step)
  })

  // (4) Start transitions and animations, remove old elements, unwrap wrappers.
  let motions = insertions.map((insertion) => insertion.startMotion?.())

  await Promise.all([...welcomed, ...motions])
}

function assertLayersAlive(steps: MatchedStep[]): t.PartialRenderResult {
  return {
    verifyFinished: () => {
      // If our layer was closed while animations are running, don't finish
      // and reject with an up.Aborted error.
      for (let step of steps) {
        step.layer.assertAlive()
      }
    }
  }
}

function insertStep(step: MatchedStep, willChangeBody: boolean): StepInsertion {
  switch (step.placement) {
    case 'swap': {
      let keepPlan = findKeepPlan(step)
      if (keepPlan) {
        return insertKeepEverythingStep(step, keepPlan)
      } else {
        return insertSwapStep(step, willChangeBody)
      }
    }
    case 'content': {
      return insertSwapChildrenStep(step, willChangeBody)
    }
    case 'before':
    case 'after': {
      return insertChildrenStep(step)
    }
    default: {
      fail('Unknown placement: %o', step.placement)
    }
  }
}

function executeNoSteps(noneOptions: t.ResolvedRenderOptions): t.PartialRenderResult {
  handleFocus(null, noneOptions)
  handleScroll(null, noneOptions)

  return {}
}

function insertKeepEverythingStep(step: MatchedStep, keepPlan: t.KeepPlan): StepInsertion {
  // Nothing to mutate in the DOM.
  return {
    fragments: [],
    focusElement: step.oldElement,
    scrollElement: step.oldElement,
    welcome: () => emitFragmentKept(keepPlan),
  }
}

function insertSwapStep(step: MatchedStep, willChangeBody: boolean): StepInsertion {
  const parent = step.parentElement ?? step.oldElement.parentNode

  markFragmentAsDestroying(step.oldElement)

  // This needs to happen before up.script.clean() below.
  // Otherwise we would run destructors for elements we want to keep.
  preserveDescendantKeepables(step, willChangeBody)

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
  restoreDescendantKeepables(step)

  return {
    fragments: [step.newElement],
    focusElement: step.newElement,
    scrollElement: step.newElement,
    welcome: (responseDoc) => {
      let compilePromise = welcomeElement(step.newElement, step, responseDoc)

      // Remove the .up-keeping classes and emit up:fragment:kept.
      finalizeDescendantKeepables(step)

      return compilePromise
    },
    startMotion,
  }
}

function insertSwapChildrenStep(step: MatchedStep, willChangeBody: boolean): StepInsertion {
  // Make a copy since it's a live HTMLCollection, and we're going to move these elements.
  let newChildren = [...step.newElement.children]

  let oldWrapper = e.wrapChildren(step.oldElement)
  let newWrapper = e.wrapChildren(step.newElement)

  let wrapperInsertion = insertSwapStep({
    ...step,
    placement: 'swap',
    parentElement: step.oldElement.parentNode, // TODO: Test that we get up:fragment:destroyed on the parent, not the wrapper.
    oldElement: oldWrapper,
    newElement: newWrapper,
    // Unwrapping preserves focus.
    afterRemove: () => e.unwrap(newWrapper),
  }, willChangeBody)

  return {
    ...wrapperInsertion,
    fragments: newChildren,
    // Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
    focusElement: step.oldElement,
  }
}

function insertChildrenStep(step: MatchedStep): StepInsertion {
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
    welcome: (responseDoc) => welcomeElement(wrapper, step, responseDoc),
    startMotion: () => animate(wrapper, step.animation, { ...step, onFinished: () => e.unwrap(wrapper) }),
  }
}

function welcomeElement(element: Element, step: MatchedStep, responseDoc: ResponseDoc): Promise<Element> {
  // Adopt CSP nonces and fix broken script tags
  responseDoc.finalizeElement(element)

  // Set [up-source], [up-etag], [up-time] from request/response.
  setReloadAttrs(step)

  // Run macros and compilers. This also snapshots for [up-keep="same-html"].
  return hello(element, step)
}

// This will find all [up-keep] descendants in oldElement, overwrite their partner
// element in newElement and leave a visually identical clone in oldElement for a later transition.
// Returns an array of keepPlans.
function preserveDescendantKeepables(step: MatchedStep, willChangeBody: boolean): void {
  const descendantKeepPlans: t.KeepPlan[] = []

  if (step.keep) {
    for (let keepable of step.oldElement.querySelectorAll<HTMLElement>('[up-keep]')) {
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

        if (willChangeBody) {
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

function restoreDescendantKeepables(step: MatchedStep): void {
  // preserveDescendantKeepables() has set the keep plans, and the revivers of each plan.
  for (let keepPlan of step.descendantKeepPlans!) {
    // Now that we know the final destination of { newElement }, we can replace it with the keepable.
    keepPlan.newElement.replaceWith(keepPlan.oldElement)

    for (let reviver of keepPlan.revivers!) {
      reviver()
    }
  }
}

function finalizeDescendantKeepables(step: MatchedStep): void {
  // preserveDescendantKeepables() has set the keep plans.
  for (let keepPlan of step.descendantKeepPlans!) {
    keepPlan.oldElement.classList.remove('up-keeping')
    emitFragmentKept(keepPlan)
  }
}

function handleFocus(fragment: HTMLElement | null, options: t.ResolvedRenderOptions): void {
  const fragmentFocus = new FragmentFocus({
    ...options,
    fragment,
    autoMeans: fragmentConfig.autoFocus,
  })
  fragmentFocus.process(options.focus)
}

function handleScroll(fragment: HTMLElement | null, options: t.ResolvedRenderOptions): void {
  const scrolling = new FragmentScrolling({
    ...options,
    fragment,
    autoMeans: fragmentConfig.autoScroll
  })
  scrolling.process(options.scrollMap ?? options.scroll)
}
