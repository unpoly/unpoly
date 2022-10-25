Reacting to form changes
========================

THIS BECOMES MORE OF AN OVERVIEW OF up.form!

This page explains how to build complex forms with sections that need to update dynamically.

In Unpoly, forms are regular `<form>` elements that you can observe with standard [`change`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [`input`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) events. However Unpoly also comes with helpers for implementing non-trivial forms with very little code.


Live validations
----------------



See `[up-validate]` for more details.


Dependent fields
----------------

- Also `[up-validate]`


  The list of employees needs to be updated as the appartment changes:

  ```html
  <form action="/contracts">
    <select name="department" up-validate="[name=employee]">...</select>
    <select name="employee">...</select>
  </form>
  ```

See `[up-validate]` for more details.



Show or hide fields depending on a value
----------------------------------------






Watching for changes programmatically
------------------------------------

Instead of listening to [`change`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [`input`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) events, you may use the `up.watch()` function or `[up-watch]` attribute.

- Only reacts when changed
- Guarantees only one async callback is running concurrently
- Normalizes events
- Can be batched
- Can be debounced


@page reacting-to-form-changes
