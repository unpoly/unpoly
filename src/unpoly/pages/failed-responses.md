Handling failed responses
=========================

You can configure how Unpoly handles failed server responses.

Some example for failed responses are:

- A form submission fails due to invalid user input. The server re-renders the form with validation errors.
- The server renders unexpected content, like a login screen or a maintenance page.
- The server-side app crashes with an HTTP 500 server error.
- The request is [aborted](/aborting-requests) by a second request [targeting](/targeting-fragments) the same fragment.

## Rendering failed responses differently

You may pass different render options for server responses with an error code, which we will call *failed* responses below.
Any HTTP status other than 2xx or [304](/skipping-rendering#rendering-nothing) is considered a failed response.

A common use case for this is [form submissions](/up.form), where a successful response
should display a follow-up screen, but a failed response should re-render the form with validation errors.
A good HTTP status code for an invalid form submission is
[422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) (Unprocessable Entity).

To use a different [render option](/up.render) for a failed server response,
prefix the option with `fail`:

```js
up.render({
  url: '/action',
  method: 'post',
  target: '.content',            // when submission succeeds update '.content'
  failTarget: 'form',            // when submission fails update the form
  scroll: 'auto',                // when submission succeeds use default scroll behavior
  failScroll: '.errors',         // when submission fails scroll to the error messages
  onRendered: () => { ... },     // when submission succeeds run this callback
  onFailRendered: () => { ... }, // when submission fails run this other callback
})
```

Options that are used before the request is made (like `{ url, method, confirm }`) do not
have a `fail`-prefixed variant.  Some options (like `{ history, fallback }`) are used for
both successful and failed responses, but may be overriden with a fail-prefixed variant
(e.g. `{ history: true, failHistory: false }`. Options related to layers, scrolling or focus are never shared.

Note that event handlers still begin with `on` for failed responses, so `{ onRendered }` becomes `{ onFailRendered }`.

When using Unpoly's HTML attributes with [links](/up.link) or [forms](/up.form)
you may infix an attribute with `fail`:

```text
<form method="post" action="/action"
  up-target=".content"      <!-- when submission succeeds update '.content' -->
  up-fail-target="form"     <!-- when submission fails update the form -->
  up-scroll="auto"          <!-- when submission succeeds use default scroll behavior -->
  up-fail-scroll=".errors"> <!-- when submission fails scroll to the error messages -->
  ...
</form>
```

Also see [validating forms](/validation).


### Ignoring HTTP error codes

With `{ fail: false }` or `[up-fail=false]` Unpoly will always consider the response
to be successful, even with a HTTP 4xx or 5xx status code.

### Customizing failure detection

By default any HTTP 2xx or [304](/skipping-rendering#rendering-nothing)) status code will be considered successful, and any other status code will be considered failed. This behavior can be customized. For instance, you can fail a response if it contains a given header or body text.

The following configuration will fail all responses with an `X-Unauthorized` header:

```js
let badStatus = up.network.config.fail
up.network.config.fail = (response) => badStatus(response) || response.header('X-Unauthorized')
```

You can also decide to fail a response in an `up:fragment:loaded` listener:

```js
up.on('up:fragment:loaded', function(event) {
  if (event.response.header('X-Unauthorized')) {
    event.renderOptions.fail = true
  }
})
```

### Local content cannot fail

When the updated fragment content is not requested from a `{ url }`, but rather passed as an
HTML string (`{ document, fragment, content }`), the update is always considered successful.


## Handling unexpected content

A server might sometimes respond with unexpected content, like a maintenance page or a
login form. In these cases a specific target selector may not match in the server response.

With `{ fallback: true }` or `[up-fallback=true]` Unpoly will try to match a [main target](/up-main)
before giving up. This will show the server content in the application's main content area,
which is often preferred to a link appearing dead. Fallback targets are enabled by default when [navigating](/navigation).

To configure a custom handling of unexpected content, use the `up:fragment:loaded` event.


## Handling fatal network errors

When a request encounters fatal error like a timeout or loss of network connectivity, Unpoly
will emit `up:request:offline` and not render.

Because there never was a server response, `up:fragment:loaded` will *not* be emitted in this case.


## Handling aborted requests

When a request was aborted, Unpoly will emit `up:request:aborted` and not render.

A promise for an aborted request will reject with an `up.AbortError`.

[By default](/up.render#options.abort) Unpoly will abort a request when a second request targets the same fragment.


## Detecting a failed response programmatically

Rendering functions like `up.render()`, `up.follow()` or `up.submit()` return a promise that rejects when the server
sends a failed response, or when there is another error.

See [render error handling example](/render-hooks#full-error-handling-example).


@page failed-responses
