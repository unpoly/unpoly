/*-
Forms
=====

The `up.form` module helps you work with non-trivial forms.

@see submitting-forms
@see validation
@see switching-form-state
@see reactive-server-forms
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

  @section Submittable forms

    @param {Array<string>} [config.submitSelectors]
      An array of CSS selectors matching forms that will be [submitted through Unpoly](/submitting-forms).

      You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute:

      ```js
      up.form.config.submitSelectors.push('form')
      ```

      Individual forms may opt out with an `[up-submit=false]` attribute.
      You may configure additional exceptions in `config.noSubmitSelectors`.

    @param {Array<string>} [config.noSubmitSelectors]
      Exceptions to `up.form.config.submitSelectors`.

      Matching forms will *not* be [submitted through Unpoly](/submitting-forms),
      even if they match `up.form.config.submitSelectors`.

  @section Form elements

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

      If no good selector can be derived from the group element, the resulting target will
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

    @param {Function(string): boolean|boolean} [config.arrayParam]
      Whether a param name is treated as an array with multiple values.

      By default, only field names ending in `"[]"` are treated as arrays.
      You can configure another function that accepts a param name and returns a `boolean`.

      If set to `true` then all fields are handled as arrays and functions like
      `up.watch()` always get the value passed as an array.

      @experimental

  @section Watching fields

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

  @section Validation

    @param {boolean} [config.validateBatch=true]
      Whether to [batch validations](/up.validate#batching).

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
    validateBatch: true,
    watchInputEvents: ['input', 'change'],
    watchInputDelay: 0,
    watchChangeEvents: ['change'],
    watchableEvents: ['input', 'change'],
    arrayParam: (name) => name.endsWith('[]'),
  }))

  function findFormElements(root, selectorFn) {
    root = e.get(root) // unwrap jQuery
    let elements = e.subtree(root, selectorFn())

    // If findFormElements() is called with an entire form, gather fields outside the form
    // element that are associated with the form (through <input form="id-of-form">, which
    // is an HTML feature.)
    if (root.matches('form[id]')) {
      const formReference = e.attrSelector('form', root.getAttribute('id'))
      const externalElementsSelector = selectorFn(formReference)
      const externalElements = up.fragment.all(externalElementsSelector, { layer: root })
      elements = u.uniq([...elements, ...externalElements])
    }

    return elements
  }

  const [fieldSelector, isField] = config.selectorFns('fieldSelectors')

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
  @stable
  */
  function findFields(root) {
    return findFormElements(root, fieldSelector)
  }

  function findFieldsAndButtons(container) {
    return [
      ...findFields(container),
      ...findSubmitButtons(container),
      ...findGenericButtons(container),
    ]
  }

  const [submitButtonSelector, isSubmitButton] = config.selectorFns('submitButtonSelectors')

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
    return findFormElements(root, submitButtonSelector)
  }

  const genericButtonSelector = config.selectorFn('genericButtonSelectors')

  function findGenericButtons(root) {
    return findFormElements(root, genericButtonSelector)
  }

  /*-
  Submits a form via AJAX and updates a page fragment with the response.

  Instead of loading a new page, the form is submitted via AJAX.
  The response is parsed for a CSS selector and the matching elements will
  replace corresponding elements on the current page.

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
      @param options.failTarget
        The [target selector](/targeting-fragments) to update when the server responds with an error code.

        By default, failed responses will update the `<form>` element itself.

        @see failed-responses

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
  // result: { url: /foo', method: 'POST', target: '.content', ... }'
  ```

  @param {Element|jQuery|string} form
    The form for which to parse render options.
  @param {Object} [options]
    Additional options for the form submission.

    Values from these options will override any attributes set on the given form element.

    @internal
  @function up.form.submitOptions
  @return {Object}
    The parsed submit options.
  @stable
  */
  function submitOptions(form, options, parserOptions) {
    form = up.fragment.get(form)
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

    Object.assign(options, submitButtonOverrides(options.submitButton))

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

    parserOptions.closest ??= true
    parserOptions.attrPrefix ??= 'up-watch-'

    let parser = new up.OptionsParser(field, options, parserOptions)

    parser.include(up.status.statusOptions, parserOptions)
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

  function validateOptions(field, options, parserOptions = {}) {
    options = u.options(options)
    let parser = new up.OptionsParser(field, options, { ...parserOptions, closest: true, attrPrefix: 'up-validate-' })
    parser.string('url')
    parser.string('method', { normalize: u.normalizeMethod })
    parser.boolean('batch', { default: config.validateBatch })
    parser.json('params')
    parser.json('headers')
    // parser.include(destinationOptions)
    parser.include(watchOptions, { defaults: { event: 'change' } })
    return options
  }

  /*-
  Disables all fields and buttons within the given element.

  To automatically disable a form when it is submitted, add the [`[up-disable]`](/up-submit#up-disable)
  property to the `<form>` element.

  Returns a function that re-enables the elements that were disabled.

  ## Dealing with focus loss

  When a focused field is disabled, it will lose focus.

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
    let originScope = () => getRegion(origin)

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
    const paramParts = [
      up.Params.fromForm(form),
      e.jsonAttr(form, 'up-params'),
    ]

    const headerParts = [
      e.jsonAttr(form, 'up-headers'),
    ]

    // (1) When processing a `submit` event, we may have received a { submitButton: event.submitter } option.
    // (2) When the user submits the form from a focused input via Enter, the browser will also submit
    //     with the first submit button set as submitter.
    // (3) For pragmatic calls of up.submit(), we assume the first submit button.
    const submitButton = (options.submitButton ??= findSubmitButtons(form)[0])
    if (submitButton) {
      // Submit buttons with a [name] attribute will add to the params.
      // Note that addField() will only add an entry if the given button has a [name] attribute.
      paramParts.push(
        up.Params.fromFields(submitButton),
        e.jsonAttr(submitButton, 'up-params')
      )

      headerParts.push(
        e.jsonAttr(submitButton, 'up-headers')
      )

      // Submit buttons may have [formmethod] and [formaction] attribute
      // that override [method] and [action] attribute from the <form> element.
      options.method ||= submitButton.getAttribute('formmethod')
      options.url ||= submitButton.getAttribute('formaction')
    }

    // We merge any { params } option into the params that we got from the form elements.
    options.params = up.Params.merge(
      ...paramParts,
      options.params,
    )

    // We merge any { headers } option to the headers that we got from the form elements.
    options.headers = u.merge(
      ...headerParts,
      options.headers,
    )

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

  function submitButtonOverrides(submitButton) {
    if (!submitButton) return {}
    let followOptions = up.link.followOptions(submitButton, {}, { defaults: false })
    // The parsing of [formmethod] and [formaction] (into { method, url })
    // already happens in destinationOptions()
    return u.omit(followOptions, ['method', 'url', 'guardEvent', 'origin', 'params', 'headers'])
  }

  /*-
  This event is [emitted](/up.emit) when a form is [submitted](/up.submit) through Unpoly.

  When the form is being [validated](/up-validate), this event is not emitted.
  Instead, an `up:form:validate` event is emitted.

  ## Changing render options

  Listeners may inspect and manipulate [render options](/up.render#parameters) for the coming fragment update.

  The code below will use a custom [transition](/up-transition)
  when a form submission [fails](/failed-responses):

  ```js
  up.on('up:form:submit', function(event) {
    event.renderOptions.failTransition = 'shake'
  })
  ```

  @event up:form:submit

  @section Submission

    @param {Element} event.form
      The form that is being submitted.

    @param {up.Params} event.params
      The [form parameters](/up.Params) that will be send as the form's request payload.

      Listeners may inspect and modify params before they are sent.

    @param {Element} [event.submitButton]
      The button used to submit the form.

      If no button was pressed directly (e.g., the user pressed `Enter` inside a focused text field),
      this returns the first submit button.

      If the form has no submit buttons, this property is `undefined`.

    @param {Element} event.target
      The element that caused the form submission.

      This is usually a submit button or a focused field from which the user pressed `Enter`.
      If the element is not known, the event is emitted on the `<form>` element.

  @section Render pass

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
  using `up.watch()` comes with a number of quality of life improvements:

  - The callback only runs when a value was actually changed. Multiple events resulting in the same value will only run the callback once.
  - The callback's execution frequency can be [debounced](/watch-options#debouncing).
  - Guarantees that [only one async callback is running concurrently](#async-callbacks).

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
  up.watch('input.query', function(value, name, options) { // mark: options
    return up.reload('main', { ...options, params: { query: value }}) // mark: options
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

  When your callback does async work (like fetching data over the network), it should return a promise
  that settles once the work concludes:

  ```js
  up.watch('input.query', function(value, name, options) {
    let url = '/search?query=' + escapeURIFragment(value)
    return up.render('.results', { url, ...options }) // mark: return
  })
  ```

  Unpoly will guarantee that only one async callback is running concurrently.
  If the form is changed while an async callback is still processing, Unpoly will wait
  until the callback concludes and then run it again with the latest field values.

  You can also return a promise by using `async` / `await`:

  ```js
  up.watch('input.query', async function(value, name, options) { // mark: async
    let url = '/search?query=' + escapeURIFragment(value)
    await up.render('.results', { url, ...options }) // mark: await
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

  @section Observed events
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
    return up.script.callbackAttr(element, 'up-watch', { argNames: ['value', 'name', 'options'] })
  }

  /*-
  Automatically submits a form when a field changes.

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

  @section Observed events
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
    return watch(target, { logPrefix: 'up.autosubmit()', ...options, batch: true }, onChange)
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

  ## Example

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
  Marks this element as a form group, which (usually) contains a label, input and error message.

  You are not required to use form groups to [submit forms through Unpoly](/submitting-forms).
  However, structuring your form into groups will help Unpoly make smaller changes to the DOM when
  working with complex forms. For instance, when [validating](/validation#validating-after-changing-a-field) a field,
  Unpoly will re-render the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
  form group around that field.

  By default Unpoly will also consider a `<fieldset>` or `<label>` around a field to be a form group.
  You can configure this in `up.form.config.groupSelectors`.

  ## Example

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
  update [dependent elements](/reactive-server-forms).

  Typical use cases are to [show validation errors](/validation#validating-after-changing-a-field)
  after a field was changed or to update forms where one field depends on the value of another.

  `up.validate()` submits the given element's form with an additional `X-Up-Validate`
  HTTP header. Upon seeing this header, the server is expected to validate (but not commit)
  the form submission and render a new form state. See [this example](/up-validate#backend-protocol)
  for control flow on the server.

  To automatically update a form after a field was changed, use the `[up-validate]` attribute.
  You may combine `[up-validate]` and `up.validate()` within the same form. In order to reduce
  requests, their updates will be [batched together](#batching).

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

  In order to reduce requests, multiple calls of `up.validate()` within the same
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

  When a validation request is already in flight,
  additional validations are [queued](/reactive-server-forms#race-conditions).
  When the current request has loaded, queued validations are batched using
  the same rules as outlined above.

  ### Batching with multiple URLs {#batching-multiple-urls}

  Even with multiple URLs, only a single validation request per form will be in flight at the same time.

  Batches will be partitioned by URL. Batch requests are sent in sequence, with no concurrency.
  Additional validations are queued until the current batch request has loaded.

  For instance, let's assume the following four validations are queued:

  ```js
  up.validate('.foo', { url: '/path1' })
  up.validate('.bar', { url: '/path2' })
  up.validate('.baz', { url: '/path1' })
  up.validate('.qux', { url: '/path2' })
  ```

  This will send a sequence of two requests:

  1. A request to `/path1` targeting `.foo, .baz`. The other validations are queued.
  2. Once that request finishes, a second request to `/path2` targeting `.bar, .qux`.

  ### Disabling batching {#batching-disable}

  By disabling batching, Unpoly will send individual requests for each call to `up.validate()`
  and for each change of an `[up-validate]` field. Additional validations are queued until the
  current validation request has loaded.

  There are multiple ways to disable batching:

  - Globally by configuring `up.form.config.validateBatch = false`.
  - Setting an [`[up-validate-batch]`](/up-validate) attribute on the element with `[up-validate]`.
  - Passing an option `up.validate(element, { batch: false })`.

  ## Preventing race conditions

  Unpoly guarantees that many concurrent validations will eventually show a consistent form state,
  regardless of how fast the user clicks or how slow the network is.

  See [preventing race conditions](/reactive-server-forms#race-conditions) for details.

  @function up.validate

  @section Targeting
    @param {string|Element|jQuery} element
      The field or fragment that should be re-rendered on the server.

      See [controlling what is updated](#controlling-what-is-updated).

    @param {string} [options.target=element]
      The [target selector](/targeting-fragments) to re-render.

      By default, the given `element` will be rendered.
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
      In this case Unpoly will try to merge render options where possible (e.g. `{ headers, target }`).
      When a render option cannot be merged (e.g. `{ scroll }`),
      the option from the last validation in the batch will be used.

  @section Client state
    @mix up.reload/client-state

  @section Request
    @param {string} options.url
      The URL to which to submit the validation request.

      By default, Unpoly will use the form's `[action]` attribute.

      See [Validating against other URLs](/up-validate#urls).

    @param {string} options.method
      The method to use for submitting the validation request.

      By default, Unpoly will use the form's `[method]` attribute.

      See [Validating against other URLs](/up-validate#urls).

    @param {boolean} [options.batch=true]
      Whether to [consolidate multiple validations into a single request](/up.validate#batching).

      Defaults to `up.form.config.validateBatch`, which defaults to `true`.

    @param options.params
      @like up.submit

    @param options.headers
      @like up.submit

  @section Loading state
    @mix up.submit/loading-state

  @return {Promise<up.RenderResult}
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

  Listeners can [inspect](#properties), [modify](#event.renderOptions), or [prevent](#event.preventDefault)
  the render pass that will load and show the validation results.

  @event up:form:validate

  @section Validation

    @param {Element} event.target
      The form that is being validated.

    @param {Element} event.form
      The form that is being validated.

    @param {up.Params} event.params
      The [form parameters](/up.Params) that will be sent as the form's request payload.

      Listeners may inspect and modify params before they are sent.
      Note that the request may be a [batch of multiple validations](/up.validate#batching).

    @param {List<Element>} event.fields
      The [form fields](/up.form.fields) that triggered this validation pass.

      When multiple fields are validating within the same [task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/),
      Unpoly will make a [single validation request with multiple targets](/up.validate#batching).

      The names of the validating fields are also sent
      as an `X-Up-Validate` request header.

      @experimental

  @section Render pass

    @param {Object} event.renderOptions
      An object with [render options](/up.render#parameters) for the fragment update
      that will show the validation results.

      Listeners may inspect and modify these options.

      Note that the request may be a [batch of multiple validations](/up.validate#batching).
      In that case `event.renderOptions` will contain the merged render options
      for every targeted fragment. Unpoly will try to merge render options where possible (e.g. `{ headers, target }`).
      When a render option cannot be merged (e.g. `{ scroll }`),
      the option from the last validation in the batch will be used.

    @param event.preventDefault()
      Prevents the validation request from being sent to the server.

  @stable
  */

  function getForm(element) {
    return getLiteralForm(element) || getClosestForm(element) || getAssociatedForm(element)
  }

  function getLiteralForm(element) {
    // We're making a lot of calls to getForm() and getRegion().
    // For performance reasons we want to return a literal <form> without further DOM look-ups.
    if (element instanceof HTMLFormElement) return element
  }

  function getClosestForm(element) {
    // Return the closest form for vanilla fields, or any non-field element within a form (like a form group).
    return element.closest('form')
  }

  function getAssociatedForm(element) {
    // We support fields without a <form> ancestor, which are associated via an [form] attribute.
    // We could use element's { form } property, but that is not layer-aware. It will always return
    // the first form with a matching [id].
    let formID = element.getAttribute('form')
    if (formID) {
      let selector = 'form' + e.idSelector(formID)
      return up.fragment.get(selector, { layer: element })
    }
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
  function getRegion(origin) {
    return getOriginRegion(origin) || up.layer.current.element
  }

  function getOriginRegion(origin) {
    if (origin) {
      return getForm(origin) || up.layer.get(origin)?.element
    }
  }

  /*-
  @function up.form.trackFields
  @param {Element} root
    A form or a container element within a form.
  @param {Function(Element): boolean} options.guard
    Optional, additional condition whether a field matches.
  @param {Function(Element): Function(Element)} callback
    A callback that is called when we discover a new match.
    The callback can return another function that is called when that field no longer matches.
  @internal
  */
  const trackFields = up.mockable(function(...args) {
    let [root, { guard }, callback] = u.args(args, 'val', 'options', 'callback')

    let filter = function(fields) {
      let region = getRegion(root)
      return u.filter(fields, function(field) {
        return (root === region || root.contains(field))
          && (getRegion(field) === region) // will also match external fields with [form]
          && (!guard || guard(field)) // user-provided condition
      })
    }

    return up.fragment.trackSelector(fieldSelector(), { filter }, callback)
  })

  function focusedField() {
    return u.presence(document.activeElement, isField)
  }

  /*-
  Returns whether the given form will be [submitted](/submitting-forms) through Unpoly
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

  [Submitting forms](/submitting-forms){:.article-ref}

  ## Example

  This will submit the form in-page and update a fragment matching `#success`:

  ```html
  <form method="post" action="/users" up-submit up-target="#success"> <!-- mark: up-submit -->
    ...
  </form>

  <div id="success">
    <!-- chip: Content will appear here -->
  </div>
  ```

  See [Submitting forms](/submitting-forms) for elaborate examples.

  ## Input validation

  When the form could not be submitted due to invalid user input,
  Unpoly can re-render the form with validation errors.

  See [Validating forms](/validation) for details and examples.

  ## Short notation

  You may omit the `[up-submit]` attribute if the form has one of the following attributes:

  - [`[up-target]`](#up-target)
  - [`[up-layer]`](#up-layer)
  - [`[up-transition]`](#up-transition)

  @selector [up-submit]

  @params-note
    Most of these attributes can also be [set on the submit button](/submitting-forms#submit-buttons).

  @section Targeting
    @mix up-follow/targeting
      @param up-target
        The [target selector](/targeting-fragments) to update for a successful form submission.

      @param up-fail-target
        The [target selector](/targeting-fragments) to update when the server responds with an error code.

        By default, failed responses will update the `<form>` element itself.

        @see failed-responses

  @section Navigation
    @mix up-follow/navigation

  @section Request
    @param action
      Where to send the form data when the form is submitted.

    @param method
      The HTTP method to use for the request.

      The value is case-insensitive.

      You can also use methods that would not be allowed on a `<form>` element,
      such as `'patch'` or `'delete'`. These will be [wrapped in a POST request](/up.network.config#config.wrapMethod).

    @mix up-follow/request-extras
      @param up-params
        Additional [Form parameters](/up.Params) that should be sent as the request's
        [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

        The given value will be added to params [parsed](/up.Params.fromForm)
        from the form's input fields. If a param with the same name already
        existed in the form, it will be deleted and overridden with the given value.

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

  @section Client state
    @mix up-follow/client-state

  @section Lifecycle hooks
    @mix up-follow/lifecycle-hooks

  @stable
  */

  up.on('submit', config.selectorFn('submitSelectors'), function(event, form) {
    // We pass on the event.submitter prop as a { submitButton } prop.
    // Otherwise submitOptions() would default to the first submit button.
    const submitButton = u.presence(event.submitter, isSubmitButton)

    // Allow individual submit buttons from opting out of Unpoly handling.
    if (submitButton?.getAttribute('up-submit') === 'false') return

    // Don't handle a form that's already been handled by foreign code.
    if (event.defaultPrevented) return

    up.event.halt(event, { log: true })
    up.error.muteUncriticalRejection(submit(form, { submitButton }))
  })

  /*-
  Controls the state of another element when this field changes.

  [Switching form state](/switching-form-state){:.article-ref}

  ## Example

  The controlling form field gets an `[up-switch]` attribute with a selector for the elements to show or hide:

  ```html
  <select name="level" up-switch=".level-dependent"> <!-- mark: up-switch=".level-dependent" -->
    <option value="beginner">beginner</option>
    <option value="intermediate">intermediate</option>
    <option value="expert">expert</option>
  </select>
  ```

  The target elements can choose how to alter their state after the controlling field changes.
  For example, the `[up-show-for]` will show an element while the field has one of the given values:

  ```html
  <div class="level-dependent" up-show-for="beginner"> <!-- mark: up-show-for="beginner" -->
    shown for beginner level, hidden for other levels
  </div>
  ```

  There are other attributes like `[up-hide-for]`, `[up-disable-for]` or `[up-enable-for]`.
  You can also [implement custom switching effects](/switching-form-state#custom-effects).

  @selector [up-switch]

  @section Dependencies
    @param up-switch
      A CSS selector for elements whose state depends on this field's value.

    @param [up-switch-region='form']
      A selector for the region in which elements are switched.

      By default all matching elements within the form are switched.
      You can expand or narrow the search scope by configuring a different selector.

  @section Observed events
    @mix up-watch/observed-events

  @stable
  */
  up.compiler('[up-switch]', (switcher) => {
    return new up.Switcher(switcher).start()
  })

  /*-
  When an `[up-switch]` field changes, this event is emitted on all dependent elements.

  You can listen to `up:form:switch` to implement [custom switching effects](/switching-form-state#custom-effects).

  [Switching form state](/switching-form-state){:.article-ref}

  ## Event targets

  This event is *not* emitted on the switching field. Instead each element matching the switch selector will receive an `up:form:switch` event:

  ```html
  <!-- Switching field won't receive an event on change -->
  <select name="role" up-switch=".role-dependent">
    <option value="trainee">Trainee</option>
    <option value="manager">Manager</option>
  </select>

  <!-- Dependent field will receive up:form:switch -->
  <input class="role-dependent" name="department">

  <!-- Dependent field will receive up:form:switch -->
  <input class="role-dependent" name="budget">
  ```

  ## Timing

  The `up:form:switch` is emitted at the following times:

  - when the switching field is initially rendered.
  - after a switching field has changed its value.
  - after a switching checkbox was checked or unchecked.
  - when a new selector match enters the form.
  - when a [kept](/up-keep) `[up-switch]` field is transported to a new form.

  @event up:form:switch

  @param {Element} event.target
    The dependent element matching the `[up-switch]` selector.

    If multiple elements match the selector, this event is emitted once for
    each match.

  @param {Element} event.field
    The controlling `[up-switch]` field.

  @param {Array<string>} event.fieldTokens
    An array describing the state of the controlling `[up-switch]` field.

    The array contains:

    - The field's value.
    - A pseudo-value [`:blank` or `:present`](/switching-form-state#presence), depending on the field's value.
    - For [checkboxes](/switching-form-state#checkboxes), a pseudo-value `:checked` or `:unchecked`.

    @experimental

  @stable
  */

  /*-
  Only shows this element if an input field with `[up-switch]` has one of the given values.

  The element will be hidden for all other values.

  [Switching visibility](/switching-form-state){:.article-ref}

  @selector [up-show-for]
  @param [up-show-for]
    A list of input values for which this element should be shown.

    @include switch-token-serialization
  @stable
  */

  /*-
  Hides this element while an input field with `[up-switch]` has one of the given values.

  The element will be shown for all other values.

  [Switching visibility](/switching-form-state#toggle){:.article-ref}

  @selector [up-hide-for]
  @param [up-hide-for]
    A list of input values for which this element should be hidden.

    @include switch-token-serialization
  @stable
  */

  /*-
  Disables this element while an input field with `[up-switch]` has one of the given values.

  The element will be enabled for all other values.

  [Switching disabled state](/switching-form-state#disable){:.article-ref}

  @selector [up-disable-for]
  @param [up-disable-for]
    A list of input values for which this element should be disabled.

    @include switch-token-serialization
  @stable
  */

  /*-
  Enables this element while an input field with `[up-switch]` has one of the given values.

  The element will be disabled for all other values.

  [Switching disabled state](/switching-form-state#disable){:.article-ref}

  @selector [up-enable-for]
  @param [up-enable-for]
    A list of input values for which this element should be enabled.

    @include switch-token-serialization
  @stable
  */

  /*-
  Watches form fields and runs a callback when a value changes.

  Only fields with a `[name]` attribute can be watched.

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

  ## Watching radio buttons

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

  When your callback does async work (like fetching data over the network), it must return a promise
  that settles once the work concludes:

    ```html
  <input name="query" up-watch="return asyncWork()"> <!-- mark: return -->
  ```

  Unpoly will guarantee that only one async callback is running concurrently.
  If the form is changed while an async callback is still processing, Unpoly will wait
  until the callback concludes and then run it again with the latest field values.

  @selector [up-watch]

  @section Callback
    @param up-watch
      The code to run when any field's value changes.

      See [callback context](#callback-context).

  @section Observed events
    @mix up-watch/observed-events

  @stable
  */

  up.attribute('up-watch', (formOrField) => watch(formOrField))

  /*-
  Renders a new form state when a field changes, to [show validation errors](/validation#validating-after-changing-a-field) or
  update [dependent elements](/reactive-server-forms).

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

    <fieldset> <!-- mark: <fieldset> -->
      <label for="email">E-mail</label>
      <input type="text" id="email" name="email">
    </fieldset> <!-- mark: </fieldset> -->

    <fieldset> <!-- mark: <fieldset> -->
      <label for="password">Password</label>
      <input type="password" id="password" name="password">
    </fieldset> <!-- mark: </fieldset> -->

    <button type="submit">Register</button>

  </form>
  ```

  We have some data constraints that we want to validate as the user is filling in fields:

  - When the user changes the `email` field, we want to validate that the e-mail address
    is formatted correctly and is still available.
  - When the user changes the `password` field, we want to validate
    the minimum password length.

  If validation fails, we want to show validation errors *as soon as the user blurs the field*.

  We're going to render validation errors using the following HTML:

    ```html
  <form action="/users">

    <fieldset>
      <label for="email">E-mail</label>
      <input type="text" id="email" name="email" value="foo@bar.com" up-validate>
      <div class="error">E-mail has already been taken!</div> <!-- mark-line -->
    </fieldset>

    <fieldset>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" value="secret" up-validate>
      <div class="error">Password is too short!</div> <!-- mark-line -->
    </fieldset>

  </form>
  ```

  We can implement this by giving both fields an `[up-validate]` attribute:

  ```html
  <form action="/users">

    <fieldset>
      <label for="email">E-mail</label>
      <input type="text" id="email" name="email" up-validate> <!-- mark: up-validate -->
    </fieldset>

    <fieldset>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" up-validate> <!-- mark: up-validate -->
    </fieldset>

    <button type="submit">Register</button>

  </form>
  ```

  Whenever a field with `[up-validate]` changes, the form is submitted to its `[action]` path
  with an additional `X-Up-Validate` HTTP header.

  Read on to learn [how a validation request is sent to the server](#backend-protocol),
  and
  [how the server response is displayed](#how-validation-results-are-displayed).

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
  Until now, the backend only had to handle two cases:

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
  showing eventual validation errors and updating [dependent elements](/reactive-server-forms):

  ```html
  <form action="/users">

    <fieldset>
      <label for="email">E-mail</label>
      <input type="text" id="email" name="email" value="foo@bar.com" up-validate>
      <div class="error">E-mail has already been taken!</div> <!-- mark-line -->
    </fieldset>

    <fieldset>
      <label for="password">Password</label>
      <input type="password" id="password" name="password" value="secret" up-validate>
      <div class="error">Password is too short!</div> <!-- mark-line -->
    </fieldset>

  </form>
  ```

  ## How validation results are displayed

  `[up-validate]` always submits the entire form with its current field values to the form's
  `[action]` path. Typically, only a fragment of the form is updated with the response.
  This minimizes the chance for loss of transient state like scroll positions, cursor selection,
  or user input while the request is in flight.

  By default, Unpoly will only update the closest [form group](/up-form-group)
  around the validating field. In the [example above](#marking-fields-for-validation),
  after changing the `email` field, only the `<fieldset>` around the field will be updated.

  If the form is not structured into groups, the entire
  form will be updated.


  ### Updating a different fragment {#target}

  If you don't want to update the field's form group, you can set the `[up-validate]`
  attribute to any [target selector](/targeting-fragments):

  ```html
  <input name="email" up-validate=".email-errors"> <!-- mark: up-validate=".email-errors" -->
  <div class="email-errors"></div>
  ```

  You may [update multiple fragments](/targeting-fragments#multiple)
  by separating their target selectors with a comma:

  ```html
  <input name="email" up-validate=".email-errors, .base-errors"> <!-- mark: up-validate=".email-errors, .base-errors" -->
  ```

  To update another fragment *in addition* to the field's form group, include
  the group in the target list.\
  You can refer to the changed field as `:origin`:

  ```html
  <fieldset>
    <input name="email" up-validate="fieldset:has(:origin), .base-errors"> <!-- mark: up-validate="fieldset:has(:origin), .base-errors" -->
  </fieldset>
  ```

  ## Updating dependent elements

  The `[up-validate]` attribute is a useful tool to partially update a form
  when an element depends on the value of another field.

  See [Reactive server forms](/reactive-server-forms) for more details and examples.


  ## Validating while typing

  @include validating-while-typing


  ## Preventing race conditions

  Custom dynamic form implementations will often exhibit race conditions, e.g., when the user
  is quickly changing fields while requests are still in flight.
  Such issues are solved with `[up-validate]`. The form will eventually show a consistent state,
  regardless of how fast the user clicks or how slow the network is.

  See [preventing race conditions](/reactive-server-forms#race-conditions) for more details.

  ## Validating multiple fields

  You can set `[up-validate]` on any element to validate *all contained fields* on change.

  In the [example above](#marking-fields-for-validation),
  instead of setting `[up-validate]` on each individual `<input>`, we can also set it on the `<form>`:

  ```html
  <form action="/users" up-validate> <!-- mark: up-validate -->

    <fieldset>
      <label for="email">E-mail</label>
      <input type="text" id="email" name="email"> <!-- chip "will validate" -->
    </fieldset>

    <fieldset>
      <label for="password">Password</label>
      <input type="password" id="password" name="password"> <!-- chip "will validate" -->
    </fieldset>

    <button type="submit">Register</button>

  </form>
  ```

  You can also set `[up-validate]` on an intermediate container to only validate its children:


  ```html
  <form action="/users">

    <div up-validate> <!-- mark: up-validate -->
      <fieldset>
        <label for="email">E-mail</label>
        <input type="text" id="email" name="email"> <!-- chip "will validate" -->
      </fieldset>

      <fieldset>
        <label for="password">Password</label>
        <input type="password" id="password" name="password"> <!-- chip "will validate" -->
      </fieldset>
    </div>

    <fieldset>
      <label for="name">Name</label>
      <input type="name" id="name" name="name"> <!-- chip "will NOT validate" -->
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

  ## Validating against other URLs {#urls}

  By default, validation requests will use `[method]` and `[action]` attributes from the form element.

  You can validate against another server endpoint by setting `[up-validate-url]`
  and `[up-validate-method]` attributes:

  ```html
  <form method="post" action="/order" up-validate-url="/validate-order"> <!-- mark: up-validate-url="/validate-order" -->
    ...
  </form>
  ```

  To have individual fields validate against different URLs, you can also set `[up-validate-url]` on a field:

  ```html
  <form method="post" action="/register">
    <input name="email" up-validate-url="/validate-email"> <!-- mark: up-validate-url="/validate-email" -->
    <input name="password" up-validate-url="/validate-password"> <!-- mark: up-validate-url="/validate-password" -->
  </form>
  ```

  Multiple validations to the same URL will be [batched together](/up.validate#batching).


  ## Programmatic validation

  To update form fragments from your JavaScript, use the [`up.validate()`](/up.validate) function.
  You may combine `[up-validate]` and `up.validate()` within the same form. Their updates
  will be [batched together](/up.validate#batching) in order to
  [prevent race conditions](/reactive-server-forms#race-conditions).


  @selector [up-validate]

  @section Targeting
    @param [up-validate]
      The [target selector](/targeting-fragments) to update with the server response.

      Defaults the closest [form group](/up-form-group) around the validating field.

      You can set another selector to [update a different fragment](/up-validate#target).
      To refer to the changed field, use the `:origin` pseudo-selector.

  @section Observed events
    @mix up-watch/observed-events
      @param [up-watch-event='change']

  @section Request
    @param [up-validate-url]
      The URL to which to submit the validation request.

      By default, Unpoly will use the form's `[action]` attribute.

      See [Validating against other URLs](/up-validate#urls).

    @param [up-validate-method]
      The method to use for submitting the validation request.

      By default, Unpoly will use the form's `[method]` attribute.

      See [Validating against other URLs](/up-validate#urls).

    @param [up-validate-params]
      @like [up-submit]/up-params
      @experimental

    @param [up-validate-headers]
      A [relaxed JSON](/relaxed-json) object with additional request headers.

      By default, Unpoly will send an `X-Up-Validate` header so the server
      can [distinguish the validation request from a regular form submission](#backend-protocol).

      @experimental

    @param [up-validate-batch='true']
      Whether to [consolidate multiple validations into a single request](/up.validate#batching).

      Defaults to `up.form.config.validateBatch`, which defaults to `true`.

  @section Loading state
    @mix up-watch/loading-state


  @stable
  */
  up.compiler('[up-validate]', { rerun: true }, function(element) {
    // There are non-intuitive ways that an [up-validate] field can find its way into a <form>,
    // e.g. when the field is also [up-keep] and is transplanted into a new <form> later.
    let form = getForm(element)
    if (form) getFormValidator(form)
  })

  /*-
  Automatically submits a form when a field changes.

  ## Example

  The following would automatically submit the form when the `query` field is changed:

  ```html
  <form method="GET" action="/search">
    <input type="search" name="query" up-autosubmit> <!-- mark: up-autosubmit -->
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

  @section Observed events
    @mix up-watch/observed-events

  @section Loading state
    @mix up-watch/loading-state

  @stable
  */
  up.attribute('up-autosubmit', (formOrField) => autosubmit(formOrField, { logPrefix: '[up-autosubmit]' }))

  return {
    config,
    submit,
    submitOptions,
    destinationOptions,
    submitButtonOverrides,
    watchOptions,
    validateOptions,
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
    // disableWhile,
    disableTemp: disableContainerTemp,
    setDisabled: setContainerDisabled,
    getDisablePreviewFn,
    // handleDisableOption,
    group: findGroup,
    groupSolution: findGroupSolution,
    groupSelectors: getGroupSelectors,
    get: getForm,
    getRegion,
  }
})()

up.submit = up.form.submit
up.watch = up.form.watch
up.autosubmit = up.form.autosubmit
up.validate = up.form.validate
