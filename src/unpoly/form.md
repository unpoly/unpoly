# up.form

Features to submit and validate forms without a full page load.

Set an `[up-submit]` attribute to let Unpoly handle a form, or call `up.submit()` from JavaScript. The `up:form:submit` event lets your code observe or prevent any submission.

To render a new form state while the user is still typing, mark fields with `[up-validate]`. This shows validation errors as the user moves through the form, and can update other fields that depend on the changed value. `[up-switch]` shows, hides or disables other elements depending on a field's value, without a server request. `[up-autosubmit]` submits the form whenever a field changes, and `up.watch()` runs your own callback instead.

@learn-ref forms

@namespace up.form

-----

# up.form.config

Sets default options for form submission and validation.

@property up.form.config

@section Submittable forms

  @param {Array<string>} [config.submitSelectors]
    An array of CSS selectors matching forms that will be [submitted through Unpoly](/learn/submitting-forms).

    You can configure Unpoly to handle *all* forms on a page without requiring an `[up-submit]` attribute:

    ```js
    up.form.config.submitSelectors.push('form')
    ```

    Individual forms may opt out with an `[up-submit=false]` attribute.
    You may configure additional exceptions in `config.noSubmitSelectors`.

  @param {Array<string>} [config.noSubmitSelectors]
    Exceptions to `up.form.config.submitSelectors`.

    Matching forms will *not* be [submitted through Unpoly](/learn/submitting-forms),
    even if they match `up.form.config.submitSelectors`.

@section Form elements

  @param {Array<string>} [config.groupSelectors=['[up-form-group]', 'fieldset', 'label', 'form']]
    An array of CSS selectors matching a [form group](/api/up-form-group).

    When [validating](/learn/validation#validating-after-changing-a-field) a field,
    Unpoly will re-render the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
    form group around that field.

    When a group is matched, Unpoly will [derive a target selector](/learn/target-derivation) for the element.
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

  @param {Array<string>} [config.fieldSelectors]
    An array of CSS selectors that represent form fields, such as `input` or `select`.

    [Form-associated custom elements](/learn/custom-form-fields#form-associated) are matched by
    default and need not be added.

    Add a selector to [register any element as a field](/learn/custom-form-fields#registering).
    Matching elements must have a `value` property.

    You may configure exceptions in `config.noFieldSelectors`.

  @param {Array<string>} [config.noFieldSelectors]
    Exceptions to `up.form.config.fieldSelectors`.

    Matching elements will *not* be considered a form field, even if they match `up.form.config.fieldSelectors`.

    For example, a form-associated custom element that renders a button should not count as a field:

    ```js
    up.form.config.noFieldSelectors.push('my-submit-button')
    ```

    @experimental

  @param {Array<string>} [config.submitButtonSelectors]
    An array of CSS selectors that represent submit buttons, such as `input[type=submit]` or `button[type=submit]`.

    Selectors must only match native submit buttons: a `<button>` without a `[type]` or with `[type=submit]`,
    an `<input type="submit">` or an `<input type="image">`. A browser cannot submit a form through other elements,
    and [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData) rejects them.

  @param {Array<string>} [config.anyButtonSelectors]
    An array of CSS selectors that represent buttons of any kind, such as `button` or `input[type=button]`.

    Unpoly uses this to disable a form's buttons while the form is submitting.
    To find the button that *submits* a form, see `config.submitButtonSelectors`.

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
    The number of milliseconds to [wait before running a watcher callback](/learn/watch-options#debouncing).

    This default delay is only applied when [watching the `input` event](/learn/watch-options#events).
    There is no default delay when watching other types of events.

  @param {Array<string>|Function(Element): Array<string>} [config.watchInputEvents=['input', 'change']]
    An array of events to substitute if [watching the `input` event](/learn/watch-options#events).

    This can be used to watch [misbehaving fields](/learn/watch-options#normalizing-non-standard-events)
    that don't emit the [standard `input` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event)
    as its value is being edited.

    It's OK to name multiple events that may result in the same change (e.g. `['keydown', 'keyup']`).
    Unpoly guarantees the callback is only run once per changed value.

    Instead of configuring an array of event types, you may also set a function that accepts
    a form field and returns an array of event types to watch for that field.

  @param {Array<string>|Function(Element): Array<string>} [config.watchChangeEvents=['change']]
    An array of events to substitute if [watching the `change` event](/learn/watch-options#events).

    This can be used to watch [misbehaving fields](/learn/watch-options#normalizing-non-standard-events)
    that don't emit the [standard `change` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event)
    after its value was changed.

    It's OK to name multiple events that may result in the same change (e.g. `['change', 'blur']`).
    Unpoly guarantees the callback is only run once per changed value.

    Instead of configuring an array of event types, you may also set a function that accepts
    a form field and returns an array of event types to watch for that field.

@section Validation

  @param {boolean} [config.validateBatch=true]
    Whether to [batch validations](/api/up.validate#batching).

@stable

-----

# up.form.isField()

Returns whether the given element is a form field, such as `input` or `select`.

Buttons are not fields, including an `<input type="submit">`.
[Form-associated custom elements](/learn/custom-form-fields#form-associated) are fields.

To configure what Unpoly considers a form field, use `up.form.config.fieldSelectors`
and `up.form.config.noFieldSelectors`.

## Example

```js
up.form.isField(document.querySelector('input[name=email]')) // result: true
up.form.isField(document.querySelector('button[type=submit]')) // result: false
```

@function up.form.isField
@param {Element} element
  The element to check.
@return {boolean}
  Whether the given element is a form field.
@stable

-----

# up.form.fields()

Returns a list of form fields within the given element.

You can configure what Unpoly considers a form field by adding CSS selectors to the
`up.form.config.fieldSelectors` array.

If the given element is itself a form field, a list of that given element is returned.

If the given element is a `<form>` with an `[id]`, the list also includes fields outside the form
that are associated with it through a [`[form]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form) attribute.
Like in the browser, a field within the form whose `[form]` attribute names another form is not included.

Fields in another [layer](/api/up.layer) and fields that are being [destroyed](/api/up.destroy) are ignored.

## Example

Given a form with a field outside of it:

```html
<form id="order">
  <input name="email">
  <button type="submit">Order</button>
</form>

<input name="coupon" form="order"> <!-- mark: form="order" -->
```

We can find all fields of the form like this:

```js
let form = document.querySelector('#order')
up.form.fields(form) // result: [<input name="email">, <input name="coupon">]
```

@function up.form.fields
@param {Element|jQuery} root
  The element to scan for contained form fields.

  If the element is itself a form field, a list of that element is returned.
@return {List<Element>}
  The field elements within the given element.
@stable

-----

# up.form.submitButtons()

Returns a list of submit buttons within the given element.

You can configure what Unpoly considers a submit button by adding CSS selectors to the
`up.form.config.submitButtonSelectors` array.

Buttons in another [layer](/api/up.layer) and buttons that are being [destroyed](/api/up.destroy) are ignored.

@function up.form.submitButtons
@param {Element|jQuery} root
  The element to scan for contained submit buttons.
@return {List<Element>}
  The list of found submit buttons.
@experimental

-----

# up.form.anyButtonSelector()

Returns a selector for any button, including buttons that don't submit their form.

@function up.form.anyButtonSelector
@internal

-----

# up.submit()

Submits a form via JavaScript and updates a fragment with the server response.

The server must render an element matching the [target selector](/learn/targeting-fragments) from the `{ target }` option
or the form's `[up-target]` attribute.
A matching element in the current page is then swapped with the new element from the server response.
The response may include other HTML (even an entire HTML document), but only the matching element will be updated.

Submitting a form is considered [navigation](/learn/navigation-defaults).

Emits the event [`up:form:submit`](/api/up:form:submit).

@learn-ref submitting-forms

### Example

```js
up.submit('form.new-user', { target: '.main' })
```

@function up.submit

@section General

  @param {Element|jQuery|string} form
    The form to submit.

    If the argument points to an element that is not a form,
    Unpoly will search its ancestors for the [closest](/api/up.fragment.closest) form.

  @param {Object} [options]
    Additional [render options](/api/up.render#parameters) that should be used for submitting the form.

    Unpoly will parse render options from the form's attributes.
    You may pass this additional `options` object to [supplement or override](/learn/attributes-and-options#options)
    options parsed from attributes.  See `[up-submit]` for a list of supported attributes.

@section Targeting
  @mix up.render/targeting
    @param options.failTarget
      The [target selector](/learn/targeting-fragments) to update when the server responds with an error code.

      By default, error responses will update the `<form>` element itself.

      See [[error-responses]].

    @param options.origin
      The element that triggered the form submission.

      This defaults to the first applicable:

      - An element within the form that was focused when the form was submitted (e.g. when the user presses `Enter` inside a text field)
      - The [button clicked to submit the form](/api/up:form:submit#event.submitButton).
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

-----

# up.form.submitOptions()

Parses the [render](/api/up.render) options that would be used to
[submit](/api/up.submit) the given form, but does not render.

## Example

Given a form element:

```html
<form action="/foo" method="post" up-target=".content">
...
</form>
```

We can parse the form's render options like this:

```js
let form = document.querySelector('form')
let options = up.form.submitOptions(form)
// result: { url: '/foo', method: 'POST', target: '.content', ... }
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

-----

# up.form.watchOptions()

Parses the [watch options](/learn/watch-options) that would be used to
[watch](/api/up.watch) the given field, but does not watch it.

## Example

Given a field with some `[up-watch-...]` attributes on itself and its form:

```html
<form up-watch-disable>
  <input name="query" up-watch-event="input" up-watch-delay="300">
</form>
```

We can parse the field's watch options like this:

```js
let field = document.querySelector('input[name=query]')
let options = up.form.watchOptions(field)
// result: { event: ['input', 'change'], delay: 300, disable: true, ... }
```

Like `up.watch()`, a field without an `[up-watch-event]` attribute is watched for the `input` event.
The event type `'input'` is expanded into the events from `up.form.config.watchInputEvents`,
and `'change'` into the events from `up.form.config.watchChangeEvents`.

@function up.form.watchOptions
@param {Element|jQuery|string} field
  The field for which to parse watch options.

  Attributes are read from the field and its ancestors.
  When more than one of them sets the same option, the closest attribute wins.
  See [setting options for multiple fields](/learn/watch-options#multiple-fields).
@param {Object} [options]
  Additional options for watching the field.

  Values from this object will override any attributes set on the field or its ancestors.
@param {Object} [parserOptions]
  Options for parsing the attributes, like `{ defaults }`.

  @internal
@return {Object}
  The [watch options](/learn/watch-options) that `up.watch()` would use for the given field.
@experimental

-----

# up.form.validateOptions()

Parses the options that would be used to [validate](/api/up.validate) the given field,
but does not validate it.

## Example

Given a field with some `[up-validate-...]` and `[up-watch-...]` attributes:

```html
<form action="/users" method="post">
  <input name="email" up-validate up-validate-url="/users/validate" up-watch-feedback="false">
</form>
```

We can parse the field's validation options like this:

```js
let field = document.querySelector('input[name=email]')
let options = up.form.validateOptions(field)
// result: { url: '/users/validate', batch: true, event: ['change'], feedback: false, ... }
```

The options also contain the [watch options](/learn/watch-options) for the field,
like `{ event }` or `{ delay }`.
Unlike `up.form.watchOptions()`, a field without an `[up-watch-event]` attribute is validated on `change`.

The options don't say which fragment to update.
`up.validate()` takes the target from the `[up-validate]` attribute's value, or from the field's [form group](/api/up-form-group).

@function up.form.validateOptions
@param {Element|jQuery|string} field
  The field for which to parse validation options.

  Attributes are read from the field and its ancestors.
  When more than one of them sets the same option, the closest attribute wins.
@param {Object} [options]
  Additional options for validating the field.

  Values from this object will override any attributes set on the field or its ancestors.
@param {Object} [parserOptions]
  Options for parsing the attributes, like `{ defaults }`.

  @internal
@return {Object}
  The [options](/api/up.validate#parameters) that `up.validate()` would use for the given field.
@experimental

-----

# up.form.disableTemp()

Disables all fields and buttons within the given element.

To automatically disable a form when it is submitted, add the [`[up-disable]`](/api/up-submit#up-disable)
property to the `<form>` element.

Returns a function that re-enables the elements that were disabled.

## Dealing with focus loss

When a focused field is disabled, it will lose focus.

In that case Unpoly will focus the [closest form group](/api/up.form.group) around the disabled control.

@function up.form.disableTemp
@param {Element} element
  The element within which fields and buttons should be disabled.
@return {Function}
  A function that re-enables the elements that were disabled.
@internal

-----

# up:form:submit

This event is [emitted](/api/up.emit) when a form is [submitted](/api/up.submit) through Unpoly.

When the form is being [validated](/api/up-validate), this event is not emitted.
Instead, an `up:form:validate` event is emitted.

@learn-ref submitting-forms

## Changing render options

Listeners may inspect and manipulate [render options](/api/up.render#parameters) for the coming fragment update.

The code below will use a custom [transition](/api/up-transition)
when a form submission [fails](/learn/error-responses):

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
    The [form parameters](/api/up.Params) that will be sent as the form's request payload.

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
    An object with [render options](/api/up.render#parameters) for the fragment update.

    Listeners may inspect and modify these options.

  @param event.preventDefault()
    Prevents the form from being submitted.

@stable

-----

# up.watch()

Watches form fields and runs a callback when a value changes.

While you can also listen to a [standard `input` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event),
`up.watch()` adds the following behavior:

- The callback only runs when a value was actually changed. Multiple events resulting in the same value will only run the callback once.
- The callback's execution frequency can be [debounced](/learn/watch-options#debouncing).
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
  let url = '/search?query=' + encodeURIComponent(value)
  return up.render('.results', { url, ...options }) // mark: return
})
```

Unpoly will guarantee that only one async callback is running concurrently.
If the form is changed while an async callback is still processing, Unpoly will wait
until the callback concludes and then run it again with the latest field values.

You can also return a promise by using `async` / `await`:

```js
up.watch('input.query', async function(value, name, options) { // mark: async
  let url = '/search?query=' + encodeURIComponent(value)
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

    See [which events to watch](/learn/watch-options#events).

  @param {number} [options.delay=0]
    The number of milliseconds to wait between an observed event and running the callback.

    See [debouncing callbacks](/learn/watch-options#debouncing).

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

  Watching will stop automatically when the form is [destroyed](/api/up.destroy).

@stable
@signature

-----

# up.autosubmit()

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
    Additional [render options](/api/up.render#parameters) to use when the form is submitted.

    Unpoly will parse render options from the watched form's attributes.
    You may pass this additional `options` object to [supplement or override](/learn/attributes-and-options#options)
    options parsed from attributes.  See `[up-submit]` for a list of supported attributes.

    Common options are documented below, but most [options for `up.submit()`](/api/up.submit#parameters) may be used.

@section Request
  @include up.submit/request

@section Loading state
  @include up.render/loading-state

@return {Function()}
  A destructor function that stops auto-submitting when called.

  Auto-submitting will stop automatically when the observed fields are removed from the DOM.

@stable

-----

# up.form.group()

Returns the [form group](/api/up-form-group) for the given element.

By default, a form group is a container with an `[up-form-group]` attribute, a `<fieldset>` or a `<label>`.
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
@param {boolean} [options.targetable=false]
  Only return a group that Unpoly can target with a selector.
@return {Element|undefined}
  The closest form group around the given element.

  If no better group can be found, the `<form>` element is returned.

  If the element is not within a `<form>`, returns `undefined`.

  With `{ targetable: true }`, returns `undefined` when no group around the element can be targeted.
@experimental

-----

# [up-form-group]

Marks this element as a form group, which (usually) contains a label, input and error message.

@learn-ref validation#form-groups

You are not required to use form groups to [submit forms through Unpoly](/learn/submitting-forms).
However, structuring your form into groups will help Unpoly make smaller changes to the DOM when
working with complex forms. For instance, when [validating](/learn/validation#validating-after-changing-a-field) a field,
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

The form above also uses the `[up-validate]` attribute to [validate](/learn/validation#validating-after-changing-a-field)
form groups after changing a field:

- After changing the *E-mail* field, Unpoly will validate the `[up-form-group]:has(#email)` target.
- After changing the *Password* field, Unpoly will validate the `[up-form-group]:has(#password)` target.

@selector [up-form-group]
@stable

-----

# up.validate()

Renders a new form state from its current field values, to show validation errors or
update [dependent elements](/learn/reactive-server-forms).

Typical use cases are to [show validation errors](/learn/validation#validating-after-changing-a-field)
after a field was changed or to update forms where one field depends on the value of another.

@learn-ref reactive-server-forms

`up.validate()` submits the given element's form with an additional `X-Up-Validate`
HTTP header. Upon seeing this header, the server is expected to validate (but not commit)
the form submission and render a new form state. See [this example](/api/up-validate#backend-protocol)
for control flow on the server.

To automatically update a form after a field was changed, use the `[up-validate]` attribute.
You may combine `[up-validate]` and `up.validate()` within the same form. In order to reduce
requests, their updates will be [batched together](#batching).

## Controlling what is updated

`up.validate()` always submits the entire form with its current field values to the form's
`[action]` path. Typically only a fragment of the form is updated with the response.
This minimizes the chance for loss of transient state like scroll positions, cursor selection
or user input while the request is in flight.

Passing a form field will update the closest [form group](/api/up-form-group) around the field:

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
In this case it is recommended to [disable fields](/learn/disabling-forms) while rendering.
This prevents the loss of user input made while the request is in flight:

```js
up.validate('form', { disable: true })
```

## Multiple validations are batched together {#batching}

In order to reduce requests, multiple calls of `up.validate()` within the same
[task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) are consolidated into a single request.
For instance, the following will send a single request [targeting](/learn/targeting-fragments) `.foo, .bar`:

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
additional validations are [queued](/learn/reactive-server-forms#race-conditions).
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
- Setting an [`[up-validate-batch]`](/api/up-validate) attribute on the element with `[up-validate]`.
- Passing an option `up.validate(element, { batch: false })`.

## Preventing race conditions

Unpoly sends one validation request per form at a time and batches the rest.

See [preventing race conditions](/learn/reactive-server-forms#race-conditions) for details.

@function up.validate

@section Targeting
  @param {string|Element|jQuery} element
    The field or fragment that should be re-rendered on the server.

    See [controlling what is updated](#controlling-what-is-updated).

  @param {string} [options.target=element]
    The [target selector](/learn/targeting-fragments) to re-render.

    By default, the given `element` will be rendered.
    If `element` is a field, its form group or `[up-validate]` target will be rendered.

  @param {boolean} [options.formGroup = true]
    Whether, when a field is given as `element`,
    the field's closest [form group](/api/up-form-group) should be targeted.

  @param {Element} [options.origin=element]
    The element or field that caused this validation pass.

    The names of all fields contained within the origin will be passed as an `X-Up-Validate` request header.

@section Render options
  @param {Object} [options]
    Additional [render options](/api/up.render#parameters) to use when re-rendering the targeted
    fragment.

    Common options are documented below, but most [options for `up.submit()`](/api/up.submit#parameters) may be used.

    Note that validation requests may be [batched together](/api/up.validate#batching).
    In this case Unpoly will try to merge render options where possible (e.g. `{ headers, target }`).
    When a render option cannot be merged (e.g. `{ scroll }`),
    the option from the last validation in the batch will be used.

@section Client state
  @mix up.reload/client-state

@section Request
  @param {string} options.url
    The URL to which to submit the validation request.

    By default, Unpoly will use the form's `[action]` attribute.

    See [Validating against other URLs](/api/up-validate#urls).

  @param {string} options.method
    The method to use for submitting the validation request.

    By default, Unpoly will use the form's `[method]` attribute.

    See [Validating against other URLs](/api/up-validate#urls).

  @param {boolean} [options.batch=true]
    Whether to [consolidate multiple validations into a single request](/api/up.validate#batching).

    Defaults to `up.form.config.validateBatch`, which defaults to `true`.

  @param options.params
    @like up.submit

  @param options.headers
    @like up.submit

@section Loading state
  @mix up.submit/loading-state

@return {Promise<up.RenderResult>}
  A promise that fulfills when the server-side validation is received and the form was updated.

@stable

-----

# up.form.parseValidateArgs()

Parses the many signatures of `up.validate()`.

See specs for examples.

@function up.form.parseValidateArgs
@internal

-----

# up:form:validate

This event is emitted before a form is being [validated](/api/up-validate).

@learn-ref validation

Listeners can [inspect](#properties), [modify](#event.renderOptions), or [prevent](#event.preventDefault)
the render pass that will load and show the validation results.

@event up:form:validate

@section Validation

  @param {Element} event.target
    The form that is being validated.

  @param {Element} event.form
    The form that is being validated.

  @param {up.Params} event.params
    The [form parameters](/api/up.Params) that will be sent as the form's request payload.

    Listeners may inspect and modify params before they are sent.
    Note that the request may be a [batch of multiple validations](/api/up.validate#batching).

  @param {List<Element>} event.fields
    The [form fields](/api/up.form.fields) that triggered this validation pass.

    When multiple fields are validating within the same [task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/),
    Unpoly will make a [single validation request with multiple targets](/api/up.validate#batching).

    The names of the validating fields are also sent
    as an `X-Up-Validate` request header.

    @experimental

@section Render pass

  @param {Object} event.renderOptions
    An object with [render options](/api/up.render#parameters) for the fragment update
    that will show the validation results.

    Listeners may inspect and modify these options.

    Note that the request may be a [batch of multiple validations](/api/up.validate#batching).
    In that case `event.renderOptions` will contain the merged render options
    for every targeted fragment. Unpoly will try to merge render options where possible (e.g. `{ headers, target }`).
    When a render option cannot be merged (e.g. `{ scroll }`),
    the option from the last validation in the batch will be used.

  @param event.preventDefault()
    Prevents the validation request from being sent to the server.

@stable

-----

# up.form.get()

Returns the form for the given element.

- For a `<form>` element, returns the element itself.
- For an element with a `[form]` attribute, returns the form with that ID in the element's [layer](/api/up.layer).
- For any other element, returns the closest `<form>` ancestor. This works for fields, submit buttons
  and any other element within a form, like a [form group](/api/up-form-group).

## Elements outside their form

A field or submit button can belong to a form that doesn't contain it.
Set its `[form]` attribute to the form's ID:

```html
<form id="search-form" action="/search">
  <input name="query">
</form>

<button type="submit" form="search-form">Search</button> <!-- mark: form="search-form" -->
```

We can now retrieve the form for the button:

```js
let button = document.querySelector('button')
up.form.get(button) // result: <form id="search-form">
```

Unlike the browser's [`element.form`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement/form)
property, `up.form.get()` only looks for the form in the element's own layer.
When an overlay shows a form with the same ID as a form in the root layer,
`element.form` returns the first form with that ID in the document, which is the form in the root layer.
`up.form.get()` returns the form in the overlay.

Like in the browser, a `[form]` attribute takes precedence over a form ancestor.
When the attribute matches no form in the element's layer, no form is returned, even if the element is within a form.

@function up.form.get
@param {Element} element
  A `<form>`, a field, a submit button or any other element within a form.
@return {Element|null|undefined}
  The form for the given element.

  Returns `null` or `undefined` if the element has no form.
@experimental

-----

# up.form.trackFields()

@function up.form.trackFields
@param {Element} root
  A form or a container element within a form.
@param {Function(Element): boolean} options.guard
  Optional, additional condition whether a field matches.
@param {Function(Element): Function(Element)} callback
  A callback that is called when we discover a new match.
  The callback can return another function that is called when that field no longer matches.
@internal

-----

# up.form.isSubmittable()

Returns whether the given form will be [submitted](/learn/submitting-forms) through Unpoly
instead of making a full page load.

By default, Unpoly will submit forms if the element has
one of the following attributes:

- [`[up-submit]`](/api/up-submit)
- [`[up-target]`](/api/up-follow#up-target)
- [`[up-layer]`](/api/up-follow#up-layer)
- `[up-transition]`

To consider other selectors to be submittable, see `up.form.config.submitSelectors`.

@function up.form.isSubmittable
@param {Element|jQuery|string} form
  The form to check.
@return {boolean}
  Whether the form will be submitted through Unpoly.
@stable

-----

# [up-submit]

Submits this form via JavaScript and updates a fragment with the server response.

The server must render an element matching the [target selector](/learn/targeting-fragments) from the `[up-target]` attribute.
A matching element in the current page is then swapped with the new element from the server response.
The response may include other HTML (even an entire HTML document), but only the matching element will be updated.

@learn-ref submitting-forms

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

See [Submitting forms](/learn/submitting-forms) for elaborate examples.

## Input validation

When the form could not be submitted due to invalid user input,
Unpoly can re-render the form with validation errors.

See [Validating forms](/learn/validation) for details and examples.

## Short notation

You may omit the `[up-submit]` attribute if the form has one of the following attributes:

- [`[up-target]`](#up-target)
- [`[up-layer]`](#up-layer)
- [`[up-transition]`](#up-transition)

@selector [up-submit]

@params-note
  Most of these attributes can also be [set on the submit button](/learn/submitting-forms#submit-buttons).

@section Targeting
  @mix up-follow/targeting
    @param up-target
      The [target selector](/learn/targeting-fragments) to update for a successful form submission.

    @param [up-fail-target=form]
      The [target selector](/learn/targeting-fragments) to update when the server responds with an error code.

      By default, error responses will update the `<form>` element itself.

      See [[error-responses]].

@section Navigation
  @mix up-follow/navigation

@section Request
  @param action
    Where to send the form data when the form is submitted.

  @param method
    The HTTP method to use for the request.

    The value is case-insensitive.

    You can also use methods that would not be allowed on a `<form>` element,
    such as `'patch'` or `'delete'`. These will be [wrapped in a POST request](/api/up.network.config#config.wrapMethod).

  @mix up-follow/request-extras
    @param up-params
      Additional [Form parameters](/api/up.Params) that should be sent as the request's
      [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

      The given value will be added to params [parsed](/api/up.Params.fromForm)
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
      [Disables form controls](/learn/disabling-forms) while the request is loading.

      The values of disabled fields will still be included in the submitted form params.

@section Client state
  @mix up-follow/client-state

@section Lifecycle hooks
  @mix up-follow/lifecycle-hooks

@stable
@signature

-----

# [up-switch]

Controls the state of another element when this field changes.

@learn-ref switching-form-state

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
You can also [implement custom switching effects](/learn/switching-form-state#custom-effects).

@selector [up-switch]

@section Dependencies
  @param up-switch
    A CSS selector for elements whose state depends on this field's value.

  @param [up-switch-region='form']
    A selector for the region in which elements are switched.

    By default all matching elements within the form are switched.
    You can expand or narrow the search scope by configuring a different selector.

@section Observed events
  @param [up-watch-event='input']
    The type of event to watch.

    See [which events to watch](/learn/watch-options#events).

    Switching is never [debounced](/learn/watch-options#debouncing). `[up-switch]` ignores
    `[up-watch-delay]` and `up.form.config.watchInputDelay`, since its effects are applied on the client.

@stable
@signature

-----

# up:form:switch

When an `[up-switch]` field changes, this event is emitted on all dependent elements.

You can listen to `up:form:switch` to implement [custom switching effects](/learn/switching-form-state#custom-effects).

@learn-ref switching-form-state#custom-effects

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
- when a [kept](/api/up-keep) `[up-switch]` field is transported to a new form.

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
  - A pseudo-value [`:blank` or `:present`](/learn/switching-form-state#presence), depending on the field's value.
  - For [checkboxes](/learn/switching-form-state#checkboxes), a pseudo-value `:checked` or `:unchecked`.

  @experimental

@stable

-----

# [up-show-for]

Only shows this element if an input field with `[up-switch]` has one of the given values.

The element will be hidden for all other values.

@learn-ref switching-form-state

@selector [up-show-for]
@param [up-show-for]
  A list of input values for which this element should be shown.

  @include switch-token-serialization
@stable

-----

# [up-hide-for]

Hides this element while an input field with `[up-switch]` has one of the given values.

The element will be shown for all other values.

@learn-ref switching-form-state#toggle

@selector [up-hide-for]
@param [up-hide-for]
  A list of input values for which this element should be hidden.

  @include switch-token-serialization
@stable

-----

# [up-disable-for]

Disables this element while an input field with `[up-switch]` has one of the given values.

The element will be enabled for all other values.

@learn-ref switching-form-state#disable

@selector [up-disable-for]
@param [up-disable-for]
  A list of input values for which this element should be disabled.

  @include switch-token-serialization
@stable

-----

# [up-enable-for]

Enables this element while an input field with `[up-switch]` has one of the given values.

The element will be disabled for all other values.

@learn-ref switching-form-state#disable

@selector [up-enable-for]
@param [up-enable-for]
  A list of input values for which this element should be enabled.

  @include switch-token-serialization
@stable

-----

# [up-watch]

Watches form fields and runs a callback when a value changes.

@learn-ref submitting-forms#autosubmit

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

To watch a group of radio buttons, use the `[up-watch]` attribute on an
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

-----

# [up-validate]

Renders a new form state when a field changes, to [show validation errors](/learn/validation#validating-after-changing-a-field) or
update [dependent elements](/learn/reactive-server-forms).

When a form field with an `[up-validate]` attribute is changed, the form is submitted to the server
which is expected to render a new form state from its current field values.
The [form group](/api/up-form-group) around the changed field is updated with the server response.
This quickly signals whether a change is valid,
without the need to scroll for error messages or to backtrack to
fields completed earlier.

@learn-ref validation
@learn-ref reactive-server-forms

> [NOTE]
> `[up-validate]` is a tool to implement highly dynamic forms that must update
> *as the user is completing fields*.\
> If you only need to [validate forms after submission](/learn/validation#validating-after-submission),
> you don't need `[up-validate]`.

## Marking fields for validation

Let's look at a standard registration form that asks for an e-mail and password.
The form is organized into [form groups](/api/up-form-group) of labels, inputs and
an optional error message:

```html
<form method="post" action="/users">

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

We can implement this by giving both fields an `[up-validate]` attribute:

```html
<form method="post" action="/users">

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
    user_params = params.permit(:email, :password)
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

The examples use Ruby on Rails, but work similarly with any other backend.

To honor the validation protocol, our backend needs to handle a third case:

<ol start="3">
  <li>When seeing an <code>X-Up-Validate</code> header, render a new form state from request parameters</li>
</ol>

In our example backend above, this change could look like this:

```ruby
class UsersController < ApplicationController

  def create
    # Instantiate model from request parameters
    user_params = params.permit(:email, :password)
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
server responds with a non-2xx status code.

Upon seeing an `X-Up-Validate` header, the server now renders a new form state from request parameters,
showing eventual validation errors and updating [dependent elements](/learn/reactive-server-forms):

```html
<form method="post" action="/users">

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

By default, Unpoly will only update the closest [form group](/api/up-form-group)
around the validating field. In the [example above](#marking-fields-for-validation),
after changing the `email` field, only the `<fieldset>` around the field will be updated.

If the form is not structured into groups, the entire
form will be updated.


### Updating a different fragment {#target}

If you don't want to update the field's form group, you can set the `[up-validate]`
attribute to any [target selector](/learn/targeting-fragments):

```html
<input name="email" up-validate=".email-errors"> <!-- mark: up-validate=".email-errors" -->
<div class="email-errors"></div>
```

You may [update multiple fragments](/learn/targeting-fragments#multiple)
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

See [Reactive server forms](/learn/reactive-server-forms) for more details and examples.


## Validating while typing

@include validating-while-typing


## Preventing race conditions

Unpoly sends one validation request per form at a time and batches the rest.

See [preventing race conditions](/learn/reactive-server-forms#race-conditions) for more details.

## Validating multiple fields

You can set `[up-validate]` on any element to validate *all contained fields* on change.

In the [example above](#marking-fields-for-validation),
instead of setting `[up-validate]` on each individual `<input>`, we can also set it on the `<form>`:

```html
<form method="post" action="/users" up-validate> <!-- mark: up-validate -->

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
<form method="post" action="/users">

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
    <input type="text" id="name" name="name"> <!-- chip "will NOT validate" -->
  </fieldset>

  <button type="submit">Register</button>

</form>
```

### Validating radio buttons

Multiple radio buttons with the same `[name]` produce a single value for the form.

To validate a group of radio buttons, use the `[up-validate]` attribute on an
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

Multiple validations to the same URL will be [batched together](/api/up.validate#batching).


## Programmatic validation

To update form fragments from your JavaScript, use the [`up.validate()`](/api/up.validate) function.
You may combine `[up-validate]` and `up.validate()` within the same form. Their updates
will be [batched together](/api/up.validate#batching) in order to
[prevent race conditions](/learn/reactive-server-forms#race-conditions).


@selector [up-validate]

@section Targeting
  @param [up-validate]
    The [target selector](/learn/targeting-fragments) to update with the server response.

    Defaults to the closest [form group](/api/up-form-group) around the validating field.

    You can set another selector to [update a different fragment](/api/up-validate#target).
    To refer to the changed field, use the `:origin` pseudo-selector.

@section Observed events
  @mix up-watch/observed-events
    @param [up-watch-event='change']

@section Request
  @param [up-validate-url]
    The URL to which to submit the validation request.

    By default, Unpoly will use the form's `[action]` attribute.

    See [Validating against other URLs](/api/up-validate#urls).

  @param [up-validate-method]
    The method to use for submitting the validation request.

    By default, Unpoly will use the form's `[method]` attribute.

    See [Validating against other URLs](/api/up-validate#urls).

  @param [up-validate-params]
    @like [up-submit]/up-params
    @experimental

  @param [up-validate-headers]
    A [relaxed JSON](/api/relaxed-json) object with additional request headers.

    By default, Unpoly will send an `X-Up-Validate` header so the server
    can [distinguish the validation request from a regular form submission](#backend-protocol).

    @experimental

  @param [up-validate-batch='true']
    Whether to [consolidate multiple validations into a single request](/api/up.validate#batching).

    Defaults to `up.form.config.validateBatch`, which defaults to `true`.

@section Loading state
  @mix up-watch/loading-state


@stable
@signature

-----

# [up-autosubmit]

Automatically submits a form when a field changes.

@learn-ref submitting-forms#autosubmit

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

To auto-submit a group of radio buttons, use the `[up-autosubmit]` attribute on an
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
@signature
