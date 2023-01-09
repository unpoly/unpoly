/*-
@module up.form
*/

up.migrate.renamedProperty(up.form.config, 'fields', 'fieldSelectors')
up.migrate.renamedProperty(up.form.config, 'submitButtons', 'submitButtonSelectors')
up.migrate.renamedProperty(up.form.config, 'validateTargets', 'groupSelectors')
up.migrate.renamedProperty(up.form.config, 'observeDelay', 'watchInputDelay')

up.migrate.migratedFormGroupSelectors = function() {
  return up.form.config.groupSelectors.map((originalSelector) => {
    let migratedSelector = originalSelector.replace(/:has\((&|:origin)\)$/, '')
    if (originalSelector !== migratedSelector) {
      up.migrate.warn('Selectors in up.form.config.groupSelectors must not contain ":has(&)". The suffix is added automatically where required. Found in "%s".', originalSelector)
    }
    return migratedSelector
  })
}

/*-
Watches form fields and runs a callback when a value changes.

Only fields with a `[name]` attribute can be watched.

The programmatic variant of this is the [`up.watch()`](/up.watch) function.

### Example

The following would run a log whenever the `<input>` changes:

```html
<input name="query" up-observe="console.log('New value', value)">
```

### Callback context

The script given to `[up-watch]` runs with the following context:

| Name     | Type      | Description                           |
| -------- | --------- | ------------------------------------- |
| `this`   | `Element` | The changed form field                |
| `name`   | `Element` | The `[name]` of the changed field     |
| `value`  | `string`  | The new value of the changed field    |

### Watching multiple fields

You can set `[up-watch]` on any element to observe all contained fields.
The `name` argument contains the name of the field that was changed.

@selector [up-observe]
@param up-observe
  The code to run when any field's value changes.
@deprecated
  Use `[up-watch]` instead.
*/
up.migrate.renamedAttribute('up-observe', 'up-watch')

/*-
Marks this element as a from group, which (usually) contains a label, input and error message.

You are not required to use form groups to [submit forms through Unpoly](/form-up-submit).
However, structuring your form into groups will help Unpoly to make smaller changes to the DOM when
working with complex form. For instance, when [validating](/up-validate) a field,
Unpoly will re-render the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
form group around that field.

By default Unpoly will also consider a `<fieldset>` or `<label>` around a field to be a form group.
You can configure this in `up.form.config.groupSelectors`.

@selector [up-fieldset]
@deprecated
  Use `[up-form-group]` instead.
*/

up.migrate.renamedAttribute('up-fieldset', 'up-form-group')

up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-autosubmit]' })

up.migrate.renamedAttribute('up-delay', 'up-watch-delay', { scope: '[up-watch]' })

up.migrate.renamedAttribute('up-restore-scroll', 'up-scroll', { mapValue: (value) => (value === 'true' ? 'restore' : 'reset') })

/*-
Observes form fields and runs a callback when a value changes.

### Example

The following would print to the console whenever an input field changes:

```js
up.observe('input.query', function(value) {
  console.log('Query is now %o', value)
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
@deprecated
  Use `up.watch()` instead.
*/
up.observe = function(...args) {
  up.migrate.deprecated('up.observe()', 'up.watch()')
  return up.watch(...args)
}
