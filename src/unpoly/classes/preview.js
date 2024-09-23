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
    let attrs = args.pop()
    let element = this._getElementArg(args[0])
    this.undo(e.setAttrsTemp(element, attrs))
  }

  addClass(...args) {
    let klass = args.pop()
    let element = this._getElementArg(args[0])
    this.undo(e.addClassTemp(element, klass))
  }

  setStyle(...args) {
    let styles = args.pop()
    let element = this._getElementArg(args[0])
    this.undo(e.setStyleTemp(element, styles))
  }

  disable(element) {
    element = this._getElementArg(element)
    this.undo(up.form.disable(element))
  }

  insert(...args) {
    let newElement = args.pop()
    let position = (/^(before|after)/.test(u.last(args))) ? args.pop() : null
    let reference = this._getElementArg(args[0])
    this.undo(up.fragment.insertTemp(reference, position, newElement))
  }

  show(element) {
    element = this._getElementArg(element)
    this.undo(e.showTemp(element))
  }

  hide(element) {
    element = this._getElementArg(element)
    this.undo(e.hideTemp(element))
  }

  hideContent(...args) {
    let parent = args.pop() || this.fragment
    let wrapper = e.wrapChildren(parent)
    e.hide(wrapper)
    this.undo(() => e.unwrap(wrapper))
  }

  showSkeleton(...args) {
    let skeletonReference = args.pop()
    let skeleton = up.feedback.buildSkeleton(skeletonReference, this.origin)
    let parent = this._getElementArg(args[0])

    up.puts('[up-skeleton]', 'Showing skeleton %o', skeletonReference)

    if (parent) {
      this._swapContent(parent, skeleton)
    } else if (this.layer === 'new') {
      this.openLayer(skeleton, { closeAnimation: false })
      // Now that the renderOptions have served as defaults for openLayer(),
      // we can disable animations for the upcoming render pass. This way
      // we don't see flickering when another overlay opens with the final content.
      this.renderOptions.openAnimation = false
    }
  }

  _getElementArg(arg) {
    // (1) up.fragment.get(undefined) returns undefined
    // (2) up.fragment.get(Element) returns the element
    // (3) this.fragment is undefined when opening a new layer
    return up.fragment.get(arg, { layer: this.layer }) || this.fragment
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
