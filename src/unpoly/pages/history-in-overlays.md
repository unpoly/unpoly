History in overlays
===================

An overlay can show its own URL in the browser's address bar while it is open, or leave
the address bar on the page behind it. By default an overlay shows its URL when it contains
a main element, so a page opened in a dialog gets a shareable address while a small popup menu does not.
You can override this for a single overlay or for all. This setting is called the overlay's *history visibility*.


Overlays with visible history {#visible-history}
-----------------------------

When an overlay has visible history, its location and title are shown in the browser window
while the overlay is open. [Meta tags](/updating-history#history-state) from the overlay content
are placed into the `<head>`.

In the example below, we start with a root layer at `/`:

```js
location.pathname // result: "/"
```

We now open an overlay from `/users/5`. Its content is a [main element](/main), so the overlay has visible history.
Note how its URL is reflected in the browser's address bar:

```js
await up.layer.open({ url: '/users/5' })
location.pathname // result: "/users/5"
```

Each layer still tracks its own location:

```js
up.layer.current.location // result: "/users/5"
up.layer.root.location    // result: "/"
```

When the overlay is closed, the root layer's URL, title and meta tags are restored:

```js
await up.layer.dismiss()
location.pathname // result: "/"
```


Hiding an overlay's history {#configuring-visibility}
---------------------------

By default an overlay has visible history when its initial fragment is a [main element](/main).
This reveals the location of significant content to the user, but hides the internal location
of smaller popups or menus.

To hide the history of one overlay, set an `[up-history=false]` attribute on the link or form that opens it:

```html
<a href="/users/5" up-layer="new" up-history="false">Show user</a> <!-- mark: up-history="false" -->
```

When opening an overlay from JavaScript, pass a `{ history: false }` option to `up.layer.open()` or `up.layer.ask()`.
Setting `true` instead of `false` makes an overlay show its history even when its content is not a main element.

To change the default for all overlays, configure `up.layer.config.overlay.history`.
A mode can have its own default, like `up.layer.config.popup.history` for all popups.
Links and options still override the configured default.

The root layer always has visible history. This cannot be configured.


Behavior with invisible history {#invisible-history}
-------------------------------

When an overlay's history is hidden, nothing the overlay renders is reflected in the address bar,
the window title or the document `<head>`, for as long as the overlay is open.

In the example below, we open an overlay from `/users/5` with invisible history.
Note how the browser's address bar stays on the root layer's location:

```js
location.pathname // result: "/"
await up.layer.open({ url: '/users/5', history: false }) // mark: history: false
location.pathname // result: "/"
```

The overlay still tracks its own location, which you can read from its `up.Layer#location` property:

```js
up.layer.current.location // result: "/users/5"
up.layer.root.location    // result: "/"
```

Observe `up:layer:location:changed` to be notified when a layer's location changes.
Unlike `up:location:changed`, this event is also emitted for layers with invisible history.


### Navigation bars work with invisible history

History visibility is not required for `.up-current` classes to be set.
When a [navigation bar](/navigation-bars) looks for links pointing to the current page,
it compares a link's `[href]` with the location of its own layer, not with the address bar.


### Invisible history is inherited

When an overlay with invisible history opens *another* overlay, the nested overlay
also has invisible history. The nested overlay cannot override this with `[up-history=true]` or `{ history: true }`.


When a link in an overlay updates the address bar {#update-conditions}
-------------------------------------------------

Once an overlay is open, links and forms inside it follow the usual rules for
[when history is updated](/updating-history#when-history-is-changed): a link updates history when it targets
a main element, or when it sets `[up-history=true]`. The address bar only changes when *both*
the link updates history *and* the updated layer has visible history:

| Link updates history? | Layer has visible history? | Address bar changed? |
|-----------------------|----------------------------|----------------------|
| yes                   | yes                        | ✔️ yes               |
| yes                   | no                         | ❌ no                 |
| no                    | yes                        | ❌ no                 |
| no                    | no                         | ❌ no                 |

When a link [updates another layer](/layer-option), only the history visibility of the *targeted* layer is considered.
The visibility of the link's own layer is not relevant.


Going back while an overlay is open {#restoration}
-----------------------------------

When the user presses the browser's Back button while an overlay is open,
all overlays are closed. The [restored URL](/restoring-history) is rendered in the root layer.

A user who opens `/users/5` in an overlay, presses Back and then Forward,
sees `/users/5` as a full page. In a canonical Unpoly app this is a good default,
since every route can render a full page anyway. [Subinteractions](/subinteractions) in particular
work the same on the root layer and in an overlay.

If you cannot work with this, you have the following options:

- Hide the history of all overlays with `up.layer.config.overlay.history = false`.
  Then no overlay ever adds a history entry.
- Implement a [custom restoration behavior](/restoring-history#custom-behavior).


@page history-in-overlays
