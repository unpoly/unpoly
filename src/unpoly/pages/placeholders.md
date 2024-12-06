Placeholders
============

Placeholders are a temporary spinners or UI skeletons shown while a fragment is loading.

Placeholders appear instantly after a user interaction, without waiting for the server.
They signal that the app is working, or by provide clues for how the page will ultimately look.
This can make long-loading interactions appear more responsive.

<video src="images/placeholders.webm" controls width="600" aria-label="UI skeletons are shown while screens are loading"></video>

Like with all [previews](/previews), placeholders only temporarily displace a fragment.
When the associated request [ends for any reason](/previews#ending), the placeholder is removed
and the original screen state is restored before the response is processed.


Simple placeholders
------------------

To show a placeholder while a link is loading, set an `[up-placeholder]` attribute
with the placeholder's HTML as its value:

```html
<a href="/path" up-target="#target" up-placeholder="<p>Loading…</p>">Show story</a> <!-- mark-phrase "up-placeholder" -->

<div id="#target">
  Old content
</div>
```

When the link is clicked, the [targeted](/targeting-fragments) fragment's content
is [hidden](/hidden). In its place the placeholder is inserted as the only visible child of `#target`:

```html
<div id="#target">
  <p>Loading…</p>
  <up-wrapper hidden>Old content</up-wrapper>
</div>
```

When the response is received, `#target` is updated with new HTML from the server:

```html
<div id="#target">
  New content from server
</div>
```

### From JavaScript

In your scripts you may pass a `{ placeholder }` option to most rendering functions:

```js
up.navigate({
  url: '/path',
  target: '#target',
  placeholder: '<p>Loading…</p>' // mark-phrase "placeholder"
})
```


Placeholder from templates
--------------------------

Instead of passing the placeholder HTML directly, you can also refer to any [template](/templates)
by its CSS selector. This is useful when you don't want to set long HTML string
as attribute value, or when you want to re-use the same placeholder multiple times:

```html
<a href="/path" up-target="#target" up-placeholder="#loading-template">Show story</a> <!-- mark-phrase "#loading-message" -->

<div id="#target">
  Old content
</div>

<template id="loading-template">
  <p>
    Loading…
  </p>
</template>
```

### Dynamic templates

You may need to customize placeholder markup to better fit the targeted fragment.
For example, a spinner animations should be larger when updating a larger content area.
Also when buildng a UI skeleton, its shapes must resemble the eventual screen state to be believable.

To limit the proliferation of template variants, you can also make a few templates that are
[customizable with variables](/templates#dynamic). When refering to a template, we
can append variables as a data object after the template selector:

```html
<a
  href="/path"
  up-target="#target"
  up-placeholder="#loading-template { size: 'xl', text: 'Please wait' }"> <!-- mark-phrase "#loading-template { size: 'xl', text: 'Please wait' }" -->
  Show story
</a>
```

There are [many ways](/templates#dynamic) to process template variables, including
the [use of compilers](/templates#compiler-postprocessing) or [templating engines](/templates#templating-engines).
This example uses the minimal `text/minimustache` templating function
that you can [copy into your project](/templates#templating-engines-examples):

```html
<script id="loading-template" type="text/minumustache">
  <p class="{{ size }}">
    {{ message }}
  </p>
</script>
```



Placeholders for new overlays
-----------------------------

You can use placeholders with [links that open an overlay](/up-layer-new):

```html
<a href="/path" up-follow up-layer="new" up-placeholder="<p>Loading…</p>">Open overlay</a>
```

This will open a temporary overlay with the same [visual style](/customizing-overlays) and open animation
as the link overlay would have shown.

When the server response is received, the temporary overlay is closed and another overlay is opened with
the response content. To make that switch appear seamless to the user, animations are disabled.

In cases when the response ends up *not* opening an overlay (e.g. the server responds with an [error code](/failed-responses),
the placeholder overlay will be closed.



Showing placeholders from a preview function
---------------------------------------------

[Previews](/previews) are a way to show arbitrary loading state.
When you want to re-use Unpoly's placeholder logic from a preview function,
use the `up.Preview#showPlaceholder()` method:

```js
up.preview('loading-message', function(preview) {
  // ...
  preview.showPlaceholder('<p>Loading…</p>')
})
```


@page placeholders
