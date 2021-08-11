Making JavaScripts work with fragment updates
=============================================

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

### Migrating legacy scripts to a compiler

The legacy code below waits for the page to load, then selects all links with a
`.lightbox` class and calls `lightboxify()` for each of these links:

```js
window.addEventListener('DOMContentLoaded', function(event) {
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

### Running inline `<script>` tags

By default Unpoly does not execute `<script>` tags in an updated fragment to prevent
unwanted side effects.
This means that your `<script>` tag will only be executed during the initial page
load, but not when navigating to a new page via an `a[up-follow]` link.

It is recommended to move all your JavaScript from `<script>` tags into a compiler.
This ensures your code is called after both page loads and fragment updats.
A compiler also enables you to scope   the side effects of your code to the DOM
fragment that was updated.

If you cannot migrate your `<script>` tags to a compiler, you you can also configure
Unpoly to run `<script>` tags in updated fragments:

```js
up.fragment.config.runScripts = true
```

If you do this, mind that the `<body>` element is a default [main target](/up-main). If you are including your global application scripts
at the end of your `<body>` for performance reasons, swapping the `<body>` will re-execute these scripts.
In that case you must configure a different main target that does not include
your application scripts.

@page legacy-scripts
