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

  get params() {
    return this.request.params
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
    let [element, attrs] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setAttrsTemp(element, attrs))
  }

  addClass(...args) {
    let [element, klass] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.addClassTemp(element, klass))
  }

  removeClass(...args) {
    let [element, klass] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.removeClassTemp(element, klass))
  }

  setStyle(...args) {
    let [element, styles] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setStyleTemp(element, styles))
  }

  disable(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(up.form.disable(element))
  }

  insert(...args) {
    let [reference, position = 'beforeend', newElement] = this._parseMutatorArgs(args, 'val', u.isAdjacentPosition, 'val')
    this.undo(up.fragment.insertTemp(reference, position, newElement))
  }

  show(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.showTemp(element))
  }

  hide(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.hideTemp(element))
  }

  hideContent(...args) {
    let [parent] = this._parseMutatorArgs(args, 'val')
    let wrapper = e.wrapChildren(parent)
    e.hide(wrapper)
    this.undo(() => e.unwrap(wrapper))
  }

  showSkeleton(...args) {
    let [parent, skeletonReference] = this._parseMutatorArgs(args, 'val', 'val')
    let skeleton = up.feedback.buildSkeleton(skeletonReference, this.origin)

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

  _parseMutatorArgs(args, ...specs) {
    let [element, ...rest] = u.args(args, ...specs)
    // (1) up.fragment.get(undefined) returns undefined
    // (2) up.fragment.get(Element) returns the element
    // (3) this.fragment is undefined when opening a new layer
    element = up.fragment.get(element, { layer: this.layer }) || this.fragment
    return [element, ...rest]
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
