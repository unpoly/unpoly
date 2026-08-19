Custom form fields
==================

Sometimes a native `<input>` or `<select>` cannot express the control your design needs: a
date picker, a tag editor, a rich text area, a set of clickable pills.

This page shows four ways to build one, and what each costs. They differ in how the value
reaches the server, and in how much Unpoly needs to know about your control.

| Pattern | Submitted | Watched, validated, switched, disabled |
|---|---|---|
| [A hidden native field](#hidden-field) | Yes | Yes |
| [A form-associated custom element](#form-associated) | Yes | With a `{ value }` property |
| [A configured custom element](#configured) | Yes | Yes |
| [A `formdata` listener](#formdata) | Yes | No |

If you can keep a native field in the form, do. It is the only pattern where nothing about
Unpoly, or about the browser's form APIs, needs to be considered at all.


## A hidden native field {#hidden-field}

Render your control with a [compiler](/up.compiler), and keep a native field in the form to
carry the value. The control is what the user sees; the field is what the form submits.

```html
<div class="pills">
  <select name="size" hidden> <!-- mark: hidden -->
    <option value="s">Small</option>
    <option value="m">Medium</option>
  </select>
  <button type="button" value="s">Small</button>
  <button type="button" value="m">Medium</button>
</div>
```

```js
up.compiler('.pills', function(pills) {
  let select = pills.querySelector('select')

  for (let pill of pills.querySelectorAll('button')) {
    pill.addEventListener('click', () => {
      select.value = pill.value
      up.emit(select, 'change') // let watchers and validations see the change
    })
  }
})
```

Because a real form field carries the value, everything works with no further
configuration: the field is submitted, [watched](/up.watch), [validated](/validation),
[switched](/switching-form-state) and [disabled](/disabling-forms) like any other.

The one thing to remember is the `change` event. Setting `select.value` from a script does
not emit one, so nothing would notice the new value.


## A form-associated custom element {#form-associated}

A [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
can join a form the way a native control does, by declaring itself form-associated and
reporting its value to the browser:

```js
class DatePicker extends HTMLElement {
  static formAssociated = true // mark: formAssociated

  constructor() {
    super()
    this.internals = this.attachInternals()
  }

  set value(newValue) {
    this.internals.setFormValue(newValue) // mark: setFormValue
    this.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

customElements.define('date-picker', DatePicker)
```

```html
<date-picker name="starts_at"></date-picker>
```

The browser includes such an element in its own form data, so Unpoly submits it without
being told anything about it. You also get `<label>` association, `:disabled`, and
[`formDisabledCallback()`](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#form-associated_custom_elements)
for free.

> [important]
> A form-associated element is only submitted if it calls `setFormValue()`. Declaring
> `formAssociated` alone makes the browser aware of your element, but with no value to send.

To also be watched, validated, switched or disabled, expose the properties Unpoly reads:

| Property | Read by |
|---|---|
| `name` | every feature that identifies a field |
| `value` | [watching](/up.watch), [validating](/validation), [switching](/switching-form-state) |
| `disabled` | [disabling](/disabling-forms) |

For `disabled`, report the state the browser computed, so an ancestor `<fieldset disabled>`
is covered too:

```js
get disabled() {
  return this.matches(':disabled')
}

set disabled(newDisabled) {
  this.toggleAttribute('disabled', newDisabled)
}
```

> [tip]
> If your element's definition is loaded lazily, register its tag name in
> `up.form.config.fieldSelectors` as described [below](#configured). A tag name matches
> before the definition arrives, while `formAssociated` cannot be known until it does.


## A configured custom element {#configured}

A custom element that is *not* form-associated can still take part, if you tell Unpoly what
to look for and expose the three properties above:

```js
up.form.config.fieldSelectors.push('date-picker')
```

Unpoly then treats `<date-picker>` as a field everywhere: it is submitted, watched,
validated, switched and disabled. The browser knows nothing about it, so this registration
is also what makes it submittable.

Prefer [a form-associated element](#form-associated) for a control you are writing today.
It needs no configuration, and it works in forms that are submitted without Unpoly.


## A `formdata` listener {#formdata}

To add a value that no element carries, append it while the form data is being built:

```js
up.on(form, 'formdata', function(event) {
  event.formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone)
})
```

This is a [standard DOM event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event),
and Unpoly honors it because it builds request params with the browser's own form-data
algorithm.

> [important]
> A `formdata` listener affects what Unpoly **sends**, not what it **watches**. Values it
> appends belong to the whole form rather than to any field, so they cannot be attributed to
> the [form group](/up-form-group) that a watcher or validation is looking at. Use it
> for data that is derived, not edited.


@page custom-form-fields
@menu-title Custom fields
