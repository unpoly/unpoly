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

  get value() {
    return this.getAttribute('value')
  }

  set value(newValue) {
    this.setAttribute('value', newValue)
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

Submission is all the browser can do for you. To also be watched, validated, switched or
disabled, your element needs to be readable from a script:

### What Unpoly reads from a field {#contract}

Submission is all the browser can do for you. To also be watched, validated, switched or
disabled, your element must be readable from a script:

| | Unpoly reads | Unpoly writes | You must provide |
|---|---|---|---|
| `value` | the property | never | **a getter** |
| `name` | the property, else the `[name]` attribute | never | nothing |
| `disabled` | the property, else the `[disabled]` attribute | whichever one you have | nothing |

**A `value` getter is the one thing to remember.** The browser reads your value through
`setFormValue()`, which a script cannot read back — so without a getter your element is
submitted correctly but never watched.

The other two need nothing from you, because of how component authoring actually works. Authors
declare properties that are fed *from* attributes and rarely reflect them back, so the property
holds the live value wherever one exists. A hand-rolled form-associated element declares nothing
at all, and there the attribute is guaranteed — the browser reads it to name and disable your
element. So Unpoly prefers the property and falls back to the attribute.

Both fall back on *absence*, not falseness. A native field reports `name === ''` and
`disabled === false`, which are answers rather than gaps.

When Unpoly [disables a form](/disabling-forms) it writes whichever spelling your element
implements, never both: the property if you declared one, otherwise the attribute. Assigning a
property you never declared would create it, and it would shadow your attribute from then on.

> [note]
> Unpoly only looks at a field's own disabled state. A field inside a `<fieldset disabled>` is
> omitted from a submission, because the browser omits it, but it is still reported to
> [watchers](/up.watch).

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
