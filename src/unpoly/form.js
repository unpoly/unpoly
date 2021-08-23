/*-
Forms
=====
  
The `up.form` module helps you work with non-trivial forms.

@see form[up-submit]
@see form[up-validate]
@see input[up-switch]
@see form[up-autosubmit]

@module up.form
*/
up.form = (function() {

  const u = up.util
  const e = up.element

  const ATTRIBUTES_SUGGESTING_SUBMIT = ['[up-submit]', '[up-target]', '[up-layer]', '[up-transition]']

  /*-
  Sets default options for form submission and validation.

  @property up.form.config

  @param {number} [config.observeDelay=0]
    The number of miliseconds to wait before [`up.observe()`](/up.observe) runs the callback
    after the input value changes. Use this to limit how often the callback
    will be invoked for a fast typist.

  @param {Array<string>} [config.submitSelectors]
    An array of CSS selectors matching forms that will be [submitted through Unpoly](/form-up-submit).

    You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute:

    ```js
    up.form.config.submitSelectors.push('form')
    ```

    Individual forms may opt out with an `[up-submit=follow]` attribute.
    You may configure additional exceptions in `config.noSubmitSelectors`.

  @param {Array<string>} [config.noSubmitSelectors]
    Exceptions to `config.submitSelectors`.

    Matching forms will *not* be [submitted through Unpoly](/form-up-submit), even if they match `config.submitSelectors`.

  @param {Array<string>} [config.validateTargets=['[up-fieldset]:has(&)', 'fieldset:has(&)', 'label:has(&)', 'form:has(&)']]
    An array of CSS selectors that are searched around a form field
    that wants to [validate](/up.validate).

    The first matching selector will be updated with the validation messages from the server.

    By default this looks for a `<fieldset>`, `<label>` or `<form>`
    around the validating input field.

  @param {string} [config.fieldSelectors]
    An array of CSS selectors that represent form fields, such as `input` or `select`.

  @param {string} [config.submitButtonSelectors]
    An array of CSS selectors that represent submit buttons, such as `input[type=submit]`.

  @stable
   */
  const config = new up.Config(() => ({
    validateTargets: ['[up-fieldset]:has(:origin)', 'fieldset:has(:origin)', 'label:has(:origin)', 'form:has(:origin)'],
    fieldSelectors: ['select', 'input:not([type=submit]):not([type=image])', 'button[type]:not([type=submit])', 'textarea'],
    submitSelectors: up.link.combineFollowableSelectors(['form'], ATTRIBUTES_SUGGESTING_SUBMIT),
    noSubmitSelectors: ['[up-submit=false]', '[target]'],
    submitButtonSelectors: ['input[type=submit]', 'input[type=image]', 'button[type=submit]', 'button:not([type])'],
    observeDelay: 0
  }))

  let abortScheduledValidate

  function fullSubmitSelector() {
    return config.submitSelectors.join(',')
  }

  function reset() {
    config.reset()
  }

  /*-
   @function up.form.fieldSelector
   @internal
   */
  function fieldSelector(suffix = '') {
    return config.fieldSelectors.map(field => field + suffix).join(',')
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
  @return {NodeList<Element>|Array<Element>}

  @experimental
  */
  function findFields(root) {
    root = e.get(root); // unwrap jQuery
    let fields = e.subtree(root, fieldSelector())

    // If findFields() is called with an entire form, gather fields outside the form
    // element that are associated with the form (through <input form="id-of-form">, which
    // is an HTML feature.)
    if (e.matches(root, 'form[id]')) {
      const outsideFieldSelector = fieldSelector(e.attributeSelector('form', root.getAttribute('id')))
      const outsideFields = e.all(outsideFieldSelector)
      fields.push(...outsideFields)
      fields = u.uniq(fields)
    }

    return fields
  }

  /*-
  @function up.form.submittingButton
  @param {Element} form
  @internal
  */
  function submittingButton(form) {
    const selector = submitButtonSelector()
    const focusedElement = document.activeElement
    if (focusedElement && e.matches(focusedElement, selector) && form.contains(focusedElement)) {
      return focusedElement
    } else {
      // If no button is focused, we assume the first button in the form.
      return e.get(form, selector)
    }
  }

  /*-
  @function up.form.submitButtonSelector
  @internal
  */
  function submitButtonSelector() {
    return config.submitButtonSelectors.join(',')
  }

  /*-
  Submits a form via AJAX and updates a page fragment with the response.

  Instead of loading a new page, the form is submitted via AJAX.
  The response is parsed for a CSS selector and the matching elements will
  replace corresponding elements on the current page.

  The unobtrusive variant of this is the `form[up-submit]` selector.
  See its documentation to learn how form submissions work in Unpoly.

  Submitting a form is considered [navigation](/navigation).

  Emits the event [`up:form:submit`](/up:form:submit).

  ### Example

  ```js
  up.submit('form.new-user', { target: '.main' })
  ```

  @function up.submit

  @param {Element|jQuery|string} form
    The form to submit.

    If the argument points to an element that is not a form,
    Unpoly will search its ancestors for the [closest](/up.fragment.closest) form.

  @param {Object} [options]
    [Render options](/up.render) that should be used for submitting the form.

    Unpoly will parse render options from the given form's attributes
    like `[up-target]` or `[up-transition]`. See `form[up-submit]` for a list
    of supported attributes.

    You may pass this additional `options` object to supplement or override
    options parsed from the form attributes.

  @param {boolean} [options.navigate=true]
    Whether this fragment update is considered [navigation](/navigation).

    Setting this to `false` will disable most defaults.

  @return {Promise<up.RenderResult>}
    A promise that will be fulfilled when the server response was rendered.

  @stable
  */
  const submit = up.mockable((form, options) => {
    return up.render(submitOptions(form, options))
  })

  /*-
  Parses the [render](/up.render) options that would be used to
  [`submit`](/up.submit) the given form, but does not render.

  ### Example

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

    Will override any attribute values set on the given form element.

    See `up.render()` for detailed documentation of individual option properties.
  @function up.form.submitOptions
  @return {Object}
  @stable
  */
  function submitOptions(form, options) {
    options = u.options(options)
    form = up.fragment.get(form)
    form = e.closest(form, 'form')
    const parser = new up.OptionsParser(options, form)

    // Parse params from form fields.
    const params = up.Params.fromForm(form)

    let submitButton = submittingButton(form)
    if (submitButton) {
      // Submit buttons with a [name] attribute will add to the params.
      // Note that addField() will only add an entry if the given button has a [name] attribute.
      params.addField(submitButton)

      // Submit buttons may have [formmethod] and [formaction] attribute
      // that override [method] and [action] attribute from the <form> element.
      options.method ||= submitButton.getAttribute('formmethod')
      options.url ||= submitButton.getAttribute('formaction')
    }

    params.addAll(options.params)
    options.params = params

    parser.string('url', {attr: 'action', default: up.fragment.source(form)})
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

    parser.string('failTarget', {default: up.fragment.toTarget(form)})

    // The guardEvent will also be assigned an { renderOptions } property in up.render()
    options.guardEvent ||= up.event.build('up:form:submit', {log: 'Submitting form'})

    // Now that we have extracted everything form-specific into options, we can call
    // up.link.followOptions(). This will also parse the myriads of other options
    // that are possible on both <form> and <a> elements.
    u.assign(options, up.link.followOptions(form, options))

    return options
  }

  /*-
  This event is [emitted](/up.emit) when a form is [submitted](/up.submit) through Unpoly.

  The event is emitted on the `<form>` element.

  When the form is being [validated](/input-up-validate), this event is not emitted.
  Instead an `up:form:validate` event is emitted.

  ### Changing render options

  Listeners may inspect and manipulate [render options](/up.render) for the coming fragment update.

  The code below will use a custom [transition](/a-up-transition)
  when a form submission [fails](/server-errors):

  ```js
  up.on('up:form:submit', function(event, form) {
    event.renderOptions.failTransition = 'shake'
  })
  ```

  @event up:form:submit
  @param {Element} event.target
    The `<form>` element that will be submitted.
  @param {Object} event.renderOptions
    An object with [render options](/up.render) for the fragment update

    Listeners may inspect and modify these options.
  @param event.preventDefault()
    Event listeners may call this method to prevent the form from being submitted.
  @stable
  */

  // MacOS does not focus buttons on click.
  // That means that submittingButton() cannot rely on document.activeElement.
  // See https://github.com/unpoly/unpoly/issues/103
  up.on('up:click', submitButtonSelector, function (event, button) {
    // Don't mess with focus unless we know that we're going to handle the form.
    // https://groups.google.com/g/unpoly/c/wsiATxepVZk
    const form = e.closest(button, 'form')
    if (form && isSubmittable(form)) {
      button.focus()
    }
  })

  /*-
  Observes form fields and runs a callback when a value changes.

  This is useful for observing text fields while the user is typing.

  The unobtrusive variant of this is the [`[up-observe]`](/input-up-observe) attribute.

  ### Example

  The following would print to the console whenever an input field changes:

  ```js
  up.observe('input.query', function(value) {
    console.log('Query is now %o', value)
  })
  ```

  Instead of a single form field, you can also pass multiple fields,
  a `<form>` or any container that contains form fields.
  The callback will be run if any of the given fields change:

  ```js
  up.observe('form', function(value, name) {
   console.log('The value of %o is now %o', name, value)
  })
  ```

  You may also pass the `{ batch: true }` option to receive all
  changes since the last callback in a single object:

  ```js
  up.observe('form', { batch: true }, function(diff) {
   console.log('Observed one or more changes: %o', diff)
  })
  ```

  @function up.observe
  @param {string|Element|Array<Element>|jQuery} elements
    The form fields that will be observed.

    You can pass one or more fields, a `<form>` or any container that contains form fields.
    The callback will be run if any of the given fields change.
  @param {boolean} [options.batch=false]
    If set to `true`, the `onChange` callback will receive multiple
    detected changes in a single diff object as its argument.
  @param {number} [options.delay=up.form.config.observeDelay]
    The number of miliseconds to wait before executing the callback
    after the input value changes. Use this to limit how often the callback
    will be invoked for a fast typist.
  @param {Function(value, name): string} onChange
    The callback to run when the field's value changes.

    If given as a function, it receives two arguments (`value`, `name`).
    `value` is a string with the new attribute value and `string` is the name
    of the form field that changed. If given as a string, it will be evaled as
    JavaScript code in a context where (`value`, `name`) are set.

    A long-running callback function may return a promise that settles when
    the callback completes. In this case the callback will not be called again while
    it is already running.
  @return {Function()}
    A destructor function that removes the observe watch when called.
  @stable
  */
  const observe = function (elements, ...args) {
    elements = e.list(elements)
    const fields = u.flatMap(elements, findFields)
    const callback = u.extractCallback(args) || observeCallbackFromElement(elements[0]) || up.fail('up.observe: No change callback given')
    const options = u.extractOptions(args)
    options.delay = options.delay ?? e.numberAttr(elements[0], 'up-delay') ?? config.observeDelay
    const observer = new up.FieldObserver(fields, options, callback)
    observer.start()
    return () => observer.stop()
  }

  function observeCallbackFromElement(element) {
    let rawCallback = element.getAttribute('up-observe')
    if (rawCallback) {
      return new Function('value', 'name', rawCallback)
    }
  }

  /*-
  [Observes](/up.observe) a field or form and submits the form when a value changes.

  Both the form and the changed field will be assigned a CSS class [`.up-active`](/form.up-active)
  while the autosubmitted form is processing.

  The unobtrusive variant of this is the [`[up-autosubmit]`](/form-up-autosubmit) attribute.

  @function up.autosubmit
  @param {string|Element|jQuery} target
    The field or form to observe.
  @param {Object} [options]
    See options for [`up.observe()`](/up.observe)
  @return {Function()}
    A destructor function that removes the observe watch when called.
  @stable
  */
  function autosubmit(target, options) {
    return observe(target, options, () => submit(target))
  }

  function findValidateTarget(element, options) {
    let givenTarget
    const container = getContainer(element)

    if (u.isElementish(options.target)) {
      return up.fragment.toTarget(options.target)
    } else if (givenTarget = options.target || element.getAttribute('up-validate') || container.getAttribute('up-validate')) {
      return givenTarget
    } else if (e.matches(element, 'form')) {
      // If element is the form, we cannot find a better validate target than this.
      return up.fragment.toTarget(element)
    } else {
      return findValidateTargetFromConfig(element, options) || up.fail('Could not find validation target for %o (tried defaults %o)', element, config.validateTargets)
    }
  }

  function findValidateTargetFromConfig(element, options) {
    // for the first selector that has a match in the field's layer.
    const layer = up.layer.get(element)
    return u.findResult(config.validateTargets, function(defaultTarget) {
      if (up.fragment.get(defaultTarget, { ...options, layer })) {
        // We want to return the selector, *not* the element. If we returned the element
        // and derive a selector from that, any :has() expression would be lost.
        return defaultTarget
      }
    })
  }

  /*-
  Performs a server-side validation of a form field.

  `up.validate()` submits the given field's form with an additional `X-Up-Validate`
  HTTP header. Upon seeing this header, the server is expected to validate (but not save)
  the form submission and render a new copy of the form with validation errors.

  The unobtrusive variant of this is the [`input[up-validate]`](/input-up-validate) selector.
  See the documentation for [`input[up-validate]`](/input-up-validate) for more information
  on how server-side validation works in Unpoly.

  ### Example

  ```js
  up.validate('input[name=email]', { target: '.email-errors' })
  ```

  @function up.validate
  @param {string|Element|jQuery} field
    The form field to validate.
  @param {Object} [options]
    Additional [submit options](/up.submit#options) that should be used for
    submitting the form for validation.

    You may pass this `options` object to supplement or override the defaults
    from `up.submit()`.
  @param {string|Element|jQuery} [options.target]
    The element that will be [updated](/up.render) with the validation results.

    By default the closest [validate target](/up.form.config#config.validateTargets)
    around the given `field` is updated.
  @return {Promise}
    A promise that fulfills when the server-side
    validation is received and the form was updated.
  @stable
  */
  function validate(field, options) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    field = up.fragment.get(field)

    options = u.options(options)
    options.navigate = false
    options.origin = field
    options.history = false
    options.target = findValidateTarget(field, options)
    options.focus = 'keep'

    // The protocol doesn't define whether the validation results in a status code.
    // Hence we use the same options for both success and failure.
    options.fail = false

    // Make sure the X-Up-Validate header is present, so the server-side
    // knows that it should not persist the form submission
    options.headers ||= {}
    options.headers[up.protocol.headerize('validate')] = field.getAttribute('name') || ':unknown'

    // The guardEvent will also be assigned a { renderOptions } attribute in up.render()
    options.guardEvent = up.event.build('up:form:validate', { field, log: 'Validating form' })

    return submit(field, options)
  }

  /*-
  This event is emitted before a field is being [validated](/input-up-validate).

  @event up:form:validate
  @param {Element} event.field
    The form field that has been changed and caused the validated request.
  @param {Object} event.renderOptions
    An object with [render options](/up.render) for the fragment update
    that will show the validation results.

    Listeners may inspect and modify these options.
  @param event.preventDefault()
    Event listeners may call this method to prevent the validation request
    being sent to the server.
  @stable
  */

  function switcherValues(field) {
    let value
    let meta

    if (e.matches(field, 'input[type=checkbox]')) {
      if (field.checked) {
        value = field.value
        meta = ':checked'
      } else {
        meta = ':unchecked'
      }
    } else if (e.matches(field, 'input[type=radio]')) {
      const form = getContainer(field)
      const groupName = field.getAttribute('name')
      const checkedButton = form.querySelector(`input[type=radio]${e.attributeSelector('name', groupName)}:checked`)
      if (checkedButton) {
        meta = ':checked'
        value = checkedButton.value
      } else {
        meta = ':unchecked'
      }
    } else {
      value = field.value
    }

    const values = []
    if (u.isPresent(value)) {
      values.push(value)
      values.push(':present')
    } else {
      values.push(':blank')
    }
    if (u.isPresent(meta)) {
      values.push(meta)
    }
    return values
  }

  /*-
  Shows or hides a target selector depending on the value.

  See [`input[up-switch]`](/input-up-switch) for more documentation and examples.

  This function does not currently have a very useful API outside
  of our use for `up-switch`'s UJS behavior, that's why it's currently
  still marked `@internal`.

  @function up.form.switchTargets
  @param {Element} switcher
  @param {string} [options.target]
    The target selectors to switch.
    Defaults to an `[up-switch]` attribute on the given field.
  @internal
  */
  function switchTargets(switcher, options = {}) {
    const targetSelector = options.target || options.target || switcher.getAttribute('up-switch')
    const form = getContainer(switcher)
    targetSelector || up.fail("No switch target given for %o", switcher)
    const fieldValues = switcherValues(switcher)

    for (let target of e.all(form, targetSelector)) {
      switchTarget(target, fieldValues)
    }
  }

  const switchTarget = up.mockable(function(target, fieldValues) {
    let show
    fieldValues ||= switcherValues(findSwitcherForTarget(target))

    let hideValues = target.getAttribute('up-hide-for')
    if (hideValues) {
      hideValues = u.splitValues(hideValues)
      show = u.intersect(fieldValues, hideValues).length === 0
    } else {
      let showValues = target.getAttribute('up-show-for')
      // If the target has neither up-show-for or up-hide-for attributes,
      // assume the user wants the target to be visible whenever anything
      // is checked or entered.
      showValues = showValues ? u.splitValues(showValues) : [':present', ':checked']
      show = u.intersect(fieldValues, showValues).length > 0
    }

    e.toggle(target, show)
    return target.classList.add('up-switched')
  })

  function findSwitcherForTarget(target) {
    const form = getContainer(target)
    const switchers = e.all(form, '[up-switch]')
    const switcher = u.find(switchers, function(switcher) {
      const targetSelector = switcher.getAttribute('up-switch')
      return e.matches(target, targetSelector)
    })
    return switcher || up.fail('Could not find [up-switch] field for %o', target)
  }

  function getContainer(element) {
    // Element#form will also work if the element is outside the form with an [form=form-id] attribute
    return element.form || e.closest(element, `form, ${up.layer.anySelector()}`)
  }

  function isField(element) {
    return e.matches(element, fieldSelector())
  }

  function focusedField() {
    return u.presence(document.activeElement, isField)
  }

  /*-
  Returns whether the given form will be [submitted](/up.follow) through Unpoly
  instead of making a full page load.

  By default Unpoly will follow forms if the element has
  one of the following attributes:

  - `[up-submit]`
  - `[up-target]`
  - `[up-layer]`
  - `[up-transition]`

  To consider other selectors to be submittable, see `up.form.config.submitSelectors`.

  @function up.form.isSubmittable
  @param {Element|jQuery|string} form
    The form to check.
  @stable
  */
  function isSubmittable(form) {
    form = up.fragment.get(form)
    return e.matches(form, fullSubmitSelector()) && !isSubmitDisabled(form)
  }

  function isSubmitDisabled(form) {
    // We also don't want to handle cross-origin forms.
    // That will be handled in `up.Change.FromURL#newPageReason`.
    return e.matches(form, config.noSubmitSelectors.join(','))
  }

  /*-
  Submits this form via JavaScript and updates a fragment with the server response.

  The server response is searched for the selector given in `up-target`.
  The selector content is then [replaced](/up.replace) in the current page.

  The programmatic variant of this is the [`up.submit()`](/up.submit) function.

  ### Example

  ```html
  <form method="post" action="/users" up-submit>
    ...
  </form>
  ```

  ### Handling validation errors

  When the server was unable to save the form due to invalid params,
  it will usually re-render an updated copy of the form with
  validation messages.

  For Unpoly to be able to detect a failed form submission,
  the form must be re-rendered with a non-200 HTTP status code.
  We recommend to use either 400 (bad request) or
  422 (unprocessable entity).

  In Ruby on Rails, you can pass a
  [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option)
  for this:

  ```ruby
  class UsersController < ApplicationController

    def create
      user_params = params[:user].permit(:email, :password)
      @user = User.new(user_params)
      if @user.save?
        sign_in @user
      else
        render 'form', status: :bad_request
      end
    end

  end
  ```

  You may define different option for the failure case by infixing an attribute with `fail`:

  ```html
  <form method="post" action="/action"
    up-target=".content"
    up-fail-target="form"
    up-scroll="auto"
    up-fail-scroll=".errors">
    ...
  </form>
  ```

  See [handling server errors](/server-errors) for details.

  Note that you can also use
  [`input[up-validate]`](/input-up-validate) to perform server-side
  validations while the user is completing fields.

  ### Giving feedback while the form is processing

  The `<form>` element will be assigned a CSS class [`.up-active`](/form.up-active) while
  the submission is loading.

  ### Short notation

  You may omit the `[up-submit]` attribute if the form has one of the following attributes:

  - `[up-target]`
  - `[up-layer]`
  - `[up-transition]`

  Such a form will still be submitted through Unpoly.

  ### Handling all forms automatically

  You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute.

  See [Handling all links and forms](/handling-everything).

  @selector form[up-submit]

  @params-note
    All attributes for `a[up-follow]` may be used.

  @stable
  */
  up.on('submit', fullSubmitSelector, function(event, form) {
    // Users may configure up.form.config.submitSelectors.push('form')
    // and then opt out individual forms with [up-submit=false].
    if (event.defaultPrevented || isSubmitDisabled(form)) {
      return
    }

    abortScheduledValidate?.()
    up.event.halt(event)
    up.log.muteUncriticalRejection(submit(form))
  })

  /*-
  When a form field with this attribute is changed, the form is validated on the server
  and is updated with validation messages.

  To validate the form, Unpoly will submit the form with an additional `X-Up-Validate` HTTP header.
  When seeing this header, the server is expected to validate (but not save)
  the form submission and render a new copy of the form with validation errors.

  The programmatic variant of this is the [`up.validate()`](/up.validate) function.

  ### Example

  Let's look at a standard registration form that asks for an e-mail and password:

  ```html
  <form action="/users">

    <label>
      E-mail: <input type="text" name="email" />
    </label>

    <label>
      Password: <input type="password" name="password" />
    </label>

    <button type="submit">Register</button>

  </form>
  ```

  When the user changes the `email` field, we want to validate that
  the e-mail address is valid and still available. Also we want to
  change the `password` field for the minimum required password length.
  We can do this by giving both fields an `up-validate` attribute:

  ```html
  <form action="/users">

    <label>
      E-mail: <input type="text" name="email" up-validate />
    </label>

    <label>
      Password: <input type="password" name="password" up-validate />
    </label>

    <button type="submit">Register</button>

  </form>
  ```

  Whenever a field with `up-validate` changes, the form is POSTed to
  `/users` with an additional `X-Up-Validate` HTTP header.
  When seeing this header, the server is expected to validate (but not save)
  the form submission and render a new copy of the form with validation errors.

  In Ruby on Rails the processing action should behave like this:

  ```ruby
  class UsersController < ApplicationController

    * This action handles POST /users
    def create
      user_params = params[:user].permit(:email, :password)
      @user = User.new(user_params)
      if request.headers['X-Up-Validate']
        @user.valid?  # run validations, but don't save to the database
        render 'form' # render form with error messages
      elsif @user.save?
        sign_in @user
      else
        render 'form', status: :bad_request
      end
    end

  end
  ```

  Note that if you're using the `unpoly-rails` gem you can simply say `up.validate?`
  instead of manually checking for `request.headers['X-Up-Validate']`.

  The server now renders an updated copy of the form with eventual validation errors:

  ```ruby
  <form action="/users">

    <label class="has-error">
      E-mail: <input type="text" name="email" value="foo@bar.com" />
      Has already been taken!
    </label>

    <button type="submit">Register</button>

  </form>
  ```

  The `<label>` around the e-mail field is now updated to have the `has-error`
  class and display the validation message.

  ### How validation results are displayed

  Although the server will usually respond to a validation with a complete,
  fresh copy of the form, Unpoly will by default not update the entire form.
  This is done in order to preserve volatile state such as the scroll position
  of `<textarea>` elements.

  By default Unpoly looks for a `<fieldset>`, `<label>` or `<form>`
  around the validating input field, or any element with an
  `up-fieldset` attribute.
  With the Bootstrap bindings, Unpoly will also look
  for a container with the `form-group` class.

  You can change this default behavior by setting `up.form.config.validateTargets`:

  ```js
  // Always update the entire form containing the current field ("&")
  up.form.config.validateTargets = ['form &']
  ```

  You can also individually override what to update by setting the `up-validate`
  attribute to a CSS selector:

  ```html
  <input type="text" name="email" up-validate=".email-errors">
  <span class="email-errors"></span>
  ```

  ### Updating dependent fields

  The `[up-validate]` behavior is also a great way to partially update a form
  when one fields depends on the value of another field.

  Let's say you have a form with one `<select>` to pick a department (sales, engineering, ...)
  and another `<select>` to pick an employeee from the selected department:

  ```html
  <form action="/contracts">
    <select name="department">...</select> <!-- options for all departments -->
    <select name="employeed">...</select> <!-- options for employees of selected department -->
  </form>
  ```

  The list of employees needs to be updated as the appartment changes:

  ```html
  <form action="/contracts">
    <select name="department" up-validate="[name=employee]">...</select>
    <select name="employee">...</select>
  </form>
  ```

  In order to update the `department` field in addition to the `employee` field, you could say
  `up-validate="&, [name=employee]"`, or simply `up-validate="form"` to update the entire form.

  @selector input[up-validate]
  @param up-validate
    The CSS selector to update with the server response.

    This defaults to a fieldset or form group around the validating field.
  @stable
  */

  /*-
  Validates this form on the server when any field changes and shows validation errors.

  You can configure what Unpoly considers a fieldset by adding CSS selectors to the
  `up.form.config.validateTargets` array.

  See `input[up-validate]` for detailed documentation.

  @selector form[up-validate]
  @param up-validate
    The CSS selector to update with the server response.

    This defaults to a fieldset or form group around the changing field.
  @stable
  */
  up.on('change', '[up-validate]', function(event) {
    // Even though [up-validate] may be used on either an entire form or an individual input,
    // the change event will trigger on a given field.
    const field = findFields(event.target)[0]

    // There is an edge case where the user is changing an input with [up-validate],
    // but blurs the input by directly clicking the submit button. In this case the
    // following events will be emitted:
    //
    // - change on the input
    // - focus on the button
    // - submit on the form
    //
    // In this case we do not want to send a validate request to the server, but
    // simply submit the form. Because this event handler does not know if a submit
    // event is about to fire, we delay the validation to the next microtask.
    // In case we receive a submit event after this, we can cancel the validation.
    abortScheduledValidate = u.abortableMicrotask(() => {
      return up.log.muteUncriticalRejection(validate(field))
    })
  })

  /*-
  Show or hide elements when a form field is set to a given value.

  ### Example: Select options

  The controlling form field gets an `up-switch` attribute with a selector for the elements to show or hide:

  ```html
  <select name="advancedness" up-switch=".target">
    <option value="basic">Basic parts</option>
    <option value="advanced">Advanced parts</option>
    <option value="very-advanced">Very advanced parts</option>
  </select>
  ```

  The target elements can use [`[up-show-for]`](/up-show-for) and [`[up-hide-for]`](/up-hide-for)
  attributes to indicate for which values they should be shown or hidden:

  ```html
  <div class="target" up-show-for="basic">
    only shown for advancedness = basic
  </div>

  <div class="target" up-hide-for="basic">
    hidden for advancedness = basic
  </div>

  <div class="target" up-show-for="advanced very-advanced">
    shown for advancedness = advanced or very-advanced
  </div>
  ```

  ### Example: Text field

  The controlling `<input>` gets an `up-switch` attribute with a selector for the elements to show or hide:

  ```html
  <input type="text" name="user" up-switch=".target">

  <div class="target" up-show-for="alice">
    only shown for user alice
  </div>
  ```

  You can also use the pseudo-values `:blank` to match an empty input value,
  or `:present` to match a non-empty input value:

  ```html
  <input type="text" name="user" up-switch=".target">

  <div class="target" up-show-for=":blank">
    please enter a username
  </div>
  ```

  ### Example: Checkbox

  For checkboxes you can match against the pseudo-values `:checked` or `:unchecked`:

  ```html
  <input type="checkbox" name="flag" up-switch=".target">

  <div class="target" up-show-for=":checked">
    only shown when checkbox is checked
  </div>

  <div class="target" up-show-for=":unchecked">
    only shown when checkbox is unchecked
  </div>
  ```

  Of course you can also match against the `value` property of the checkbox element:

  ```html
  <input type="checkbox" name="flag" value="active" up-switch=".target">

  <div class="target" up-show-for="active">
    only shown when checkbox is checked
  </div>
  ```

  @selector input[up-switch]
  @param up-switch
    A CSS selector for elements whose visibility depends on this field's value.
  @stable
  */

  /*-
  Only shows this element if an input field with [`[up-switch]`](/input-up-switch) has one of the given values.

  See [`input[up-switch]`](/input-up-switch) for more documentation and examples.

  @selector [up-show-for]
  @param [up-show-for]
    A space-separated list of input values for which this element should be shown.
  @stable
  */

  /*-
  Hides this element if an input field with [`[up-switch]`](/input-up-switch) has one of the given values.

  See [`input[up-switch]`](/input-up-switch) for more documentation and examples.

  @selector [up-hide-for]
  @param [up-hide-for]
    A space-separated list of input values for which this element should be hidden.
  @stable
  */
  up.compiler('[up-switch]', (switcher) => {
    switchTargets(switcher)
  })

  up.on('change', '[up-switch]', (_event, switcher) => {
    switchTargets(switcher)
  })

  up.compiler('[up-show-for]:not(.up-switched), [up-hide-for]:not(.up-switched)', (element) => {
    switchTarget(element)
  })

  /*-
  Observes this field and runs a callback when a value changes.

  This is useful for observing text fields while the user is typing.
  If you want to submit the form after a change see [`input[up-autosubmit]`](/input-up-autosubmit).

  The programmatic variant of this is the [`up.observe()`](/up.observe) function.

  ### Example

  The following would run a global `showSuggestions(value)` function
  whenever the `<input>` changes:

  ```html
  <input name="query" up-observe="showSuggestions(value)">
  ```
  
  Note that the parameter name in the markup must be called `value` or it will not work.
  The parameter name can be called whatever you want in the JavaScript, however.
      
  Also note that the function must be declared on the `window` object to work, like so:

  ```js
  window.showSuggestions = function(selectedValue) {
    console.log(`Called showSuggestions() with ${selectedValue}`)
  }
  ```

  ### Callback context

  The script given to `[up-observe]` runs with the following context:

  | Name     | Type      | Description                           |
  | -------- | --------- | ------------------------------------- |
  | `value`  | `string`  | The current value of the field        |
  | `this`   | `Element` | The form field                        |
  | `$field` | `jQuery`  | The form field as a jQuery collection |

  ### Observing radio buttons

  Multiple radio buttons with the same `[name]` (a radio button group)
  produce a single value for the form.

  To observe radio buttons group, use the `[up-observe]` attribute on an
  element that contains all radio button elements with a given name:

  ```html
  <div up-observe="formatSelected(value)">
    <input type="radio" name="format" value="html"> HTML format
    <input type="radio" name="format" value="pdf"> PDF format
    <input type="radio" name="format" value="txt"> Text format
  </div>
  ```

  @selector input[up-observe]
  @param up-observe
    The code to run when the field's value changes.
  @param up-delay
    The number of miliseconds to wait after a change before the code is run.
  @stable
  */

  /*-
  Observes this form and runs a callback when any field changes.

  This is useful for observing text fields while the user is typing.
  If you want to submit the form after a change see [`input[up-autosubmit]`](/input-up-autosubmit).

  The programmatic variant of this is the [`up.observe()`](/up.observe) function.

  ### Example

  The would call a function `somethingChanged(value)`
  when any `<input>` within the `<form>` changes:

  ```html
  <form up-observe="somethingChanged(value)">
    <input name="foo">
    <input name="bar">
  </form>
  ```

  ### Callback context

  The script given to `[up-observe]` runs with the following context:

  | Name     | Type      | Description                           |
  | -------- | --------- | ------------------------------------- |
  | `value`  | `string`  | The current value of the field        |
  | `this`   | `Element` | The form field                        |
  | `$field` | `jQuery`  | The form field as a jQuery collection |

  @selector form[up-observe]
  @param up-observe
    The code to run when any field's value changes.
  @param up-delay
    The number of miliseconds to wait after a change before the code is run.
  @stable
  */
  up.compiler('[up-observe]', (formOrField) => observe(formOrField))

  /*-
  Submits this field's form when this field changes its values.

  Both the form and the changed field will be assigned a CSS class [`.up-active`](/form.up-active)
  while the autosubmitted form is loading.

  The programmatic variant of this is the [`up.autosubmit()`](/up.autosubmit) function.

  ### Example

  The following would automatically submit the form when the query is changed:

  ```html
  <form method="GET" action="/search">
    <input type="search" name="query" up-autosubmit>
    <input type="checkbox" name="archive"> Include archive
  </form>
  ```

  ### Auto-submitting radio buttons

  Multiple radio buttons with the same `[name]` (a radio button group)
  produce a single value for the form.

  To auto-submit radio buttons group, use the `[up-submit]` attribute on an
  element that contains all radio button elements with a given name:

  ```html
  <div up-autosubmit>
    <input type="radio" name="format" value="html"> HTML format
    <input type="radio" name="format" value="pdf"> PDF format
    <input type="radio" name="format" value="txt"> Text format
  </div>
  ```

  @selector input[up-autosubmit]
  @param [up-delay]
    The number of miliseconds to wait after a change before the form is submitted.
  @stable
  */

  /*-
  Submits the form when any field changes.

  Both the form and the field will be assigned a CSS class [`.up-active`](/form.up-active)
  while the autosubmitted form is loading.

  The programmatic variant of this is the [`up.autosubmit()`](/up.autosubmit) function.

  ### Example

  This will submit the form when either query or checkbox was changed:

  ```html
  <form method="GET" action="/search" up-autosubmit>
    <input type="search" name="query">
    <input type="checkbox" name="archive"> Include archive
  </form>
  ```

  @selector form[up-autosubmit]
  @param [up-delay]
    The number of miliseconds to wait after a change before the form is submitted.
  @stable
  */
  up.compiler('[up-autosubmit]', (formOrField) => autosubmit(formOrField))

  up.on('up:framework:reset', reset)

  return {
    config,
    submit,
    submitOptions,
    isSubmittable,
    observe,
    validate,
    autosubmit,
    fieldSelector,
    fields: findFields,
    focusedField,
    switchTarget
  }
})()

up.submit = up.form.submit
up.observe = up.form.observe
up.autosubmit = up.form.autosubmit
up.validate = up.form.validate
