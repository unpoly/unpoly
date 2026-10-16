Custom form fields
==================

A custom control like a date picker, a tag editor or a set of clickable pills can take part
in Unpoly's form features the same way a native `<input>` or `<select>` does.
There are four ways to build one. They differ in how the value
reaches the server, and in how much Unpoly needs to know about your control.

| Pattern | Needs JS | Submitted | Watched, validated, switched | Disabled |
|---|---|---|---|---|
| [A hidden native field](#hidden-field) | No | Yes | Yes | Yes |
| [A form-associated element](#form-associated) | Yes | Yes | With `value` prop | Yes |
| [A registered element](#registering) | Yes | With `value` prop | With `value` prop | Yes |
| [A `formdata` listener](#formdata) | Yes | Yes | No | No |

If you can keep a native field in the form, do. It is the only pattern where nothing about
Unpoly, or about the browser's form APIs, needs to be considered at all, and it keeps working
without JavaScript.


## <em class="heading-prefix">Option 1</em> Keeping a hidden native field {#hidden-field}

Start with a native field that carries the value. A [compiler](/up.compiler) hides it and
renders your control in its place. The user sees the control; the form submits the field.

```html
<select name="size" class="pills">
  <option value="s">Small</option>
  <option value="m">Medium</option>
</select>
```

```js
up.compiler('select.pills', function(select) {
  up.element.hide(select)

  for (let option of select.options) {
    let pill = up.element.affix(select, 'beforebegin', 'button', { type: 'button', text: option.text })
    pill.addEventListener('click', () => {
      select.value = option.value
      up.emit(select, 'change') // let watchers and validations see the change
    })
  }
})
```

This is the only option that still works without JavaScript. The user then sees the native
`<select>`, and the form submits it.

Because a real form field carries the value, everything works with no further
configuration: the field is submitted, [watched](/up.watch), [validated](/validation),
[switched](/switching-form-state) and [disabled](/disabling-forms) like any other.

Don't forget the `change` event. Setting `select.value` from a script does
not emit one, so nothing would notice the new value.


## <em class="heading-prefix">Option 2</em> Making a custom element form-associated {#form-associated}

A [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
can join a form the way a native control does, by declaring itself form-associated and
reporting its value to the browser:

```js
class DatePicker extends HTMLElement {
  static formAssociated = true // mark: formAssociated
  #value = ''

  constructor() {
    super()
    this.internals = this.attachInternals()
  }

  get value() {
    return this.#value
  }

  set value(newValue) {
    this.#value = newValue
    this.internals.setFormValue(newValue) // mark: setFormValue
  }

  // Called when the user picks a day in the calendar sheet
  onDayPicked(day) {
    this.value = day
    this.dispatchEvent(new Event('change', { bubbles: true })) // mark: change
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

Unpoly reads your element's value through its `value` property, because a script cannot read back
what you passed to `setFormValue()`. Emit a `change` event whenever the value changes, so
watchers and validations notice it.

An element that is defined after the form was rendered, e.g. by a lazily loaded component,
is picked up automatically.


## <em class="heading-prefix">Option 3</em> Registering any element as a field {#registering}

Any element can act as a field, even a plain `<div>`. Tell Unpoly which elements to treat as
fields, and give them a `value` property with a [compiler](/up.compiler):

```html
<div class="rating" name="stars"></div>
```

```js
up.form.config.fieldSelectors.push('.rating') // mark: fieldSelectors

up.compiler('.rating', function(rating) {
  rating.value = '' // mark: rating.value

  for (let stars of ['1', '2', '3', '4', '5']) {
    let button = up.element.affix(rating, 'button', { type: 'button', text: '★' })
    button.addEventListener('click', () => {
      rating.value = stars
      up.emit(rating, 'change') // let watchers and validations see the change
    })
  }
})
```

Unpoly then treats the `<div>` as a field everywhere: it is submitted, watched,
validated, switched and disabled. Its name comes from the `[name]` attribute, as on an `<input>`.

The browser knows nothing about this element, so Unpoly uses the `value` property to submit it.
Emit a `change` event whenever the value changes.

Prefer [a form-associated element](#form-associated) for a control you are writing today.
It needs no configuration, and it works in forms that are submitted without Unpoly.


## <em class="heading-prefix">Option 4</em> Adding values with a `formdata` listener {#formdata}

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
