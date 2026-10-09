Lazy loading content
====================

Unpoly can load parts of a page after the page itself has rendered.
A deferred element with an `[up-defer]` attribute fetches its content from a separate URL,
either right away, when it is scrolled into view, or when your JavaScript decides.
Expensive or rarely seen fragments no longer delay the first paint.


## Deferring a fragment {#on-insert}

Look for fragments that are expensive to render on the server, but aren't needed immediately.
For example, a large navigation menu that only appears once the user clicks a menu icon:

```html
<div id="menu">
  Hundreds of links here
</div>
```

Move the menu's content to its own route, like `/menu`.
In the page, leave only a *deferred element* with an `[up-defer]` attribute.
An `[up-href]` attribute says where to load the content from:

```html
<div id="menu" up-defer up-href="/menu"> <!-- mark: up-defer -->
  Loading...
</div>
```

As soon as the deferred element is inserted into the page, Unpoly requests `/menu`:

```http
GET /menu HTTP/1.1
X-Up-Target: #menu
```

The server responds with a page containing the `#menu` element with its full content:

```html
<div id="menu">
  Hundreds of links here
</div>
```

Unpoly swaps the deferred element with the element from the response.
Other elements in the response are discarded, so the server is free to send
a full HTML document.

Note the following:

- The deferred element [targets itself](/targeting-fragments) by default, so it must have a
  [derivable target selector](/target-derivation) like a unique `[id]`.
- The `#menu` element in the response must *not* have an `[up-defer]` attribute,
  or it would load itself again, forever.
- The deferred element's children (`Loading...`) are shown until the content arrives.
  See [showing a fallback](#pending) below.


## Loading when scrolled into view {#on-reveal}

Instead of loading right away, a deferred element can wait until it is scrolled into its [viewport](/up.viewport).
For this set an `[up-defer="reveal"]` attribute:

```html
<div id="comments" up-defer="reveal" up-href="/posts/5/comments"> <!-- mark: up-defer="reveal" -->
  Loading...
</div>
```

A deferred element that is already visible when inserted loads immediately.

To load some pixels before the deferred element becomes visible, set an `[up-intersect-margin]` attribute.
A positive margin loads earlier, a negative margin requires the user to scroll into the element.

A deferred element that loads when revealed can also [implement infinite scrolling](/infinite-scrolling)
without custom JavaScript.

> [note]
> Safari requires an `[up-defer="reveal"]` element to have a non-zero width and height
> to track its scrolling position.


## Loading from JavaScript {#scripted}

With an `[up-defer="manual"]` attribute, a deferred element does not load on its own:

```html
<div id="menu" up-defer="manual" up-href="/menu"> <!-- mark: up-defer="manual" -->
  Loading...
</div>
```

Load it whenever you like by passing it to `up.deferred.load()`.
The [compiler](/enhancing-elements) below loads the menu after two seconds:

```js
up.compiler('#menu[up-defer]', function(element) {
  setTimeout(() => up.deferred.load(element), 2000) // mark: up.deferred.load
})
```

`up.deferred.load()` returns a promise for the [render result](/up.RenderResult),
so you can wait for the content to arrive.


## Showing a fallback while loading {#pending}

The initial children of an `[up-defer]` element are shown until its content has loaded:

```html
<div id="menu" up-defer up-href="/menu">
  Loading... <!-- mark: Loading... -->
</div>
```

While the content is loading, the deferred element is also assigned an `.up-loading` class.
All [loading state](/loading-state) techniques for regular links, like [placeholders](/placeholders)
and [previews](/previews), work with `[up-defer]` elements as well.

> [note]
> When the deferred content is already [cached](#caching), the deferred element is
> replaced immediately and its fallback children are never shown.


## Loading multiple fragments from one URL {#loading-multiple-fragments-from-the-same-url}

Deferred elements may be scattered across the page, but load from the same URL:

```html
<div id="editorial-controls" up-defer up-href="/articles/123/deferred"></div> <!-- mark: id="editorial-controls" -->

... other HTML ...

<div id="analytics-controls" up-defer up-href="/articles/123/deferred"></div> <!-- mark: id="analytics-controls" -->
```

Unpoly [sends a single request](/X-Up-Target#merging) with both targets:

```http
GET /articles/123/deferred HTTP/1.1
X-Up-Target: #editorial-controls, #analytics-controls
```

The response must contain both elements.


## Updating other fragments {#distant}

Instead of replacing itself, a deferred element can target one or [multiple](/targeting-fragments#multiple)
other fragments. For this set an [`[up-target]`](/up-defer#up-target) attribute.

The following deferred element updates `#editorial-controls` and `#analytics-controls`
when it is scrolled into view:

```html
<a href="/articles/123/controls" up-defer="reveal" up-target="#editorial-controls, #analytics-controls"> <!-- mark: up-target="#editorial-controls, #analytics-controls" -->
  Load controls
</a>
```

[Infinite scrolling](/infinite-scrolling) is built on this technique: a link at the end of a list
appends the next page to the list, then replaces itself with a link to the page after that.


## Caching {#caching}

### Cached partials are rendered instantly {#cached-partials-are-rendered-instantly}

Unpoly caches [responses to `GET` requests](/caching) on the client.
When deferred content is already cached, it is rendered synchronously and the
`[up-defer]` element is replaced before the browser paints it.

This means Unpoly caches complete pages, including their lazy-loaded fragments.
Navigating back to such a page renders it instantly, without a flash of [fallback state](#pending).
The page also stays accessible during [network issues](/network-issues).

Deferred content rendered from the cache is [revalidated](/caching#revalidation)
unless you also set an [`[up-revalidate=false]`](/up-follow#up-revalidate) attribute.

### Improving cacheability on the server {#server-cache}

Many apps have a server-side cache for HTML that is expensive to render.
Pages that mix content shared by all users with content specific to one user are hard to cache.
Complex cache keys that capture all the differences duplicate logic and cause frequent cache misses.

For example, the `<article>` below has the same content for all users.
Only administrators get buttons to edit or delete the article:

```html
<article>
  <h1>Article title</h1>
  <nav id="controls"> <!-- mark-line -->
    <% if current_user.admin? %> <!-- mark-line -->
      <a href="...">Edit</a> <!-- mark-line -->
      <a href="...">Delete</a> <!-- mark-line -->
    <% end %> <!-- mark-line -->
  </nav> <!-- mark-line -->
  <p>Lorem ipsum dolor sit amet ...</p>
</article>
```

By extracting the admin-only buttons into a deferred fragment, the entire `<article>`
element becomes the same for everyone, and can be cached as a whole:

```html
<article>
  <h1>Article title</h1>
  <nav id="controls" up-defer up-href="/articles/123/controls"></nav> <!-- mark-line -->
  <p>Lorem ipsum dolor sit amet ...</p>
</article>
```


## Performance considerations {#performance}

Deferring expensive but non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments
paints critical content earlier. This generally improves metrics like
[First Contentful Paint](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint) (FCP) and
[Interaction to Next Paint](https://web.dev/articles/inp) (INP).

When lazy-loaded content is inserted later, it may cause [layout shift](https://web.dev/articles/cls)
by pushing down subsequent elements in the [flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Normal_Flow).
This forces the browser to re-layout parts of the page.

Layout shift is rarely a problem when lazy-loaded content appears below the fold,
or when it is positioned absolutely and removed from the flow.
Giving the deferred element the height of its coming content also avoids it.


## SEO considerations {#seo}

Search engines may not reliably index lazy-loaded content. Avoid lazy loading heavily optimized keywords,
or [use Google's URL inspection tool to test your implementation](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading).

To let crawlers discover and index lazy-loaded content *as a separate URL*, use `[up-defer]` on a standard hyperlink:

```html
<a id="menu" up-defer href="/menu">Load menu</a> <!-- mark: href="/menu" -->
```

Since this indexes `/menu` as a separate page, it should render with a full application layout.
You can omit the layout when an [`X-Up-Target`](/optimizing-responses) header is present on the request.


## Preventing a deferred element from loading {#events}

Before a deferred element loads its content, an `up:deferred:load` event is emitted on it.
Prevent the event to stop the request:

```js
up.on('up:deferred:load', '#menu', function(event) {
  if (!navigator.onLine) event.preventDefault() // mark: event.preventDefault()
})
```

The loading will not be attempted again on its own.
You can still load the element later by passing it to `up.deferred.load()`.


@page lazy-loading
@signature
