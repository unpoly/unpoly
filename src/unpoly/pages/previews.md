Previews
========

Previews let you change the page temporarily while waiting for a network request.
You can show arbitrary loading state (like placeholders) and even do optimistic rendering.

Because previews immediately appear after a user interactions, their use
increases the perceived responsiveness of your application.

Once the server response is received, any change made by a preview is reverted.
This ensures a consistent state in all cases, e.g. if the server [renders a error](/failed-responses),
[updates a different fragment](/X-Up-Target) or when the request is [aborted](/aborting-requests).



## Changing the DOM from a preview {#dom-changes}

We're looking for an effect like this:

<span class="todo">Animated GIF</span>

For this we are going to define a *preview* named `link-spinner`:

```js
up.preview('link-spinner', function(preview) {
  let link = preview.origin
  preview.insert(link, '<span class="spinner"></span>')
})
```

We can use this preview in any link or form by setting an `[up-preview]` attribute:

```html
<a href="/edit" up-follow up-preview="link-spinner">Edit page</a>
```

When the link is followed, the preview will append the spinner element to the link label.
When the server response is received, the spinner element will be removed automatically. 

The `preview` argument is an `up.Preview` instance that offers many methods to make temporary changes:

| Method                     | Temporary effect                  |
|----------------------------|-----------------------------------|
| `up.Preview#setAttrs()`    | Set attributes on an element      |
| `up.Preview#addClass()`    | Add a class to an element         |
| `up.Preview#removeClass()` | Add a class to an element         |
| `up.Preview#setStyle()`    | Set inline styles on an element   |
| `up.Preview#disable()`     | Disable form controls             |
| `up.Preview#insert()`      | Append or prepend an element      |
| `up.Preview#hide()`        | Hide an element                   |
| `up.Preview#show()`        | Show a hidden element             |
| `up.Preview#hideContent()` | Hide all children of an element   |
| `up.Preview#swapContent()` | Replace the content of an element |
| `up.Preview#openLayer()`   | Open an overlay                   |



### Inspecting the preview context

The `up.Preview` object also provides getter to learn more about the current render pass:

```js
up.preview('my-preview', function(preview) {
  preview.target         // The target selector
  preview.fragment       // The fragment being updated
  preview.layer          // The layer being updated
  preview.request        // The request we're waiting for
  preview.params         // Requested form params
  preview.renderOptions  // All options for this render pass
})
```


## Arbitrary changes

Instead of using an `up.Preview` method you can use arbitrary changes to the DOM.

For example, this preview uses the native browser API to add a `.loading` class to the `<body>`
while a request is loading:

```js
up.preview('my-preview', function(preview) {
  if (document.body.classList.contains('loading')) return // mark-phrase "return"
  document.body.classList.add('loading')
  return () => document.body.classList.remove('loading') 
})
```

Note how in this manual approach we need to do additional work:

1. We must return a function that undoes our changes
2. We must only undo changes that we caused. We may have multiple concurrent previews racing for the same changes.

> [tip]
> All `up.Preview` methods automatically undo their changes.

Another way to register an undo action is to register a callback with `preview.undo()`:

```js
up.preview('my-preview', function(preview) {
  if (document.body.classList.contains('loading')) return
  document.body.classList.add('loading')
  preview.undo(() => document.body.classList.remove('loading'))
})
```


### Prefer additive changes

Don't remove targeted fragment from the DOM or it can no longer be aborted.

```js
up.preview('spinner', function(preview) {
  let spinner = up.element.createFromHTML('<div class="spinner"></div>')
  preview.fragment.replaceWith(spinner)
  return () => spinner.replaceWith(preview.fragment)
})
```

Hide it instead:

```js
up.preview('spinner', function(preview) {
  let spinner = up.element.createFromHTML('<div class="spinner"></div>')
  preview.fragment.insertAdjacentElement('beforebegin', spinner)
  up.element.hide(preview.fragment)

  return () => {
    spinner.remove()
    up.element.show()
  }
})
```

Shortened:

```js
up.preview('spinner', function(preview) {
  preview.insert(preview.fragment, 'beforebegin', '<div class="spinner"></div>')
  preview.hide(preview.fragment)
})
```



## Preview parameters

- Previews can take arguments
- Show how to inline args in arg
- In JavaScript you can use { preview: Function<Preview> }
- Call another preview with `preview.run(name, opts)`



## Caching

Previews are not shown for cache hits

Previews are not shown for local content

This prevents a flash of content when a preview is shown and immediately reverted.

Also not shown when cache-then-revalidate.



## Optimistic rendering

Add a todo

Drag'n'drop

See demo.


## Delaying previews

```js
up.preview('foo', (preview) => {
  up.util.timer(1000, function() {
    if (!preview.ended) {
      preview.run('other')      
    }
  })
}) 
```

@page previews
