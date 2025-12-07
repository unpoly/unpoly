const u = up.util
const e = up.element

up.Change.UpdateSteps = class UpdateSteps extends up.Change.Addition {

  constructor(options) {
    super(options)

    this._steps = u.copy(u.assert(options.steps)) // we mutate it below
    this._passRenderOptions = u.assert(options.passRenderOptions)
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

    // returns ':none' for empty steps
    let targetForSteps = up.fragment.targetForSteps(this._steps)

    // Group compilation and emission of up:fragment:inserted into a mutation block.
    // This allows up.SelectorTracker to only sync once after the mutation, and
    // ignore any events in between.
    return up.fragment.mutate(() => {
      let results
      if (this._steps.length) {
        // We swap fragments in reverse order for two reasons:
        //
        // (1) Only the first step will process focus. Other steps may cause focus loss
        //     (when they're swapping a fragment with focus), causing an option like
        //     { focus: 'main-if-lost' } to not satisfy the "lost" condition.
        // (2) Only the first step will scroll. However other steps may change
        //     the viewport height through element insertions.

        // TODO: Once we implemented the phased render engine, we should no longer need to reverse steps.
        this._steps.reverse()
        results = this._steps.map((step) => this._executeStep(step))
      } else {
        results = [this._executeNoSteps()]
      }

      let renderResult = new up.RenderResult({
        layer: this._passRenderOptions.layer, // layer is looked up by FromContent#_expandIntoPlans()
        target: targetForSteps,
        renderOptions: this._passRenderOptions,
        fragments: u.flatMap(results.toReversed(), 'newFragments'), // Since we reversed steps, restore fragment order
      })

      renderResult.finished = this._finish(u.map(results, 'postprocess'), renderResult)

      return renderResult
    })
  }

  async _finish(postprocessFns, renderResult) {
    let postprocessPromises = postprocessFns.map((fn) => fn())

    await Promise.all(postprocessPromises)

    // If our layer was closed while animations are running, don't finish
    // and reject with an up.AbortError.
    for (let step of this._steps) {
      this.ensureLayerAlive(step.layer)
    }

    // The RenderResult has not changed. We still updated the same target and fragments.
    // We only want to signal the time of the end of animations / DOM changes.
    return renderResult
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

    return {
      newFragments: [],
      postprocess: u.asyncNoop
    }
  }

  // _willStepMorph(step) {
  //   return up.motion.willAnimate(step.oldElement, step.transition, step)
  // }

  _executeKeepEverythingStep(step, keepPlan) {
    if (!keepPlan) return

    // Nothing to do

    return {
      // Don't add kept fragment to this.renderResult.
      newFragments: [],
      postprocess: async () => {
        up.fragment.emitKept(keepPlan)

        this._handleFocus(step.oldElement, step)
        this._handleScroll(step.oldElement, step)
      }
    }
  }

  // _executeSimpleSwapStep(step) {
  //   const parent = step.parentElement ?? step.oldElement.parentNode
  //
  //   this._preserveDescendantKeepables(step)
  //   e.cleanJQuery(step.oldElement)
  //   up.script.clean(step.oldElement, { layer: step.layer })
  //   step.oldElement.replaceWith(step.newElement)
  //
  //   this._restoreDescendantKeepables(step)
  //
  //   up.fragment.emitDestroyed(step.oldElement, { parent, log: false })
  //
  //   return {
  //     newFragments: [step.newElement],
  //
  //     // TODO: It would be more clearer to have syncPostprocess() and asyncPostprocess() separately
  //
  //     async postprocess() {
  //       let compilePromise = this._welcomeElement(step.newElement, step)
  //
  //       // Remove the .up-keeping classes and emit up:fragment:kept.
  //       this._finalizeDescendantKeepables(step)
  //
  //       this._handleFocus(step.newElement, step)
  //       this._handleScroll(step.newElement, step)
  //
  //       await compilePromise
  //     }
  //   }
  // }
  //
  // _executeMorphingSwapStep(step) {
  //   const parent = step.parentElement ?? step.oldElement.parentNode
  //   const oldRect = step.oldElement
  //
  //   up.fragment.markAsDestroying(step.oldElement)
  //
  //   // This needs to happen before up.script.clean() below.
  //   // Otherwise we would run destructors for elements we want to keep.
  //   this._preserveDescendantKeepables(step)
  //   e.insertBefore(step.oldElement, step.newElement)
  //   this._restoreDescendantKeepables(step)
  //
  //   return {
  //     newFragments: [step.newElement],
  //     async postprocess() {
  //       // TODO: welcomeElement currently tracks up.hello promises. Can we do this here?
  //       let compilePromise = this._welcomeElement(step.newElement, step)
  //
  //       // Remove the .up-keeping classes and emit up:fragment:kept.
  //       this._finalizeDescendantKeepables(step)
  //
  //       await up.morph(step.oldElement, step.newElement, step.transition, {
  //         ...step,
  //         oldRect,
  //         scrollNew: () => {
  //           this._handleFocus(step.newElement, step)
  //           this._handleScroll(step.newElement, step)
  //         }
  //       })
  //
  //       e.cleanJQuery(step.oldElement) // TODO: Can this be part of up.script.clean()?
  //       up.script.clean(step.oldElement, { layer: step.layer })
  //       up.fragment.emitDestroyed(step.oldElement, { parent, log: false })
  //
  //       await compilePromise
  //     }
  //   }
  // }

  _executeSwapStep(step) {
    const parent = step.parentElement ?? step.oldElement.parentNode
    // const oldRect = step.oldElement

    up.fragment.markAsDestroying(step.oldElement)

    // This needs to happen before up.script.clean() below.
    // Otherwise we would run destructors for elements we want to keep.
    this._preserveDescendantKeepables(step)
    const morphPhases = up.motion.phasedMorph(step.oldElement, step.newElement, step.transition, {
      ...step,
      // oldRect,
      scrollNew: () => {
        console.debug("[_executeSwapStep] scrollNew handles focus on element %o with opt", step.newElement, step.focus)
        this._handleFocus(step.newElement, step)
        this._handleScroll(step.newElement, step)
      },
      beforeRemove: () => {
        up.script.clean(step.oldElement, { layer: step.layer })
      },
      afterRemove: () => {
        e.cleanJQuery(step.oldElement) // TODO: Can this be part of up.script.clean()?
        up.fragment.emitDestroyed(step.oldElement, { parent, log: false })
        step.afterRemove?.()
      }
    })

    this._restoreDescendantKeepables(step)

    return {
      newFragments: [step.newElement],
      postprocess: async () => {
        console.debug("[_executeSwapStep] postprocess newElement %o", step.newElement)
        // TODO: welcomeElement currently tracks up.hello promises. Can we do this here?
        let compilePromise = this._welcomeElement(step.newElement, step)

        // Remove the .up-keeping classes and emit up:fragment:kept.
        this._finalizeDescendantKeepables(step)

        await morphPhases.postprocess()

        await compilePromise
      }
    }
  }

  _executeSwapChildrenStep(step) {
    // Make a copy since it's a live HTMLCollection, and we're going to move these elements.
    let newChildren = [...step.newElement.children]

    let oldWrapper = e.wrapChildren(step.oldElement)
    let newWrapper = e.wrapChildren(step.newElement)

    let wrapperStep = {
      ...step,
      placement: 'swap',
      parentElement: step.oldElement.parentNode, // TODO: Test that we get up:fragment:destroyed on the parent, not the wrapper.
      oldElement: oldWrapper,
      newElement: newWrapper,
      focus: false,
      afterRemove: () => {
        e.unwrap(newWrapper)

        // (A) Unwrapping may destroy focus, so we need to handle it again.
        // (B) Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
        // (B improved) TODO: Handle focus for the first new fragment, if it's an element
        this._handleFocus(step.oldElement, step)
      }
    }

    let wrapperResults = this._executeSwapStep(wrapperStep)

    return {
      newFragments: newChildren,
      postprocess: wrapperResults.postprocess,
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

    return {
      newFragments: newChildren,
      postprocess: async () => {
        let compilePromise = this._welcomeElement(wrapper, step)

        this._handleFocus(wrapper, step)

        // Reveal element that was being prepended/appended.
        // Since we will animate (not morph) it's OK to allow animation of scrolling
        // if options.scrollBehavior is given.
        this._handleScroll(wrapper, step)

        await up.animate(wrapper, step.animation, step)
        e.unwrap(wrapper)

        // (A) Unwrapping may destroy focus, so we need to handle it again.
        // (B) Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
        // (B improved) TODO: Handle focus for the first new fragment, if it's an element
        this._handleFocus(step.oldElement, step)

        await compilePromise
      }
    }
  }

  async _welcomeElement(element, step) {
    console.debug("[_welcomeElement] %o", element)

    // Adopt CSP nonces and fix broken script tags
    this.responseDoc.finalizeElement(element)

    // Remember where the element came from to support up.reload(element).
    // TODO: Consider making setReloadAttrs() part of up.hello() options (would implicate move to up.fragment)
    this.setReloadAttrs(step)

    // Run macros and compilers. This also snapshots for [up-keep="same-html"].
    await up.hello(element, step)
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
