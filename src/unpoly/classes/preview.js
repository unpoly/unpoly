const u = up.util
const e = up.element

/*-
Instances of `up.Preview` can describe temporary changes to a page.

You can use this to describe [arbitrary loading state](/previews) or [implement optimistic rendering](/optimistic-rendering).

Previews are usually defined using `up.preview()` (lowercase)
and then applied using the `[up-preview]` attribute or [`{ preview }`](/up.render#options.preview) option.
See [Previews](/previews) for an overview.

@class up.Preview
@parent up.status
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
  The targeted `Element` that is being previewed.

  When [updating multiple fragments](/targeting-fragments#multiple), the first targeted fragment will be previewed.

  Also see [inspecting the preview context](/previews#inspecting-the-preview-context).

  @property up.Preview#fragment
  @return {Element}
  @stable
  */

  /*-
  The [request](/up.Request) that is loading.

  When the request ends for [any reason](#ending), all preview changes will be reverted before
  the server response is processed further.

  Also see [inspecting the preview context](/previews#inspecting-the-preview-context).

  @property up.Preview#request
  @return {up.Request}
  @stable
  */

  /*-
  The [render options](/up.render#options) for this render pass.

  Preview functions may mutate this object to influence
  the render pass after the request ends. Note that the request has already been queued
  when previews run. Thus setting request-related render options will have no effect.

  Also see [inspecting the preview context](/previews#inspecting-the-preview-context).

  @property up.Preview#renderOptions
  @return {Object}
  @stable
  */

  /*-
  Register a function that will revert this preview's effects
  when the preview [ends](/previews#ending).

  See [Advanced preview mutations](/previews#advanced-mutations) for an elaborate example.

  ## Example

  The preview below sets a `[foo]` attribute on the targeted fragment.
  It uses `#undo()` to remove the attribute when the preview ends:

  ```js
  up.preview('my-preview', function(preview) {
    if (preview.fragment.hasAttribute('foo')) return
    preview.fragment.setAttribute('foo', 'foo-value')
    preview.undo(() => preview.fragment.removeAttribute('foo'))
  })
  ```

  Instead of registering a callback with `#undo()` a preview function can also return
  a function:

  ```js
  up.preview('my-preview', function(preview) {
    if (preview.fragment.hasAttribute('foo')) return
    preview.fragment.setAttribute('foo', 'foo-value')
    return () => preview.fragment.removeAttribute('foo')) // mark-phrase "return"
  })
  ```

  Common DOM mutations can be expressed more concisely using an `up.Preview` method.
  These methods automatically undo their changes, without you needing to call `#undo()`:

  ```js
  up.preview('my-preview', function(preview) {
    preview.setAttrs({ foo: 'foo-value' })
  })
  ```

  @function up.Preview#undo
  @param {Function} undoFn
    A function that will be called when the preview ends.
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
  The [origin](/origin) element that triggered this render pass.

  For example, when the user clicked a link with a preview effect, `preview.origin` will be the
  clicked `a[href]` element.

  @property up.Preview#origin
  @return {Element}
  @stable
  */
  get origin() {
    return this.request.origin
  }

  /*-
  Form data for the request being previewed.

  See [Previewing form submissions](/optimistic-rendering#previewing-form-submissions) for an example.

  @property up.Preview#params
  @return {up.Params}
  @stable
  */
  get params() {
    return this.request.params
  }

  /*-
  The [layer](/up.layer) that the previewed render pass is going to update.

  When [opening a new overlay](/opening-overlays), this property has the value `"new"`:

  ```js
  up.preview('my-preview', function(preview) {
    if (preview.layer === 'new') {
      console.log("Opening a layer with mode", preview.renderOptions.mode)
    } else {
      console.log("Updating layer", preview.layer)
    }
  })
  ```

  @property up.Preview#layer
  @return {up.Layer|string}
  @stable
  */
  get layer() {
    return this.request.layer
  }

  /*-
  Whether this preview has [ended](/previews#ending).

  When a [preview function](/up.preview) is called, its associated
  request has just been queued and `preview.ended` is always `false`.

  Only if the preview function is async, `preview.ended` can be `true`.
  See [Delaying previews](/previews#delaying) for an example.

  @property up.Preview#ended
  @return {boolean}
  @stable
  */
  get ended() {
    return this.request.ended
  }

  /*-
  When [revalidating a cache entry](/up.Preview.prototype.revalidating),
  this property is the cached response with expired content.

  When not revalidating, this property is `undefined`.

  @property up.Preview#expiredResponse
  @return {up.Response|undefined)
  @experimental
  */
  get expiredResponse() {
    return this.renderOptions.expiredResponse
  }

  /*-
  Whether the previewed render pass is a [revalidation an expired cache entry](/caching#revalidation).

  Cache revalidation is only previewed when an
  [`[up-revalidate-preview]`](/up-follow#up-revalidate-preview) attribute is set
  or when a [`{ revalidatePreview: true }`](/up.render#options.revalidatePreview)
  render option is passed.

  When revalidating, the preview will be called *after* the expired content has been rendered
  from the cache.

  @property up.Preview#revalidating
  @return {boolean}
  @experimental
  */
  get revalidating() {
    return !!this.expiredResponse
  }

  /*-
  Runs another preview function.

  ## Example

  To run another preview function registered with `up.preview()`, pass it's
  name:

  ```js
  up.preview('foo', function(preview) { // mark-phrase "'foo'"
    // ...
  })

  up.preview('bar', function(preview) {
    preview.run('foo') // mark-phrase "'foo'"
  })
  ```

  ## Undo callbacks are merged

  All [undo callbacks](/up.Preview.prototype.undo) from the other
  preview will be added to this preview.

  In the example below, `preview2` will call both `undo1()` and
  `undo2()` when the preview [ends](/previews#ending):

  ```js
  function undo1() { ... }
  function undo2() { ... }

  up.preview('preview1', function(preview) {
    preview.undo(undo1)
  })

  up.preview('preview2', function(preview) {
    preview.run('preview1')
    preview.undo(undo2)
  })
  ```

  ## Passing options

  To call a [preview with parameters](/previews#parameters),
  pass an options object as a second argument:

  ```js
  up.preview('foo', function(preview, { size, speed }) {
    // ...
  })

  up.preview('bar', function(preview) {
    preview.run('foo', { size: 'large', speed: 'fast' })
  })
  ```

  ## Sharing behavior between previews

  Instead of running a preview by its registered name,
  you can pass any function that accepts an `up.Preview` argument.

  This is a way to share common behavior between multiple
  preview functions:

  ```js
  function shared(preview) {
    // ...
  }

  up.preview('foo', function(preview) {
    preview.run(shared)
  })

  up.preview('bar', function(preview) {
    preview.run(shared)
  })
  ```



  @function up.Preview#run
  @param {string|Function(up.Preview, Object)} nameOrFn
    Another preview function or its [registered name](/up.preview).
  @param {Object} options
    [Parameters](/previews#parameters) that will be passed
    to the other preview function.
  @experimental
  */
  run(value, options = {}) {
    for (let fn of up.status.resolvePreviewFns(value)) {
      this.undo(up.error.guard(fn, this, options))
    }
  }

  /*-
  Reverts all effects of this preview.

  Called automatically when the previewed request ends.

  @function up.Preview#revert
  @internal
  */
  revert() {
    this._cleaner.clean()
  }

  /*-
  Temporarily changes an element's attributes.

  The element's original attributes will be restored
  when whe preview [ends](/previews#ending).

  ## Example

  This preview sets a temporary `[app-loading=true]` attribute on the targeted fragment:

  ```js
  up.preview('loading-attr', function(preview) {
    preview.setAttrs({ 'app-loading': true })
  })
  ```

  @function up.Preview#setAttrs
  @param {Element|string} [element=this.fragment]
    The element or selector to change.

    If omitted, the [targeted fragment](/up.Preview.prototype.fragment) will be changed.
  @param {Object} attributes
    An object of attribute names and values to set.

    To set an empty attribute, pass an empty string value.

    To remove an attribute, use a value of `null` or `undefined`.
  @stable
  */
  setAttrs(...args) {
    let [element, attrs] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setAttrsTemp(element, attrs))
  }

  /*-
  Temporarily adds a CSS class to an element.

  The class will be removed once the preview [ends](/previews#ending).

  ## Example

  This preview sets a temporary `.loading` class to the targeted fragment:

  ```js
  up.preview('loading-attr', function(preview) {
    preview.addClass('loading')
  })
  ```

  @function up.Preview#addClass
  @param {Element|string} [element=this.fragment]
    The element or selector to change.

    If omitted, the [targeted fragment](/up.Preview.prototype.fragment) will be changed.
  @param {string} className
    The CSS class to add.
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
  Temporarily removes a CSS class from an element.

  The removed class will be restored once the preview [ends](/previews#ending).

  @function up.Preview#removeClass
  @param {Element|string} [element=this.fragment]
    The element or selector to change.

    If omitted, the [targeted fragment](/up.Preview.prototype.fragment) will be changed.
  @param {string} className
    The CSS class to remove.
  @stable
  */
  removeClass(...args) {
    let [element, klass] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.removeClassTemp(element, klass))
  }

  /*-
  Temporarily sets inline CSS styles on an element.

  ## Example

  This preview temporarily changes the background and foreground colors of
  the targeted fragment:

  ```js
  up.preview('highlight', function(preview) {
    preview.setStyle({
      'color': 'yellow',
      'background-color': 'red'
    })
  })
  ```

  @function up.Preview#setStyle
  @param {Element|string} [element=this.fragment]
    The element or selector to change.

    If omitted, the [targeted fragment](/up.Preview.prototype.fragment) will be changed.
  @param {Object} styles
    One or more CSS properties with kebab-case keys.
  @stable
  */
  setStyle(...args) {
    let [element, styles] = this._parseMutatorArgs(args, 'val', 'val')
    this.undo(e.setStyleTemp(element, styles))
  }

  /*-
  Temporarily disables fields and buttons.

  The disabled controls will be re-enabled when the preview [ends](/previews#ending).

  Also see [Disabling forms while working](/disabling-forms).

  ## Example

  This preview disables an `input[name=email]` and all controls within a container matching `.button-bar`:

  ```js
  up.preview('.sign-in', function(preview) {
    preview.disable('input[name=email]')
    preview.disable('.button-bar')
  })
  ```

  @param {Element|string} [element=this.fragment]
    The element (or selector) within which fields and buttons should be disabled.

    If omitted, fields and buttons within the [targeted fragment](/up.Preview.prototype.fragment) will be disabled.
  @function up.Preview#disable
  @stable
  */
  disable(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(up.form.disable(element))
  }

  /*-
  Temporarily inserts an element.

  The element will be removed when the preview [ends](/previews#ending).

  ## Providing the new element

  The new element is passed as the last argument to the `insert()` method.

  For example, this preview will insert a `.spinner` element as the last child of the targeted fragment:

  ```js
  up.preview('spinner', function(preview) {
    let spinnerElement = up.element.createFromHTML('<span class="spinner">Please wait...</span>')
    preview.insert(spinnerElement)
  })
  ```

  You may also pass a string of HTML:

  ```js
  up.preview('spinner', function(preview) {
    preview.insert('<span class="spinner">Please wait...</span>')
  })
  ```

  ## Cloning templates {#templates}

  If the given element is a [template](/templates), it will be cloned before insertion.

  Let's say we have a template for the spinner element:

  ```html
  <template id="spinner-template">
    <span class="spinner">
      Please wait ...
    </span>
  </template>
  ```

  We can pass a selector for the template to clone:

  ```js
  up.preview('spinner', function(preview) {
    preview.insert('#spinner-template')
  })
  ```

  Any [template variables](/templates#parameters) can be appended after the
  selector as [relaxed JSON](/relaxed-json):

  ```js
  up.preview('spinner', function(preview) {
    preview.insert('#spinner-template { message: "One moment..." }')
  })
  ```

  For more control you may clone the template manually using `up.template.clone()`:

  ```js
  up.preview('spinner', function(preview) {
    let spinnerElement = up.template.clone('#spinner-template', { message: "One moment..." }),
    spinnerElement.classList.add('big')
    preview.insert(spinnerElement)
  })
  ```

  ## Controlling the insert position

  You can control where the new element by providing a *reference element* and an *adjacent position* relative
  to the reference argument.

  For example, this preview will create a `.spinner` element as the *first* child of the `<body>`:

  ```js
  up.preview('spinner', function(preview) {
    preview.insert(document.body, 'afterbegin', '<span class="spinner">Please wait...</span>')
  })
  ```

  The following insert positions are supported:

  @include adjacent-positions

  If the reference element is omitted, the new element will be inserted relative to
  the [targeted fragment](/up.Preview.prototype.fragment).

  If the adjacent position is omitted, the new element will become the new last child
  of the reference element (`'beforeend'`).

  ## Compilation

  When this function inserts a new element, it is [compiled](/up.compiler).\
  When the preview [ends](/previews#ending), the element is [destroyed](/up.compiler#destructor).

  ## Moving existing elements

  When the last argument is an attached element, it is moved to the indicated position relative to the reference.
  When the preview ends, the element is returned to its initial position.

  Moved elements are neither [compiled nor destroyed](#compilation) by this function.

  @function up.Preview#insert

  @param {Element|string} [reference=this.fragment]
    The reference element relative to which the new element will be inserted.

    You may pass an `Element` or a CSS selector.

  @param {string} [position='beforeend']
    The insert position relative to the `reference` element.

  @param {Element|string} newElement
    The element to insert.

    You may pass an `Element`, a CSS selector or a snippet of HTML.

  @stable
  */
  insert(...args) {
    // (1) tempValue can have on of the following forms:
    //     - A string of HTML
    //     - A CSS selector string matching a template
    //     - An Element node
    //     - A Text node
    //     - A NodeList with mixed Element and Text nodes
    // (2) When tempValue resolves to multiple nodes, it will be wrapped
    //     in an <up-wrapper> container.
    let [reference, position = 'beforeend', tempValue] = this._parseMutatorArgs(args, 'val', u.isAdjacentPosition, 'val')
    this.undo(up.fragment.insertTemp(reference, position, tempValue))
  }

  /*-
  Temporarily [shows](/up.element.show) a hidden element.

  The element will be [hidden](/up.element.hide) when the preview [ends](/previews#ending).

  ## Example

  This preview shows a hidden `#spinner` element while the request is loading:

  ```js
  up.preview('show-spinner', function(preview) {
    preview.show('#spinner')
  })
  ```

  @function up.Preview#show
  @param {Element|string} [element=this.fragment]
    The element or selector to change.

    If omitted, the [targeted fragment](/up.Preview.prototype.fragment) will be changed.
  @stable
  */
  show(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.showTemp(element))
  }

  /*-
  Temporarily [hides](/up.element.hide) an element.

  The element will be [shown](/up.element.show) when the preview [ends](/previews#ending).

  > [tip]
  > To visually remove elements during a preview, prefer hiding over detaching. See [Prefer additive changes](/previews#prefer-additive-changes).

  ## Example

  This preview hides an element `#nav` while the request is loading:

  ```js
  up.preview('hide-nav', function(preview) {
    preview.hide('#nav')
  })
  ```

  @function up.Preview#hide
  @param {Element|string} [element=this.fragment]
    The element or selector to change.

    If omitted, the [targeted fragment](/up.Preview.prototype.fragment) will be changed.
  @stable
  */
  hide(...args) {
    let [element] = this._parseMutatorArgs(args, 'val')
    this.undo(e.hideTemp(element))
  }

  /*-
  Temporarily [hides](/up.element.hide) the children of an element.

  The children will be [shown](/up.element.show) when the preview [ends](/previews#ending).

  > [tip]
  > To visually remove elements during a preview, prefer hiding over detaching. See [Prefer additive changes](/previews#prefer-additive-changes).

  ## Example

  This preview (visually) replaces the children of the [targeted fragment](/up.Preview.prototype.fragment)
  with a `.spinner` element:

  ```js
  up.preview('spinner', function(preview) {
    preview.hideChildren()
    preview.insert('<span class="spinner">Please wait...</span>')
  })
  ```

  @function up.Preview#hideContent
  @param {Element|string} [element=this.fragment]
    The element or selector to hide the children off.

    If omitted, the children of the [targeted fragment](/up.Preview.prototype.fragment) will be hidden.
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
  swapContent(...args) {
    let [parent, newContent] = this._parseMutatorArgs(args, 'val', 'val')
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
    element = up.fragment.get(element, { layer: this.layer, origin: this.origin }) || this.fragment
    return [element, ...rest]
  }

}
