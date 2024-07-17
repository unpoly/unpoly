History in overlays
===================

Overlays can configure whether their [history state](/updating-history#history-state) is reflected the
browser's [address bar](https://en.wikipedia.org/wiki/Address_bar)
and in the document `<head>`. This property is called *history visibility*.


## When overlays update history {#update-conditions}

A render pass will only update the address bar if it *both* [changes history](/updating-history#when-history-is-changed) *and* the updated layer has visible history:

| Link updates history? | Layer has visible history? | Address bar changed? |
|-----------------------|----------------------------|----------------------|
| yes                   | yes                        | ✔️ yes               |
| yes                   | no                         | ❌ no                 |
| no                    | yes                        | ❌ no                 |
| no                    | no                         | ❌ no                 |

> [note]
> When a link [updates another layer](/a-up-follow#up-layer), only the history visibility of the targeted layer is considered.
> Settings for the link's *own* layer is not relevant.

## Configuring history visibility {#configuring-visibility}

By default overlays will have visible history if their initial fragment is a [main element](/main).
The intent is to reveal the location of significant content to the user, but hide the internal location of smaller popups or menus. 

To override this default, use one of the following methods:

- Set an [`[up-history]`](/a-up-layer-new#up-history) attribute on a link or form that opens an overlay.
  For example, a link with `[up-history=false]` will open an overlay that never changes the address bar. 
- Configure [`up.layer.config.overlay.history`](/up.layer.config#config.overlay.history). This will be the default for future overlays. The default can
  be overridden with an `[up-history]` attribute or `{ history }` option.
- You may also configure different defaults for different [layer modes](/layer-terminology).
  E.g. setting `up.layer.configure.popup.history = false` will disable history visibility for all future popups.
- When opening an overlay from your JavaScript using `up.layer.open()` or `up.layer.ask()`,
  pass a [`{ history }`](/up.layer.open#options.history) option to configure history visibility for that new overlay.

> [note]
> The root layer always has visible history. This cannot be configured.


## Behavior with visible history {#visible-history}

When an overlay has visible history, its location and title are shown in the browser window while
the overlay is open. Also [meta tags](/updating-history#history-state) from the overlay content will be placed into the `<head>`.

In the example below, we start with a root layer on the `/` path:

```js
location.pathname // => "/"
```

We now open a new overlay with visible overlay. Note how its URL `/overlay` is reflected in the browser's address bar (`location.pathname`):

```js
await up.layer.open({ url: '/overlay', history: true }) // mark-phrase "true"
location.pathname // => "/overlay"
```

You can still access the tracked location for each individual layer:

```js
up.layer.current.location // => "/overlay"
up.layer.root.location    // => "/"
```

When the overlay is closed, the root layer's URL, title and meta tags are restored:

```js
await up.layer.dismiss()
location.pathname // => "/"
```

## Behavior with invisible history {#invisible-history}

If visible history is disabled, its history state will *never* be reflected in the browser window or document `<head>`,
as long as the overlay is open.

In the example below, we open an overlay with invisible history from the URL `/overlay`.
Note how the browser's address bar remains on the root layer's location (`/`):

```js
location.pathname // => "/"
await up.layer.open({ url: '/overlay', history: false }) // mark-phrase "false"
location.pathname // => "/"
```

Overlays with invisible history still track their location using the rules [described above](#update-conditions). You can access the tracked location for each individual layer:

```js
up.layer.current.location // => "/"
up.layer.root.location    // => "/"
location.pathname         // => "/"
```


### Navigation bars work with invisible history

History visibility is not required for `.up-current` classes to be set.
When a [navigation bar](/up-nav) identifies links pointing to the current page,
it compares a link's `[href]` with the location tracked in `up.layer.current.location`.


### Invisible history is inherited

When an overlay with invisible history opens *another* overlay, the nested overlay is forced to
also have invisible history.

This cannot be overridden with `{ history: true }`.



## History restoration {#restoration}

When a previous history is restored while an [overlay](/up.layer) is open, all overlays
will be closed. The restored URL will be rendered in the [root layer](/up.layer.root).

This behavior may cause overlay content to display as a full pages. In a canonic Unpoly app this
is a good default, as Unpoly encourages all server routes to be prepared to render full HTML pages.
In particular [subinteractions](/subinteractions) make it easy to implement interactions
that work both on the root layer, and in an overlay.

If you absolutely cannot work with the way Unpoly restores history with overlays, you have the following options:

- Configure overlays to have no visible history by setting `up.layer.config.overlay.history = false`.
- Implement a [custom restoration behavior](/restoring-history#custom-restoration-behavior).



@page history-in-overlays
