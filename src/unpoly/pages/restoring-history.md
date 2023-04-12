Restoring history
=================

Unpoly lets the user restore a previous history entry, usually by pressing the browser's back button.

## Default restoration behavior

To restore a history entry, Unpoly goes through the following steps:

- Fetch the content for the URL of the history entry being restored.
- Render the restored content into the `<body>` element. You may prefer other [targets](/targeting-fragments)
  by configuring `up.history.config.restoreTargets`.
- Restore earlier scroll positions for viewports in the restored content.
- Restore earlier focus and input text selection in the restored content.


## Custom restoration behavior

Listeners may prevent `up:location:restore` and substitute their own restoration behavior:

  ```js
  up.on('up:location:restore', function(event) {
    event.preventDefault()
    document.body.innerText = `Restored content for ${event.location}!`
  })
  ```

See `up:location:restore` for details.


## History restoration with overlays {#overlays}

When a previous history is restored while an [overlay](/up.layer) is open, all overlays
will be closed. The restored URL will be rendered in the [root layer](/up.layer.root).

This behavior may cause overlay content to display as a full pages. In a canonic Unpoly app this
is a good default, as Unpoly encourages all server routes to be prepared to render full HTML pages.
In particular [subinteractions](/subinteractions) make it easy to implement interactions
that work both on the root layer, and in an overlay.

If you absolutely cannot work with the way Unpoly restores history with overlays, you have the following options:

- Configure overlays to have no visible history by setting `up.layer.config.overlay.history = false`.
- Implement a [custom restoration behavior](#custom-restoration-behavior).


@page restoring-history
