Handling server errors
======================

You may pass different render options for server responses with an error code.

Any HTTP status code other than 2xx or 304 is considered an error code.

A common use case for this is [form submissions](/up.form), where a successful response
should display a follow-up screen, but a failed response should re-render the form
or display errors.

## Rendering failed responses differently

To use a different [render option](/up.render) for a failed server response,
prefix the option with `fail`:

```js
up.render({
  url: '/action',
  method: 'post',
  target: '.content',   // when submission succeeds update '.content'
  failTarget: 'form',   // when submission fails update the form
  scroll: 'auto',       // when submission succeeds use default scroll behavior
  failScroll: '.errors' // when submission fails scroll to the error messages
})
```

When using Unpoly's HTML attributes with [links](/up.link) or [forms](/up.form)
you may infix an attribute with `fail`:

```html
<form method="post" action="/action"
  up-target=".content"
  up-fail-target="form"
  up-scroll="auto"
  up-fail-scroll=".errors">
  ...
</form>
```

Options that are used before the request is made (like `{ url, method, confirm }`) do not
have a `fail`-prefixed variant. Some options (like `{ history, fallback }`) are used for both
successful and failed responses, but may be overriden with a fail-prefixed variant
(e.g. `{ history: true, failHistory: false }`. Options related to layers, scrolling or
focus are never shared.

### Ignoring HTTP error codes

With `{ fail: false }` or `[up-fail=false]` Unpoly will always consider the response
to be successful, even with a HTTP 4xx or 5xx status code.

### Customizing failure detection

By default any HTTP 2xx or 304 status code will be considered successful, and any other status code will be considered failed. This behavior can be customized. For instance, you can fail a response if it contains a given header or body text.

The following configuration will fail all responses with an `X-Unauthorized` header.

```js
let badStatus = up.network.config.fail
up.network.config.fail = (response) => badStatus(response) || response.getHeader('X-Unauthorized')
```

You can also decide to fail a response in an `up:fragment:loaded` listener:

```js
up.on('up:fragment:loaded', function(event) {
  if (event.response.getHeader('X-Unauthorized')) {
    event.renderOptions.fail = true
  }
})
```

### Local content cannot fail

When the updated fragment content is not requested from a `{ url }`, but rather passed as a
HTML string, the update is always considered successful.


## Handling other types of failure

### Fatal network errors

When a request encounters fatal error like a timeout or loss of network connectivity, Unpoly
will emit `up:request:fatal` and not render.

### Aborted requests

When a request was aborted, Unpoly will emit `up:request:aborted` and not render.

A promise for an aborted request will reject with an `up.AbortError`.

### Unexpected content

A server might sometimes respond with unexpected content, like a maintenance page or a
login form.

To handle these cases, see `up:fragment:loaded`.

@page server-errors
