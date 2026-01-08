const u = up.util
const e = up.element

up.Change.UpdateSteps = class UpdateSteps extends up.Change.Addition {

  constructor(options) {
    super(options)

    this._steps = u.copy(u.assert(options.steps)) // we mutate it below
    this._noneOptions = options.noneOptions || {}
  }

  execute(responseDoc) {
    this.responseDoc = responseDoc

    // Fill in `step.newElement` unless it was already done by our caller.
    // This may throw up.CannotMatch for non-optional steps that don't match in `responseDoc`.
    this._steps = responseDoc.selectSteps(this._steps)

    // Now that we know our steps will succeed, we detach them from `responseDoc`.
    // This way they won't be moved by hungry elements later.
    this._steps = responseDoc.commitSteps(this._steps)

    return [
      ...this._executeSteps(),
      this._assertLayersAlive(),
    ]
  }

  _executeSteps() {
    if (this._steps.length) {
      // We swap fragments in reverse order for several reasons:
      //
      // (1) Only the first step will process focus. Other steps may cause focus loss
      //     (when they're swapping a fragment with focus), causing an option like
      //     { focus: 'main-if-lost' } to not satisfy the "lost" condition.
      // (2) Only the first step will scroll. However other steps may change
      //     the viewport height through element insertions.
      return this._steps.toReversed().map((step) => this._executeStep(step)).toReversed()
    } else {
      return this._executeNoSteps()
    }
  }

  _assertLayersAlive() {
    return {
      verifyFinished: () => {
        // If our layer was closed while animations are running, don't finish
        // and reject with an up.AbortError.
        for (let step of this._steps) {
          step.layer.assertAlive()
        }
      }
    }
  }

  _executeStep(step) {
    switch (step.placement) {
      case 'swap': {
        let keepPlan = up.fragment.keepPlan(step)
        if (keepPlan) {
          return this._executeKeepEverythingStep(step, keepPlan)
        }  else {
          return this._executeSwapStep(step)
        }
      }
      case 'content': {
        return this._executeSwapChildrenStep(step)
      }
      case 'before':
      case 'after': {
        return this._executeInsertChildrenStep(step)
      }
      default: {
        up.fail('Unknown placement: %o', step.placement)
      }
    }
  }

  _executeNoSteps() {
    this._handleFocus(null, this._noneOptions)
    this._handleScroll(null, this._noneOptions)

    return [{}]
  }

  _executeKeepEverythingStep(step, keepPlan) {
    if (!keepPlan) return

    // Nothing to mutate in the DOM.

    up.fragment.emitKept(keepPlan)

    this._handleFocus(step.oldElement, step)
    this._handleScroll(step.oldElement, step)

    return {}
  }

  _executeSwapStep(step) {
    const parent = step.parentElement ?? step.oldElement.parentNode

    up.fragment.markAsDestroying(step.oldElement)

    // This needs to happen before up.script.clean() below.
    // Otherwise we would run destructors for elements we want to keep.
    this._preserveDescendantKeepables(step)

    let compilePromise

    let morphPromise = up.motion.morph(step.oldElement, step.newElement, step.transition, {
      ...step,
      afterInsert: () => {
        // Restore keepable before finalizing. Finalizing will rewrite elements that DOMParser broke,
        // causing a keepPlans's newElement to point to a rewritten element that is now detached.
        // Hence we lose the original position of the keepable.
        this._restoreDescendantKeepables(step)

        compilePromise = this._welcomeElement(step.newElement, step)

        // Remove the .up-keeping classes and emit up:fragment:kept.
        this._finalizeDescendantKeepables(step)

        this._handleFocus(step.newElement, step)
        this._handleScroll(step.newElement, step)
      },
      beforeRemove: () => {
        up.script.clean(step.oldElement, { layer: step.layer })
      },
      afterRemove: () => {
        up.fragment.emitDestroyed(step.oldElement, { parent, log: false })
        step.afterRemove?.()
      }
    })

    return {
      fragments: [step.newElement],
      finished: Promise.all([morphPromise, compilePromise]),
    }
  }

  _executeSwapChildrenStep(step) {
    // Make a copy since it's a live HTMLCollection, and we're going to move these elements.
    let newChildren = [...step.newElement.children]

    let oldWrapper = e.wrapChildren(step.oldElement)
    let newWrapper = e.wrapChildren(step.newElement)

    let wrapperResult = this._executeSwapStep({
      ...step,
      placement: 'swap',
      parentElement: step.oldElement.parentNode, // TODO: Test that we get up:fragment:destroyed on the parent, not the wrapper.
      oldElement: oldWrapper,
      newElement: newWrapper,
      focus: false, // We will need to handle focus after unwrapping below.
      afterRemove: () => {
        e.unwrap(newWrapper)

        // (A) Unwrapping may destroy focus, so we need to handle it again.
        // (B) Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
        this._handleFocus(step.oldElement, step)
      }
    })

    return {
      fragments: newChildren,
      finished: wrapperResult.finished,
    }
  }

  _executeInsertChildrenStep(step) {
    // Make a copy since it's a live HTMLCollection, and we're going to move these elements.
    let newChildren = [...step.newElement.children]

    // We're either appending or prepending. No keepable elements must be honored.

    // Text nodes are wrapped in an <up-wrapper> container so we can
    // animate them and measure their position/size for scrolling.
    // This is not possible for container-less text nodes.
    let wrapper = e.wrapChildren(step.newElement)

    // Note that since we're prepending/appending instead of replacing,
    // newElement will not actually be inserted into the DOM, only its children.
    let position = step.placement === 'before' ? 'afterbegin' : 'beforeend'
    step.oldElement.insertAdjacentElement(position, wrapper)

    // Start compilation in the sync phase of postprocessing.
    let compilePromise = this._welcomeElement(wrapper, step)

    // Reveal the element that was being prepended/appended.
    // Since we will animate (not morph) it's OK to allow animation of scrolling with { scrollBehavior }.
    this._handleScroll(wrapper, step)

    let animatePromise = up.animate(wrapper, step.animation, {
      ...step,
      onFinished: () => {
        e.unwrap(wrapper)

        // (A) Unwrapping may destroy focus, so we need to handle it again.
        // (B) We never inserted step.newElement, only its children.
        // (C) We focus the first new element child. If it's all text nodes, we focus step.oldElement.
        const focusElement = e.leadingElement(step.oldElement.childNodes) || step.oldElement
        this._handleFocus(focusElement, step)
      }
    })

    return {
      fragments: newChildren,
      finished: Promise.all([compilePromise, animatePromise]),
    }
  }

  _welcomeElement(element, step) {
    // Adopt CSP nonces and fix broken script tags
    this.responseDoc.finalizeElement(element)

    // Set [up-source], [up-etag], [up-time] from request/response.
    this.setReloadAttrs(step)

    // Run macros and compilers. This also snapshots for [up-keep="same-html"].
    return up.hello(element, step)
  }

  // This will find all [up-keep] descendants in oldElement, overwrite their partner
  // element in newElement and leave a visually identical clone in oldElement for a later transition.
  // Returns an array of keepPlans.
  _preserveDescendantKeepables(step) {
    const descendantKeepPlans = []

    if (step.keep) {
      for (let keepable of step.oldElement.querySelectorAll('[up-keep]')) {
        let keepPlan = up.fragment.keepPlan({ ...step, oldElement: keepable, descendantsOnly: true })
        if (keepPlan) {
          // Replace keepable with its clone so it looks good in a transition
          // between oldElement and newElement.
          const keepableClone = keepable.cloneNode(true)
          keepable.insertAdjacentElement('beforebegin', keepableClone)

          // Mark the original keepable to up.ResponseDoc#finalizeElement() knows to skip it.
          keepable.classList.add('up-keeping')

          // When the newElement from the response has a response, it will be inserted
          // into the DOM during the transition. Only at the end it will be replaced by the keepable.
          // To prevent the execution of these placeholder-scripts, we change their { type }.
          up.script.disableSubtree(keepPlan.newElement)

          // Attaching a viewport to another element will cause it to lose
          // its scroll position, even if both parents are in the same document.
          let viewports = up.viewport.subtree(keepPlan.oldElement)
          keepPlan.revivers = u.map(viewports, function(viewport) {
            let cursorProps = up.viewport.copyCursorProps(viewport)
            return () => up.viewport.copyCursorProps(cursorProps, viewport)
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

  _restoreDescendantKeepables(step) {
    for (let keepPlan of step.descendantKeepPlans) {
      // Now that we know the final destination of { newElement }, we can replace it with the keepable.
      keepPlan.newElement.replaceWith(keepPlan.oldElement)

      for (let reviver of keepPlan.revivers) {
        reviver()
      }
    }
  }

  _finalizeDescendantKeepables(step) {
    for (let keepPlan of step.descendantKeepPlans) {
      keepPlan.oldElement.classList.remove('up-keeping')
      up.fragment.emitKept(keepPlan)
    }
  }

  // Legacy apps might e.g. replace the <body> and an element in the <head>.
  // In that case we cannot use the body as "safe harbor" to remporarily move
  // [up-keep] elements.
  _willChangeBody() {
    return u.some(this._steps, (step) => step.oldElement.matches('body'))
  }

  _handleFocus(fragment, options) {
    const fragmentFocus = new up.FragmentFocus({
      ...options,
      fragment,
      autoMeans: up.fragment.config.autoFocus,
    })
    return fragmentFocus.process(options.focus)
  }

  _handleScroll(fragment, options) {
    const scrolling = new up.FragmentScrolling({
      ...options,
      fragment,
      autoMeans: up.fragment.config.autoScroll
    })
    return scrolling.processMap(options.scrollMap, options.scroll)
  }

}
