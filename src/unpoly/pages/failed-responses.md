Handling failed responses
=========================

When the server responds with an error status, Unpoly renders the response with a separate
set of options: a failed form submission re-renders the form instead of showing the next screen.
You can also decide what counts as a failure, show unexpected screens like a login page,
and react to requests that never got a response.

Some examples of failed responses are:

- A form submission fails due to invalid user input. The server re-renders the form with validation errors.
- The server renders unexpected content, like a login screen or a maintenance page.
- The server-side app crashes with an HTTP 500 server error.
- The request is [aborted](/aborting-requests) by a second request [targeting](/targeting-fragments) the same fragment.


Rendering failed responses differently {#fail-options}
--------------------------------------

Any HTTP status other than 2xx or [304](/conditional-requests#rendering-nothing) marks a response as *failed*.
For a failed response you can pass different render options than for a successful one.

A common use case is a [form submission](/submitting-forms). A successful response
should show a follow-up screen, but a failed response should re-render the form with validation errors.
A good HTTP status code for an invalid form submission is
[422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) (Unprocessable Content).

To use a different [render option](/up.render) for a failed response, prefix the option with `fail`:

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

Event handlers still begin with `on` for failed responses, so `{ onRendered }` becomes `{ onFailRendered }`.

When using Unpoly's HTML attributes with [links](/up-follow) or [forms](/up-submit),
infix the attribute with `fail`:

```text
<form method="post" action="/action"
  up-submit                 <!-- have Unpoly handle the form -->
  up-target=".content"      <!-- when submission succeeds update '.content' -->
  up-fail-target="form"     <!-- when submission fails update the form -->
  up-scroll="auto"          <!-- when submission succeeds use default scroll behavior -->
  up-fail-scroll=".errors"> <!-- when submission fails scroll to the error messages -->
  ...
</form>
```

> [tip]
> When Unpoly handles a form, the default `[up-fail-target]` is the form itself.
> This makes sure that any validation errors appear within the `<form>` element,
> so you rarely need to set the attribute. See [validating forms](/validation) for examples.


### Which options have a fail variant {#fail-variants}

Options that are used before the request is made, like `{ url, method, confirm }`, have no `fail`-prefixed variant.

Some options, like `{ history, fallback }`, are used for both successful and failed responses,
but may be overridden with a fail-prefixed variant, e.g. `{ history: true, failHistory: false }`.

Options related to layers, scrolling or focus are never shared.
A failed response uses `{ failLayer, failScroll, failFocus }`, or the [configured defaults](/up.fragment.config#config.navigateOptions)
when these are not given.


### Fail targets for links {#links}

Unlike a form, a link has no natural fragment to show an error in.
When a link's response fails, Unpoly updates the [main target](/main) instead of the link's `[up-target]`.
This way a server error page shows up in the main content area, where the user expects it.

To re-render a different fragment, set an `[up-fail-target]` attribute.

A plain `up.render()` call has no default fail target. When the server responds with an error
and you passed neither `{ failTarget }` nor `{ fallback }`, the render pass rejects with an `up.CannotMatch` error.


Ignoring HTTP error codes {#ignoring-error-codes}
-------------------------

With `{ fail: false }` or `[up-fail=false]` Unpoly will always consider the response
to be successful, even with an HTTP 4xx or 5xx status code:

```html
<a href="/missing-page" up-target=".content" up-fail="false">Show page</a> <!-- mark: up-fail="false" -->
```

The error page is now rendered into `.content`, as if the server had responded with `200 OK`.


Customizing failure detection {#customizing-failure-detection}
-----------------------------

By default any HTTP 2xx or [304](/conditional-requests#rendering-nothing) status code is considered successful,
and any other status code is considered failed. You can customize this behavior.
For instance, you can fail a response if it contains a given header or body text.

The following configuration fails all responses with an `X-Unauthorized` header:

```js
let badStatus = up.network.config.fail
up.network.config.fail = (response) => badStatus(response) || response.header('X-Unauthorized') // mark: response.header('X-Unauthorized')
```

You can also decide to fail a response in an `up:fragment:loaded` listener:

```js
up.on('up:fragment:loaded', function(event) {
  if (event.response.header('X-Unauthorized')) {
    event.renderOptions.fail = true // mark-line
  }
})
```


Local content cannot fail {#local-content}
-------------------------

When the new fragment content is passed as an HTML string (`{ document, fragment, content }`)
instead of being requested from a `{ url }`, the update is always considered successful.


Handling unexpected content {#unexpected-content}
---------------------------

A server might sometimes respond with unexpected content, like a maintenance page or a
login form. In these cases a specific target selector may not match in the server response.

With `{ fallback: true }` or `[up-fallback=true]` Unpoly tries to match a [main target](/main)
before giving up. This shows the server content in the application's main content area,
which is often preferred to a link appearing dead. Fallback targets are enabled by default when [navigating](/navigation-defaults).

To handle unexpected content in your own way, use the `up:fragment:loaded` event.
It can inspect the response, change the render options, or make a full page load instead.
See [[render-lifecycle]] for examples.


Handling fatal network errors {#handling-fatal-network-errors}
-----------------------------

When a request encounters a fatal error (like a timeout or loss of network connectivity), Unpoly
emits `up:request:offline` and does not render.

Because there never was a server response, `up:fragment:loaded` is *not* emitted in this case.

See [[network-issues]].


Handling aborted requests {#handling-aborted-requests}
-------------------------

When a request was [aborted](/aborting-requests), Unpoly emits `up:request:aborted` and does not render.

A promise for an aborted request rejects with an `up.Aborted` error.
Its `{ name }` is `'AbortError'`, like the `DOMException` that `fetch()` and other native APIs reject with when aborted.
To detect both kinds of aborts, check the error's name:

```js
try {
  await up.render({ url: '/path', target: '.content' })
} catch (error) {
  if (error.name === 'AbortError') { // mark: error.name === 'AbortError'
    console.log('Rendering was aborted: ' + error.message)
  }
}
```

[By default](/up.render#options.abort) Unpoly aborts a request when a second request targets the same fragment.


Detecting a failed response programmatically {#detecting-failure}
--------------------------------------------

Rendering functions like `up.render()`, `up.follow()` or `up.submit()` return a promise that rejects when the server
sends a failed response, or when there is another error.

See [Render error handling example](/render-lifecycle#error-handling-example).


@page failed-responses
@signature
