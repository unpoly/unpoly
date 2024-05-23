Migrating legacy JavaScripts
============================

Legacy code often contains JavaScripts that expect a full page load whenever the
user interacts with the page. When you configure Unpoly to handle all interaction,
there will not be additional page loads as the user clicks a link or submits a form.

This may cause some of the following issues:

1. The `window` will not emit another `DOMContentLoaded` event when you
   update the page body through Unpoly. This may cause your legacy JavaScript to not
   run when you expect it to.
2. Legacy JavaScript often enhances elements on the entire page
   instead of scoping its changes to a region of the DOM.
   When we're updating fragments we only want to enhance elements within the new fragment,
   and don't want to touch elements that we have already enhanced.
3. Legacy JavaScript may have [memory leaks](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/), e.g. by scheduling timers with `setInterval()`
   but never clearing these timers when they're no longer needed.
   When you're resetting the page with every click you may never
   notice the leaks. However, when all links are handled through Unpoly
   the JavaScript VM may persist for minutes or hours and those leaks
   are going to stack up.

The cleanest solution to these issues is to call all your JavaScript
from an [Unpoly compiler](/up.compiler).

## Migrating legacy scripts to a compiler

The legacy code below waits for the page to load, then selects all links with a
`.lightbox` class and calls `lightboxify()` for each of these links:

```js
document.addEventListener('DOMContentLoaded', function(event) {
  document.querySelectorAll('a.lightbox').forEach(function(element) {
    lightboxify(element)
  })
})
```

Since the code only runs after the initial page load, links contained in
a fragment update will not be lightboxified.

You can fix this by moving your code to a [compiler](/up.compiler):

```js
up.compiler('a.lightbox', function(element) {
  lightboxify(element)
})
```

When the page initially loads, Unpoly will call this compiler for every element
matching `a.lightbox`. When a fragment is updated later, Unpoly will call this compiler
for new matches within the new fragment.

> [important]
> Compilers should only process the given element and its children.
> It should not use `document.querySelectorAll()` to process elements
> elsewhere on the page, since these may already have been compiled.

## Running inline `<script>` tags

`<script>` tags will run if they are part of the updated fragment.

Mind that the `<body>` element is a default [main target](/main).
If you are including your global application scripts
at the end of your `<body>` for performance reasons, swapping the `<body>` will re-execute these scripts:

```html
<html>
  <body>
    <p>Content here</p>
    <script src="app.js"></script> <!-- will run every time `body` is updated -->
  </body>
</html>
```

A better solution is so move the `<script>` to head and [give it an `[defer]` attribute](https://makandracards.com/makandra/504104-you-should-probably-load-your-javascript-with-script-defer
):

```html
<html>
  <head>
    <script src="app.js" defer></script> <!-- mark-phrase "defer" -->
  </head>
  <body>
    <p>Content here</p>
  </body>
</html>
```


@page legacy-scripts
