Updating history
================

Unpoly will update the browser location, document title and meta tags
as the user [follows links](/up-follow) and [submits forms](/up-submit).



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

To force a change of history state, use one of the following: 

- Set an `[up-history=true]` attribute on your link or form.
- Pass a `{ history: true }` option when rendering a fragment [programmatically](/up.fragment).
- Set `up.fragment.config.navigateOptions.history = true`. This will be the new default for all links and forms.
- Listeners to `up:link:follow` or `up:form:submit` may set `event.renderOptions.history = true`.


### Preventing a history change 

To prevent changing history-related state after rendering a major fragment, use one of the following:

- Set an `[up-history=false]` attribute on your link or form.
- Pass a `{ history: false }` option when rendering a fragment [programmatically](/up.fragment).
- Set `up.fragment.config.navigateOptions.history = false`. This will be the new default for all links and forms.
- Listeners to `up:link:follow` or `up:form:submit` may set `event.renderOptions.history = false`.
- Set `up.history.config.enabled = false` to globally prevent Unpoly from making history changes. 


### Only `GET` requests change history

Only requests with a `GET` method are egible to change browser history.
This is because only `GET` requests can be reloaded and restored safely.
This behavior cannot be configured.


### Changing history after a form submission

Form submissions with methods like `POST`, `PUT` or `PATCH` never change history. 
However, if a successful form submssion redirects to a `GET` URL, that new request is
again egible to change history.


### Changing history during programmatic rendering

When your JavaScript updates a fragment using `up.render()`, history is never changed by default.
You may opt into history changes using one of the following:

- Pass a `{ history: true }` option to force a history change.
- Pass a `{ history: 'auto' }` option to update history if updating a major fragment.
- Use `up.navigate()` instead of `up.render()` to inherit [navigation defaults](/navigation#navigation-defaults).



## What is updated when history changes {#history-state}

A history update comprises the following:

- The URL shown in the browser's address bar.
- The document title shown as the browser's window title.
- Meta tags like `meta[name=description]` or `link[rel=canonical]`.
- The `[lang]` attribute of the root `<html>` element.

In the document below, the highlighted nodes will be updated when history is changed, in additional to the location URL:

```html
<html lang="en"> <!-- mark-phrase "en" -->
  <head>
    <title>AcmeCorp</title> <!-- mark-line -->
    <link rel="canonical" href="https://example.com/dresses/green-dresses"> <!-- mark-line -->
    <meta name="description" content="About the AcmeCorp team"> <!-- mark-line -->
    <meta prop="og:image" content="https://app.com/og.jpg"> <!-- mark-line -->
    <script src="/assets/app.js"></script>
    <link rel="stylesheet" href="/assets/app.css">
  </head>
  <body>
    ...
  </body>
</html>
```

The linked JavaScript and stylesheet are *not* part of history state and will not be updated.

### Partial history updates

You may choose to only update some history-related state, but keep others unchanged:

- Location changes can be disabled by setting [`[up-location="false"]`](/up-follow#up-location) on a link or form, or by passing [`{ location: false }`](/up.render#options.location) to a rendering function.
- Title changes can be disabled by setting [`[up-title="false"]`](/up-follow#up-title) on a link or form, or by passing [`{ title: false }`](/up.render#options.location) to a rendering function.
- Meta tag synchronization can be disabled by setting [`[up-meta-tags="false"]`](/up-follow#up-meta-tags) on a link or form, or by passing [`{ metaTags: false }`](/up.render#options.metaTags) to a rendering function.
- Changes to the [`html[lang]`](https://www.tpgi.com/using-the-html-lang-attribute/) attribute can be disabled by setting [`[up-lang="false"]`](/up-follow#up-title) on a link or form, or by passing [`{ title: false }`](/up.render#options.location) to a rendering function.

> [note]
> Options like `{ location }` will only be honored [when a render pass is changing history](#when-history-is-changed).


@page updating-history
