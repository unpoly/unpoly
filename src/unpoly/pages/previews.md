Previews
========

Previews are temporary page changes while waiting for a network request.
They signal that the app is working, or provide clues for how the page will ultimately look.

Because previews immediately appear after a user interaction, their use
increases the perceived responsiveness of your application.

> [tip]
> Previews are an advanced technique to describe arbitrary loading state or optimistic UI.
> Unpoly also provides more accessible utilities for common use cases, implemented as previews internally.
> See [loading state](/loading-state) for an overview.


## Overview {#overview}

Previews are small functions that can
be attached to a [link](/up-follow), [form](/up-submit) or any [programmatic render pass](/up.render).

When the user interacts with a link or form, its preview function is invoked immediately.
The function will usually [mutate the DOM](#basic-mutations) in a way the user gets
a preview of the interaction effect. For example, if the user is deleting an item from a list, the preview
function could hide that item visually.

When the request ends for [any reason](#ending), all preview changes will be reverted before
the server response is processed. This ensures a consistent screen state in cases when
a request is aborted, or when we end up updating a different fragment.

Unpoly provides utility functions to [make temporary DOM mutations](#basic-mutations) that automatically revert
when the preview ends. For advanced cases you may also apply [arbitrary mutations](#advanced-mutations),
as long as you revert them cleanly when the preview ends.


## Mutating the DOM from a preview {#basic-mutations}

For a simple example, we want to show a simple spinner animation
within a button while it is loading:

<video src="images/button-spinner.mp4" controls loop width="350" aria-label="A button showing a spinning animation when pressed"></video>

To achieve this effect, we define a *preview* named `link-spinner`:

```js
up.preview('link-spinner', function(preview) {
  let link = preview.origin
  preview.insert(link, '<img src="spinner.gif">')
})
```

The `preview` argument is an `up.Preview` instance that offers many utilities to make temporary changes:

| Function                                                       | Effect                          |
|----------------------------------------------------------------|---------------------------------|
| [`preview.insert()`](/up.Preview.prototype.insert)             | Inserts an element.             |
| [`preview.addClass()`](/up.Preview.prototype.addClass)         | Adds a CSS class.               |
| [`preview.removeClass()`](/up.Preview.prototype.removeClass)   | Removes a CSS class.            |
| [`preview.setAttrs()`](/up.Preview.prototype.setAttrs)         | Change an element's attributes. |
| [`preview.setStyle()`](/up.Preview.prototype.setStyle)         | Set inline CSS styles.          |
| [`preview.swapContent()`](/up.Preview.prototype.swapContent)   | Replace an element's children.  |
| [`preview.hide()`](/up.Preview.prototype.hide)                 | Hides an element.               |
| [`preview.show()`](/up.Preview.prototype.show)                 | Shows a hidden element.         |
| [`preview.openLayer()`](/up.Preview.prototype.openLayer)       | Opens an overlay.               |
| [`preview.showLayer()`](/up.Preview.prototype.showPlaceholder) | Show a placeholder.             |

We can use the `link-spinner` preview in any link or form by setting an `[up-preview]` attribute:

```html
<a href="/edit" up-follow up-preview="link-spinner">Edit page</a> <!-- mark-phrase: up-preview -->
```

When the link is followed, the preview will append the spinner element to the link label.
When the server response is received, the spinner element will be removed automatically. 


### From JavaScript

From JavaScript you can pass the preview name as a `{ preview }` option:

```js
up.navigate({ url: '/edit', preview: 'link-spinner' })
```

If you don't want to define a named preview using `up.preview()`, the JavaScript API also accepts an anonymous preview function:

```js
up.navigate({
   url: '/edit',
   preview: (preview) => preview.insert(preview.origin, '<img src="spinner.gif">')
})
```


## Inspecting the preview context

The `up.Preview` object provides getters to learn more about the current render pass:

```js
up.preview('my-preview', function(preview) {
  preview.target         // The target selector
  preview.fragment       // The fragment being updated
  preview.layer          // The layer being updated
  preview.request        // The request we're waiting for
  preview.params         // Requested form params
  preview.renderOptions  // All options for this render pass
  preview.revalidating   // Whether we're previewing a cache revalidation
})
```

In particular `preview.params` is helpful to
[preview the effects of a form submission](/optimistic-rendering#previewing-form-submissions).




## Advanced mutations {#advanced-mutations}

Instead of using an `up.Preview` method you can use arbitrary changes to the DOM.

For example, this preview uses the native browser API to add a `.loading` class to the `<body>`
while a request is loading:

```js
up.preview('my-preview', function(preview) {
  // Only make a change when it is necessary. 
  if (document.body.classList.contains('loading')) return

  document.body.classList.add('loading')
  
  // Undo our change when the preview ends.
  return () => document.body.classList.remove('loading') 
})
```

In this manual approach we need to do additional work:

1. We must return a function that undoes our changes
2. We must only undo changes that we caused.
   We may have multiple concurrent previews racing for the same changes,
   and we must not undo a change done by another preview.

> [tip]
> All `up.Preview` methods automatically undo their changes and work concurrently.

Another way to register an undo action is to register a callback with `preview.undo()`.
This is especially useful when you're making multiple changes, and want to group each change and undo effect together:

```js
up.preview('my-preview', function(preview) {
  change1()
  preview.undo(() => undoChange1())

  change2()
  preview.undo(() => undoChange2())
})
```



### Prefer additive changes

While previews can change the DOM arbitrary, we recommend to not remove the targeted
fragment from the DOM. A detached fragment cannot be [aborted](/aborting-requests).

```js
up.preview('spinner', function(preview) {
  let spinner = up.element.createFromHTML('<img src="spinner.gif">')

  // ❌ Detached fragments cannot be aborted
  preview.fragment.replaceWith(spinner)

  return () => spinner.replaceWith(preview.fragment)
})
```

Instead of detaching a fragment, consider hiding it instead:

```js
up.preview('spinner', function(preview) {
  let spinner = up.element.createFromHTML('<img src="spinner.gif">')
  preview.fragment.insertAdjacentElement('beforebegin', spinner)

  // ✅ Hidden fragments can still be aborted
  up.element.hide(preview.fragment)

  return () => {
    spinner.remove()
    up.element.show()
  }
})
```

By using `up.Preview` methods (which undo automatically), we can shorten the example considerably:

```js
up.preview('spinner', function(preview) {
  preview.insert(preview.fragment, 'beforebegin', '<img src="spinner.gif">')
  preview.hide(preview.fragment)
})
```



## Preview parameters {#parameters}

Preview functions can accept an options object as a second argument.
This is useful to define multiple variations of a preview effect.

For example, the following preview accepts a `{ size }` option to show a spinner of varying size:

```js
up.preview('spinner', function(preview, { size = 50 }) {
  let spinner = up.element.createFromSelector('img', { src: 'spinner.gif', width: size })
  preview.insert(preview.fragment, spinner)
})
```

From HTML you can append the options to the `[up-preview]` argument, after the preview name:

```html
<a href="/edit" up-follow up-preview="spinner { size: 100 }">Edit page</a> <!-- mark-phrase: { size: 100 } -->
```

### Passing options from JavaScript

From JavaScript you can also pass the a string containing preview name and options:

```js
up.navigate({
  url: '/edit',
  preview: 'link-spinner { size: 100 }'
})
```

As an alternative, you can also pass a function that calls [`preview.run()`](/up.Preview.prototype.run)
with a preview name and options.
This makes it easier to pass option values that already exist in your scope:

```js
let size = 100

up.navigate({
  url: '/edit',
  preview: (preview) => preview.run('link-spinner', { size })
})
```


## How previews end {#ending}

A preview ends when its associated request ends for *any* reason. Reasons include:

- the server responds with new HTML
- the server [renders an error code](/failed-responses#fail-options)
- the request encounters a [fatal error](/failed-responses#handling-fatal-network-errors), like a timeout or loss of network connectivity.
- the server [updates a different fragment](/X-Up-Target)
- the request is [aborted](/aborting-requests), e.g. by a different link targeting the same fragment

When the preview ends, all its page changes will be reverted before the server response is processed.

To manually end a preview, [abort](/aborting-requests) its associated request.

To test whether a request has ended from an async [preview function](/up.preview),
access the [`preview.ended`](/up.Preview.prototype.ended) property.



## Using previews with caching

Previews are *not* shown when rendering [cached content](/caching).
This avoids a flash when a preview is shown and immediately reverted.

After rendering cached content that is [expired](/caching#expiration),
Unpoly will usually [revalidate](/caching#revalidation) the fragment by reloading it.
To show a preview for the revalidating request, use the `[up-revalidate-preview]` attribute instead:

```html
<a href="/clients"
   up-follow
   up-preview="index-placeholder"
   up-revalidate-preview="spinner"> <!-- mark-phrase: up-revalidate-preview -->
  Clients
</a>
```

The revalidation preview is run after the expired content has been rendered.
Hence the preview can modify a DOM tree showing the destination screen (albeit with stale data).

To use the `[up-preview]` attribute for both the initial render pass, and the revalidation request, set `[up-revalidate-preview]`
to a [true value](/attributes-and-options#boolean-attributes):


```html
<a href="/clients"
   up-follow
   up-preview="spinner"
   up-revalidate-preview="true"> <!-- mark-phrase: true -->
  Clients
</a>
```


## Delaying previews {#delaying}

When your backend responds quickly, a preview will only be shown for a short time
before it is reverted. To avoid a flash of preview state, you may want to
run some previews for long-running requests only.

To do this, a preview function can set a timer using `setTimeout()` or `up.util.timer()`.
After the timer expires, the preview must check if it is still running before changing the page:

```js
up.preview('delayed-spinner', (preview) => {
  up.util.timer(1000, function() {
    if (!preview.ended) { // mark-phrase: ended
      preview.insert('<img src="spinner.gif">')      
    }
  })
}) 
```

> [important]
> When a preview changes the DOM after the preview has ended, these changes will not be reverted. 


## Multiple previews {#multiple}

A change can show multiple previews at once:

```html
<a href="/edit"
   up-follow
   up-preview="spinner, form-placeholder">
  Edit page
</a>
```

To pass [preview options](#parameters), append the options object after each preview name:

```html
<a href="/edit"
   up-follow
   up-preview="spinner { size: 20 }, form-placeholder { animation: 'pulse' }">
  Edit page
</a>
```

From JavaScript, pass multiple previews as either a comma-separated string or as an array:

```js
up.navigate({ url: '/edit', preview: 'spinner form-placeholder' })
up.navigate({ url: '/edit', preview: ['spinner', 'form-placeholder'] })
```

You may also pass multiple anonymous preview functions as an array:

```js
let fn1 = (preview) => { ... }
let fn2 = (preview) => { ... }
up.navigate({ url: '/edit', preview: [fn1, fn2] })
```


@page previews
