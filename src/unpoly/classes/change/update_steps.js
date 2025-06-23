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

    this.renderResult = new up.RenderResult({
      layer: this._passRenderOptions.layer, // layer is looked up by FromContent#_expandIntoPlans()
      target: up.fragment.targetForSteps(this._steps), // returns ':none' for empty steps
      renderOptions: this._passRenderOptions,
    })

    if (!this._steps.length) {
      // When rendering nothing we still want to process { focus, scroll } options.
      this._handleFocus(null, this._noneOptions)
      this._handleScroll(null, this._noneOptions)
    } else {
      // We swap fragments in reverse order for two reasons:
      //
      // (1) Only the first step will process focus. Other steps may cause focus loss
      //     (when they're swapping a fragment with focus), causing an option like
      //     { focus: 'main-if-lost' } to not satisfy the "lost" condition.
      // (2) Only the first step will scroll. However other steps may change
      //     the viewport height through element insertions.
      this._steps.reverse()

      const motionEndPromises = this._steps.map((step) => this._executeStep(step))
      this.renderResult.finished = this._finish(motionEndPromises)
    }

    return this.renderResult
  }

  async _finish(motionEndPromises) {
    await Promise.all(motionEndPromises)

    // If our layer was closed while animations are running, don't finish
    // and reject with an up.AbortError.
    for (let step of this._steps) {
      this.abortWhenLayerClosed(step.layer)
    }

    // The RenderResult has not changed. We still updated the same target and fragments.
    // We only want to signal the time of the end of animations / DOM changes.
    return this.renderResult
  }

  _addToResult(fragment) {
    let newFragments = fragment.matches('up-wrapper') ? fragment.children : [fragment]

    // Since we're executing steps in reverse order we prepend the new fragment
    // to the beginning of the array. This way the elements will be in the order
    // that the user named them in their { target }.
    this.renderResult.fragments.unshift(...newFragments)
  }

  _executeStep(step) {
    switch (step.placement) {
      case 'swap': {
        let keepPlan = up.fragment.keepPlan(step)
        if (keepPlan) {
          // Since we're keeping the element that was requested to be swapped,
          // we won't be making changes to the DOM.

          this._handleFocus(step.oldElement, step)
          this._handleScroll(step.oldElement, step)

          // Don't add kept fragment to this.renderResult.

          return Promise.resolve()

        } else {
          // This needs to happen before up.script.clean() below.
          // Otherwise we would run destructors for elements we want to keep.
          this._preserveDescendantKeepables(step)

          // TODO: Don't suppport [up-keep] for direct children of <body>

          const parent = step.oldElement.parentNode

          const morphOptions = {
            ...step,
            beforeStart() {
              up.fragment.markAsDestroying(step.oldElement)
            },
            afterInsert: () => {
              // Restore keepable before finalizing. Finalizing will rewrite elements that DOMParser broke,
              // causing a keepPlans's newElement to point to a rewritten element that is now detached.
              // Hence we lose the original position of the keepable.
              this._restoreDescendantKeepables(step)

              this._welcomeElement(step.newElement, step)

              // Remove the .up-keeping classes and emit up:fragment:kept.
              this._finalizeDescendantKeepables(step)
            },
            beforeDetach: () => {
              // In the case of [up-keep] descendants, keepable elements have been replaced
              // with a clone in step.oldElement. However, since that clone was never compiled,
              // it does not have destructors registered. Hence we will not clean the clone
              // unnecessarily.
              up.script.clean(step.oldElement, { layer: step.layer })
            },
            afterDetach() {
              e.cleanJQuery()
              up.fragment.emitDestroyed(step.oldElement, { parent, log: false })
            },
            scrollNew: () => {
              this._handleFocus(step.newElement, step)
              this._handleScroll(step.newElement, step)
            }
          }

          return up.morph(
            step.oldElement,
            step.newElement,
            step.transition,
            morphOptions
          )
        }
      }
      case 'content': {
        let oldWrapper = e.wrapChildren(step.oldElement)
        // oldWrapper.appendTo(step.oldElement)
        let newWrapper = e.wrapChildren(step.newElement)

        let wrapperStep = {
          ...step,
          placement: 'swap',
          oldElement: oldWrapper,
          newElement: newWrapper,
          focus: false
        }

        return this._executeStep(wrapperStep).then(() => {
          e.unwrap(newWrapper)
          // Unwrapping may destroy focus, so we need to handle it again.
          // Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
          this._handleFocus(step.oldElement, step)
        })

      }
      case 'before':
      case 'after': {
        // We're either appending or prepending. No keepable elements must be honored.

        // Text nodes are wrapped in an <up-wrapper> container so we can
        // animate them and measure their position/size for scrolling.
        // This is not possible for container-less text nodes.
        let wrapper = e.wrapChildren(step.newElement)

        // Note that since we're prepending/appending instead of replacing,
        // newElement will not actually be inserted into the DOM, only its children.
        let position = step.placement === 'before' ? 'afterbegin' : 'beforeend'
        step.oldElement.insertAdjacentElement(position, wrapper)

        this._welcomeElement(wrapper, step)

        this._handleFocus(wrapper, step)

        // Reveal element that was being prepended/appended.
        // Since we will animate (not morph) it's OK to allow animation of scrolling
        // if options.scrollBehavior is given.
        this._handleScroll(wrapper, step)

        // Since we're adding content instead of replacing, we'll only
        // animate newElement instead of morphing between oldElement and newElement
        return up.animate(wrapper, step.transition, step).then(() => e.unwrap(wrapper))
      }
      default: {
        up.fail('Unknown placement: %o', step.placement)
      }
    }
  }

  _welcomeElement(element, step) {
    // Adopt CSP nonces and fix broken script tags
    this.responseDoc.finalizeElement(element)

    // Remember where the element came from to support up.reload(element).
    // TODO: Consider making setReloadAttrs() part of up.hello() options (would implicate move to up.fragment)
    this.setReloadAttrs(step)

    // Run macros and compilers. This also snapshots for [up-keep="same-html"].
    up.hello(element, step)

    this._addToResult(element)
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
    return scrolling.process(options.scroll)
  }

}
