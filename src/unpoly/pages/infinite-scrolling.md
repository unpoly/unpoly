Infinite scrolling
==================

[Deferred fragments](/lazy-loading) that [load when revealed](/lazy-loading#on-reveal)
can implement [infinite scrolling](https://www.interaction-design.org/literature/topics/infinite-scrolling)
without custom JavaScript.

## Structuring the HTML

```html
<div id="pages">
  <div class="page">items for page 1</div>
</div>

<a id="next-page" href="/items?page=2" up-defer="reveal" up-target="#next-page, #pages:after">
  load next page
</div>
```

Note the following:

- All pages are children of a container (`#pages`).
- The *"load next page"* link is an `[up-defer]` placeholder that loads content [when it enters the viewport](/lazy-loading#on-reveal)
- The partial targets itself (`#next-pages`) and the list of pages (`#pages`), using an [`[up-target]`](/up-defer#up-target) attribute.
- Instead of [swapping](/targeting-fragments#swapping-a-fragment) the pages container, we're [appending content](/targeting-fragments#appending-or-prepending-content) to it

## Loading the next page

When the user scrolls to the "load next page" button, Unpoly automatically makes a request:

```http
GET /items?page=2 HTTP/1.1
X-Up-Target: #next-page, #pages
```

The server is now expected to respond with HTML containing both targeted elements.

Note how the response only contains items for page 2, and a link to page 3:

```html
<div id="pages">
  <div class="page">items for page 2</div> <!-- mark-line -->
</div>

<a id="next-page" href="/items?page=3" up-defer="reveal" up-target="#next-page, #pages:after"> <!-- mark-phrase "/items?page=3" -->
  load next page
</div>
```

Unpoly renders the response, resulting in the following page:

```html
<div id="pages">
  <div class="page">items for page 1</div>
  <div class="page">items for page 2</div> <!-- mark-line -->
</div>

<a id="next-page" href="/items?page=3" up-defer="reveal" up-target="#next-page, #pages:after"> <!-- mark-phrase "/items?page=3" -->
  load next page
</div>
```

> [note]
> We're using [standard links](#seo) to allow sharing of pages and also to follow
[Google's recommendation](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading#paginated-infinite-scroll).


## Handling the last page

On the last page render we can render an empty (or text-only) `#next-page` container to remove the link:

```html
<div id="pages">
  <div class="page">items for last page</div>
</div>

<div id="next-page">You've reached the end.</div>
```


@page infinite-scrolling
