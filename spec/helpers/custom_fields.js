// Custom elements can only be defined once per page load, and can never be undefined.
// So the elements that specs use to stand in for real-world custom fields are defined
// here, once, for the whole suite.
//
// They mirror two of the patterns documented in /custom-form-fields:
//
//     <test-form-associated-element>   a form-associated custom element
//     <test-form-field>                a custom element exposing { name, value, disabled }
//
// Both take their initial value from a [value] attribute, so a fixture reads as HTML:
//
//     htmlFixtureList(`
//       <form>
//         <test-form-associated-element name="email" value="foo@example.com"></test-form-associated-element>
//       </form>
//     `)
//
// To simulate a user editing one, set { value } and trigger the event, as with a native field:
//
//     field.value = 'new value'
//     Trigger.change(field)
//
// A <test-form-field> is not form-associated, so a spec must register it before Unpoly
// considers it a field:
//
//     up.form.config.fieldSelectors.push('test-form-field')

// A form-associated custom element. The browser includes it in its own form-data
// algorithm, so Unpoly needs no configuration to submit it.
class TestFormAssociatedElement extends HTMLElement {

  static formAssociated = true

  constructor() {
    super()
    this._internals = this.attachInternals()
  }

  connectedCallback() {
    this._internals.setFormValue(this.value)
  }

  get name() {
    return this.getAttribute('name')
  }

  get value() {
    return this.getAttribute('value') ?? ''
  }

  set value(newValue) {
    this.setAttribute('value', newValue)
    this._internals.setFormValue(newValue)
  }

  // Report the disabled state that the browser computed, which also covers an
  // ancestor <fieldset disabled>. This is the pattern we recommend to authors.
  get disabled() {
    return this.matches(':disabled')
  }

  set disabled(newDisabled) {
    this.toggleAttribute('disabled', newDisabled)
  }

}

// A custom element that is *not* form-associated, and that participates only through
// the { name, value, disabled } properties that up.form.config.fieldSelectors expects.
class TestFormField extends HTMLElement {

  get name() {
    return this.getAttribute('name')
  }

  get value() {
    return this.getAttribute('value') ?? ''
  }

  set value(newValue) {
    this.setAttribute('value', newValue)
  }

  get disabled() {
    return this.hasAttribute('disabled')
  }

  set disabled(newDisabled) {
    this.toggleAttribute('disabled', newDisabled)
  }

}

// A custom element that reports a { name } but no readable { value } — the shape of a
// form-associated element whose author never exposed one. It has nothing to contribute.
class TestValuelessField extends HTMLElement {

  get name() {
    return this.getAttribute('name')
  }

}

customElements.define('test-form-associated-element', TestFormAssociatedElement)
customElements.define('test-form-field', TestFormField)
customElements.define('test-valueless-field', TestValuelessField)
