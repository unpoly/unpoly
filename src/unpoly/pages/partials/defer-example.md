Identify fragments that are expensive to render on the server, but aren't immediately required.
For example, you may have a large navigation menu that only appears once the user clicks a menu icon:

```html
<div id="menu">
  Hundreds of links here
</div>
```

To remove the menu from the initial render pass, extract its contents to its own route, like `/menu`. 

In the initial view, only leave a placeholder element and mark it with an `[up-defer]` attribute.
Also set an `[up-href]` attribute with the URL from which to load the deferred content:

```html
<div id="menu" up-defer up-href="/menu"> <!-- mark-phrase "up-defer" -->
  Loading...
</div>
```

The placeholder content can show a pending state while the full content is loading.

When the `[up-defer]` placeholder is rendered, it will immediately make a request to fetch
its content from `/menu`:

```http
GET /path HTTP/1.1
X-Up-Target: #menu
```

> [note]
> By default the placeholder is [targeting](/targeting-fragments) itself (`#menu`).
> For this the element must have a [derivable target selector](/target-derivation).

The server is now expected to respond with a page containing `#menu` with content:

```html
<div id="menu">
  Hundreds of links here
</div>
```

The server is free to send additional elements or even a full HTML document.
Only `#menu` will be updated on the page. Other elements from the response will be discarded.


@partial defer-example
