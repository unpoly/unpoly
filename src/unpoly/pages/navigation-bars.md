Navigation bars
===============

Links within navigational containers are automatically marked as `.up-current` if they point to the current page.

This helps highlighting current menu sections using CSS.


## Marking links as current

@include nav-example

### Updating `.up-current` classes

The `.up-current` class is toggled automatically within all content that Unpoly renders.
For example, when Unpoly [follows a link](/up-follow), [submits a form](/submitting-forms)
or [renders from a script](/up.render), any newly inserted hyperlinks will get `.up-current`
if they point to the current URL. When the browser location [changes](/up:location:changed),
existing links will be updated to reflect the new location.

To toggle `.up-current` on content that you manually inserted without Unpoly, use `up.hello()`.



## Defining navigational containers {#navigational-containers}

The `.up-current` class is applied to all links within a *navigational container*.

Standard [`<nav>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav) elements are
always considered navigational containers:

```html
<nav> <!-- mark: <nav> -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</nav> <!-- mark: </nav> -->
```

If you cannot use a `<nav>` element, you can also set the `[up-nav]` attribute on an arbitrary tag instead:

```html
<div up-nav> <!-- mark: up-nav -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</div>
```

You may also assign `[up-nav]` to an individual link instead of an navigational container:

```html
<a href="/foo" up-nav>Foo</a> <!-- mark: up-nav -->
```

Matching containers can opt *out* of `.up-current` assignment by setting an `[up-nav=false]` attribute:

```html
<nav up-nav="false"> <!-- mark: up-nav="false" -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</nav>
```

You can configure additional selectors to automatically match your navigation components
in `up.status.config.navSelectors`:

```js
up.status.config.navSelectors.push('.navbar')
```



## Matching the current location {#matching-urls}

The URL shown in the browser's [address bar](https://en.wikipedia.org/wiki/Address_bar) is
generally considered the "current" location ([except with overlays](#layers)).

A link is marked as `.up-current` when the current location matches either:

- the link's `[href]` attribute
- the link's `[up-href]` attribute on a [faux hyperlink](/faux-interactive-elements#acting-like-a-hyperlink)
- one of the link's [alias URLs](#aliases)

Any `#hash` fragments will be ignored in both link attributes and in the current location.


### Matching multiple URLs {#aliases}

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


### Matching the location of other layers {#layers}

Each [layer](/up.layer) has a separate location that it considers "current".
Even when the overlay has [no visible history](/history-in-overlays#configuring-visibility),
it still tracks the location of the fragment it contains. 

Links are marked as current when they point to location *of their own layer*.
To highlight links that point to the location of *another* layer, set an [`[up-layer]`](/up-nav#up-layer) attribute
on its [navigational container](#navigational-containers).
The attribute value can be any [layer option](/layer-option).

Below you can see a "hamburger menu" that is shown in an overlay. It contains links to the root layer,
whose `.up-current` class also match the root layer's location:

```html
<!-- label: Navigation bar in an overlay -->
<nav up-layer="root"> <!-- mark: up-layer="root" -->
  <a href="/users" up-layer="root">Users</a>
  <a href="/posts" up-layer="root">Posts</a>
</nav>
```

You can also match multiple layers this way. This is useful
when links within a single navigation bar target various layers.

In this example links are marked as "current" if their
URL matches the location of *any* layer:

```html
<nav up-layer="any"> <!-- mark: up-layer="any" -->
  <a href="/users" up-layer="root">Users</a>
  <a href="/posts" up-layer="root">Posts</a>
  <a href="/sitemap" up-layer="current">Full sitemap</a>
</nav>
```


## Styling current links {#styling}

Unpoly applies no default styling to `.up-current` links. Use your own CSS instead:

```css
.up-current {
  font-weight: bold;
  background-color: yellow;
}
```

If you have already have a CSS class for current links that you want to reuse, you can tell Unpoly about it:

```js
up.status.config.currentClasses.push('.my-current')
```

Unpoly will set all configured classes on a current link:

```html
<nav>
  <a href="/foo" class="up-current my-current">Foo</a> <!-- mark: class="up-current selected" -->
  <a href="/bar">Bar</a>
</nav>
```


## Accessibility considerations

When a link is marked as `.up-current`, Unpoly also assigns an [`[aria-current]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current) attribute
to convey the emphasis to assistive technologies:

```html
<nav>
  <a href="/foo" class="up-current" aria-current="page">Foo</a> <!-- mark: aria-current="page" -->
  <a href="/bar">Bar</a>
</nav>
```

When using a non-`<nav>` element with `[up-nav]`, we recommend to also set a `[role=navigation]` attribute
to define a navigation landmark:

```html
<div up-nav role="navigation"> <!-- mark: role="navigation" -->
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</div>
```



@page navigation-bars
