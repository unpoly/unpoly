Infinite scrolling
==================

A long list can load its next page when the user scrolls to its end, without custom JavaScript.
The "load more" link at the bottom is a [deferred placeholder](/lazy-loading)
that [loads when revealed](/lazy-loading#on-reveal), appends the next page to the list
and replaces itself with a link to the page after that.


## Structuring the HTML {#structuring-the-html}

All pages are children of a container (`#pages`). Below the container,
a link to the next page carries an `[up-defer="reveal"]` attribute:

```html
<div id="pages">
  <div class="page">items for page 1</div>
</div>

<a id="next-page" href="/items?page=2" up-defer="reveal" up-target="#next-page, #pages:after"> <!-- mark: up-target="#next-page, #pages:after" -->
  Load next page
</a>
```

Note the following:

- The link is an `[up-defer]` placeholder that loads [when it enters the viewport](/lazy-loading#on-reveal).
- Its [`[up-target]`](/up-defer#up-target) names two fragments: the link itself (`#next-page`) and the list of pages (`#pages`).
- Instead of [swapping](/targeting-fragments#swapping) the `#pages` container, the `:after` suffix
  [appends](/targeting-fragments#appending-or-prepending) the children of the response's `#pages` to it.

The link remains a standard hyperlink to `/items?page=2`, so every page has a URL that can be
shared or indexed. This follows
[Google's recommendation](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading#paginated-infinite-scroll)
for paginated content.


## Loading the next page {#loading-the-next-page}

When the user scrolls to the link, Unpoly requests it:

```http
GET /items?page=2 HTTP/1.1
X-Up-Target: #next-page, #pages
```

The server responds with HTML containing both targeted elements.
The `#pages` container holds only the items for page 2, and the link now points to page 3:

```html
<div id="pages">
  <div class="page">items for page 2</div> <!-- mark-line -->
</div>

<a id="next-page" href="/items?page=3" up-defer="reveal" up-target="#next-page, #pages:after"> <!-- mark: /items?page=3 -->
  Load next page
</a>
```

Unpoly appends the new `.page` to the existing container and swaps the link.
The page now looks like this:

```html
<div id="pages">
  <div class="page">items for page 1</div>
  <div class="page">items for page 2</div> <!-- mark-line -->
</div>

<a id="next-page" href="/items?page=3" up-defer="reveal" up-target="#next-page, #pages:after"> <!-- mark: /items?page=3 -->
  Load next page
</a>
```

The new link is again an `[up-defer="reveal"]` placeholder.
When the user keeps scrolling, it loads page 3 the same way.


## Handling the last page {#handling-the-last-page}

On the last page, render an empty or text-only `#next-page` element instead of a link.
Without an `[up-defer]` attribute, nothing more is loaded:

```html
<div id="pages">
  <div class="page">items for last page</div>
</div>

<div id="next-page">You've reached the end.</div> <!-- mark-line -->
```


## Loading before the end is reached {#intersect-margin}

By default the next page loads when the link becomes visible.
To start loading earlier, set an [`[up-intersect-margin]`](/up-defer#up-intersect-margin) attribute
with a number of pixels:

```html
<a id="next-page" href="/items?page=2" up-defer="reveal" up-intersect-margin="500" up-target="#next-page, #pages:after"> <!-- mark: up-intersect-margin="500" -->
  Load next page
</a>
```

The link now loads when it is within 500 pixels of the viewport,
so the next page is often there before the user reaches the end of the list.


@page infinite-scrolling
