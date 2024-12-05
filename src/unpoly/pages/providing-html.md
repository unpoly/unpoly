Providing HTML to render
===========================

When you [render](/up.render) HTML using a function or attribute, you can provide that HTML in different ways.

For example, you can [fetch HTML](#url) from the server, [render an existing string](#local) or 
[clone a `<template>`](#template).


Loading HTML from the server {#url}
----------------------------

To fetch a HTML document from the server when a hyperlink is clicked, pass the URL as a standard `[href]` attribute.
Also set an `[up-target]` attribute indicating which fragment to update.

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
Other elements will be discarded from the response and kept unchanged on the page.

> [tip]
> See [targeting fragments](/targeting-fragments) for ways of controlling how the
> new fragment is inserted. For instance, you can choose to [append](/targeting-fragments#appending-or-prepending)
> the fragment instead of swapping it.


### Usage in forms

For a form, set the server endpoint URL as a standard `[action]` attribute.
Also set an `[up-target]` attribute indicating which fragment to update after a successful submission.

```html
<form action="/path" up-target=".target"> <!-- mark-phrase "action" -->
  ...
</form>

<div class="target">
  Content will appear here
</div>
```

When the form is submitted, the server is expected to respond with HTML that contains an element matching the [target selector](/targeting-fragments) (`.target`).
The server response may contain other HTML, but only the element matching `.target` will be extracted and placed into the page.
Other elements will be discarded from the response and kept unchanged on the page.

> [tip]
> If the server responds with an error code, Unpoly will ignore the `[up-target]` attribute
> and update the selector found in the `[up-fail-target]` attribute instead. The default fail target
> is the form itself. See [rendering failed responses differently](/failed-responses#rendering-failed-responses-differently).


### Programmatic API

To render remote content from JavaScript, pass a `{ url }` option to the `up.render()` function:

```js
up.render({ url: '/path', target: '.target' })
```

When the fragment change represents a [navigation](/navigation), use `up.navigate()` instead.
This will update the browser location, scroll position and focus.

```js
up.navigate({ url: '/path', target: '.target' })
```


Rendering a string of HTML {#string}
-----------------------------------

Sometimes you have to render a string of HTML that you already have. You may pass this string as a JavaScript variable or HTML attribute to render content without going through the server.


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
<a href="#" up-target=".target" up-content="New content">Click me</a> <!-- mark-phrase "up-content" -->
```

Clicking the link will change the targeted element's inner HTML to the attribute value:

```html
<div class="target">
  New content <!-- mark-line -->
</div>
```

Only the element's inner HTML will be [compiled](/up.compiler) and updated.
The element node itself, including its attributes and event listeners, will remain unchanged.




### Rendering a string that only contains the fragment {#fragment}

To render a string of HTML comprising *only* the new fragment's [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML), pass it as a [`{ fragment }`](/up.render#options.fragment) option:

```js
// This will update .foo
up.render({ fragment: '<div class=".target">inner</div>' })
```

Note how we omitted a `{ target }` option or `[up-target]` attribute.
The target will be [derived](/target-derivation) from the root element in the given HTML, yielding `.target` in the example above.

You can also embed the HTML in an [`[up-fragment]`](/up-follow#up-fragment) attribute.

```html
<a href='#' up-fragment='<div class="target">inner</div>'>Click me</a> <!-- mark-phrase "up-content" -->
```

> [tip]
> HTML5 [allows unescaped angle brackets](https://html.spec.whatwg.org/multipage/syntax.html#attributes-2) in quoted attribute values.
> It's also valid to escape them with `&lt;` and `&gt;`.


### Omitting `[href]` for local updates {#omitting-href}

When updating fragments from a string or `<template>`, you may omit the `[href="#"]` attribute:

```html
<a up-target=".target" up-content="New content">Click me</a> <!-- mark-phrase "up-content" -->
```

Unpoly will [make sure](/up.link.config#config.clickableSelectors) that such a link is focusable and supports keyboard activation.

Most browsers will only tint and underline an `a[href]` element. You may need to update your CSS to also style links without an `[href]` attribute:

```css
a:is([href], [up-content], [up-fragment], [up-document]) {
  color: blue;
  text-decoration: underline;
}
```


### Sanitizing user input

HTML provided via `{ content }` or `{ fragment }` will be placed into the document without sanitization.  

When dealing with user-controlled input, you must escape or sanitize it before rendering.
You should also wrap it in a HTML `<tag>` to make sure that is going to be interpreted as HTML, and not as a [`<template> selector`](#template):

```js
let userText = document.querySelector('wysiwyg-textarea').value
up.render({ fragment: '<div class=".foo">' + up.util.escapeHTML(userText) + '</div>' })
```

We also recommend a [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP), which [plays nice with Unpoly](/csp).


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
```

You can pass this HTML string as a `{ document }` option. Also pass a `{ target }` option indicating
which fragments to update:

```js
up.render({ target: '.foo, .bar', document: html })
```

Only the targeted elements will be extracted and placed into the page.
Other elements parsed from the document string will be discarded.


Rendering a `<template>`
------------------------

Instead of passing an HTML string, you may also refer to a [`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
in any attribute or option that accepts HTML:


```html
<a href="#" up-target=".target" up-document="#my-template">Click me</a> <!-- mark-phrase "#my-template" -->

<div class="target">
  Old content
</div>

<template id="my-template"> <!-- mark-phrase "my-template" -->
  <div class="target">
    New content
  </div>
</template>
```

See [Templates](/templates) for many more examples, including ways to define [dynamic templates](/templates#dynamic) with variables, loops or conditions.


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

If the element is a [template](/templates), it will be cloned before insertion.



## Rendering an `up.Response` object {#response}

You can pass an `up.Response` object as a `{ response }` option:

```js
let response = await up.request('/path')
up.render({ target: '.target', response })
```

In addition to matching `.target` in the [response text](/up.Response.prototype.text), the response headers will be processed.
For example, when the response was originally sent with `X-Up-Target` header, it will change the rendered selector.

> [tip]
> Rendering an `up.Response` is useful when
> [accessing the discarded response](/closing-overlays#using-the-discarded-response) when an overlay was closed by a server response.


@page providing-html
