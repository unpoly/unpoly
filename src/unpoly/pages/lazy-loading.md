Lazy loading content
====================

Unpoly lets you [lazy load](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading) fragments as they enter the DOM or viewport.

By extracting non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments into partials
with a separate URL, you can paint important content earlier.




## Example {#on-insert}

@include partial-example

## Loading as the placeholder becomes visible {#on-reveal}




## Controlling the load timing with JavaScript {#scripted}


## Caching benefits


## Performance considerations

Content earlier

Note that when lazy loaded content is inserted later, it may cause [layout shift](https://web.dev/articles/cls) by pushing
down elements farther down the flow. This can force a browser to relayout parts of the page, or cause the
user to click on the wrong element.

Layout shift is less of a problem if lazy loaded content appears below the fold, or if has positioning that doesn't affect many other elements.


## SEO considerations {#seo}

Partials will not be followed.

May not be indexed.

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


## Lazy preloading of link destinations




@page lazy-loading
