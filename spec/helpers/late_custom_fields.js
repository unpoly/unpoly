// Returns a form-associated custom element that is not yet defined, like a component whose
// script loads after the page was rendered. The element behaves like <test-form-associated-element>
// (see custom_fields.js) once defined.
//
// A definition can never be undone, so every call returns a new tag name:
//
//     const { tagName, define } = lateFormAssociatedElement()
//
//     const [form, field] = htmlFixtureList(`
//       <form>
//         <${tagName} name="email" value="foo@example.com"></${tagName}>
//       </form>
//     `)
//     up.hello(form)
//
//     define()
//     await wait()
//
// To simulate a custom element that is never defined (e.g. one that only exists for CSS),
// just don't call define().

let lateElementCount = 0

window.lateFormAssociatedElement = function() {
  const tagName = `test-late-form-associated-element-${++lateElementCount}`

  function define() {
    const TestFormAssociatedElement = customElements.get('test-form-associated-element')
    customElements.define(tagName, class extends TestFormAssociatedElement {})
  }

  return { tagName, define }
}
