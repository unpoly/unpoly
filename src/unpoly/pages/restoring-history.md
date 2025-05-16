Restoring history
=================

Unpoly lets the user restore a previous history entry, usually by pressing the browser's back button.



## Default restoration behavior {#default-behavior}

When the user navigates back to a history entry, Unpoly will usually update the `<body>` with HTML loaded from the restored location.

The exact process goes like this:

- Check whether Unpoly [owns](#handled-entries) the location.
- Emit `up:location:changed` to see if another script wants to handle the location change.
- Test which parts of the location changed.
 
If only the `#hash` changed from the previous location, Unpoly will scroll to a matching fragment and end the process.

If the location's path or query string changed:

- Emit `up:location:restore` to see if another script wants is implementing [custom restoration behavior](#custom).
- Fetch the content for the URL of the history entry being restored. [Cached](/caching) responses are used.
- [Dismiss all overlays](/history-in-overlays#restoration).
- Render the restored content into the `<body>` element. You may prefer other [targets](/targeting-fragments)
  by configuring `up.history.config.restoreTargets`.
- Restore earlier scroll positions for viewports in the restored content.
- Restore earlier focus and input text selection in the restored content.
- [Revalidate](/caching#revalidation) cached content if it has expired.


## Custom restoration behavior {#custom-behavior}

Listeners to `up:location:restore` may mutate the `event.renderOptions`
event to customize the render pass that is about to restore content:

```js
up.on('up:location:restore', function(event) {
  // Update a different fragment when restoring /special-path  
  if (event.location === '/special-path') {
    event.renderOptions.target = '#other'
  }
})
```

You may also substitute Unpoly's render pass with your own restoration behavior,
by preventing `up:location:restore`. This will prevent Unpoly from changing any element.
Your event handler can then restore the page with your own custom code:

```js
up.on('up:location:restore', function(event) {
  // Stop Unpoly from rendering anything
  event.preventDefault()
  
  // We will render ourselves
  document.body.innerText = `Restored content for ${event.location}!`
})
```

When `up:location:restore` is emitted, the [browser location](/up.history.location)
has already been updated. This cannot be prevented by an event listener.

> [important]
> Custom restoration code should not push new history entries.


## Handled history entries {#handled-entries}

By default Unpoly feels responsible for handling history entries that it *owns*:

- The entry of the initial page load, after Unpoly has booted.
- Locations changed by Unpoly while [navigating](/navigation) or rendering with [`{ history: true }`](/up.render#options.history).
- Entries pushed by changing the `#hash` of a location that Unpoly owns

You can control whether Unpoly will handle a location change by listening to `up:location:changed`
and mutating the [`event.willHandle`](/up:location:changed#event.willHandle) property.


## History restoration with overlays

See [History restoration with overlays](/history-in-overlays#restoration).



@page restoring-history
