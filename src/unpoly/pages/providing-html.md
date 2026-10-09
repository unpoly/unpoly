Providing HTML to render
========================

Every render pass needs HTML to insert. Usually Unpoly loads it from a URL,
but you can also render HTML you already have: a string, an `Element`, a `<template>` or an `up.Response`.

Each source has its own attribute or option:

@include providing-html-table


Loading HTML from the server {#url}
----------------------------

To load an HTML document from the server when a link is clicked, set the URL as a standard `[href]` attribute.
Also set an `[up-target]` attribute indicating which fragment to update:

```html
<a href="/path" up-target=".target">Click me</a> <!-- mark: up-target=".target" -->

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
</html>
```

The response may contain other HTML, but only the element matching `.target` is extracted and placed into the page.
Other elements in the response are discarded, and the corresponding elements on the page stay unchanged.

> [tip]
> See [targeting fragments](/targeting-fragments) for ways of controlling how the
> new fragment is inserted. For instance, you can choose to [append](/targeting-fragments#appending-or-prepending)
> the fragment instead of swapping it.


### Usage in forms

For a form, set the server endpoint URL as a standard `[action]` attribute.
Also set an `[up-target]` attribute indicating which fragment to update after a successful submission:

```html
<form action="/path" up-target=".target"> <!-- mark: up-target=".target" -->
  ...
</form>

<div class="target">
  Content will appear here
</div>
```

When the form is submitted, the server is expected to respond with HTML that contains an element matching `.target`.

If the server responds with an error code, Unpoly ignores the `[up-target]` attribute
and updates the selector in the `[up-fail-target]` attribute instead. The default fail target
is the form itself. See [Handling failed responses](/failed-responses) for details.

See [Submitting forms in-place](/submitting-forms) for an expanded example.


### Programmatic API

To render remote content from JavaScript, pass a `{ url }` option to the `up.render()` function:

```js
up.render({ url: '/path', target: '.target' })
```

When the fragment change represents a [navigation](/navigation-defaults), use `up.navigate()` instead.
This also updates the browser location, scroll position and focus:

```js
up.navigate({ url: '/path', target: '.target' })
```


Rendering a string of HTML {#string}
--------------------------

Sometimes you already have the HTML to render, as a JavaScript string or in an HTML attribute.
You can render such a string without a server request.


### Replacing a fragment's children {#content}

To replace only an element's children, pass the new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
as an [`[up-content]`](/up-follow#up-content) attribute or [`{ content }`](/up.render#options.content) option.

For example, take the following HTML:

```html
<div class="target">
  Old content
</div>
```

We can update the element's children from a link like this:

```html
<a href="#" up-target=".target" up-content="New content">Click me</a> <!-- mark: up-content="New content" -->
```

Clicking the link changes the targeted element's inner HTML to the attribute value:

```html
<div class="target">
  New content <!-- mark-line -->
</div>
```

Only the new inner HTML is inserted and [compiled](/enhancing-elements).
The element node itself, including its attributes and event listeners, stays unchanged.


### Rendering a string that only contains the fragment {#fragment}

To render a string of HTML comprising *only* the new fragment's [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML),
pass it as a [`{ fragment }`](/up.render#options.fragment) option:

```js
// This will update .target
up.render({ fragment: '<div class="target">New content</div>' }) // mark: fragment: '<div class="target">New content</div>'
```

Note how we omitted a `{ target }` option.
The target is [derived](/target-derivation) from the root element in the given HTML, yielding `.target` in the example above.

In HTML, embed the fragment in an [`[up-fragment]`](/up-follow#up-fragment) attribute:

```html
<a href="#" up-fragment='<div class="target">New content</div>'>Click me</a> <!-- mark: up-fragment='<div class="target">New content</div>' -->
```

> [tip]
> HTML5 [allows unescaped angle brackets](https://html.spec.whatwg.org/multipage/syntax.html#attributes-2) in quoted attribute values.
> It's also valid to escape them with `&lt;` and `&gt;`.


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
  </main>
`
```

You can pass this HTML string as a `{ document }` option. Also pass a `{ target }` option indicating
which fragments to update:

```js
up.render({ target: '.foo, .bar', document: html })
```

Only the targeted elements are extracted and placed into the page.
Other elements parsed from the document string are discarded.

In HTML, the same option is available as an [`[up-document]`](/up-follow#up-document) attribute.


### Omitting `[href]` for local updates {#omitting-href}

When updating fragments from a string or `<template>`, you may omit the `[href="#"]` attribute:

```html
<a up-target=".target" up-content="New content">Click me</a> <!-- mark: up-content="New content" -->
```

Unpoly [makes sure](/up.link.config#config.clickableSelectors) that such a link is focusable and supports keyboard activation.

Most browsers only tint and underline an `a[href]` element. You may need to update your CSS to also style links without an `[href]` attribute:

```css
a:is([href], [up-content], [up-fragment], [up-document]) {
  color: blue;
  text-decoration: underline;
}
```


### Sanitizing user input

HTML provided via `{ content }`, `{ fragment }` or `{ document }` is placed into the document without sanitization.

When dealing with user-controlled input, you must escape or sanitize it before rendering.
Also wrap it in an HTML `<tag>` to make sure it is interpreted as HTML, and not as a [`<template>` selector](#template):

```js
let userText = document.querySelector('wysiwyg-textarea').value
up.render({ fragment: '<div class="foo">' + up.util.escapeHTML(userText) + '</div>' })
```

We also recommend a [Content Security Policy](/script-security).


Rendering a `<template>` {#template}
------------------------

Instead of passing an HTML string, you may also refer to a [`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
in any attribute or option that accepts HTML:

```html
<a href="#" up-target=".target" up-document="#my-template">Click me</a> <!-- mark: up-document="#my-template" -->

<div class="target">
  Old content
</div>

<template id="my-template"> <!-- mark: id="my-template" -->
  <div class="target">
    New content
  </div>
</template>
```

The template is cloned and the `.target` is updated with a matching element from the clone.

See [Templates](/templates) for many more examples, including ways to define [dynamic templates](/templates#dynamic) with variables, loops or conditions.


Rendering an `Element` object {#element}
-----------------------------

Instead of a string you can also pass an [`Element`](https://developer.mozilla.org/en-US/docs/Web/API/Element) value
as a `{ content }`, `{ fragment }` or `{ document }` option:

```js
let element = document.createElement('div')
element.textContent = 'New content'
up.render({ target: '.target', content: element })
```

If the element was already [attached](https://developer.mozilla.org/en-US/docs/Web/API/Node/isConnected)
before rendering, it is moved to the target position in the DOM tree.

The element is [compiled](/enhancing-elements) after insertion.
If the element has been compiled before, it is [not re-compiled](/up.hello#recompiling-elements).

If the element is a [template](/templates), it is cloned before insertion.


Rendering an `up.Response` object {#response}
---------------------------------

You can pass an `up.Response` object as a `{ response }` option:

```js
let response = await up.request('/path')
up.render({ target: '.target', response })
```

In addition to matching `.target` in the [response text](/up.Response.prototype.text), the response headers are processed.
For example, when the response was sent with an `X-Up-Target` header, that header changes the rendered selector.
The `up:fragment:loaded` event is emitted as if the response had been loaded by the render pass itself.

> [tip]
> Rendering an `up.Response` is useful when
> [accessing the discarded response](/closing-overlays#using-the-discarded-response) of an overlay that was closed by the server.


@page providing-html
