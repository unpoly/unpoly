Navigation bars
===============

Links within navigational containers are automatically marked as `.up-current` if they point to the current page.

This helps highlighting current menu sections using CSS.


## Marking links as current

@include nav-example


### Defining navigational containers

Standard [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) elements are
always considered navigational containers:

```html
<nav> <!-- mark-phrase "nav" -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</nav>
```


If you cannot use a `<nav>` element, you can also set the `[up-nav]` attribute on an arbitrary tag instead:

```html
<div up-nav> <!-- mark-phrase "up-nav" -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</div>
```

You may also assign `[up-nav]` to an individual link instead of an navigational container:

```html
<a href="/foo" up-nav>Foo</a> <!-- mark-phrase "up-nav" -->
```

Matching containers can opt *out* of `.up-current` assignment by setting an `[up-nav=false]` attribute:

```html
<nav up-nav="false"> <!-- mark-phrase "false" -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</nav>
```

You can configure additional selectors to automatically match your navigation components
in `up.feedback.config.navSelectors`:

```js
up.feedback.config.navSelectors.push('.navbar')
```


### Updating `.up-current` classes

The `.up-current` class is toggled automatically within all content that Unpoly renders.
For example, when Unpoly [follows a link](/up-follow), [submits a form](/up-submit)
or [renders from a script](/up.render), any newly inserted hyperlinks will get `.up-current`
if they point to the current URL. When the render pass changes history, existing links
will be updated to reflect the new location.

To toggle `.up-current` on content that you manually inserted without Unpoly, use `up.hello()`.


## What is current?

The URL shown in the browser's [address bar](https://en.wikipedia.org/wiki/Address_bar) is
generally considered the "current" location.

A link matches the current location (and is marked as `.up-current`) if it matches either:

- the link's `[href]` attribute
- the link's `[up-href]` attribute on a [faux hyperlink](/faux-interactive-elements#acting-like-a-hyperlink)
- the link's [URL alias](#aliases)

Any `#hash` fragments will be ignored in both link attributes and in the current location.


### Highlighting links for multiple URLs {#aliases}

You often want to highlight a link for multiple URLs. For example a link to a *Users* section
might open a list of users, but should also be "current" for the new user form.

To build this, set an `[up-alias]` attribute to any URL that should also be highlighted as `.up-current`.
The link below will be highlighted at both `/users` and `/users/new` locations:

```html
<nav>
  <a href="/users" up-alias="/users/new">Users</a>
</nav>
```

To pass more than one alternative URLs, set comma-separated values:

```html
<nav>
  <a href="/users" up-alias="/users/new, /users/online">Users</a>
</nav>
```

You can also use a [URL pattern](/url-patterns):

```html
<nav>
  <a href="/users" up-alias="/users/*">Users</a>
</nav>
```


### Layers have separate locations

When no [overlay](/up.layer) is open, the current location is the URL displayed
in the browser's [address bar](https://en.wikipedia.org/wiki/Address_bar).

While overlays are open, Unpoly tracks a separate location for each layer.
When a link is placed in an overlay, the current location is the [location of that overlay](/up.layer.location),
even if that overlay doesn't have [visible history](/history-in-overlays).


## Styling current links

Unpoly applies no default styling to `.up-current` links. Use your own CSS instead:

```css
.up-current {
  font-weight: bold;
  background-color: yellow;
}
```

If you have already have a CSS class for current links that you want to reuse, you can tell Unpoly about it:

```js
up.feedback.config.currentClasses.push('.my-current')
```

Unpoly will set all configured classes on a current link:

```html
<nav>
  <a href="/foo" class="up-current my-current">Foo</a> <!-- mark-phrase "up-current selected" -->
  <a href="/bar">Bar</a>
</nav>
```


## Accessibility considerations

When a link is marked as `.up-current`, Unpoly also assigns an [`[aria-current]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) attribute
to convey the emphasis to assistive technologies:

```html
<nav>
  <a href="/foo" class="up-current" aria-current="page">Foo</a> <!-- mark-phrase "aria-current" -->
  <a href="/bar">Bar</a>
</nav>
```

When using a non-`<nav>` element with `[up-nav]`, we recommend to also set a `[role=navigation]` attribute
to define a navigation landmark:

```html
<div up-nav role="navigation"> <!-- mark-phrase "navigation" -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</div>
```



@page navigation-bars
