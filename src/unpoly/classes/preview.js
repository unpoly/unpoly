const u = up.util
const e = up.element

/*-
The `up.Preview` class allows to describe revertible preview effects.

@class up.Preview
@parent up.feedback
*/
up.Preview = class Preview {

  /*-
  @constructor up.Preview
  @internal
  */
  constructor({ fragment, request, renderOptions, cleaner }) {
    this.fragment = fragment
    this.request = request
    this.renderOptions = renderOptions
    this._cleaner = cleaner
  }

  undo(...args) {
    this._cleaner.guard(...args)
  }

  get target() {
    return this.renderOptions.target
  }

  get origin() {
    return this.request.origin
  }

  get layer() {
    return this.renderOptions.resolvedLayers[0]
  }

  run(value) {
    for (let fn of up.feedback.resolvePreviewFns(value)) {
      this.undo(up.error.guard(fn, this))
    }
  }

  revert() {
    this._cleaner.clean()
  }

  setAttrs(...args) {
    this.undo(e.setAttrsTemp(...args))
  }

  addClass(...args) {
    this.undo(e.addClassTemp(...args))
  }

  setStyle(...args) {
    this.undo(e.setStyleTemp(...args))
  }

  disable(...args) {
    this.undo(up.form.disable(...args))
  }

  insert(...args) {
    this.undo(up.fragment.insertTemp(...args))
  }

  show(...args) {
    this.undo(e.showTemp(...args))
  }

  hide(...args) {
    this.undo(e.hideTemp(...args))
  }

  hideContent(parent) {
    let wrapper = e.wrapChildren(parent)
    e.hide(wrapper)
    this.undo(() => e.unwrap(wrapper))
  }

  showSkeleton(...args) {
    let skeletonReference = args.pop()
    let skeleton = up.feedback.buildSkeleton(skeletonReference)
    let explicitParent = args[0]

    up.puts('[up-skeleton]', 'Showing skeleton %o', skeletonReference)

    if (explicitParent) {
      // Look-up the parent in case we received a CSS selector.
      // If we received an Element, up.fragment.get() will return that unchanged.
      explicitParent = up.fragment.get(explicitParent, { layer: this.layer })
      this._swapContent(explicitParent, skeleton)
    } else if (this.layer === 'new') {
      this.openLayer(skeleton, { closeAnimation: false })
      // Now that the renderOptions have served as defaults for openLayer(),
      // we can disable animations for the upcoming render pass. This way
      // we don't see flickering when another overlay opens with the final content.
      this.renderOptions.openAnimation = false
    } else {
      this._swapContent(this.fragment, skeleton)
    }
  }

  _swapContent(parent, newContent) {
    this.hideContent(parent)
    this.insert(parent, newContent)
  }

  openLayer(content, options = {}) {
    let undoDismissValue = ':undo-preview'

    let onDismiss = ({ value }) => {
      // Abort the request when the user dismisses the overlay,
      // but not when we ourselves dismiss it when reverting.
      if (value !== undoDismissValue) this.request.abort({ reason: 'Preview overlay dismissed' })
    }

    up.layer.open({
      ...u.pick(this.renderOptions, [...up.Layer.Overlay.VISUAL_KEYS, 'target']),
      ...options,
      content,
      abort: false,
      onDismiss
    })

    // The new overlay is already in the stack. However, this function must be be sync and cannot
    // wait a microtask for (the fulfilled) up.layer.open() promise.
    let overlay = up.layer.front

    this.undo(() => overlay.dismiss(undoDismissValue, { preventable: false }))

    return overlay
  }


}
