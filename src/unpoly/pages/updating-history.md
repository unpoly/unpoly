Updating history
================

When Unpoly updates a page's main content, it also updates the browser's address bar,
the window title and the meta tags in the `<head>`. The result looks and behaves like a full page load:
the user can bookmark the URL, share it, or return to it with the Back button.
Updates to minor fragments leave history untouched.


When history is updated {#when-history-is-changed}
-----------------------

Following a link or submitting a form counts as [navigation](/navigation).
When navigation updates the layer's [main element](/main), Unpoly adds a history entry for the new URL:

```html
<a href="/posts/5" up-follow>Read post</a> <!-- mark: up-follow -->
```

Clicking the link fetches `/posts/5` and swaps the main element.
The address bar now shows `/posts/5`, and the window title is taken from the response's `<title>`.

A link that updates a smaller fragment does not change history:

```html
<a href="/comments?page=2" up-target="#comments">Next page</a> <!-- mark: up-target="#comments" -->
```

Clicking this link replaces only the `#comments` element. The address bar keeps its URL,
so the user does not collect a history entry for every minor update.

This is the `auto` setting of the [`[up-history]`](/up-follow#up-history) attribute, which is the default for links and forms.
History is updated when the targeted fragment contains an element matching `up.fragment.config.autoHistoryTargets`.
By default that is the layer's main element.

> [note]
> An overlay only shows its URL in the address bar when it has [visible history](/history-in-overlays).
> This page describes the root layer, which always has.


### Forcing or preventing a change {#forcing}

To update history even when a minor fragment is updated, set `[up-history=true]`:

```html
<a href="/comments?page=2" up-target="#comments" up-history="true">Next page</a> <!-- mark: up-history="true" -->
```

To never update history, set `[up-history=false]`:

```html
<a href="/posts/5" up-follow up-history="false">Peek at post</a> <!-- mark: up-history="false" -->
```

Forms accept the same [`[up-history]`](/up-submit#up-history) attribute.
When rendering from JavaScript, pass a [`{ history }`](/up.render#options.history) option instead.

To change the default for all links and forms, configure `up.fragment.config.navigateOptions.history`.
To decide per link, listen to `up:link:follow` or `up:form:submit` and set `event.renderOptions.history`:

```js
up.on('up:link:follow', function(event, link) {
  if (link.matches('.pagination a')) {
    event.renderOptions.history = false // mark-line
  }
})
```

To stop Unpoly from ever changing the browser URL, set `up.history.config.enabled = false`.


### Treating other fragments as major {#auto-history-targets}

If your app has a significant element that is not a main element,
you can add its selector to `up.fragment.config.autoHistoryTargets`:

```js
up.fragment.config.autoHistoryTargets.push('.content')
```

Now a link targeting `.content`, or any fragment that contains a `.content` element,
updates history without an explicit `[up-history=true]`.


### Only `GET` requests update history {#get-requests}

Only a `GET` request can be reloaded or restored by the browser, so only a `GET` response updates history.
A form that submits with `POST`, `PUT` or `PATCH` never changes history, even with `[up-history=true]`.

When a successful submission redirects to a `GET` URL, the redirect's response updates history
with the new URL. Unpoly detects the redirect from the response URL, or from an `X-Up-Method` header
that your server can set.

The exception is an explicit location: when you set [`[up-location]`](/up-follow#up-location)
or pass a [`{ location }`](/up.render#options.location) option, Unpoly pushes that URL even after a non-`GET` request.


### Rendering from JavaScript {#scripting}

The low-level `up.render()` function never updates history by default:

```js
up.render({ target: '.content', url: '/path' }) // History is unchanged
```

Pass a `{ history }` option to opt in:

```js
up.render({ target: '.content', url: '/path', history: true })   // Always update
up.render({ target: '.content', url: '/path', history: 'auto' }) // Update if a main element is rendered
```

To render with all [navigation defaults](/navigation#navigation-defaults), including `{ history: 'auto' }`,
use `up.navigate()` instead of `up.render()`.


What is updated {#history-state}
---------------

A history update comprises the following:

- The URL shown in the browser's address bar.
- The document title shown as the browser's window title.
- Meta tags like `meta[name=description]` or `link[rel=canonical]`.
- The `[lang]` attribute of the root `<html>` element.
- [JSON-LD](https://json-ld.org/) annotations in the `<head>`.

In the document below, the highlighted nodes are updated when history changes, in addition to the location URL:

```html
<html lang="en"> <!-- mark: lang="en" -->
  <head>
    <title>AcmeCorp</title> <!-- mark-line -->
    <link rel="canonical" href="https://example.com/dresses/green-dresses"> <!-- mark-line -->
    <meta name="description" content="About the AcmeCorp team"> <!-- mark-line -->
    <meta prop="og:image" content="https://app.com/og.jpg"> <!-- mark-line -->
    <script src="/assets/app.js"></script>
    <link rel="stylesheet" href="/assets/app.css">
    <script type="application/ld+json">...</script> <!-- mark-line -->
  </head>
  <body>
    ...
  </body>
</html>
```

The linked JavaScript and stylesheet are *not* part of history state and will not be updated.
See [[handling-asset-changes]] for strategies to detect new app deployments.


### Including and excluding meta tags {#meta-tags}

To update an additional `<head>` element during history changes, mark it with an `[up-meta]` attribute:

```html
<link rel="license" href="https://opensource.org/license/mit/" up-meta> <!-- mark: up-meta -->
```

To keep an element that would be updated by default, set `[up-meta=false]`:

```html
<meta name="theme-color" content="#ffffff" up-meta="false"> <!-- mark: up-meta="false" -->
```

To change the defaults for all pages, configure `up.history.config.metaTagSelectors`
and `up.history.config.noMetaTagSelectors`. Only elements in the `<head>` are ever considered.


### Updating only some of the state {#partial-updates}

You can keep parts of the history state unchanged while the rest is updated.
Each part has an attribute for links and forms, and a render option for JavaScript:

| Keep unchanged | Attribute                                        | Render option                                  |
|----------------|--------------------------------------------------|------------------------------------------------|
| URL            | [`[up-location=false]`](/up-follow#up-location)  | [`{ location: false }`](/up.render#options.location) |
| Title          | [`[up-title=false]`](/up-follow#up-title)        | [`{ title: false }`](/up.render#options.title)       |
| Meta tags      | [`[up-meta-tags=false]`](/up-follow#up-meta-tags) | [`{ metaTags: false }`](/up.render#options.metaTags) |
| `html[lang]`   | [`[up-lang=false]`](/up-follow#up-lang)          | [`{ lang: false }`](/up.render#options.lang)         |

For example, this link updates the URL and title, but leaves the meta tags alone:

```html
<a href="/posts/5" up-follow up-meta-tags="false">Read post</a> <!-- mark: up-meta-tags="false" -->
```

To disable meta tag synchronization for all render passes, set `up.history.config.updateMetaTags = false`.

These options only take effect when a render pass [updates history](#when-history-is-changed) in the first place.


### Setting a different URL or title {#explicit-values}

Instead of the response's URL and `<title>`, you can set your own values.
Give `[up-location]` or `[up-title]` a string instead of `false`:

```html
<a href="/posts/5?utm=newsletter" up-follow up-location="/posts/5" up-title="My post">Read post</a> <!-- mark: up-location="/posts/5" up-title="My post" -->
```

The server can do the same by responding with an `X-Up-Location` or `X-Up-Title` header.
This is useful when you [optimize a response](/optimizing-responses) to omit the layout,
and the response no longer includes a `<title>`.


Changing history from JavaScript {#history-api}
--------------------------------

To add a history entry without rendering, call `up.history.push()`:

```js
up.history.push('/posts/5')
```

To change the URL of the current entry, call `up.history.replace()`.
Neither function updates the title or meta tags.

Entries placed this way are owned by Unpoly. When the user goes back to such an entry,
Unpoly [restores the content](/restoring-history) at that URL.
To push an entry that your own script will restore, use the browser's `history.pushState()` instead.


Observing changes {#observing}
-----------------

After the address bar changed for any reason, Unpoly emits an `up:location:changed` event:

```js
up.on('up:location:changed', function(event) {
  console.log('New location is', event.location)
})
```

The event has a `{ reason }` property that tells whether an entry was pushed or replaced,
whether the user went back, or whether only the `#hash` changed.
See [[analytics]] for using this event to track page views.


@page updating-history
