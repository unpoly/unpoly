Navigation
==========

When a browser user interacts with a standard hyperlink or form,
they have certain expectations regarding scrolling, history, focus,
request cancelation, etc. When an Unpoly feature
*navigates* it will mimic the behavior of standard hyperlinks and forms.

When an Unpoly feature does *not* navigate, it only renders a new fragment,
without affecting scroll positions, browser, history, etc.

## Navigating features

[Following a link](/a-up-follow), [submitting a form](/form-up-submit) or
[opening an overlay](/up.layer.open) is considered navigation by default.
You may opt *out of* navigation defaults by passing a `{ navigate: false }` option
or setting an `[up-navigate=false]` attribute.

Other features like [validation](/up-validate) or `up.render()` are *not*
considered navigation by default. You may opt *into* navigation by passing a
`{ navigate: true }` option or setting an `[up-navigate=true]` attribute.

| Feature           | Navigates by default? |
|-------------------|-----------------------|
| `a[up-follow]`    | yes                   |
| `up.follow()`     | yes                   |
| `up.navigate()`   | yes                   |
| `a[up-layer=new]` | yes                   |
| `up.layer.open()` | yes                   |
| `form[up-submit]` | yes                   |
| `up.submit()`     | yes                   |
| `up.render()`     | no                    |
| `[up-validate]`   | no                    |
| `up.validate()`   | no                    |
| `[up-poll]`       | no                    |

## Navigation defaults

The following default options will be used when navigating:

| Option                  | Effect                                                                                                 |
| ----------------------- |--------------------------------------------------------------------------------------------------------|
| `{ history: 'auto' }`   | Update browser location and window title if updating a main target                                     |
| `{ scroll: 'auto' }`    | Reset scroll position if updating a main target ([read more](/up.fragment.config#config.autoScroll))   |
| `{ fallback: ':main' }` | Replace a [main target](/up-main) if response doesn't contain target                                   |
| `{ cache: true }`       | [Cache responses](/caching)                                                                            |
| `{ feedback: true }`    | Set `.up-active` and [`.up-loading`](/up-loading) classes while waiting for the server |
| `{ focus: 'auto' }`     | Focus the new fragment ([read more](/up.fragment.config#config.autoFocus))                             |
| `{ peel: true }`        | Close overlays when targeting a layer below                                                            |


### Customizing defaults

You can customize your navigation defaults with `up.fragment.config.navigateOptions`:

```js
up.fragment.config.navigateOptions.transition = 'cross-fade'
```

### Defaults that depend on the origin

Sometimes you need to configure defaults that depend on the link or form that was activated.

Events like `up:link:follow` or `up:form:submit` have a `{ renderOptions }` property
that lets you change render options for the coming fragment update.

The code below will open all form-contained links in an overlay, as to not
lose the user's form data:

```js
up.on('up:link:follow', function(event, link) {
  if (link.closest('form')) {
    event.renderOptions.layer = 'new'
  }
})
```

@page navigation

