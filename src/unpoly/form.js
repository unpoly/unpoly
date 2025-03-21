/*-
Forms
=====

The `up.form` module helps you work with non-trivial forms.

@see validation
@see dependent-fields
@see disabling-forms
@see watch-options

@see [up-submit]
@see [up-validate]
@see [up-switch]
@see [up-autosubmit]
@see up.watch

@module up.form
*/
up.form = (function() {

  const u = up.util
  const e = up.element

  /*-
  Sets default options for form submission and validation.

  @property up.form.config

  @param {Array<string>} [config.submitSelectors]
    An array of CSS selectors matching forms that will be [submitted through Unpoly](/up-submit).

    You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute:

    ```js
    up.form.config.submitSelectors.push('form')
    ```

    Individual forms may opt out with an `[up-submit=false]` attribute.
    You may configure additional exceptions in `config.noSubmitSelectors`.

  @param {Array<string>} [config.noSubmitSelectors]
    Exceptions to `up.form.config.submitSelectors`.

    Matching forms will *not* be [submitted through Unpoly](/up-submit),
    even if they match `up.form.config.submitSelectors`.

  @param {Array<string>} [config.groupSelectors=['[up-form-group]', 'fieldset', 'label', 'form']]
    An array of CSS selectors matching a [form group](/up-form-group).

    When [validating](/validation#validating-after-changing-a-field) a field,
    Unpoly will re-render the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
    form group around that field.

    When a group is matched, Unpoly will [derive a target selector](/target-derivation) for the element.
    In the example below, changing the *City* field would validate the target `#city_group`:

    ```html
    <fieldset id="city_group">
      <label for="city">City</label>
      <input type="text" name="city" id="city" up-validate>
    </fieldset>
    ```

    If no good selector cannot be derived from the group element, the resulting target will
    use a `:has()` suffix that matches the changed field. In the example below the target
    would be `fieldset:has(#city)`:

    ```html
    <fieldset> <!-- no [id] attribute to derive a selector from -->
      <label for="city">City</label>
      <input type="text" name="city" id="city" up-validate>
    </fieldset>
    ```

  @param {string} [config.fieldSelectors]
    An array of CSS selectors that represent form fields, such as `input` or `select`.

    When you add custom JavaScript controls to this list, matching elements should respond to the properties `{ name, value, disabled }`.

  @param {string} [config.submitButtonSelectors]
    An array of CSS selectors that represent submit buttons, such as `input[type=submit]` or `button[type=submit]`.

  @param {string} [config.genericButtonSelectors]
    An array of CSS selectors that represent push buttons with no default behavior, such as `input[type=button]` or `button[type=button]`.

    @experimental

  @param {number} [config.watchInputDelay=0]
    The number of milliseconds to [wait before running a watcher callback](/watch-options#debouncing).

    This default delay is only applied when [watching the `input` event](/watch-options#events).
    There is no default delay when watching other types of events.

  @param {Array<string>|Function(Element): Array<string>} [config.watchInputEvents=['input', 'change']]
    An array of events to substitute if [watching the `input` event](/watch-options#events).

    This can be used to watch [misbehaving fields](/watch-options#normalizing-non-standard-events)
    that don't emit the [standard `input` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event)
    as its value is being edited.

    It's OK to name multiple events that may result in the same change (e.g. `['keydown', 'keyup']`).
    Unpoly guarantees the callback is only run once per changed value.

    Instead of configuring an array of event types, you may also set a function that accepts
    a form field and returns an array of event types to watch for that field.

  @param {Array<string>|Function(Element): Array<string>} [config.watchChangeEvents=['change']]
    An array of events to substitute if [watching the `change` event](/watch-options#events).

    This can be used to watch [misbehaving fields](/watch-options#normalizing-non-standard-events)
    that don't emit the [standard `change` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event)
    after its value was changed.

    It's OK to name multiple events that may result in the same change (e.g. `['change', 'blur']`).
    Unpoly guarantees the callback is only run once per changed value.

    Instead of configuring an array of event types, you may also set a function that accepts
    a form field and returns an array of event types to watch for that field.

  @stable
   */
  const config = new up.Config(() => ({
    groupSelectors: ['[up-form-group]', 'fieldset', 'label', 'form'],
    fieldSelectors: ['select', 'input:not([type=submit], [type=image], [type=button])', 'button[type]:not([type=submit], [type=button])', 'textarea'],
    submitSelectors: ['form:is([up-submit], [up-target], [up-layer], [up-transition])'],
    noSubmitSelectors: ['[up-submit=false]', '[target]', e.crossOriginSelector('action')],
    submitButtonSelectors: ['input[type=submit]', 'input[type=image]', 'button[type=submit]', 'button:not([type])'],
    genericButtonSelectors: ['input[type=button]', 'button[type=button]'],
    // Although we only need to bind to `input`, we always also bind to `change`
    // in case another script manually triggers it.
    watchInputEvents: ['input', 'change'],
    watchInputDelay: 0,
    watchChangeEvents: ['change'],
    watchableEvents: ['input', 'change'],
  }))

  /*-
  @function up.form.fieldSelector
  @internal
  */
  function fieldSelector(suffix = '') {
    return config.fieldSelectors.map((field) => field + suffix).join()
  }

  /*-
  Returns whether the given element is a form field, such as `input` or `select`.

  To configure what Unpoly considers a form field, use `up.form.config.fieldSelectors`.

  @function up.form.isField
  @param {Element} element
    The element to check.
  @return {boolean}
    Whether the given element is a form field.
  @stable
  */
  function isField(element) {
    return element.matches(fieldSelector())
  }

  /*-
  Returns a list of form fields within the given element.

  You can configure what Unpoly considers a form field by adding CSS selectors to the
  `up.form.config.fieldSelectors` array.

  If the given element is itself a form field, a list of that given element is returned.

  @function up.form.fields
  @param {Element|jQuery} root
    The element to scan for contained form fields.

    If the element is itself a form field, a list of that element is returned.
  @return {List<Element>}
    The field elements within the given element.
  @experimental
  */
  function findFields(root) {
    root = e.get(root) // unwrap jQuery
    let fields = e.subtree(root, fieldSelector())

    // If findFields() is called with an entire form, gather fields outside the form
    // element that are associated with the form (through <input form="id-of-form">, which
    // is an HTML feature.)
    if (root.matches('form[id]')) {
      const outsideFieldSelector = fieldSelector(e.attrSelector('form', root.getAttribute('id')))
      const outsideFields = up.fragment.all(outsideFieldSelector, { layer: root })
      fields.push(...outsideFields)
      fields = u.uniq(fields)
    }

    return fields
  }

  function findFieldsAndButtons(container) {
    return [
      ...findFields(container),
      ...findSubmitButtons(container),
      ...findGenericButtons(container),
    ]
  }

  /*-
  Returns a list of submit buttons within the given element.

  You can configure what Unpoly considers a submit button by adding CSS selectors to the
  `up.form.config.submitButtonSelectors` array.

  @function up.form.submitButtons
  @param {Element|jQuery} root
    The element to scan for contained submit buttons.
  @return {List<Element>}
    The list of found submit buttons.
  @experimental
  */
  function findSubmitButtons(root) {
    return e.subtree(root, submitButtonSelector())
  }

  function findGenericButtons(root) {
    return e.subtree(root, config.selector('genericButtonSelectors'))
  }

  function isSubmitButton(element) {
    return element?.matches(submitButtonSelector())
  }

  /*-
  @function up.form.submitButtonSelector
  @internal
  */
  function submitButtonSelector() {
    return config.selector('submitButtonSelectors')
  }

  /*-
  Submits a form via AJAX and updates a page fragment with the response.

  Instead of loading a new page, the form is submitted via AJAX.
  The response is parsed for a CSS selector and the matching elements will
  replace corresponding elements on the current page.

  The unobtrusive variant of this is the `[up-submit]` selector.
  See its documentation to learn how form submissions work in Unpoly.

  Submitting a form is considered [navigation](/navigation).

  Emits the event [`up:form:submit`](/up:form:submit).

  ### Example

  ```js
  up.submit('form.new-user', { target: '.main' })
  ```

  @function up.submit

  @section General

    @param {Element|jQuery|string} form
      The form to submit.

      If the argument points to an element that is not a form,
      Unpoly will search its ancestors for the [closest](/up.fragment.closest) form.

    @param {Object} [options]
      Additional [render options](/up.render#parameters) that should be used for submitting the form.

      Unpoly will parse render options from the watched form's attributes.
      You may pass this additional `options` object to [supplement or override](/attributes-and-options#options)
      options parsed from attributes.  See `[up-submit]` for a list of supported attributes.

  @section Targeting
    @mix up.render/targeting
      @param options.origin
        The element that triggered the form submission.

        This defaults to the first applicable:

        - An element within the form that was focused when the form was submitted (e.g. when the user presses `Enter` inside a text field)
        - The [button clicked to submit the form](/up:form:submit#event.submitButton).
        - The first submit button
        - The `<form>` element

  @section Navigation
    @mix up.render/navigation
      @param [options.navigate=true]

  @section Request
    @mix up.submit/request

  @section Layer
    @mix up.render/layer

  @section History
    @mix up.render/history

  @section Animation
    @mix up.render/motion

  @section Caching
    @mix up.render/caching

  @section Scrolling
    @mix up.render/scrolling

  @section Focus
    @mix up.render/focus

  @section Loading state
    @mix up.submit/loading-state

  @section Failed responses
    @mix up.render/failed-responses
      @param options.failTarget
        The [target selector](/targeting-fragments) to update when the server responds with an error code.

        By default, failed responses will update the `<form>` element itself.

        @see failed-responses

  @section Client state
    @mix up.render/client-state

  @section Lifecycle hooks
    @mix up.render/lifecycle-hooks

  @return
    @like up.render

  @stable
  */
  const submit = up.mockable((form, options) => {
    return up.render(submitOptions(form, options))
  })

  /*-
  Parses the [render](/up.render) options that would be used to
  [submit](/up.submit) the given form, but does not render.

  ## Example

  Given a form element:

  ```html
  <form action="/foo" method="post" up-target=".content">
  ...
  </form>
  ```

  We can parse the link's render options like this:

  ```js
  let form = document.querySelector('form')
  let options = up.form.submitOptions(form)
  // => { url: '/foo', method: 'POST', target: '.content', ... }
  ```

  @param {Element|jQuery|string} form
    The form for which to parse render option.
  @param {Object} [options]
    Additional options for the form submission.

    Values from these options will override any attributes set on the given form element.
  @function up.form.submitOptions
  @return {Object}
    The parsed submit options.
  @stable
  */
  function submitOptions(form, options, parserOptions) {
    form = getForm(form)

    options = u.options(options)

    let parser = new up.OptionsParser(form, options, parserOptions)

    parser.include(destinationOptions)

    // We should usually be able to derive a target selector since form[action] is a default
    // deriver. In cases when we cannot, we should usually update a main target since
    // submitting is navigation, and { fallback: true } is a navigation default.
    parser.string('failTarget', { default: up.fragment.tryToTarget(form) })

    // The guardEvent will also be assigned an { renderOptions } property in up.render()
    options.guardEvent ||= up.event.build('up:form:submit', {
      submitButton: options.submitButton,
      log: 'Submitting form',
      params: options.params,
      form,
    })

    options.origin ||= up.viewport.focusedElementWithin(form) || options.submitButton || form
    options.activeElements = u.uniq([options.origin, options.submitButton, form].filter(u.isElement))

    // Now that we have extracted everything form-specific into options, we can call
    // up.link.followOptions(). This will also parse the myriads of other options
    // that are possible on both <form> and <a> elements.
    parser.include(up.link.followOptions)

    return options
  }

  function watchOptions(field, options, parserOptions = {}) {
    options = u.options(options)

    // Computing the effective options for a given field is pretty involved,
    // as there are multiple layers of defaults. In increasing priority these are:
    //
    // Users can configure app-wide defaults for some options:
    //
    // 		up.form.config.watchInputDelay = 100
    //
    // Forms can configure [up-watch-...] prefixed defaults for all watchers:
    //
    // 		<form up-watch-disable="false">
    // 			<input up-autosubmit>
    // 		</form>
    //
    // Form-wide options can be overridden at the input level:
    //
    // 		<form up-watch-disable="true">
    // 			<input up-autosubmit up-watch-disable="false">
    // 		</form>
    //
    // You may also set [up-watch-...] attribute on any element containing fields.
    // The closest attribute around the changed field is honored.
    //
    // This is particularly useful for a group of radio buttons:
    //
    // 		<form up-watch-disable="true">
    // 			<fieldset up-autosubmit up-watch-disable="false">
    // 				<input type="radio" name="kind" value="0">
    // 				<input type="radio" name="kind" value="1">
    // 				<input type="radio" name="kind" value="2">
    // 			</fieldset>
    // 		</form>
    //
    // Programmatic callers may also override all HTML attributes by passing an options hash:
    //
    //    up.validate(field, { disable: true })

    let parser = new up.OptionsParser(field, options, { ...parserOptions, closest: true, attrPrefix: 'up-watch-' })

    parser.include(up.status.statusOptions)
    parser.string('event')
    parser.number('delay')

    let config = up.form.config
    if (options.event === 'input') {
      // Expand the event name via the map in `up.form.config.watchInputEvents`.
      // This way we can fix components
      options.event = u.evalOption(config.watchInputEvents, field)
      options.delay ??= config.watchInputDelay
    } else if (options.event === 'change') {
      options.event = u.evalOption(config.watchChangeEvents, field)
    }

    options.origin ||= field

    // The callback to [up-watch] is not parsed here.
    // It is parsed in watch(), which calls watchCallbackFromElement().

    return options
  }

  /*-
  Disables all fields and buttons within the given element.

  To automatically disable a form when it is submitted, add the [`[up-disable]`](/up-submit#up-disable)
  property to the `<form>` element.

  Returns a function that re-enables the elements that were disabled.

  ### Dealing with focus loss

  When a focus field is disabled, it will lose focus.

  In that case Unpoly will focus the [closest form group](/up.form.group) around the disabled control.

  @function up.form.disableTemp
  @param {Element} element
    The element within which fields and buttons should be disabled.
  @return {Function}
    A function that re-enables the elements that were disabled.
  @internal
  */

  function disableContainerTemp(container) {
    let controls = findFieldsAndButtons(container)
    return u.sequence(u.map(controls, disableControlTemp))
  }

  function disableControlTemp(control) {
    // Ignore controls that were already disabled before us.
    // This way we don't accidentally re-enable a control that we didn't change.
    if (control.disabled) return

    let focusFallback
    if (document.activeElement === control) {
      focusFallback = findGroup(control)
      control.disabled = true
      up.focus(focusFallback, { force: true, preventScroll: true })
    } else {
      control.disabled = true
    }

    // (1) This function is only returned if we didn't early-return above
    //     for a control that is already disabled.
    // (2) In case our disabling caused focus loss: We don't care about restoring focus,
    //     selection or scroll position here. The up.form.disableTemp() function is *only*
    //     used via up.Preview#disable(), and previews already use a FocusCapsule
    //     to preserve and restore focus-related state.
    return () => { control.disabled = false }
  }

  function getDisableContainers(disable, origin) {
    let originScope = () => getScope(origin)

    if (disable === true) {
      return [originScope()]
    } else if (u.isElement(disable)) {
      return [disable]
    } else if (u.isString(disable)) {
      return up.fragment.subtree(originScope(), disable, { origin })
    } else if (u.isArray(disable)) {
      return u.flatMap(disable, (d) => getDisableContainers(d, origin))
    } else {
      return []
    }
  }

  function getDisablePreviewFn(disable, origin) {
    return function(preview) {
      let containers = getDisableContainers(disable, origin)
      for (let container of containers) {
        preview.disable(container)
      }
    }
  }

  function setContainerDisabled(container, disabled) {
    // This function is much simpler than disableContainerTemp(), as we only require
    // it for [up-enable-for] / [up-disable-for].
    for (let control of findFieldsAndButtons(container)) {
      control.disabled = disabled
    }
  }

  // This was extracted from submitOptions().
  // Validation needs to submit a form without options intended for the final submission,
  // like [up-scroll], [up-confirm], etc.
  function destinationOptions(form, options, parserOptions) {
    options = u.options(options)
    form = getForm(form)
    const parser = new up.OptionsParser(form, options, parserOptions)

    parser.string('contentType', { attr: 'enctype' })
    parser.json('headers')

    // Parse params from form fields.
    const params = up.Params.fromForm(form)

    // (1) When processing a `submit` event, we may have received a { submitButton: event.submitter } option.
    // (2) When the user submits the form from a focused input via Enter, the browser will also submit
    //     with the first submit button set as submitter.
    // (3) For pragmatic calls of up.submit(), we assume the first submit button.
    const submitButton = (options.submitButton ??= findSubmitButtons(form)[0])
    if (submitButton) {
      // Submit buttons with a [name] attribute will add to the params.
      // Note that addField() will only add an entry if the given button has a [name] attribute.
      params.addField(submitButton)

      // Submit buttons may have [formmethod] and [formaction] attribute
      // that override [method] and [action] attribute from the <form> element.
      options.method ||= submitButton.getAttribute('formmethod')
      options.url ||= submitButton.getAttribute('formaction')
    }

    // We had any { params } option to the params that we got from the form.
    params.addAll(options.params)
    options.params = params

    // Parse the form element's { url, method } *after* parsing the submit button.
    // The submit button's [formmethod] and [formaction] attributes have precedence.
    parser.string('url', { attr: 'action', default: up.fragment.source(form) })
    parser.string('method', {
      attr: ['up-method', 'data-method', 'method'],
      default: 'GET',
      normalize: u.normalizeMethod
    })
    if (options.method === 'GET') {
      // Only for GET forms, browsers discard all query params from the form's [action] URL.
      // The URLs search part will be replaced with the serialized form data.
      // See design/query-params-in-form-actions/cases.html for
      // a demo of vanilla browser behavior.
      options.url = up.Params.stripURL(options.url)
    }

    return options
  }

  /*-
  This event is [emitted](/up.emit) when a form is [submitted](/up.submit) through Unpoly.

  When the form is being [validated](/up-validate), this event is not emitted.
  Instead an `up:form:validate` event is emitted.

  ### Changing render options

  Listeners may inspect and manipulate [render options](/up.render#parameters) for the coming fragment update.

  The code below will use a custom [transition](/up-transition)
  when a form submission [fails](/failed-responses):

  ```js
  up.on('up:form:submit', function(event) {
    event.renderOptions.failTransition = 'shake'
  })
  ```

  @event up:form:submit

  @param {Element} event.target
    The element that caused the form submission.

    This is usually a submit button or a focused field. If the element is not known, the event is emitted
    on the `<form>` element.

  @param {Element} event.form
    The form that is being submitted.

  @param {up.Params} event.params
    The [form parameters](/up.Params) that will be send as the form's request payload.

    Listeners may inspect and modify params before they are sent.

  @param {Element} [event.submitButton]
    The button used to submit the form.

    If no button was pressed directly (e.g. the user pressed `Enter` inside a focused text field),
    this returns the first submit button.

  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the fragment update.

    Listeners may inspect and modify these options.

  @param event.preventDefault()
    Prevents the form from being submitted.

  @stable
  */

  /*-
  Watches form fields and runs a callback when a value changes.

  While you can also listen to a [standard `input` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event),
  using `up.watch()` comes with a number of quality of live improvements:

  - The callback only runs when a value was actually changed. Multiple events resulting in the same value will only run the callback once.
  - The callback's execution frequency can be [debounced](/watch-options#debouncing).
  - Guarantees that [only one async callback is running concurrently](#async-callbacks).

  The unobtrusive variant of this is the `[up-watch]` attribute.

  ## Example

  The following would print to the console whenever an input field changes:

  ```js
  up.watch('input.query', function(value) {
    console.log('Query is now', value)
  })
  ```

  ## Callback arguments {#callback-arguments}

  The watch callback may accept up to three arguments that describe the observed change:

    ```js
  up.watch('input.query', function(value, name, options) {
    console.log('Query is now', value)
  })
  ```

  Here is a full description of the individual callback arguments:

  @include watch-callback-arguments

  When rendering from a watch callback, you should forward the `options` to the rendering function:

  ```js
  up.watch('input.query', function(value, name, options) { // mark-phrase "options"
    return up.reload('main', { ...options, params: { query: value }) // mark-phrase "options"
  })
  ```

  > [tip]
  > A rendering watch callback can often be replaced with `[up-autosubmit]`.

  ## Watching multiple fields

  Instead of a single form field, you can also pass multiple fields,
  a `<form>` or any container that contains form fields.
  The callback will be run if any of the given fields change:

  ```js
  up.watch('form', function(value, name) {
    console.log('The value of %o is now %o', name, value)
  })
  ```

  ## Async callbacks

  When your callback does async work (like fetching data over the network) it should return a promise
  that settles once the work concludes:

  ```js
  up.watch('input.query', function(value, name, options) {
    let url = '/search?query=' + escapeURIFragment(value)
    return up.render('.results', { url, ...options }) // mark-phrase "return"
  })
  ```

  Unpoly will guarantee that only one async callback is running concurrently.
  If the form is changed while an async callback is still processing, Unpoly will wait
  until the callback concludes and then run it again with the latest field values.

  You can also return a promise by using `async` / `await`:

  ```js
  up.watch('input.query', async function(value, name, options) { // mark-phrase "async"
    let url = '/search?query=' + escapeURIFragment(value)
    await up.render('.results', { url, ...options }) // mark-phrase "await"
  })
  ```

  ## Batching changes

  You may also pass the `{ batch: true }` option to receive all
  changes since the last callback in a single object:

  ```js
  up.watch('form', { batch: true }, function(diff, options) {
    for (let name in diff) {
      let value = diff[name]
      console.log('The value of %o is now %o', name, value)
    }
  })
  ```

  @function up.watch

  @section Event source
    @param {Element|jQuery} element
      The form field that will be watched.

      You can pass a field, a `<form>` or any container that contains form fields.
      The callback will be run if any of the contained fields change.

    @param {string|Array<string>} [options.event='input']
      The types of event to observe.

      See [which events to watch](/watch-options#events).

    @param {number} [options.delay=0]
      The number of milliseconds to wait between an observed event and running the callback.

      See [debouncing callbacks](/watch-options#debouncing).

  @section Callback
    @param {boolean} [options.batch=false]
      If set to `true`, the callback will receive multiple
      detected changes in a [single diff object as its argument](#batching-changes).

      The object's keys are the names of the changed fields.
      The object's values are the values of the changed fields.

      @experimental

    @param {Function(value, name, options): Promise} callback
      The callback to run when the field's value changes.

      The callback is called with [arguments](#callback-arguments) that
      describe the change.

      An [async callback function must return a promise](#async-callbacks) that settles when
      the callback completes.

  @return {Function()}
    A destructor function that unsubscribes the watcher when called.

    Watching will stop automatically when the form is [destroyed](/up.destroy).

  @stable
  */
  function watch(...args) {
    let [root, options, callback] = u.args(args, 'val', 'options', 'callback')

    root = up.element.get(root) // unwrap jQuery
    callback ||= watchCallbackFromElement(root) || up.fail('No callback given for up.watch()')

    const watcher = new up.FieldWatcher(root, options, callback)

    return watcher.start()
  }

  function watchCallbackFromElement(element) {
    let rawCallback = element.getAttribute('up-watch')
    if (rawCallback) {
      return up.NonceableCallback.fromString(rawCallback).toFunction('value', 'name', 'options').bind(element)
    }
  }

  /*-
  Automatically submits a form when a field changes.

  The unobtrusive variant of this is the `[up-autosubmit]` attribute.

  ## Example

  We have a search form like this:

  ```html
  <form method="GET" action="/search">
    <input type="search" name="query">
    <input type="checkbox" name="archive"> Include archived
  </form>
  ```

  To cause the form to automatically submit when either field is changed,
  call `up.autosubmit()`:

  ```js
  up.autosubmit(form)
  ```

  @function up.autosubmit

  @section Event source
    @param {string|Element|jQuery} element
      The field or form to watch.

    @param options.event
      @like up.watch

    @param options.delay
      @like up.watch

  @section Render options
    @param {Object} [options]
      Additional [render options](/up.render#parameters) to use when the form is submitted.

      Unpoly will parse render options from the watched form's attributes.
      You may pass this additional `options` object to [supplement or override](/attributes-and-options#options)
      options parsed from attributes.  See `[up-submit]` for a list of supported attributes.

      Common options are documented below, but most [options for `up.submit()`](/up.submit#parameters) may be used.

  @section Request
    @include up.submit/request

  @section Loading state
    @include up.render/loading-state

  @return {Function()}
    A destructor function that stops auto-submitting when called.

    Auto-submitting will stop automatically when the observed fields are removed from the DOM.

  @stable
  */
  function autosubmit(target, options = {}) {
    const onChange = (_diff, renderOptions) => submit(target, renderOptions)
    return watch(target, { ...options, batch: true }, onChange)
  }

  function getGroupSelectors() {
    return up.migrate.migratedFormGroupSelectors?.() || config.groupSelectors
  }

  /*-
  Returns the [form group](/up-form-group) for the given element.

  By default, a form group is a `<fieldset>` element or any container with an `[up-form-group]` attribute.
  This can be configured in `up.form.config.groupSelectors`.

  Form groups may be nested. This function returns the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest) group around the given element.
  If no closer group is found, the `<form>` element is returned.

  ### Example

  This is a form with two groups:

  ```html
  <form>
    <fieldset>
      <label for="email">E-mail</label>
      <input type="text" name="email" id="email">
    </fieldset>
    <fieldset>
      <label for="password">Password</label>
      <input type="text" name="password" id="password">
    </fieldset>
  </form>
  ```

  We can now retrieve the form group for any element in the form:

  ```js
  let passwordField = document.querySelector('#password')
  let group = up.form.group(passwordField) // returns second <fieldset>
  ```

  @function up.form.group
  @param {Element} element
    The element for which to find a form group.
  @return {Element|undefined}
    The closest form group around the given element.

    If no better group can be found, the `<form>` element is returned.

    If the element is not within a `<form>`, returns `undefined`.
  @experimental
  */
  function findGroup(field) {
    return findGroupSolution(field).element
  }

  /*-
  Marks this element as a from group, which (usually) contains a label, input and error message.

  You are not required to use form groups to [submit forms through Unpoly](/up-submit).
  However, structuring your form into groups will help Unpoly to make smaller changes to the DOM when
  working with complex form. For instance, when [validating](/validation#validating-after-changing-a-field) a field,
  Unpoly will re-render the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
  form group around that field.

  By default Unpoly will also consider a `<fieldset>` or `<label>` around a field to be a form group.
  You can configure this in `up.form.config.groupSelectors`.

  ### Example

  Many apps use form groups to wrap a label, input field, error message and help text:

  ```html
  <form up-validate>
    <div up-form-group>
      <label for="email">E-mail</label>
      <input type="text" name="email" id="email">
    </div>
    <div up-form-group>
      <label for="password">Password</label>
      <input type="text" name="password" id="password">
      <div class="error">Must be 8 characters or longer</div>
    </div>
  </form>
  ```

  The form above also uses the `[up-validate]` attribute to [validate](/validation#validating-after-changing-a-field)
  form groups after changing a field:

  - After changing the *E-Mail* field, Unpoly will validate the `[up-form-group]:has(#email)` target.
  - After changing the *Password* field, Unpoly will validate the `[up-form-group]:has(#password)` target.

  @selector [up-form-group]
  @stable
  */

  function findGroupSolution(field) {
    return u.findResult(getGroupSelectors(), function(groupSelector) {
      let group = field.closest(groupSelector)
      if (group) {
        let strongDerivedGroupTarget = up.fragment.tryToTarget(group, { strong: true })
        let goodDerivedFieldTarget = up.fragment.tryToTarget(field)
        // Most forms have multiple groups with no identifying attributes, e.g. <div up-form-group>.
        // Hence we use a :has() selector to identify the form group by the selector
        // of the contained field, which usually has an identifying [name] or [id] attribute.
        let groupHasFieldTarget = goodDerivedFieldTarget && (group !== field) && `${groupSelector}:has(${goodDerivedFieldTarget})`
        let target = strongDerivedGroupTarget || groupHasFieldTarget
        if (target) {
          return {
            target,
            element: group,
            origin: field
          }
        }
      }
    })
  }


  /*-
  Render a new form state from its current field values, to show validation errors or
  update [dependent fields](/dependent-fields).

  Typical use cases are to [show validation errors](/validation#validating-after-changing-a-field)
  after a field was changed or to update forms where one field depends on the value of another.

  `up.validate()` submits the given element's form with an additional `X-Up-Validate`
  HTTP header. Upon seeing this header, the server is expected to validate (but not commit)
  the form submission and render a new form state. See [this example](/up-validate#backend-protocol)
  for control flow on the server.

  To automatically update a form after a field was changed, use the the `[up-validate]` attribute.
  You may combine `[up-validate]` and `up.validate()` within the same form. Their updates
  will be [batched together](#batching) to prevent race conditions.

  ## Controlling what is updated

  `up.validate()` always submits the entire form with its current field values to the form's
  `[action]` path. Typically only a fragment of the form is updated with the response.
  This minimizes the chance for loss of transient state like scroll positions, cursor selection
  or user input while the request is in flight.

  Passing a form field will update the closest [form group](/up-form-group) around the field:

  ```js
  up.validate('input[name=email]')
  ```

  If the given field has an `[up-validate]` attribute with a custom target selector, that selector
  will be updated instead.

  You may also update arbitrary elements within the form:

  ```js
  up.validate('.preview')
  ```

  You may also choose to re-render an entire form.
  In this case it is recommended to [disable fields](/disabling-forms) while rendering.
  This prevents the loss of user input made while the request is in flight:

  ```js
  up.validate('form', { disable: true })
  ```

  ## Multiple validations are batched together {#batching}

  In order to prevent race conditions, multiple calls of `up.validate()` within the same
  [task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) are consolidated into a single request.
  For instance, the following will send a single request [targeting](/targeting-fragments) `.foo, .bar`:

  ```js
  up.validate('.foo')
  up.validate('.bar')
  ```

  Validating the same target multiple times will also only send a single request.
  For instance, the following will send a single request targeting `.qux`:

  ```js
  up.validate('.qux')
  up.validate('.qux')
  ```

  When one of your target elements is an ancestor of another target, Unpoly will only request the ancestor.
  For instance, the following would send a single request targeting `form`:

  ```js
  up.validate('input[name=email]')
  up.validate('form')
  ```

  Also see [preventing race conditions](/dependent-fields#preventing-race-conditions).

  @function up.validate

  @section Targeting
    @param {string|Element|jQuery} element
      The field or fragment that should be re-rendered on the server.

      See [controlling what is updated](#controlling-what-is-updated).

    @param {string} [options.target=element]
      The [target selector](/targeting-fragments) to re-render.

      By default the given `element` will be rendered.
      If `element` is a field, its form group or `[up-validate]` target will be rendered.

    @param {boolean} [options.formGroup = true]
      Whether, when a field is given as `element`,
      the field's closest [form group](/up-form-group) should be targeted.

    @param {Element} [options.origin=element]
      The element or field that caused this validation pass.

      The names of all fields contained within the origin will be passed as an `X-Up-Validate` request header.

  @section Render options
    @param {Object} [options]
      Additional [render options](/up.render#parameters) to use when re-rendering the targeted
      fragment.

      Common options are documented below, but most [options for `up.submit()`](/up.submit#parameters) may be used.

      Note that validation requests may be [batched together](/up.validate#batching).
      In this case Unpoly will try to merge render options where possible (e.g. `{ headers }`).
      When a render option cannot be merged (e.g. `{ scroll }`),
      the option from the last validation in the batch will be used.

  @section Client state
    @mix up.reload/client-state

  @section Request
    @param options.params
      @like up.render

    @param options.headers
      @like up.render

  @section Loading state
    @mix up.submit/loading-state

  @return {Promise<up.RenderResult}}
    A promise that fulfills when the server-side validation is received and the form was updated.

  @stable
  */
  function validate(...args) {
    let options = parseValidateArgs(...args)
    let form = getForm(options.origin)
    let validator = getFormValidator(form)
    return validator.validate(options)
  }

  /*-
  Parses the many signatures of `up.validate()`.

  See specs for examples.

  @function up.form.parseValidateArgs
  @internal
  */
  function parseValidateArgs(originOrTarget, ...args) {
    const options = u.extractOptions(args)

    if (options.origin) {
      options.target ||= up.fragment.toTarget(originOrTarget)
    } else {
      options.origin ||= up.fragment.get(originOrTarget)
    }

    return options
  }

  /*-
  This event is emitted before a form is being [validated](/up-validate).

  @event up:form:validate

  @param {Element} event.target
    The form that is being validated.

  @param {Element} event.form
    The form that is being validated.

  @param {up.Params} event.params
    The [form parameters](/up.Params) that will be sent as the form's request payload.

    Listeners may inspect and modify params before they are sent.
    Note that the request may be a [batch of multiple validations](/up.validate#batching).

  @param {Element} event.fields
    The form fields that triggered this validation pass.

    When multiple fields are validating within the same [task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/),
    Unpoly will make a [single validation request with multiple targets](/up.validate#batching).

    @experimental

  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the fragment update
    that will show the validation results.

    Listeners may inspect and modify these options.
    Note that the request may be a [batch of multiple validations](/up.validate#batching).

  @param event.preventDefault()
    Prevents the validation request from being sent to the server.

  @stable
  */

  // function switcherValues(field) {
  //   let value
  //   let meta
  //
  //   if (field.matches('input[type=checkbox]')) {
  //     if (field.checked) {
  //       value = field.value
  //       meta = ':checked'
  //     } else {
  //       meta = ':unchecked'
  //     }
  //   } else if (field.matches('input[type=radio]')) {
  //     const form = getScope(field)
  //     const groupName = field.getAttribute('name')
  //     const checkedButton = form.querySelector(`input[type=radio]${e.attrSelector('name', groupName)}:checked`)
  //     if (checkedButton) {
  //       meta = ':checked'
  //       value = checkedButton.value
  //     } else {
  //       meta = ':unchecked'
  //     }
  //   } else {
  //     value = field.value
  //   }
  //
  //   const values = []
  //   if (u.isPresent(value)) {
  //     values.push(value)
  //     values.push(':present')
  //   } else {
  //     values.push(':blank')
  //   }
  //   if (u.isPresent(meta)) {
  //     values.push(meta)
  //   }
  //   return values
  // }

  // function switchTargets(switcher) {
  //   const targetSelector = switcher.getAttribute('up-switch')
  //   const form = getScope(switcher)
  //   targetSelector || up.fail("No switch target given for %o", switcher)
  //   const fieldValues = switcherValues(switcher)
  //
  //   for (let target of up.fragment.all(form, targetSelector)) {
  //     switchTarget(target, fieldValues, switcher)
  //   }
  // }
  //
  // const SWITCH_EFFECTS = [
  //   { attr: 'up-hide-for', toggle(target, active) { e.toggle(target, !active) } },
  //   { attr: 'up-show-for', toggle(target, active) { e.toggle(target, active) } },
  //   { attr: 'up-disable-for', toggle(target, active) { up.form.setDisabled(target, active) } },
  //   { attr: 'up-enable-for', toggle(target, active) { up.form.setDisabled(target, !active) } },
  // ]
  //
  // function unswitchedSwitchTargetSelector() {
  //   return e.unionSelector(u.map(SWITCH_EFFECTS, (effect) => `[${effect.attr}]`), ['.up-switched'])
  // }
  //
  // const switchTarget = up.mockable(function(target, fieldValues, switcher) {
  //   switcher ||= findSwitcherForTarget(target)
  //   fieldValues ||= switcherValues(switcher)
  //
  //   for (let { attr, toggle } of SWITCH_EFFECTS) {
  //     let attrValue = target.getAttribute(attr)
  //     if (attrValue) {
  //       let activeValues = parseSwitchTokens(attrValue)
  //       let isActive = u.intersect(fieldValues, activeValues).length > 0
  //       toggle(target, isActive)
  //     }
  //   }
  //
  //   target.classList.add('up-switched')
  // })
  //
  // function parseSwitchTokens(str) {
  //   return u.getSimpleTokens(str, { json: true })
  // }
  //
  // function findSwitcherForTarget(target) {
  //   const form = getScope(target)
  //   const switchers = form.querySelectorAll('[up-switch]')
  //   const switcher = u.find(switchers, function(switcher) {
  //     const targetSelector = switcher.getAttribute('up-switch')
  //     return target.matches(targetSelector)
  //   })
  //   return switcher || up.fail('Could not find [up-switch] field for %o', target)
  // }

  function getForm(elementOrSelector, options = {}) {
    const element = up.fragment.get(elementOrSelector, options)

    // (1) Element#form will also work if the element is outside the form with an [form=form-id] attribute
    // (2) We still need the closest('form') in case we're called with a non-field element
    return element.form || element.closest('form')
  }

  function getFormValidator(form) {
    return form.upFormValidator ||= setupFormValidator(form)
  }

  function setupFormValidator(form) {
    const validator = new up.FormValidator(form)
    const stop = validator.start()
    up.destructor(form, stop)
    return validator
  }

  // Alternative to getForm() which always returns a likely scope:
  //
  // (1) Called with an origin within a form => Returns the closest form
  // (2) Called with an origin outside a form => Returns the origin's layer element
  // (3) Called without an origin element => Returns the current layer element
  //
  // Does not support a selector string as a first argument. Only works with Element arguments.
  function getScope(origin, options) {
    if (origin) {
      return getForm(origin, options) || up.layer.get(origin).element
    } else {
      return up.layer.current.element
    }
  }

  // function trackFields(...args) {
  //   let [root, options, callback] = u.args(args, 'val', 'options', 'callback')
  //   let tracker = new up.FieldTracker(root, options, callback)
  //   return tracker.start()
  // }

  /*-
  @function up.form.trackFields
  @param {Element} root
    A form or a container element within a form.
  @param {Function(Element): boolean} options.guard
    Optional, additional condition whether a field matches.
  @param {Function(Element): Function(Element)
    A callback that is called when we discover a new match.
    The callback can return another function that is called when that field no longer matches.
  */
  function trackFields(...args) {
    let [root, { guard }, callback] = u.args(args, 'val', 'options', 'callback')

    let filter = function(fields) {
      let scope = getScope(root)
      return u.filter(fields, function(field) {
        return (root === scope || root.contains(field))
          && (getForm(field) === scope) // will also match external fields with [form]
          && (!guard || guard(field)) // user-provided condition
      })
    }

    // If root is already a field, it cannot contain other fields.
    // We do not need to listed to up:fragment:inserted etc.
    const live = true // !isField(root)

    return up.fragment.trackSelector(fieldSelector(), { filter, live }, callback)
  }

  function focusedField() {
    return u.presence(document.activeElement, isField)
  }

  /*-
  Returns whether the given form will be [submitted](/up-submit) through Unpoly
  instead of making a full page load.

  By default, Unpoly will follow forms if the element has
  one of the following attributes:

  - [`[up-submit]`](/up-submit)
  - [`[up-target]`](/up-follow#up-target)
  - [`[up-layer]`](/up-follow#up-layer)
  - `[up-transition]`

  To consider other selectors to be submittable, see `up.form.config.submitSelectors`.

  @function up.form.isSubmittable
  @param {Element|jQuery|string} form
    The form to check.
  @return {boolean}
    Whether the form will be submitted through Unpoly.
  @stable
  */
  function isSubmittable(form) {
    form = up.fragment.get(form)
    return config.matches(form, 'submitSelectors')
  }

  /*-
  Submits this form via JavaScript and updates a fragment with the server response.

  The server must render an element matching the [target selector](/targeting-fragments) from the `[up-target]` attribute.
  A matching element in the current page is then swapped with the new element from the server response.
  The response may include other HTML (even an entire HTML document), but only the matching element will be updated.

  The programmatic variant of this is the [`up.submit()`](/up.submit) function.

  ### Example

  ```html
  <form method="post" action="/users" up-submit up-target=".content">
    ...
  </form>
  ```

  ### Handling validation errors

  When the form could not be submitted due to invalid user input,
  Unpoly can re-render the form with validation errors.

  See [validating forms](/validation) for details and examples.


  ### Showing that the form is processing

  See [Loading state](/loading-state) and [Disabling form controls while working](/disabling-forms).


  ### Short notation

  You may omit the `[up-submit]` attribute if the form has one of the following attributes:

  - `[up-target]`
  - `[up-layer]`
  - `[up-transition]`

  Such a form will still be submitted through Unpoly.

  ### Handling all forms automatically

  You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute.

  See [Handling all links and forms](/handling-everything).

  @selector [up-submit]

  @section Targeting
    @mix up-follow/targeting
      @param [up-target]
        The [target selector](/targeting-fragments) to update for a successful form submission.

  @section Navigation
    @mix up-follow/navigation

  @section Request
    @param action
      Where to send the form data when the form is submitted.

    @param method
      The HTTP method to use for the request.

      The value is case-insensitive.

      You can also use methods that would not be allowed on a `<form>` element,
      such as `'patch`' or `'delete'`. These will be [wrapped in a POST request](/up.network.config#config.wrapMethod).

    @mix up-follow/request-extras
      @param up-params
        Additional [Form parameters](/up.Params) that should be sent as the request's
        [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

        The given value will be added to params [parsed](/up.Params.fromForm)
        from the form's input fields.

  @section Layer
    @mix up-follow/layer

  @section History
    @mix up-follow/history

  @section Animation
    @mix up-follow/motion

  @section Caching
    @mix up-follow/caching

  @section Scrolling
    @mix up-follow/scrolling

  @section Focus
    @mix up-follow/focus

  @section Loading state
    @mix up-follow/loading-state
      @param up-disable
        [Disables form controls](/disabling-forms) while the request is loading.

        The values of disabled fields will still be included in the submitted form params.

  @section Failed responses
    @mix up-follow/failed-responses
      @param up-fail-target
        The [target selector](/targeting-fragments) to update when the server responds with an error code.

        By default, failed responses will update the `<form>` element itself.

        @see failed-responses

  @section Client state
    @mix up-follow/client-state

  @section Lifecycle hooks
    @mix up-follow/lifecycle-hooks

  @stable
  */

  up.on('submit', config.selectorFn('submitSelectors'), function(event, form) {
    // Users may configure up.form.config.submitSelectors.push('form')
    // and then opt out individual forms with [up-submit=false].
    if (event.defaultPrevented) return

    const submitButton = u.presence(event.submitter, isSubmitButton)

    up.event.halt(event, { log: true })
    up.error.muteUncriticalRejection(submit(form, { submitButton }))
  })

  /*-
  Renders a new form state when a field changes, to show validation errors or
  update [dependent fields](/dependent-fields).

  When a form field with an `[up-validate]` attribute is changed, the form is submitted to the server
  which is expected to render a new form state from its current field values.
  The [form group](/up-form-group) around the changed field is updated with the server response.

  This quickly signals whether a change is valid,
  without the need to scroll for error messages or to backtrack to
  fields completed earlier.

  > [NOTE]
  > `[up-validate]` is a tool to implement highly dynamic forms that must update
  > *as the user is completing fields*.\
  > If you only need to [validate forms after submission](/validation#validating-after-submission),
  > you don't need `[up-validate]`.

  ## Marking fields for validation

  Let's look at a standard registration form that asks for an e-mail and password.
  The form is organized into [form groups](/up-form-group) of labels, inputs and
  an optional error message:

  ```html
  <form action="/users">

    <fieldset>
      <label for="email">E-mail</label>
      <input type="text" id="email" name="email">
    </fieldset>

    <fieldset>
      <label for="password">Password</label>
      <input type="password" id="password" name="password">
    </fieldset>

    <button type="submit">Register</button>

  </form>
  ```

  We have some data constraints that we want to validate as the user is filling in fields:

  - When the user changes the `email` field, we want to validate that the e-mail address
    is formatted correctly and is still available.
  - When the user changes the `password` field, we want to validate
    the minimum password length.

  If validation fails we want to show validation errors *as soon as the user blurs the field*.

  We're going to render validation errors using the following HTML:

    ```html
  <form action="/users">

    <fieldset>
      <label for="email" up-validate>E-mail</label>
      <input type="text" id="email" name="email" value="foo@bar.com">
      <div class="error">E-mail has already been taken!</div> <!-- mark-line -->
    </fieldset>

    <fieldset>
      <label for="password" up-validate>Password</label>
      <input type="password" id="password" name="password" value="secret">
      <div class="error">Password is too short!</div> <!-- mark-line -->
    </fieldset>

  </form>
  ```

  We can implement this by giving both fields an `[up-validate]` attribute:

  ```html
  <form action="/users">

    <fieldset>
      <label for="email" up-validate>E-mail</label> <!-- mark-phrase "up-validate" -->
      <input type="text" id="email" name="email">
    </fieldset>

    <fieldset>
      <label for="password" up-validate>Password</label> <!-- mark-phrase "up-validate" -->
      <input type="password" id="password" name="password">
    </fieldset>

    <button type="submit">Register</button>

  </form>
  ```

  Whenever a field with `[up-validate]` changes, the form is submitted to its `[action]` path
  with an additional `X-Up-Validate` HTTP header.

  ## Backend protocol

  When the user changes the `email` field in the registration form above,
  the following request will be sent:

  ```http
  POST /users HTTP/1.1
  X-Up-Validate: email
  X-Up-Target: fieldset:has(#email)
  Content-Type: application/x-www-form-urlencoded

  email=foo%40bar.com&password=secret
  ```

  Upon seeing an `X-Up-Validate` header, the server is expected to validate (but not commit)
  the form submission and render a new form state from the request parameters.

  This requires a change in the backend code that handles the form's `[action]` path.
  Until now the backend only had to handle two cases:

  1. The form was submitted with valid data. We create a new account and sign in the user.
  2. The form submission failed due to an invalid email or password. We re-render the form with error messages.

  A [Ruby on Rails](https://rubyonrails.org/) implementation would look like this:

  ```ruby
  class UsersController < ApplicationController

    def create
      # Instantiate model from request parameters
      user_params = params.require(:user).permit(:email, :password)
      @user = User.new(user_params)

      if @user.save
        # Form is submitted successfully
        sign_in @user
      else
        # Submission failed
        render 'form', status: :unprocessable_entity
      end

    end

  end
  ```

  To honor the validation protocol, our backend needs to handle a third case:

  <ol start="3">
    <li>When seeing an <code>X-Up-Validate</code> header, render a new form state from request parameters</li>
  </ol>

  In our example backend above, this change could look like this:

  ```ruby
  class UsersController < ApplicationController

    def create
      # Instantiate model from request parameters
      user_params = params.require(:user).permit(:email, :password)
      @user = User.new(user_params)

      if request.headers['X-Up-Validate'] # mark-line
        @user.validate # mark-line
        render 'form' # mark-line
      elsif @user.save
        # Form is submitted successfully
        sign_in @user
      else
        # Submission failed
        render 'form', status: :unprocessable_entity
      end

    end

  end
  ```

  > [TIP]
  > If you're using Python with Django, you may find the [`django-forms-dynamic`](https://github.com/dabapps/django-forms-dynamic)
  > package useful to implement this pattern.

  The server is free to respond with any HTTP status code, regardless of the validation result.
  Unpoly will always consider a validation request to be successful, even if the
  server responds with a non-200 status code.

  Upon seeing an `X-Up-Validate` header, the server now renders a new state form from request parameters,
  showing eventual validation errors and updating [dependent fields](/dependent-fields):

  ```html
  <form action="/users">

    <fieldset>
      <label for="email" up-validate>E-mail</label>
      <input type="text" id="email" name="email" value="foo@bar.com">
      <div class="error">E-mail has already been taken!</div> <!-- mark-line -->
    </fieldset>

    <fieldset>
      <label for="password" up-validate>Password</label>
      <input type="password" id="password" name="password" value="secret">
      <div class="error">Password is too short!</div> <!-- mark-line -->
    </fieldset>

  </form>
  ```

  ## How validation results are displayed

  `[up-validate]` always submits the entire form with its current field values to the form's
  `[action]` path. Typically only a fragment of the form is updated with the response.
  This minimizes the chance for loss of transient state like scroll positions, cursor selection
  or user input while the request is in flight.

  By default Unpoly will only update the closest [form group](/up-form-group)
  around the validating field. The [example above](#marking-fields-for-validation),
  after changing the `email` field, only the `<fieldset>` around the field will be updated.

  If the form is not structured into groups, the entire
  form will be updated.


  ### Updating a different fragment

  If you don't want to update the field's form group, you can set the `[up-validate]`
  attribute to any [target selector](/targeting-fragments):

  ```html
  <input type="text" name="email" up-validate=".email-errors"> <!-- mark-phrase ".email-errors" -->
  <div class="email-errors"></div>
  ```

  You may also [update multiple fragments](/targeting-fragments#multiple)
  by separating their target selectors with a comma:

  ```html
  <input type="text" name="email" up-validate=".email-errors, .base-errors"> <!-- mark-phrase ".email-errors, .base-errors" -->
  ```

  ## Updating dependent fields

  The `[up-validate]` attribute is a useful tool to partially update a form
  when one fields depends on the value of another field.

  See [dependent fields](/dependent-fields) for more details and examples.


  ## Validating while typing

  @include validating-while-typing


  ## Preventing race conditions

  Custom dynamic form implementations will often exhibit race conditions, e.g. when the user
  is quickly changing fields while requests are still in flight.
  Such issues are solved with `[up-validate]`. The form will eventually show a consistent state,
  regardless of how fast the user clicks or how slow the network is.

  See [preventing race conditions](/dependent-fields#preventing-race-conditions) for more details.

  ## Validating multiple fields

  You can set `[up-validate]` on any element to validate *all contained fields* on change.

  In the [example above](#marking-fields-for-validation),
  instead of setting `[up-validate]` on each individual `<input>`, we can also set it on the `<form>`:

  ```html
  <form action="/users" up-validate> <!-- mark-phrase "up-validate" -->

    <fieldset>
      <label for="email" up-validate>E-mail</label>
      <input type="text" id="email" name="email">
    </fieldset>

    <fieldset>
      <label for="password" up-validate>Password</label>
      <input type="password" id="password" name="password">
    </fieldset>

    <button type="submit">Register</button>

  </form>
  ```

 ### Validating radio buttons

  Multiple radio buttons with the same `[name]` produce a single value for the form.

  To watch radio buttons group, use the `[up-validate]` attribute on an
  element that contains all radio button elements with a given name:

  ```html
  <fieldset up-validate>
    <input type="radio" name="format" value="html"> HTML format
    <input type="radio" name="format" value="pdf"> PDF format
    <input type="radio" name="format" value="txt"> Text format
  </fieldset>
  ```

  ## Programmatic validation

  To update form fragments from your JavaScript, use the [`up.validate()`](/up.validate) function.
  You may combine `[up-validate]` and `up.validate()` within the same form. Their updates
  will be [batched together](/up.validate#batching) in order to
  [prevent race conditions](/dependent-fields#preventing-race-conditions).


  @selector [up-validate]

  @section Targeting
    @param [up-validate]
      The [target selector](/targeting-fragments) to update with the server response.

      Defaults the closest [form group](/up-form-group) around the validating field.

  @section Event source
    @mix up-watch/event-source
      @param [up-watch-event='change']

  @section Loading state
    @mix up-watch/loading-state

  @stable
  */
  up.compiler('form', function(form) {
    // We pre-emptively initialize a FormValidator for *every* form, so it can start tracking fields.
    // There are non-intuitive ways that an [up-validate] field can find its way into a <form>,
    // e.g. when the field is also [up-keep] and is transplanted into a new <form> later.
    getFormValidator(form)
  })

  /*-
  Show or hide elements when a form field is set to a given value.

  The observed elements can use [`[up-show-for]`](/up-show-for) and [`[up-hide-for]`](/up-hide-for)
  attributes to indicate for which values they should be shown or hidden.

  The `[up-switch]` element and its observed elements must be inside the same `<form>`.

  ### Example: Select options

  The controlling form field gets an `[up-switch]` attribute with a selector for the elements to show or hide:

  ```html
  <select name="advancedness" up-switch=".target">
    <option value="basic">Basic parts</option>
    <option value="advanced">Advanced parts</option>
    <option value="very-advanced">Very advanced parts</option>
  </select>
  ```

  The target elements can use [`[up-show-for]`](/up-show-for) and [`[up-hide-for]`](/up-hide-for)
  attributes to indicate for which values they should be shown or hidden.

  ```html
  <div class="target" up-show-for="basic">
    only shown for advancedness = basic
  </div>

  <div class="target" up-hide-for="basic">
    hidden for advancedness = basic
  </div>

  <div class="target" up-show-for="advanced, very-advanced">
    shown for advancedness = advanced or very-advanced
  </div>
  ```

  ### Example: Text field

  The controlling `<input>` gets an `[up-switch]` attribute with a selector for the elements to show or hide:

  ```html
  <input type="text" name="user" up-switch=".target">

  <div class="target" up-show-for="alice">
    only shown for user alice
  </div>
  ```

  You may also use the pseudo-values `:blank` to match an empty input value,
  or `:present` to match a non-empty input value:

  ```html
  <input type="text" name="user" up-switch=".target">

  <div class="target" up-show-for=":blank">
    please enter a username
  </div>
  ```

  ### Example: Checkbox

  For checkboxes you may match against the pseudo-values `:checked` or `:unchecked`:

  ```html
  <input type="checkbox" name="flag" up-switch=".target">

  <div class="target" up-show-for=":checked">
    only shown when checkbox is checked
  </div>

  <div class="target" up-show-for=":unchecked">
    only shown when checkbox is unchecked
  </div>
  ```

  You may also match against the `[value]` attribute of the checkbox element:

  ```html
  <input type="checkbox" name="flag" value="active" up-switch=".target">

  <div class="target" up-show-for="active">
    only shown when checkbox is checked
  </div>
  ```

  ### Example: Radio button

  ```html
  <input type="radio" name="advancedness" value="basic" up-switch=".target">
  <input type="radio" name="advancedness" value="advanced" up-switch=".target">
  <input type="radio" name="advancedness" value="very-advanced" up-switch=".target">

  <div class="target" up-show-for="basic">
    only shown for advancedness = basic
  </div>

  <div class="target" up-hide-for="basic">
    hidden for advancedness = basic
  </div>

  <div class="target" up-show-for="advanced, very-advanced">
    shown for advancedness = advanced or very-advanced
  </div>
  ```

  ### Example: Values containing spaces

  If your values might contain spaces, you may also serialize them as a [relaxed JSON](/relaxed-json) array:

  ```html
  <select name='advancedness' up-switch='.target'>
    <option value='John Doe'>John Doe</option>
    <option value='Jane Doe'>Jane Doe</option>
    <option value='Max Mustermann'>Max Mustermann</option>
  </select>

  <div class='target' up-show-for='["John Doe", "Jane Doe"]'>
    You selected John or Jane Doe
  </div>

  <div class='target' up-hide-for='["Max Mustermann"]'>
    You selected Max Mustermann
  </div>
  ```

  @selector [up-switch]
  @param up-switch
    A CSS selector for elements whose visibility depends on this field's value.
  @stable
  */

  /*-
  Only shows this element if an input field with `[up-switch]` has one of the given values.

  See `[up-switch]` for more documentation and examples.

  @selector [up-show-for]
  @param [up-show-for]
    A list of input values for which this element should be shown.

    Multiple values can be separated by either a space (`foo bar`) or a comma (`foo, bar`).
    If your values might contain spaces, you may also serialize them as a JSON array (`["foo", "bar"]`).
  @stable
  */

  /*-
  Hides this element if an input field with `[up-switch]` has one of the given values.

  See `[up-switch]` for more documentation and examples.

  @selector [up-hide-for]
  @param [up-hide-for]
    A list of input values for which this element should be hidden.

    Multiple values can be separated by either a space (`foo bar`) or a comma (`foo, bar`).
    If your values might contain spaces, you may also serialize them as a JSON array (`["foo", "bar"]`).
  @stable
  */
  up.compiler('[up-switch]', (switcher) => {
    return new up.Switcher(switcher).start()
  })

  // up.on('change', '[up-switch]', (_event, switcher) => {
  //   switchTargets(switcher)
  // })
  //
  // up.compiler(unswitchedSwitchTargetSelector, (element) => {
  //   switchTarget(element)
  // })

  /*-
  Watches form fields and runs a callback when a value changes.

  Only fields with a `[name]` attribute can be watched.

  The programmatic variant of this is the [`up.watch()`](/up.watch) function.

  ## Example

  The following would log a message whenever the `<input>` changes:

  ```html
  <input name="query" up-watch="console.log('New value', value)">
  ```

  ## Callback context

  The script given to `[up-watch]` runs with the following context:

  @include watch-callback-arguments

  ## Watching multiple fields

  You can set `[up-watch]` on any element to observe all contained fields.
  The `name` argument contains the name of the field that was changed:

  ```html
  <form>
    <div up-watch="console.log(`New value of ${name} is ${value}`)">
      <input type="email" name="email">
      <input type="password" name="password">
    </div>

    <!-- This field is outside the [up-watch] container and will not be watched -->
    <input type="text" name="screen-name">
  </form>
  ```

  You may also set `[up-watch]` on a `<form>` element to watch *all* fields in a form:

  ```html
  <form up-watch="console.log(`New value of ${name} is ${value}`)">
    <input type="email" name="email">
    <input type="password" name="password">
    <input type="text" name="screen-name">
  </form>
  ```

  ### Watching radio buttons

  Multiple radio buttons with the same `[name]` produce a single value for the form.

  To watch radio buttons group, use the `[up-watch]` attribute on an
  element that contains all radio button elements with a given name:

  ```html
  <div up-watch="console.log('New value is', value)">
    <input type="radio" name="format" value="html"> HTML format
    <input type="radio" name="format" value="pdf"> PDF format
    <input type="radio" name="format" value="txt"> Text format
  </div>
  ```

  ## Async callbacks

  When your callback does async work (like fetching data over the network) it must return a promise
  that settles once the work concludes:

    ```html
  <input name="query" up-watch="return asyncWork()"> <!-- mark-phrase "return" -->
  ```

  Unpoly will guarantee that only one async callback is running concurrently.
  If the form is changed while an async callback is still processing, Unpoly will wait
  until the callback concludes and then run it again with the latest field values.

  @selector [up-watch]

  @section Callback
    @param up-watch
      The code to run when any field's value changes.

      See [callback context](#callback-context).

  @section Event source
    @mix up-watch/event-source

  @stable
  */

  up.attribute('up-watch', (formOrField) => watch(formOrField))

  /*-
  Automatically submits a form when a field changes.

  The programmatic variant of this is the [`up.autosubmit()`](/up.autosubmit) function.

  ## Example

  The following would automatically submit the form when the `query` field is changed:

  ```html
  <form method="GET" action="/search">
    <input type="search" name="query" up-autosubmit> <!-- mark-phrase "up-autosubmit" -->
    <input type="checkbox" name="archive"> Include archived
  </form>
  ```

  ## Auto-submitting multiple fields

  You can set `[up-autosubmit]` on any element to submit the form when a contained field changes.

  For instance, to auto-submit a form when any field changes, set the `[up-autosubmit]` on the `<form>` element:

  ```html
  <form method="GET" action="/search" up-autosubmit>
    <input type="search" name="query">
    <input type="checkbox" name="archive"> Include archived
  </form>
  ```

  ## Auto-submitting radio buttons

  Multiple radio buttons with the same `[name]` (a radio button group)
  produce a single value for the form.

  To auto-submit group of radio buttons, use the `[up-autosubmit]` attribute on an
  element containing the entire button group:

  ```html
  <div up-autosubmit>
    <input type="radio" name="format" value="html"> HTML format
    <input type="radio" name="format" value="pdf"> PDF format
    <input type="radio" name="format" value="txt"> Text format
  </div>
  ```

  @selector [up-autosubmit]

  @section Event source
    @mix up-watch/event-source

  @section Loading state
    @mix up-watch/loading-state

  @stable
  */
  up.attribute('up-autosubmit', (formOrField) => autosubmit(formOrField))

  return {
    config,
    submit,
    submitOptions,
    destinationOptions,
    watchOptions,
    isSubmittable,
    watch,
    validate,
    autosubmit,
    fieldSelector,
    fields: findFields,
    trackFields,
    isField,
    submitButtons: findSubmitButtons,
    focusedField,
    // switchTarget,
    // disableWhile,
    disableTemp: disableContainerTemp,
    setDisabled: setContainerDisabled,
    getDisablePreviewFn,
    // handleDisableOption,
    group: findGroup,
    groupSolution: findGroupSolution,
    groupSelectors: getGroupSelectors,
    get: getForm,
    getScope,
  }
})()

up.submit = up.form.submit
up.watch = up.form.watch
up.autosubmit = up.form.autosubmit
up.validate = up.form.validate
