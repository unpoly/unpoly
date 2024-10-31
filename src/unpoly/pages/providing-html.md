Providing HTML to render
===========================

When you [render](/up.render) HTML with a function like `up.render()` or an attribute like `[up-follow]`, you can provide that HTML in different ways.

@include providing-html-table


Loading content from a URL {#url}
---------------------------------

To fetch content from a server when a hyperlink is clicked, pass the URL as a standard `[href]` attribute:

```html
<a href="/path" up-target=".target">Click me</a> <!-- mark-phrase "href" -->

<div class="target">
  Content will appear here
</div>
```

The server is expected to respond with HTML that contains an element matching the [target selector](/targeting-fragments) (`.target`):

```html
<html>
  ...
  <div class="target"> <!-- mark-line -->
    New content <!-- mark-line -->
  </div> <!-- mark-line -->
  ...
</html>>
```

The server response may contain other HTML, but only the element matching `.target` will be extracted and placed into the page.
Other elements will be discarded. To only render the targeted element, observe the `X-Up-Target` request header.


> [tip]
> See [targeting fragments](/targeting-fragments) for ways of controlling how the
> new fragment is inserted. For instance, you can choose to [append](/targeting-fragments#appending-or-prepending)
> the fragment instead of swapping it.


### Usage in forms

For a form, use the `[action]` attribute instead:

```html
<form action="/path" up-target=".target"> <!-- mark-phrase "action" -->
  ...
</form>

<div class="target">
  Content will appear here
</div>
```

The server response.

> [tip]


### Programmatic API

To render remote content from JavaScript, pass a `{ url }` option to any rendering function:

```js
up.render({ url: '/path', target: '.target' })
```


Rendering a string of HTML {#local}
-----------------------------------

Sometimes you have to render a string of HTML that you already have. You may pass this string as a JavaScript variable or HTML attribute to render content without going through the server.

After HTML was inserted from a string, it is [compiled](/up.compiler).

### Replacing a fragment's children {#content}

To only replace an element's children, pass the new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) as an [`[up-content]`](/up-follow#up-content) attribute or [`{ content }`](/up.render#options.content) option.

For example, take the following HTML:

```html
<div class="target">
  Old content
</div>
```

We can update the element's children from a link like this:

```html
<a up-target=".target" up-content="New content">Click me</a> <!-- mark-phrase "up-content" -->
```

Clicking the link will change the targeted element's inner HTML to this:

```html
<div class="target">
  New content <!-- mark-line -->
</div>
```

> [note]
> Only the element's inner HTML will be changed. The element node itself, including its attributes and event listeners, will remain unchanged.


#### Opening an overlay from string content

The `[up-content]` attribute lets you open an overlay without going through the server:

```html
<a up-layer="new popup" up-content="Passwords must contain a special character"> <!-- mark-phrase "up-content" -->
  Help
</a>
```

### Rendering a string that only contains the fragment {#fragment}

To render a string of HTML comprising *only* the new fragment's [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML), pass it as a [`{ fragment }`](/up.render#options.fragment) option or as an [`[up-fragment]`](/up-follow#up-fragment) attribute.

In this variant you can omit a `{ target }` option or `[up-target]` attribute.
The target will be [derived](/target-derivation) from the root element in the given HTML:

```js
// This will update .foo
up.render({ fragment: '<div class=".foo">inner</div>' })
```

### Sanitizing user input

HTML provided via `{ content }` or `{ fragment }` will be placed into the document without sanitization.  

When dealing with user-controlled input, you must escape or sanitize it before rendering.
You should also wrap it in a HTML `<tag>` to make sure that is going to be interpreted as HTML, and not as a [`<template> selector`](#template):

```js
let userText = document.querySelector('wysiwyg-textarea').value
up.render({ fragment: '<div class=".foo">' + up.util.escapeHTML(userText) + '</div>' })
```


### Extracting a fragment from a document {#document}

Sometimes you have a larger string of HTML from which you want to update
one or more elements:

```js
let html = `
  <main>
    <div class="foo">...</div>
    <div class="bar">...</div>
    <div class="bar">...</div>
    <div class="qux">...</div>
  </main  
`

up.render({ target: '.foo, .bar', document: html })
```

The given `{ document }` can either be an entire HTML document or a HTML fragment that contains `.foo` and `.bar` somewhere.
Only the targeted elements will be extracted and placed into the page.
Other elements parsed from the document string will be discarded.


Rendering a `<template>`
------------------------

```html
<a up-fragment="#my-template">Click me</a>

<template id="my-template">
  
</template>

```


## Rendering an `Element` object {#element}

Instead of a string you can also pass an [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element) value
as a `{ content }`, `{ fragment }` or `{ document }` option:

```js
let element = document.createElement(...)
up.render({ target: '.target', content: element })
```

If the element was already [attached](https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected)
before rendering, it will be moved to the target position in the DOM tree.

The element will be [compiled](/up.compiler) after insertion.
If the element has been compiled before, it will [not be re-compiled](/up.hello#recompiling-elements).



## Rendering an `up.Response` object {#response}

If you have already fetched content from the server,  you can pass an `up.Response` object as a `{ response }` option:

```js
let response = await up.request('/path')
up.render({ target: '.target', response })
```

In addition to matching `.target` in the response text, the response headers will be processed.
For example, when the response was originally sent with `X-Up-Target` header, it will change the rendered selector.

> [tip]
> Rendering an `up.Response` is useful when
> [accessing the discarded response](/closing-overlays#using-the-discarded-response) when an overlay was closed by a server response.


@page providing-html
