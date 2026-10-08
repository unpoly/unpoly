Enhance an element
==================

For your own JavaScript, Unpoly pairs behavior with HTML elements.
Instead of running scripts once per page load, you register a *compiler*
that enhances matching elements whenever they enter the page.


Writing a compiler
------------------

Say your server renders this element:

```html
<span class="current-time"></span>
```

Register a compiler for its selector:

```js
up.compiler('.current-time', function(element) { // mark: .current-time
  element.textContent = new Date().toString()
})
```

The function is called once for each matching element: when the page first
loads, and again whenever a fragment update inserts a `.current-time` element.

This replaces listening to `DOMContentLoaded`. Because Unpoly updates fragments,
the browser keeps the same document through many navigations, and events that
only fire at the initial page load would miss all content that arrives later.



@page start/elements
@signature
