Infinite scrolling
==================

[Partials](/lazy-loading) that [load when revealed](/lazy-loading#on-reveal)
can implement [infinite scrolling](https://www.interaction-design.org/literature/topics/infinite-scrolling)
without custom JavaScript.

```html
<div id="pages">
  <div class="page">items for page 1</div>
</div>

<a id="next-page" href="/items?page=2" up-partial up-load-on="reveal" up-target="#next-page, #pages:after">
  load next page
</div>
```

Three tricks:

- The "load next page" link is a partial that loads itself [when it is scrolled into the viewport](/lazy-loading#on-reveal)
- The partial targets itself (`#next-pages`) and the list of pages (`#pages`)
- Instead of [swapping](/targeting-fragments#swapping-a-fragment) the pages container, we're [appending content](/targeting-fragments#appending-or-prepending-content) to it

When the user scrolls to the "load next page" button, Unpoly makes a request:

```http
GET /items?page=2 HTTP/1.1
X-Up-Target: #next-page, #pages
```

The server responds with HTML containing both targeted elements:

```html
<div id="pages">
  <div class="page">items for page 2</div>
</div>

<a id="next-page" href="/items?page=3" up-partial up-load-on="reveal" up-target="#next-page, #pages:after">
  load next page
</div>
```

This is stitched together:

```html
<div id="pages">
  <div class="page">items for page 1</div>
  <div class="page">items for page 2</div>
</div>

<a id="next-page" href="/items?page=3" up-partial up-load-on="reveal" up-target="#next-page, #pages:after">
  load next page
</div>
```

Note that we're using [standard links](#seo) to allow sharing of pages and also to follow
[Google's recommendation](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading#paginated-infinite-scroll).

On the last page render an empty #next-page container to remove the button:

The server responds with HTML containing both targeted elements:

```html
<div id="pages">
  <div class="page">items for last page</div>
</div>

<div id="next-page">You've reached the end.</div>
```


@page infinite-scrolling
