Migrating legacy JavaScripts
============================

Legacy scripts often run on `DOMContentLoaded`, expecting a fresh page load for every interaction.
Once Unpoly handles your [links](/handling-all-links) and [forms](/handling-all-forms),
that event fires only once per session, and such scripts stop running.
The fix is to call them from a [compiler](/enhancing-elements) instead.


## Migrating legacy scripts to a compiler {#migrate-to-compiler}

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
a fragment update will not be "lightboxified".

You can fix this by moving your code to a [compiler](/enhancing-elements):

```js
up.compiler('a.lightbox', function(element) {
  lightboxify(element)
})
```

When the page initially loads, Unpoly will call this compiler for every element
matching `a.lightbox`. When a fragment is updated later, Unpoly will call this compiler
for new matches within the new fragment. Each element is only compiled once, so
elements that an earlier pass already enhanced are left alone.

> [important]
> Compilers should only process the given element and its children.
> It should not use `document.querySelectorAll()` to process elements
> elsewhere on the page, since these may already have been compiled.


### Migrating screen-specific scripts

You may sometimes have a script that enhances the HTML on the current screen:

```html
<form action="/orders/new">
   ...
</form>

<script>
   trackView({ screen: 'order-form', step: 1 })
</script>
```

To migrate this script, think of an attribute or class that should activate the behavior,
and add it to the relevant element:

```html
<form action="/orders/new" track-view> <!-- mark: track-view -->
   ...
</form>
```

Any parameters can be [attached to the element](/data):

```html
<form action="/orders/new" track-view up-data="{ screen: 'order-form', step: 1 }"> <!-- mark: up-data="{ screen: 'order-form', step: 1 }" -->
   ...
</form>
```

You can now react to the element in a compiler:

```js
up.compiler('[track-view]', function(element, data) { // mark: [track-view]
  trackView(data)
})
```



### Avoid loading your application scripts in the `<body>`

When allowing inline scripts to run, mind that the `<body>` element is a default [main target](/main).
If you include your global scripts at the end of your `<body>`, swapping the `<body>` will re-execute these scripts:

```html
<html>
  <body>
    <p>Content here</p>
    <script src="app.js"></script> <!-- will run every time `body` is updated -->
  </body>
</html>
```

A better solution is to move the `<script>` into the `<head>` and [give it a `[defer]` attribute](https://makandracards.com/makandra/504104-you-should-probably-load-your-javascript-with-script-defer):

```html
<html>
  <head>
    <script src="app.js" defer></script> <!-- mark: defer -->
  </head>
  <body>
    <p>Content here</p>
  </body>
</html>
```


## Memory leaks on long-lived pages {#memory-leaks}

Without full page loads, the browser no longer resets the JavaScript VM with every click.
The same VM can now persist for minutes or hours, so
[memory leaks](https://nolanlawson.com/2020/02/19/fixing-memory-leaks-in-web-applications/)
that a full page load used to hide are going to stack up.

A common leak is scheduling timers with `setInterval()`, but never clearing these timers
when they are no longer needed. When a compiler sets up something like this, undo it in a
[destructor function](/enhancing-elements#destructor).


@page legacy-scripts
