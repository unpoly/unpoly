Lazy loading content
====================

Unpoly lets you load additional fragments when a placeholder enters the DOM or viewport.

By deferring the loading of non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments
with a separate URL, you can paint important content earlier.


## Extracting deferred fragments {#on-insert}

@include defer-example

## Loading as the placeholder scrolls into view {#on-reveal}

Instead of loading deferred content right away, you may also wait until the placeholder is scrolled into its [viewport](/up.viewport).

For this set an `[up-defer="reveal"]` attribute:

```html
<div id="menu" up-defer="reveal" up-href="/menu"> <!-- mark-phrase "reveal" -->
  Loading...
</div>
```

To shift the load timing to an earlier or later moment, set an `[up-intersect-margin]` attribute.

You can use the loading of deferred placeholders to [implement infinite scrolling](/infinite-scrolling) without custom JavaScript.

> [note]
> Safari requires an `[up-defer="reveal"]` element to have a non-zero width and height to be able to
> track its scrolling position.


## Custom load timing {#scripted}

By setting an `[up-defer="manual"]` attribute, the deferred content will not load on its own:

```html
<div up-defer="manual" id="menu" up-href="/menu">
  Loading...
</div>
```

You can now control the load timing by calling `up.deferred.load()` from your own JavaScripts.
The code below uses a [compiler](/up.compiler) to load the fragment after two seconds:

```js
up.compiler('#menu[up-defer]', function(placeholder) {
  setTimeout(() => up.deferred.load(placeholder), 2000)
})
```


## Performance considerations

By deferring the loading of expensive but non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments,
you can paint critical content earlier. This will generally improve metrics like 
[First Contentful Paint](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint) (FCP) and 
[Interaction to Next Paint](https://web.dev/articles/inp) (INP).

Note, however, that when lazy loaded content is inserted later, it may cause [layout shift](https://web.dev/articles/cls) by pushing
down subsequent elements in the [flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Normal_Flow).
This can force a browser to re-layout parts of the page.

Layout shift is rarely a problem if lazy loaded content appears [below the fold](https://www.abtasty.com/blog/above-the-fold/),
or when it has absolute positioning that removes it from the flow.


## SEO considerations {#seo}

Search engines may not realiably index lazy loaded content. Avoid lazy loading heavily optimized keywords,
or [use Google's URL inspection tool to test your implementation](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading). 

To allow crawlers to discover and index lazy loaded content *as a separate URL*, you can use `[up-defer]` on a standard hyperlink:

```html
<a id="menu" up-defer href="/menu">load menu</a>
```

Since this will index `/menu` as a separate page, it should render with a full application layout. You can optionally
omit the layout if an `X-Up-Target` header is present on the request.



## Caching considerations {#caching}


### Cached partials are rendered instantly

Unpoly caches [responses to GET requests](/caching) on the client. When deferred content is already cached, it is rendered synchronously.
The `[up-defer]` placeholder will never appear in the DOM.

This means Unpoly will cache complete pages, including any lazy-loaded fragments. Navigating to such pages will render them instantly,
without showing a flash of [fallback state](#pending). Such pages will also remain accessible in the event of [network issues](/network-issues).

Deferred content that is rendered from the cache will be [revalidated](/caching#revalidation) unless you also set an
[`[up-revalidate=false]`](/a-up-follow#up-revalidate) attribute.


### Improving cacheability on the server

Many apps have a server-side cache with HTML that is expensive to render.

It can be challenging to cache pages that mix content specific to a some users with content shared by many users.
While you can use complex cache keys to capture all the differences, this may duplicate logic and cause frequent cache misses.
By [extracting user-specific fragments into deferred partials](#on-insert), you can improve the cacheability of a larger page or component.

For example, the `<article>` below almost has the some content for all users. However, only administrators
get buttons to edit or delete the article:

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

By extracting the admin-only buttons into a separate fragment, we can easily cache the entire `<article>`
element:

```html
<article>
  <h1>Article title</h1>
  <nav id="controls" up-defer up-href="/articles/123/controls"></nav> <!-- mark-line -->
  <p>Lorem ipsum dolor sit amet ...</p>
</article>
```



## Displaying a fallback while content is loading {#pending}

The initial children of an `[up-defer]` element are shown while its deferred content is loading:

```html
<div id="menu" up-defer up-href="/menu">
  Loading... <!-- mark-phrase "Loading..." -->
</div>
```

> [note]
> If the deferred content is already [cached](/caching), the fallback will [immediately be replaced](#cached-partials-are-rendered-instantly) by the cached content.

A [progress bar](/loading-indicators) will show while deferred content is loading. This can be disabled by setting an `[up-background=true]` attribute.

The `[up-defer]` placeholder is assigned an `.up-active` class while its content is loading.



## Loading multiple fragments from the same URL

Deferred placeholders may be scattered throughout the page, but load from the same URL:


```html
<div id="editorial-controls" up-defer up-href="/articles/123/deferred"></div> <!-- mark-phrase "#editorial-controls" -->

... other HTML ...

<div id="analytics-controls" up-defer up-href="/articles/123/deferred"></div> <!-- mark-phrase "#analytics-controls" -->
```

When loading the deferred content, Unpoly will send a *single request* with both targets:

```http
GET /articles/123/deferred HTTP/1.1
X-Up-Target: #editorial-controls, #analytics-controls
```


## Triggering distant updates

Instead of replacing itself, a placeholder can target one or [multiple](/targeting-fragments#updating-multiple-fragments) other fragments.
To do so, set an `[up-target]` attribute matching the elements you want to update.

The following placeholder would update the fragments `#editorial-controls` and `#analytics-controls` when
the placeholder is scrolled into view:

```html
<a href="/articles/123/controls" up-defer="reveal" up-target="#editorial-controls, #analytics-controls"> <!-- mark-phrase "up-target" -->
  load controls
</div>
```

See [infinite scrolling](/infinite-scrolling) for another example of this technique.


## Events

Before a placeholder loads its deferred content, an `up:deferred:load` event is emitted.

The event can be [prevented](/up:deferred:load#event.preventDefault) to stop the network request.
The loading will not be attempted again, but you can use `up.deferred.load()` to manually load afterwards.



@page lazy-loading
