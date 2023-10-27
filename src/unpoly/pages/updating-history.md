Updating history
================

Unpoly will update the browser location, document title and meta tags
as the user [follows links](/a-up-follow) and [submits forms](/form-up-submit).



## When history is changed

There are some restrictions for when Unpoly will change history.
This sections explains the reasons for these restrictions and shows how to override them.


### Only major fragments change history 

By default Unpoly only changes history when a [main element](/main) is rendered.
This is to prevent location changes when rendering a minor fragment, like a table row or a message counter.

This behavior is a [navigation default](/navigation#navigation-defaults) in
`up.fragment.config.navigateOptions.history === 'auto'`.

To cause auto-history to trigger on fragments other than main elements, add a selector to `up.fragment.config.autoHistoryTargets`.


### Forcing a history change

To force a location change, use one of the following: 

- Set an `[up-history=true]` attribute on your link or form.
- Pass a `{ history: true }` option when rendering a fragment [programmatically](/up.fragment).
- Set `up.fragment.config.navigateOptions.history = true`. This will be the new default for all links and forms.


### Preventing a history change 

To prevent a location change after rendering a major fragment, use one of the following:

- Set an `[up-history=false]` attribute on your link or form.
- Pass a `{ history: false }` option when rendering a fragment [programmatically](/up.fragment).
- Set `up.fragment.config.navigateOptions.history = false`. This will be the new default for all links and forms.


### Only `GET` requests change history

Only requests with a `GET` method are egible to change browser history.
This is because only `GET` requests can be reloaded and restored safely.
This behavior cannot be configured.

### Changing history after a form submission

Form submissions with methods like `POST`, `PUT` or `PATCH` never change history. 
However, if a successful form submssion redirects to a `GET` URL, that new request is
again egible to change history.




## What is updated when history changes {#history-state}

A history update comprises the following:

- The URL shown in the browser's address bar.
- The document title shown as the browser's window title.
- Meta tags like `meta[name=description]` or `link[rel=canonical]`.

In the document below, the highlighted elements will be updated when history is changed, in additional to the location URL:

```html
<head>
  <title>AcmeCorp</title> <!-- mark-line -->
  <link rel="canonical" href="https://example.com/dresses/green-dresses"> <!-- mark-line -->
  <meta name="description" content="About the AcmeCorp team"> <!-- mark-line -->
  <meta prop="og:image" content="https://app.com/og.jpg"> <!-- mark-line -->
  <script src="/assets/app.js"></script>
  <link rel="stylesheet" href="/assets/app.css">  
</head>
```

The linked JavaScript and stylesheet are *not* part of history state and will not be updated.

The updating of `<link>` and `<meta>` elements can be disabled with `up.history.config.updateMetaTags = false`.



## History in overlays

By default modals and overlays will have visible history if their initial fragment is a [main element](/main).
To override this default, use one of the following:

- Set an `[up-history]` attribute on a link or form that opens an overlay.
- Pass a `{ history }` option to `up.layer.open()` or `up.layer.ask()`.
- Configure [`up.layer.config.overlay.history`](/up.layer.config#config.overlay.history). This will be the new
  default for new overlays. You may also configure different defaults for different [layer modes](/layer-terminology),
  e.g. by setting `up.layer.configure.popup.history`. 

Also see [History restoration in overlays](/restoring-history#overlays)

### Behavior of overlays with history

When an overlay has visible history, its location and title are shown in the browser window while
the overlay is open. Also [meta tags](#history-state) from the overlay content will be placed into the `<head>`.  

When an overlay is closed, the URL, title and meta tags from the background layer are restored.

### Behavior of overlays without history

If visible history is disabled, it will remain disabled for the lifetime of the overlay.
 
Even when an overlay doesn't have visible history, is still tracks its location using the rules described
on this page. You can access an overlay's current location using `up.layer.location`.

When an overlay without history opens *another* overlay, the nested overlay cannot have history,
even with `{ history: true }`.


## History for programmatic updates

When your JavaScript updates a fragment using `up.render()`, history is never changed by default.
You may opt into history changes using one of the following:

- Pass a `{ history: true }` option to force a history change.
- Pass a `{ history: 'auto' }` option to update history if updating a major fragment.
- Use `up.navigate()` instead of `up.render()` to inherit [navigation defaults](/navigation#navigation-defaults).


## Supporting the back button

See [Restoring history](/restoring-history).


@page updating-history
