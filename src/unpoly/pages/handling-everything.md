Handling all links and forms
============================

You can configure Unpoly to handle all links and forms on the page.

This avoids full page loads where possible, resulting in a smoother navigation experience.
For developers this means having to use fewer `[up-...]` attributes.

This page shows how to make handle Unpoly all interactive elements.
It also explains how to configure smart defaults that work for most of your links and forms.


## Following all links

To follow *all* links on a page without requiring an [`[up-follow]`](/a-up-follow) attribute:

```js
up.link.config.followSelectors.push('a[href]')
```

There are some exceptions when links will still make a full page load under this setting:

- Links with an `[up-follow=false]` attribute. Also see [boolean attributes](/attributes-and-options#boolean-attributes).
- Links that cannot be followed through JavaScript,
  like links with an `[download]` attribute or with a cross-origin `[href]`.
- You have configured additional exceptions in `up.link.config.noFollowSelectors`.

### Following all links on `mousedown`

To follow links on `mousedown` instead of `click` without an `[up-instant]` attribute:

```js
up.link.config.instantSelectors.push('a[href]')
```

Note that an instant link must also by [followable](/up.link.isFollowable), usually by giving it an [`[up-follow]`](/a-up-follow) attribute or by configuring `up.link.config.followSelectors`.

There are some exceptions when links still activate on `click` under this setting:

- Links with an `[up-instant=false]` attribute.
- Links that are not [followable](#following-all-links).
- You have configured additional exceptions in `up.link.config.noInstantSelectors`.

Note that if you have event listeners bound to `click` on accelerated links, they will
no longer be called. You need to bind these listeners to `mousedown` or, better, `up:click` instead.

### Preloading all links

To preload *all* links on when hovering over them, without requiring an `[up-preload]` attribute:

```js
up.link.config.preloadSelectors.push('a[href]')
```

There are some exceptions when links will not be preloaded under this setting:

- Links with an `[up-preload=false]` attribute.
- Links that are not [followable](#following-all-links).
- When the link destination [cannot be cached](/up.network.config#config.autoCache).
- You have configured additional exceptions in `up.link.config.noPreloadSelectors`.


## Handling all forms

To handle *all* forms on a page without requiring an [`[up-submit]`](/up-submit) attribute:

```js
up.form.config.submitSelectors.push(['form'])
```

There are some exceptions when forms will still submit with a full page load under this setting:

- Forms with an `[up-submit=false]` attribute.
- Forms with a cross-origin `[action]` attribute.

You may configure additional exceptions in `up.form.config.noSubmitSelectors`.


## Fixing legacy JavaScript code

Legacy code often contains JavaScript that expects a full page load whenever the
user interacts with the page. When you configure Unpoly to handle all interaction,
there will not be additional page loads as the user clicks a link or submits a form.

See [Making JavaScripts work with fragment updates](/legacy-scripts).


## Customizing navigation defaults

[Following a link](/a-up-follow) or [submitting a form](/up-submit) is considered
[navigation](/navigation) by default.

When navigating Unpoly will use defaults to satisfy the user's expectation regarding
scrolling, history, focus, request cancelation, etc.

See [navigation](/navigation) for a detailed breakdown of navigation defaults
and how to customize them.


@page handling-everything
