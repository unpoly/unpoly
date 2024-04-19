Lazy loading content
====================

Unpoly lets you [lazy load](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading) fragments.



## Example {#on-insert}

With `[up-partial]` with empty content.

```html
<div id="menu" up-partial up-href="/path"></div>
```

As soon as the content is rendered.

Makes a request to the `/path` URL from `[up-href]`:

```
GET /path HTTP/1.1
X-Up-Target: #menu
```

The server is now expected to respond with a page containing `#menu` with content:

```html
<div id="menu">
  Menu content
</div>
```

The server is free to send additional elements or even a full HTML document.
Only `#menu` will be updated on the page. Other elements from the response will be discarded.

## Loading as the partial becomes visible {#on-reveal}




## Controlling the load timing with JavaScript {#scripted}


## Caching benefits


## Performance considerations

Content earlier

Note that when lazy loaded content is inserted later, it may cause [layout shift](https://web.dev/articles/cls) by pushing
down elements farther down the flow. This can force a browser to relayout parts of the page, or cause the
user to click on the wrong element.

Layout shift is less of a problem if lazy loaded content appears below the fold, or if has positioning that doesn't affect many other elements.


## SEO considerations

Partials will not be followed.

If you want to reveal your partial to crawlers and non-JavaScript clients, you can use a standard hyperlink instead:

```html
<a id="menu" up-partial href="/path">load menu</a>
```


## Targeting


### Identifying the partial in new content

Must have derivable target.

Set `[id]` or `[up-id]` attribute.


### Multiple partials on the same page

Merged



## Events

`up:partial:load`.


@page lazy-loading
