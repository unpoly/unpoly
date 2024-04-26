Lazy loading content
====================

Unpoly lets you [lazy load](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading) fragments as they enter the DOM or viewport.

By extracting non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments into partials
with a separate URL, you can paint important content earlier.


## Extracting partials {#on-insert}

@include partial-example

## Loading as the placeholder becomes visible {#on-reveal}

Instead of loading the partial right away, you may also wait until the partial is scrolled into its [viewport](/up.viewport).

For this set an `[up-load-on="reveal"]` attribute:

```html
<div id="menu" up-partial up-href="/menu" up-load-on="reveal"> <!-- mark-phrase "up-load-on" -->
  Loading...
</div>
```

Partials that load when revealed can [implement infinite scrolling](/infinite-scrolling) without custom JavaScript.



## Controlling the load timing with JavaScript {#scripted}

By setting an `[up-load-on="manual"]` attribute, the partial will not load on its own.:

```html
<div up-partial id="menu" up-load-on="manual">
</div>
```

You can now control the load timing by calling `up.partial.load()` from your own JavaScripts.
The code below uses a [compiler](/up.compiler) to load the partial after two seconds:

```js
up.compiler('#menu[up-partial]', function(placeholder) {
  setTimeout(() => up.partial.load(placeholder), 2000)
})
```


## Performance considerations

By moving expensive but non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments into partials,
you can paint critical content earlier. This will generally improve metrics like 
[First Contentful Paint](https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint) (FCP) and 
[Interaction to Next Paint](https://web.dev/articles/inp) (INP).

Note, however, that when lazy loaded content is inserted later, it may cause [layout shift](https://web.dev/articles/cls) by pushing
down subsequent elements in the [flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Normal_Flow).
This can force a browser to re-layout parts of the page.

Layout shift is rarely a problem if lazy loaded content appears [below the fold](https://www.abtasty.com/blog/above-the-fold/),
or when it has absolute positioning that removes it from the flow.


## SEO considerations {#seo}

May not be indexed.

Partials will not be followed.

If you want to reveal your partial to crawlers and non-JavaScript clients, you can use a standard hyperlink instead:

```html
<a id="menu" up-partial href="/path">load menu</a>
```


## Better caching with partials

It is hard to efficiently cache pages that mix content specific to a some users with content shared by many users.
While you can use complex cache keys to capture all differences, this may duplicate logic and cause frequent cache misses.
By instead extracting user-specific fragments into partials, you can improve the cacheability of a large page or component.

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

By extracting the admin-only buttons into a separate partial, we can easily cache the entire `<article>`
element:

```html
<article>
  <h1>Article title</h1>
  <nav id="controls" up-partial up-href="/articles/123/controls"></nav> <!-- mark-line -->
  <p>Lorem ipsum dolor sit amet ...</p>
</article>
```


## Targeting


### Identifying the partial in new content

Must have derivable target.

Set `[id]` or `[up-id]` attribute.


### Multiple partials on the same page

Partials can target one or [multiple](/targeting-fragments#updating-multiple-fragments) fragments.

To target the partial itself, you can use `:origin` target instead of spelling out a selector.



## Events

`up:partial:load`.

Can be prevented.

Will not be attempted again (but you can use `up.partial.load()`).




@page lazy-loading
