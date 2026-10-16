Handling error responses
========================

When the server responds with an error code, like 422 for an invalid form or 500 for a crash,
Unpoly renders the response with a separate set of options.
This way a failed form submission re-renders the form with validation errors, instead of showing the next screen.
You can also decide which responses count as errors.


Rendering error responses differently {#fail-options}
-------------------------------------

Any HTTP status other than 2xx or [304](/conditional-requests#rendering-nothing) makes a response an *error response*.
For an error response you can pass different render options than for a successful one.

A common use case is a [form submission](/submitting-forms). A successful response
should show a follow-up screen, but an error response should re-render the form with validation errors.
A good HTTP status code for an invalid form submission is
[422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) (Unprocessable Content).

To use a different [render option](/up.render) for an error response, prefix the option with `fail`:

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

Event handlers still begin with `on`, so `{ onRendered }` becomes `{ onFailRendered }`.

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

Some options, like `{ history, fallback }`, are used for both successful and error responses,
but may be overridden with a fail-prefixed variant, e.g. `{ history: true, failHistory: false }`.

Options related to layers, scrolling or focus are never shared.
An error response uses `{ failLayer, failScroll, failFocus }`, or the [configured defaults](/up.fragment.config#config.navigateOptions)
when these are not given.


### Fail targets for links {#links}

Unlike a form, a link has no natural fragment to show an error in.
When a link receives an error response, Unpoly updates the [main fragment](/main) instead of the link's `[up-target]`.
This way a server error page shows up in the main fragment, where the user expects it.

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

By default only the status code decides whether a response is an error response.
You can also fail a response if it contains a given header or body text.

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


Detecting an error response programmatically {#detecting-failure}
--------------------------------------------

Rendering functions like `up.render()`, `up.follow()` or `up.submit()` return a promise that rejects when the server
sends an error response, or when there is another error.

See [Render error handling example](/render-lifecycle#error-handling-example).


See also
--------

When the server responds successfully, but with unexpected content like a login form, your target may be missing from the response.
See [[targeting-fragments#missing-targets]].

When a request gets no response at all, because the device is offline or the request timed out, nothing is rendered.
See [[network-issues]].

When a request is aborted, nothing is rendered either. See [[aborting-requests#reacting]].


@page error-responses
@signature
