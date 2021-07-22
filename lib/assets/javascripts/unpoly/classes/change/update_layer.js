/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.Change.UpdateLayer = class UpdateLayer extends up.Change.Addition {

  constructor(options) {
    this.executeStep = this.executeStep.bind(this);
    options = up.RenderOptions.finalize(options);
    super(options);
    this.layer = options.layer;
    this.target = options.target;
    this.placement = options.placement;
    this.context = options.context;
    this.parseSteps();
  }

  preflightProps() {
    // This will throw up.error.notApplicable() if { target } cannot
    // be found in { layer }.
    this.matchPreflight();

    return {
      layer: this.layer,
      mode: this.layer.mode,
      context: u.merge(this.layer.context, this.context),
      target: this.bestPreflightSelector(),
    };
  }

  bestPreflightSelector() {
    this.matchPreflight();

    return u.map(this.steps, 'selector').join(', ') || ':none';
  }

  execute(responseDoc) {
    // For each step, find a step.alternative that matches in both the current page
    // and the response document.
    this.responseDoc = responseDoc;
    this.matchPostflight();

    // Don't log @target since that does not include hungry elements
    up.puts('up.render()', `Updating \"${this.bestPreflightSelector()}\" in ${this.layer}`);

    this.options.title = this.improveHistoryValue(this.options.title, this.responseDoc.getTitle());

    // Make sure only the first step will have scroll-related options.
    this.setScrollAndFocusOptions();

    if (this.options.saveScroll) {
      up.viewport.saveScroll({ layer: this.layer });
    }

    if (this.options.peel) {
      this.layer.peel();
    }
      // Layer#peel() will manipulate the stack sync.
      // We don't wait for the peeling animation to finish.

    u.assign(this.layer.context, this.context);

    if (this.options.history === 'auto') {
      this.options.history = this.hasAutoHistory();
    }

    // Change history before compilation, so new fragments see the new location.
    if (this.options.history) {
      this.layer.updateHistory(this.options); // layer location changed event soll hier nicht mehr fliegen
    }

    // The server may trigger multiple signals that may cause the layer to close:
    //
    // - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    // - Event an event with X-Up-Events, to which a listener may close the layer
    // - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    //   will close the layer.
    //
    // Note that @handleLayerChangeRequests() also throws an up.error.aborted
    // if any of these options cause the layer to close.
    this.handleLayerChangeRequests();

    const swapPromises = this.steps.map(this.executeStep);

    Promise.all(swapPromises).then(() => {
      this.abortWhenLayerClosed();

      // Run callback for callers that need to know when animations are done.
      return this.onFinished();
    });

    // Don't wait for animations to finish.
    return new up.RenderResult({
      layer: this.layer,
      fragments: u.map(this.steps, 'newElement')
    });
  }

  executeStep(step) {
    // Remember where the element came from to support up.reload(element).
    let keepPlan;
    this.setSource(step);

    switch (step.placement) {
      case 'swap':
        if (keepPlan = this.findKeepPlan(step)) {
          // Since we're keeping the element that was requested to be swapped,
          // there is nothing left to do here, except notify event listeners.
          up.fragment.emitKept(keepPlan);

          this.handleFocus(step.oldElement, step);
          return this.handleScroll(step.oldElement, step);

        } else {
          // This needs to happen before up.syntax.clean() below.
          // Otherwise we would run destructors for elements we want to keep.
          this.transferKeepableElements(step);

          const parent = step.oldElement.parentNode;

          const morphOptions = u.merge(step, {
            beforeStart() {
              return up.fragment.markAsDestroying(step.oldElement);
            },
            afterInsert: () => {
              this.responseDoc.finalizeElement(step.newElement);
              return up.hello(step.newElement, step);
            },
            beforeDetach: () => {
              return up.syntax.clean(step.oldElement, { layer: this.layer });
            },
            afterDetach() {
              e.remove(step.oldElement); // clean up jQuery data
              return up.fragment.emitDestroyed(step.oldElement, {parent, log: false});
            },
            scrollNew: () => {
              this.handleFocus(step.newElement, step);
              // up.morph() expects { scrollNew } to return a promise.
              return this.handleScroll(step.newElement, step);
            }
          }
          );

          return up.morph(
            step.oldElement,
            step.newElement,
            step.transition,
            morphOptions
          );
        }

      case 'content':
        var oldWrapper = e.wrapChildren(step.oldElement);
        // oldWrapper.appendTo(step.oldElement)
        var newWrapper = e.wrapChildren(step.newElement);

        var wrapperStep = u.merge(step, {
          placement: 'swap',
          oldElement: oldWrapper,
          newElement: newWrapper,
          focus: false
        }
        );
        var promise = this.executeStep(wrapperStep);

        promise = promise.then(() => {
          e.unwrap(newWrapper);
          // Unwrapping will destroy focus, so we need to handle it again.
          return this.handleFocus(step.oldElement, step);
        });

        return promise;

      case 'before': case 'after':
        // We're either appending or prepending. No keepable elements must be honored.

        // Text nodes are wrapped in an <up-wrapper> container so we can
        // animate them and measure their position/size for scrolling.
        // This is not possible for container-less text nodes.
        var wrapper = e.wrapChildren(step.newElement);

        // Note that since we're prepending/appending instead of replacing,
        // newElement will not actually be inserted into the DOM, only its children.
        var position = step.placement === 'before' ? 'afterbegin' : 'beforeend';
        step.oldElement.insertAdjacentElement(position, wrapper);

        this.responseDoc.finalizeElement(wrapper);
        up.hello(wrapper, step);

        this.handleFocus(wrapper, step);

        // Reveal element that was being prepended/appended.
        // Since we will animate (not morph) it's OK to allow animation of scrolling
        // if options.scrollBehavior is given.
        promise = this.handleScroll(wrapper, step);

        // Since we're adding content instead of replacing, we'll only
        // animate newElement instead of morphing between oldElement and newElement
        promise = promise.then(() => up.animate(wrapper, step.transition, step));

        // Remove the wrapper now that is has served it purpose
        promise = promise.then(() => e.unwrap(wrapper));

        return promise;

      default:
        return up.fail('Unknown placement: %o', step.placement);
    }
  }

  // Returns a object detailling a keep operation iff the given element is [up-keep] and
  // we can find a matching partner in newElement. Otherwise returns undefined.
  //
  // @param {Element} options.oldElement
  // @param {Element} options.newElement
  // @param {boolean} options.keep
  // @param {boolean} options.descendantsOnly
  findKeepPlan(options) {
    // Going back in history uses keep: false
    let partnerSelector;
    if (!options.keep) { return; }

    const { oldElement, newElement } = options;

    // We support these attribute forms:
    //
    // - up-keep             => match element itself
    // - up-keep="true"      => match element itself
    // - up-keep="false"     => don't keep
    // - up-keep=".selector" => match .selector
    if (partnerSelector = e.booleanOrStringAttr(oldElement, 'up-keep')) {
      let partner;
      if (partnerSelector === true) {
        partnerSelector = '&';
      }

      const lookupOpts = { layer: this.layer, origin: oldElement };

      if (options.descendantsOnly) {
        partner = up.fragment.get(newElement, partnerSelector, lookupOpts);
      } else {
        partner = up.fragment.subtree(newElement, partnerSelector, lookupOpts)[0];
      }

      if (partner && e.matches(partner, '[up-keep]')) {
        const plan = {
          oldElement, // the element that should be kept
          newElement: partner, // the element that would have replaced it but now does not
          newData: up.syntax.data(partner) // the parsed up-data attribute of the element we will discard
        };

        if (!up.fragment.emitKeep(plan).defaultPrevented) {
          return plan;
        }
      }
    }
  }

  // This will find all [up-keep] descendants in oldElement, overwrite their partner
  // element in newElement and leave a visually identical clone in oldElement for a later transition.
  // Returns an array of keepPlans.
  transferKeepableElements(step) {
    const keepPlans = [];
    if (step.keep) {
      for (let keepable of step.oldElement.querySelectorAll('[up-keep]')) {
        var plan;
        if (plan = this.findKeepPlan(u.merge(step, {oldElement: keepable, descendantsOnly: true}))) {
          // plan.oldElement is now keepable

          // Replace keepable with its clone so it looks good in a transition between
          // oldElement and newElement. Note that keepable will still point to the same element
          // after the replacement, which is now detached.
          const keepableClone = keepable.cloneNode(true);
          e.replace(keepable, keepableClone);

          // Since we're going to swap the entire oldElement and newElement containers afterwards,
          // replace the matching element with keepable so it will eventually return to the DOM.
          e.replace(plan.newElement, keepable);
          keepPlans.push(plan);
        }
      }
    }

    return step.keepPlans = keepPlans;
  }

  parseSteps() {
    this.steps = [];

    // up.fragment.expandTargets() was already called by up.Change.FromContent
    return (() => {
      const result = [];
      for (var simpleTarget of u.splitValues(this.target, ',')) {
        if (simpleTarget !== ':none') {
          const expressionParts = simpleTarget.match(/^(.+?)(?:\:(before|after))?$/) ||
            (() => { throw up.error.invalidSelector(simpleTarget); })();

          // Each step inherits all options of this change.
          const step = u.merge(this.options, {
            selector: expressionParts[1],
            placement: expressionParts[2] || this.placement || 'swap'
          }
          );

          result.push(this.steps.push(step));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  matchPreflight() {
    if (this.matchedPreflight) { return; }

    for (let step of this.steps) {
      const finder = new up.FragmentFinder(step);
      // Try to find fragments matching step.selector within step.layer.
      // Note that step.oldElement might already have been set by @parseSteps().
      if (!step.oldElement) { step.oldElement = finder.find() || (() => { throw this.notApplicable(`Could not find element \"${this.target}\" in current page`); })(); }
    }

    this.resolveOldNesting();

    return this.matchedPreflight = true;
  }

  matchPostflight() {
    if (this.matchedPostflight) { return; }

    this.matchPreflight();

    for (let step of this.steps) {
      // The responseDoc has no layers.
      step.newElement = this.responseDoc.select(step.selector) ||
        (() => { throw this.notApplicable(`Could not find element \"${this.target}\" in server response`); })();
    }

    // Only when we have a match in the required selectors, we
    // append the optional steps for [up-hungry] elements.
    if (this.options.hungry) {
      this.addHungrySteps();
    }

//    # Remove steps when their oldElement is nested inside the oldElement
//    # of another step.
    this.resolveOldNesting();

    return this.matchedPostflight = true;
  }

  addHungrySteps() {
    // Find all [up-hungry] fragments within @layer
    const hungries = up.fragment.all(up.radio.hungrySelector(), this.options);
    return (() => {
      const result = [];
      for (let oldElement of hungries) {
        var newElement;
        const selector = up.fragment.toTarget(oldElement);
        if (newElement = this.responseDoc.select(selector)) {
          const transition = e.booleanOrStringAttr(oldElement, 'transition');
          result.push(this.steps.push({ selector, oldElement, newElement, transition, placement: 'swap' }));
        } else {
          result.push(undefined);
        }
      }
      return result;
    })();
  }

  containedByRivalStep(steps, candidateStep) {
    return u.some(steps, rivalStep => (rivalStep !== candidateStep) &&
      ((rivalStep.placement === 'swap') || (rivalStep.placement === 'content')) &&
      rivalStep.oldElement.contains(candidateStep.oldElement));
  }

  resolveOldNesting() {
    let compressed = u.uniqBy(this.steps, 'oldElement');
    compressed = u.reject(compressed, step => this.containedByRivalStep(compressed, step));
    return this.steps = compressed;
  }

  setScrollAndFocusOptions() {
    return this.steps.forEach((step, i) => {
      // Since up.motion will call @handleScrollAndFocus() after each fragment,
      // and we only have a single scroll position and focus, only scroll/focus  for the first step.
      if (i > 0) {
        step.scroll = false;
        step.focus = false;
      }

      if ((step.placement === 'swap') || (step.placement === 'content')) {
        // We cannot animate scrolling when we're morphing between two elements.
        step.scrollBehavior = 'auto';

        // Store the focused element's selector, scroll position and selection range in an up.FocusCapsule
        // for later restoration.
        //
        // We might need to preserve focus in a fragment that is not the first step.
        // However, only a single step can include the focused element, or none.
        return this.focusCapsule != null ? this.focusCapsule : (this.focusCapsule = up.FocusCapsule.preserveWithin(step.oldElement));
      }
    });
  }

  handleFocus(fragment, step) {
    const fragmentFocus = new up.FragmentFocus(u.merge(step, {
      fragment,
      layer: this.layer,
      focusCapsule: this.focusCapsule,
      autoMeans: up.fragment.config.autoFocus,
    }));
    return fragmentFocus.process(step.focus);
  }

  handleScroll(fragment, step) {
    const scrolling = new up.FragmentScrolling(u.merge(step, {
      fragment,
      layer: this.layer,
      autoMeans: up.fragment.config.autoScroll
    }));
    return scrolling.process(step.scroll);
  }

  hasAutoHistory() {
    const oldFragments = u.map(this.steps, 'oldElement');
    return u.some(oldFragments, oldFragment => up.fragment.hasAutoHistory(oldFragment));
  }
};
