Identify fragments that are expensive to render on the server, but not immediately required.
For example, you may have a large navigation menu that only appears once the user clicks a menu icon:

```html
<div id="menu">
  Hundreds of links here
</div>
```

To remove the menu from the initial render pass, extract its contents to its own route, like `/menu`. 

In the initial view, only leave a placeholder element and mark it with an `[up-partial]` attribute.
Also set an `[up-href]` attribute with the URL from which to load the partial's content:

```html
<div id="menu" up-partial up-href="/menu"> <!-- mark-phrase "up-partial" -->
  Loading...  
</div>
```

The placeholder content is not important. It can be empty or a show a pending state.

When the `[up-partial]` placeholder is rendered, it will immediately make a request to fetch
its content from `/menu`:

```
GET /path HTTP/1.1
X-Up-Target: #menu
```

Note how the placeholder is targeting itself (`#menu`).
For this the element must have a [derivable target selector](/target-derivation).

The server is now expected to respond with a page containing `#menu` with content:

```html
<div id="menu">
  Hundreds of links here
</div>
```

The server is free to send additional elements or even a full HTML document.
Only `#menu` will be updated on the page. Other elements from the response will be discarded.


@partial partial-example
