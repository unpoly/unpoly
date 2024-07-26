Providing content to render
===========================

When you [render](/up.render) content with a function like `up.render()` or an attribute like `[up-follow]`, there are several methods to provide that content.

A rendering function (or element) must be passed exactly one of the following options:

@include render-content-table


Rendering content from the server {#remote}
--------------------------------



### Loading content from a URL {#url}

To have Unpoly fetch a HTML document from a server, pass a `{ url }` option to a rendering function:

```js
up.render({ url: '/path', target: '.target' })
```

The server is expected to respond with HTML that contains an element matching the [target selector](/targeting-fragments) (`.target`):

```html
<html>
  ...
  <div class="target">
    New content
  </div>
  ...
</html>>
```

The server response may contain other HTML, but only the element matching `.target` will be extracted and placed into the page.
Other elements will be discarded. To only render the targeted element, observe the `X-Up-Target` request header.

In HTML you can pass the URL as a standard `[href]` attribute of a hyperlink (or as a form's `[action]` attribute):

```html
<a href="/path" up-target=".target">Click me</a>
```

> [tip]
> See [targeting fragments](/targeting-fragments) for ways of controlling how the
> new fragment is inserted. For instance, you can choose to [append](/targeting-fragments#appending-or-prepending-content)
> the fragment instead of swapping it.



### Rendering an existing response object {#response}

If you have already fetched content from the server,  you can pass an `up.Response` object as a `{ response }` option to render its contents:

```js
let response = await up.request('/path')
up.render({ target: '.target', response })
```

This is also useful for [accessing the discarded response](/closing-overlays#using-the-discarded-response) when an overlay was closed by a server response.


Rendering a string of HTML {#local}
-----------------------------------

Sometimes you have to render a string of HTML that you already have. You may pass this string as a JavaScript variable or HTML attribute to render content without going through the server.

After HTML was inserted from a string, it is [compiled](/up.compiler).

### Replacing a fragment's children {#content}

To only replace an element's children, pass the new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) as a [`{ content }`](/up.render#options.content) option or as an [`[up-content]`](/up-follow#up-content) attribute.

For example, take the following HTML:

```html
<div class="target" data-foo="value">
  Old content
</div>
```

We can update the element's children like this:

```js
up.render('.target', { content: 'New content' })
```

```html
<div class="target" data-foo="value">
  New content <!-- mark-line -->
</div>
```

Note that only the element's inner HTML was changed. The element node itself, including its attributes and event listeners, will remain unchanged.


#### Overlays

This is useful to show overlays without going through the server:

```html
<a up-layer="new popup" up-content="Passwords must contain a special character"> <!-- mark-phrase "up-content" -->
  Help
</a>
```

> [note]
> When no target is provided for a link, the [main target](/main) is updated.

### Rendering a string that only contains the fragment {#fragment}

To render a string of HTML comprising *only* the new fragment's [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML), pass it as a [`{ fragment }`](/up.render#options.fragment) option or as an [`[up-fragment]`](/up-follow#up-fragment) attribute.

In this variant you can omit a `{ target }` option or `[up-target]` attribute.
The target will be [derived](/target-derivation) from the root element in the given HTML:

```js
// This will update .foo
up.render({ fragment: '<div class=".foo">inner</div>' })
```


### Extracting a fragment from a document {#document}

```js
let html = `
  <main>
    <div class="target">...</div>
    <div class="other">...</div>
  </main  
`

up.render({ target: '.target', document: html })
```

The given `{ document }` can be an entire HTML document or a larger fragment that contains `.target` somewhere.
Only the matching element [target selector](/targeting-fragments) will be extracted and placed into the page.
Other elements will be discarded.


## Rendering a detached element {#element}

Instead of a string you can also pass a detached [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element)
as a `{ content }`, `{ fragment }` or `{ document }` option:

```js
let element = document.createElement(...)
up.render({ target: '.target', content: element })
```

Note that the element will be mutated by the render process.


@page render-content
