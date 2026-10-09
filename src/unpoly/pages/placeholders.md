Placeholders
============

Placeholders are temporary spinners or UI skeletons shown within a fragment while it is loading.
They appear instantly after the user's interaction and are replaced by the server response.

<video src="images/placeholders.webm" controls width="600" aria-label="UI skeletons are shown while screens are loading"></video>

By providing clues for how the page will ultimately look,
placeholders make long-loading interactions feel more responsive.


Basic placeholders {#basic-example}
------------------

To show a placeholder while a link is loading, set an `[up-placeholder]` attribute
with the placeholder's HTML as its value:

```html
<a href="/path" up-target="#target" up-placeholder="<p>Loading…</p>">Show story</a> <!-- mark: up-placeholder="<p>Loading…</p>" -->

<div id="target">
  Old content
</div>
```

When the link is clicked, the [targeted](/targeting-fragments) fragment's content
is [hidden](/hidden). In its place the placeholder is inserted as the only visible child of `#target`:

```html
<div id="target">
  <p>Loading…</p> <!-- mark-line -->
  <up-wrapper hidden>Old content</up-wrapper>
</div>
```

When the response is received, `#target` is updated with new HTML from the server:

```html
<div id="target">
  New content from server
</div>
```

Like all [preview effects](/previews), a placeholder only temporarily displaces a fragment.
When the request [ends for any reason](/previews#ending), the placeholder is removed
and the original content is restored before the response is processed.
This also happens when the server responds with an error, or when the request is aborted.

Forms can show placeholders the same way, by setting `[up-placeholder]` on the `<form>` element.
When [targeting multiple fragments](/targeting-fragments#multiple),
the placeholder is shown in the first fragment.

### From JavaScript

In your scripts you may pass a `{ placeholder }` option to most rendering functions:

```js
up.navigate({
  url: '/path',
  target: '#target',
  placeholder: '<p>Loading…</p>' // mark-line
})
```

Instead of passing an HTML snippet you may also pass an `Element` or a [template reference](#from-template).


Placeholders from templates {#from-template}
---------------------------

Instead of passing the placeholder HTML directly, you can refer to any [template](/templates)
by its CSS selector. This is useful when you don't want to set a long HTML string
as an attribute value, or when you want to reuse the same placeholder many times:

```html
<a href="/path" up-target="#target" up-placeholder="#loading-template">Show story</a> <!-- mark: up-placeholder="#loading-template" -->

<div id="target">
  Old content
</div>

<template id="loading-template"> <!-- mark: id="loading-template" -->
  <p>
    Loading…
  </p>
</template>
```

### Dynamic templates {#dynamic-templates}

You may need to customize placeholder markup to better fit the targeted fragment.
For example, a spinner animation should be larger when updating a larger content area.
Also when building a UI skeleton, its shapes must resemble the eventual screen state to be believable.

To limit the proliferation of template variants, you can make a few templates that are
[customizable with variables](/templates#dynamic). When referring to a template, append
the variables as a data object after the template selector:

```html
<a
  href="/path"
  up-target="#target"
  up-placeholder="#loading-template { size: 'xl', message: 'Please wait' }"> <!-- mark: #loading-template { size: 'xl', message: 'Please wait' } -->
  Show story
</a>
```

The template can then use the variables:

```html
<script id="loading-template" type="text/minimustache">
  <p class="{{size}}">
    {{message}}
  </p>
</script>
```

@include minimustache-tip


Placeholders for new overlays {#overlays}
-----------------------------

You can use placeholders with [links that open an overlay](/up-layer-new):

```html
<a href="/path" up-follow up-layer="new" up-placeholder="<p>Loading…</p>">Open overlay</a> <!-- mark: up-placeholder="<p>Loading…</p>" -->
```

This opens a temporary overlay with the same [visual style](/customizing-overlays) and open animation
as the link's overlay would have shown.

When the server response is received, the temporary overlay is closed and another overlay is opened with
the response content. To make that switch appear seamless to the user, the close and open animations are disabled.

When the response ends up *not* opening an overlay (e.g. the server responds with an [error code](/failed-responses)),
the placeholder overlay is closed.

If the user dismisses the placeholder overlay before the server responds,
the request is [aborted](/aborting-requests).


Arbitrary placeholder logic {#from-preview}
--------------------------

Sometimes you need more than [templates and variables](#dynamic-templates) can give you:

- Complex placeholder construction logic
- Showing a placeholder in a fragment that wasn't targeted
- Placeholders that affect multiple fragments

In such cases you can define a [preview](/previews), which describes arbitrary loading state in JavaScript.
A preview can show a placeholder in any element with `up.Preview#showPlaceholder()`.
For example, this preview shows a loading message in a `#sidebar` element while the targeted fragment is loading:

```js
up.preview('sidebar-loading', function(preview) {
  preview.showPlaceholder('#sidebar', '<p>Loading…</p>') // mark: showPlaceholder
})
```

The placeholder is removed when the preview ends, just like a placeholder set with `[up-placeholder]`.


@page placeholders
