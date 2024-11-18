Previews
========

Previews let you change the page temporarily while waiting for a network request.
You can show arbitrary loading state (like spinners or placeholders) and even do optimistic rendering.

Because previews immediately appear after a user interactions, their use
increases the perceived responsiveness of your application.

Once the server response is received, any change made by a preview is reverted.
This ensures a consistent state in all cases, e.g. if the server [renders a error](/failed-responses),
[updates a different fragment](/X-Up-Target) or when the request is [aborted](/aborting-requests).



## Changing the DOM from a preview {#dom-changes}

For a simple example, we want to show a simple spinner animation
within a button while it is loading:

<span class="todo">Animated GIF</span>

To achieve tis effect, we define a *preview* named `link-spinner`:

```js
up.preview('link-spinner', function(preview) {
  let link = preview.origin
  preview.insert(link, '<img src="spinner.gif">')
})
```

We can use this preview in any link or form by setting an `[up-preview]` attribute:

```html
<a href="/edit" up-follow up-preview="link-spinner">Edit page</a>
```

When the link is followed, the preview will append the spinner element to the link label.
When the server response is received, the spinner element will be removed automatically. 

The `preview` argument is an `up.Preview` instance that offers many utilities to make temporary changes:

| Method                         | Temporary effect                    |
|--------------------------------|-------------------------------------|
| `up.Preview#setAttrs()`        | Set attributes on an element        |
| `up.Preview#addClass()`        | Add a class to an element           |
| `up.Preview#removeClass()`     | Add a class to an element           |
| `up.Preview#setStyle()`        | Set inline styles on an element     |
| `up.Preview#disable()`         | Disable form controls               |
| `up.Preview#insert()`          | Append or prepend an element        |
| `up.Preview#hide()`            | Hide an element                     |
| `up.Preview#show()`            | Show a hidden element               |
| `up.Preview#hideContent()`     | Hide all children of an element     |
| `up.Preview#swapContent()`     | Replace the content of an element   |
| `up.Preview#openLayer()`       | Open an overlay                     |
| `up.Preview#showPlaceholder()` | Show a [placeholder](/placeholders) |

From JavaScript you can pass the preview name as a `{ preview }` option:

```js
up.navigate({ url: '/edit', preview: 'link-spinner' })
```


### Inspecting the preview context

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


## Arbitrary changes

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
up.preview('spinner', function(preview, { width = 50 }) {
  let spinner = up.element.createFromSelector('img', { src: 'spinner.gif', width })
  preview.insert(preview.fragment, spinner)
})
```

From HTML you can append the options to the `[up-preview]` argument, after the preview name:

```html
<a href="/edit" up-follow up-preview="spinner { size: 100 }">Edit page</a>
```

### Passing options from JavaScript

From JavaScript you can also pass the a string containing preview name and options:

```js
up.navigate({
  url: '/edit',
  preview: 'link-spinner { size: 100 }'
})
```

As an alternative, you can also pass a function that calls `preview.run()` with a preview name and options.
This makes it easier to pass option values that already exist in your scope:

```js
let size = 100

up.navigate({
  url: '/edit',
  preview: (preview) => preview.run('link-spinner', { size })
})
```



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
   up-revalidate-preview="spinner"> <!-- mark-phrase "up-revalidate-preview" -->
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
   up-revalidate-preview="true"> <!-- mark-phrase "true" -->
  Clients
</a>
```


## Optimistic rendering

[Optimistic rendering](https://kiwee.eu/blog/what-is-the-optimistic-ui/) is a pattern where we update the page
without waiting for the server to respond. When the server eventually does respond, the optimistic change
is reverted and replaced by the server-confirmed content.



### Example

The entire TODO list is rendered optimistically:

- Adding a task
- Checking and unchecking a task
- Re-ordering tasks with drag'n'drop
- Clearing done tasks

The HTML is in [`views/tasks`](https://github.com/unpoly/unpoly-demo/tree/master/app/views/tasks).
The JavaScript is in [`application.js`](https://github.com/unpoly/unpoly-demo/blob/master/app/assets/javascripts/application.js)


```html
<div id="tasks">
   <form up-target="#tasks" up-preview="add-task">
      <input type="text" name="text">
      <button type="submit">Save</button>
   </form>
   
   <div class="task">Buy milk</div>
   <div class="task">Buy toast</div>
</div>
```


```js
up.preview('add-task', function(preview) {
  let form = preview.origin.closest('form')
  let text = preview.params.get('text')

  if (text) {
    preview.insert(form, 'afterend', `<div class="task">${up.util.escapeHTML(text)}</div>`)
    form.reset()
  }
})
```

Server-side validation (uniquness)

### Using `<template>`

Optimistic rendering often involves duplicating view logic.

```js
let task = preview.cloneTemplate('#task-template')
task.innerText = text
preview.insert(form, 'afterend', task)
```

Do we really need cloneTemplate when we (1) can also mention the template in insert() ? 


## Delaying previews

When your backend responds quickly, a preview will only be shown for a short time
before it is reverted. To avoid a flash of preview state, you may want to
run some previews for long-running requests only.

To do this, a preview function can set a timer using `setTimeout()` or `up.util.timer()`.
After the timer expires, the preview must check if it is still running before changing the page:

```js
up.preview('delayed-spinner', (preview) => {
  up.util.timer(1000, function() {
    if (!preview.ended) { // mark-phrase "ended"
      preview.insert('<img src="spinner.gif">')      
    }
  })
}) 
```

> [important]
> When a preview changes the DOM after the preview has ended, these changes will not be reverted. 


## Multiple previews

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
up.navigate({ url: '/edit', preview: ['spinner', 'form-placeholder'] })
```


@page previews