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

  /*-
  TODO: Docs: Multi-fragment updates only preview the primary target

  @property up.Preview#fragment
  @stable
  */

  /*-
  TODO: Docs

  @property up.Preview#request
  @stable
  */

  /*-
  TODO: Docs

  @property up.Preview#renderOptions
  @stable
  */

  undo(...args) {
    if (this.ended) {
      // We might have the idea to immediately undo an effect when the preview has ended,
      // but it might lead to infinite loops in cases like this:
      //
      //    up.preview('broken', function(preview) {
      //      preview.show('#element')
      //      return () => preview.hide('#element')
      //    })
      reportError(new up.Error('Preview used after end of request'))
    } else {
      this._cleaner.guard(...args)
    }
  }

  /*-
  TODO: Docs: Multi-fragment updates only preview the primary target

  @property up.Preview#target
  @stable
  */
  get target() {
    return this.renderOptions.target
  }

  /*-
  TODO: Docs

  @property up.Preview#origin
  @stable
  */
  get origin() {
    return this.request.origin
  }

  /*-
  TODO: Docs

  @property up.Preview#params
  @stable
  */
  get params() {
    return this.request.params
  }

  /*-
  TODO: Docs

  @property up.Preview#layer
  @stable
  */
  get layer() {
    return this.request.layer
  }

  /*-
  TODO: Docs

  @property up.Preview#ended
  @stable
  */
  get ended() {
    return this.request.ended
  }

  /*-
  TODO: Docs

  @function up.Preview#run
  @experimental
  */
  run(value, data = {}) {
    for (let fn of up.feedback.resolvePreviewFns(value)) {
      this.undo(up.error.guard(fn, this, data))
    }
  }

  /*-
  Reverts all effects of this preview.

  @function up.Preview#run
  @internal
  */
  revert() {
    this._cleaner.clean()
  }

  /*-
  TODO: Docs

  @function up.Preview#setAttrs
  @stable
  */
  setAttrs(...args) {
    let [element, attrs] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setAttrsTemp(element, attrs))
  }

  /*-
  TODO: Docs

  @function up.Preview#addClass
  @stable
  */
  addClass(...args) {
    let [element, klass] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.addClassTemp(element, klass))
  }

  /*-
  Adds one or more classes to one or more elements.

  @function up.Preview#addClassBatch
  @internal
  */
  addClassBatch(elements, classes) {
    for (let element of elements) {
      for (let klass of classes) {
        this.addClass(element, klass)
      }
    }
  }

  /*-
  TODO: Docs

  @function up.Preview#removeClass
  @stable
  */
  removeClass(...args) {
    let [element, klass] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.removeClassTemp(element, klass))
  }

  /*-
  TODO: Docs

  @function up.Preview#setStyle
  @stable
  */
  setStyle(...args) {
    let [element, styles] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setStyleTemp(element, styles))
  }

  /*-
  TODO: Docs

  @function up.Preview#disable
  @stable
  */
  disable(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(up.form.disable(element))
  }

  /*-
  TODO: Docs

  @function up.Preview#addClass
  @stable
  */
  insert(...args) {
    // tempValue can have on of the following forms:
    // - A string of HTML
    // - A CSS selector string
    // - An Element node
    // - A Text node
    // - A NodeList with mixed Element and Text nodes
    let [reference, position = 'beforeend', tempValue] = this._parseMutatorArgs(args, 'val', u.isAdjacentPosition, 'val')
    this.undo(up.fragment.insertTemp(reference, position, tempValue))
  }

  /*-
  TODO: Docs

  @function up.Preview#show
  @stable
  */
  show(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.showTemp(element))
  }

  /*-
  TODO: Docs

  @function up.Preview#hide
  @stable
  */
  hide(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.hideTemp(element))
  }

  /*-
  TODO: Docs

  @function up.Preview#hideContent
  @experimental
  */
  hideContent(...args) {
    let [parent] = this._parseMutatorArgs(args, 'val')
    // Place all children in a wrapper so we can hide text nodes.
    let wrapper = e.wrapChildren(parent)
    e.hide(wrapper)
    this.undo(() => e.unwrap(wrapper))
  }

  /*-
  TODO: Docs
  TODO: Link to /placeholders

  @function up.Preview#showPlaceholder
  @experimental
  */
  showPlaceholder(...args) {
    let [parent, placeholderReference] = this._parseMutatorArgs(args, 'val', 'val')

    // We do not need to wrap a NodeList of mixed Text and Element nodes.
    // Both swapContent() and openLayer() can deal with that.
    let placeholderNodes = up.fragment.provideNodes(placeholderReference, { callbackArgs: [this], origin: this.origin })

    up.puts('[up-placeholder]', 'Showing placeholder %o', placeholderReference)

    if (parent) {
      this.swapContent(parent, placeholderNodes)
    } else if (this.layer === 'new') {
      this.openLayer(placeholderNodes, { closeAnimation: false })
      // Now that the renderOptions have served as defaults for openLayer(),
      // we can disable animations for the upcoming render pass. This way
      // we don't see flickering when another overlay opens with the final content.
      this.renderOptions.openAnimation = false
    }
  }

  /*-
  TODO: Docs

  @function up.Preview#swapContent
  @experimental
  */
  swapContent(parent, newContent) {
    this.hideContent(parent)
    this.insert(parent, newContent)
  }

  /*-
  TODO: Docs

  @function up.Preview#openLayer
  @experimental
  */
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

  _parseMutatorArgs(args, ...specs) {
    let [element, ...rest] = u.args(args, ...specs)
    // (1) up.fragment.get(undefined) returns undefined
    // (2) up.fragment.get(Element) returns the element
    // (3) this.fragment is undefined when opening a new layer
    element = up.fragment.get(element, { layer: this.layer }) || this.fragment
    return [element, ...rest]
  }

}
