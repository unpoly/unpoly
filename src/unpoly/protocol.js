/*-
Server protocol
===============

You rarely need to change server-side code to use Unpoly. You don't need
to provide a JSON API, or add extra routes for AJAX requests. The server simply renders
a series of full HTML pages, like it would without Unpoly.

There is an **optional** protocol your server may use to exchange additional information
when Unpoly is [updating fragments](/up.link). The protocol mostly works by adding
additional HTTP headers (like `X-Up-Target`) to requests and responses.

While the protocol can help you optimize performance and handle some edge cases,
implementing it is **entirely optional**. For instance, `unpoly.com` itself is a static site
that uses Unpoly on the frontend and doesn't even have an active server component.

### Existing implementations

You should be able to implement the protocol in a very short time.

There are existing implementations for various web frameworks:

- [Ruby on Rails](/install/ruby)
- [Roda](https://github.com/adam12/roda-unpoly)
- [Rack](https://github.com/adam12/rack-unpoly) (Sinatra, Padrino, Hanami, Cuba, ...)
- [Phoenix](https://elixirforum.com/t/unpoly-a-framework-like-turbolinks/3614/15) (Elixir)
- [PHP](https://github.com/webstronauts/php-unpoly) (Symfony, Laravel, Stack)

@module up.protocol
*/
up.protocol = (function() {

  const u = up.util
  const e = up.element

  const headerize = function(camel) {
    const header = camel.replace(/(^.|[A-Z])/g, char => '-' + char.toUpperCase())
    return 'X-Up' + header
  }

  const extractHeader = function(xhr, shortHeader, parseFn = u.identity) {
    let value = xhr.getResponseHeader(headerize(shortHeader))
    if (value) {
      return parseFn(value)
    }
  }

  /*-
  This request header contains the current Unpoly version to mark this request as a fragment update.

  Server-side code may check for the presence of an `X-Up-Version` header to
  distinguish [fragment updates](/up.link) from full page loads.

  The `X-Up-Version` header is guaranteed to be set for all [requests made through Unpoly](/up.request).

  ### Example

  ```http
  X-Up-Version: 1.0.0
  ```

  @header X-Up-Version
  @stable
  */

  /*-
  This request header contains the CSS selector targeted for a successful fragment update.

  Server-side code is free to optimize its response by only rendering HTML
  that matches the selector. For example, you might prefer to not render an
  expensive sidebar if the sidebar is not targeted.

  Unpoly will usually update a different selector in case the request fails.
  This selector is sent as a second header, `X-Up-Fail-Target`.

  The user may choose to not send this header by configuring
  `up.network.config.requestMetaKeys`.

  ### Example

  ```http
  X-Up-Target: .menu
  X-Up-Fail-Target: body
  ```

  ### Changing the render target from the server

  The server may change the render target context by including a CSS selector as an `X-Up-Target` header
  in its response.

  ```http
  Content-Type: text/html
  X-Up-Target: .selector-from-server

  <div class="selector-from-server">
    ...
  </div>
  ```

  The frontend will use the server-provided target for both successful (HTTP status `200 OK`)
  and failed (status `4xx` or `5xx`) responses.

  The server may also set a target of `:none` to have the frontend render nothing.
  In this case no response body is required:

  ```http
  Content-Type: text/html
  X-Up-Target: :none
  ```

  @header X-Up-Target
  @stable
  */

  /*-
  This request header contains the CSS selector targeted for a failed fragment update.

  A fragment update is considered *failed* if the server responds with a status code other than 2xx,
  but still renders HTML.

  Server-side code is free to optimize its response to a failed request by only rendering HTML
  that matches the provided selector. For example, you might prefer to not render an
  expensive sidebar if the sidebar is not targeted.

  The user may choose to not send this header by configuring
  `up.network.config.requestMetaKeys`.

  ### Example

  ```http
  X-Up-Target: .menu
  X-Up-Fail-Target: body
  ```

  ### Signaling failed form submissions

  When [submitting a form via AJAX](/form-up-submit)
  Unpoly needs to know whether the form submission has failed (to update the form with
  validation errors) or succeeded (to update the `[up-target]` selector).

  For Unpoly to be able to detect a failed form submission, the response must be
  return a non-2xx HTTP status code. We recommend to use either
  400 (bad request) or 422 (unprocessable entity).

  To do so in [Ruby on Rails](http://rubyonrails.org/), pass a [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option):

  ```ruby
  class UsersController < ApplicationController

    def create
      user_params = params[:user].permit(:email, :password)
      @user = User.new(user_params)
      if @user.save?
        sign_in @user
      else
        render 'form', status: :bad_request
      end
    end

  end
  ```

  @header X-Up-Fail-Target
  @stable
  */

  /*-
  This request header contains the targeted layer's [mode](/up.layer.mode).

  Server-side code is free to render different HTML for different modes.
  For example, you might prefer to not render a site navigation for overlays.

  The user may choose to not send this header by configuring
  `up.network.config.requestMetaKeys`.

  ### Example

  ```http
  X-Up-Mode: drawer
  ```

  @header X-Up-Mode
  @stable
  */

  /*-
  This request header contains the [mode](/up.layer.mode) of the layer
  targeted for a failed fragment update.

  A fragment update is considered *failed* if the server responds with a
  status code other than 2xx, but still renders HTML.

  Server-side code is free to render different HTML for different modes.
  For example, you might prefer to not render a site navigation for overlays.

  The user may choose to not send this header by configuring
  `up.network.config.requestMetaKeys`.

  ### Example

  ```http
  X-Up-Mode: drawer
  X-Up-Fail-Mode: root
  ```

  @header X-Up-Fail-Mode
  @stable
  */

  function parseClearCacheValue(value) {
    switch (value) {
      case 'true':
        return true
      case 'false':
        return false
      default:
        return value
    }
  }

  function clearCacheFromXHR(xhr) {
    return extractHeader(xhr, 'clearCache', parseClearCacheValue)
  }

  /*-
  The server may send this optional response header to control which previously cached responses should be [uncached](/up.cache.clear) after this response.

  The value of this header is a [URL pattern](/url-patterns) matching responses that should be uncached.

  For example, to uncache all responses to URLs starting with `/notes/`:

  ```http
  X-Up-Clear-Cache: /notes/*
  ```

  ### Overriding the client-side default

  If the server does not send an `X-Up-Clear-Cache` header, Unpoly will [clear the entire cache](/up.network.config#config.clearCache) after a non-GET request.

  You may force Unpoly to *keep* the cache after a non-GET request:

  ```http
  X-Up-Clear-Cache: false
  ```

  You may also force Unpoly to *clear* the cache after a GET request:

  ```http
  X-Up-Clear-Cache: *
  ```

  @header X-Up-Clear-Cache
  @stable
  */

  /*-
  This request header contains a timestamp of an existing fragment that is being [reloaded](/up.reload).

  The timestamp must be explicitly set by the user as an `[up-time]` attribute on the fragment.
  It should indicate the time when the fragment's underlying data was last changed.

  See `[up-time]` for a detailed example.

  ### Format

  The time is encoded is the number of seconds elapsed since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time).

  For instance, a modification date of December 23th, 1:40:18 PM UTC would produce the following header:

  ```http
  X-Up-Target: .unread-count
  X-Up-Reload-From-Time: 1608730818
  ```

  If no timestamp is known, Unpoly will send a value of zero (`X-Up-Reload-From-Time: 0`).

  @header X-Up-Reload-From-Time
  @stable
  */

  function contextFromXHR(xhr) {
    return extractHeader(xhr, 'context', JSON.parse)
  }

  /*-
  This request header contains the targeted layer's [context](/context), serialized as JSON.

  The user may choose to not send this header by configuring
  `up.network.config.requestMetaKeys`.

  ### Example

  ```http
  X-Up-Context: { "lives": 3 }
  ```

  ### Updating context from the server

  The server may update the layer context by sending a `X-Up-Context` response header with
  changed key/value pairs:

  ```http
  Content-Type: text/html
  X-Up-Context: { "lives": 2 }

  <html>
    ...
  </html>
  ```

  Upon seeing the response header, Unpoly will assign the server-provided context object to
  the layer's context object, adding or replacing keys as needed.

  Client-side context keys not mentioned in the response will remain unchanged.
  There is no explicit protocol to *remove* keys from the context, but the server may send a key
  with a `null` value to effectively remove a key.

  The frontend will use the server-provided context upates for both successful (HTTP status `200 OK`)
  and failed (status `4xx` or `5xx`) responses.  If no `X-Up-Context` response header is set,
  the updating layer's context will not be changed.

  It is recommended that the server only places changed key/value pairs into the `X-Up-Context`
  response header, and not echo the entire context object. Otherwise any client-side changes made while
  the request was in flight will get overridden by the server-provided context.

  @header X-Up-Context
  @experimental
  */

  /*-
  This request header contains the [context](/context) of the layer
  targeted for a failed fragment update, serialized as JSON.

  A fragment update is considered *failed* if the server responds with a
  status code other than 2xx, but still renders HTML.

  Server-side code is free to render different HTML for different contexts.
  For example, you might prefer to not render a site navigation for overlays.

  The user may choose to not send this header by configuring
  `up.network.config.requestMetaKeys`.

  ### Example

  ```http
  X-Up-Fail-Context: { "context": "Choose a company contact" }
  ```

  @header X-Up-Fail-Context
  @experimental
  */

  /*-
  @function up.protocol.methodFromXHR
  @internal
  */
  function methodFromXHR(xhr) {
    return extractHeader(xhr, 'method', u.normalizeMethod)
  }

  /*-
  The server may set this optional response header to change the browser location after a fragment update.

  Without this header Unpoly will set the browser location to the response URL, which is usually sufficient.

  When setting `X-Up-Location` it is recommended to also set `X-Up-Method`. If no `X-Up-Method` header is given
  and the response's URL changed from the request's URL, Unpoly will assume a redirect and set the
  method to `GET`.

  ### Internet Explorer 11

  There is an edge case on Internet Explorer 11, where Unpoly cannot detect the final URL after a redirect.
  You can fix this edge case by delivering `X-Up-Location` and `X-Up-Method` headers with the *last* response
  in a series of redirects.

  The **simplest implementation** is to set these headers for every request.

  ### Example

  ```http
  X-Up-Location: /current-url
  X-Up-Method: GET
  ```

  @header X-Up-Location
  @stable
  */

  /*-
  The server may set this optional response header to change the HTTP method after a fragment update.

  Without this header Unpoly will assume a `GET` method if the response's URL changed from the request's URL,

  ### Example

  ```http
  X-Up-Location: /current-url
  X-Up-Method: GET
  ```

  @header X-Up-Method
  @stable
  */

  /*-
  The server may set this optional response header to change the document title after a fragment update.

  Without this header Unpoly will extract the `<title>` from the server response.

  This header is useful when you [optimize your response](/X-Up-Target) to not render
  the application layout unless targeted. Since your optimized response
  no longer includes a `<title>`, you can instead use this HTTP header to pass the document title.

  ### Example

  ```http
  X-Up-Title: Playlist browser
  ```

  @header X-Up-Title
  @stable
  */

  /*-
  This request header contains the `[name]` of a [form field being validated](/input-up-validate).

  When seeing this header, the server is expected to validate (but not save)
  the form submission and render a new copy of the form with validation errors.
  See the documentation for [`input[up-validate]`](/input-up-validate) for more information
  on how server-side validation works in Unpoly.

  The server is free to respond with any HTTP status code, regardless of the validation result.
  Unpoly will always consider a validation request to be successful, even if the
  server responds with a non-200 status code. This is in contrast to [regular form submissions](/form-up-submit),
  [where a non-200 status code will often update a different element](/server-errors).

  ### Example

  Assume we have an auto-validating form field:

  ```html
  <fieldset>
    <input name="email" up-validate>
  </fieldset>
  ```

  When the input is changed, Unpoly will submit the form with an additional header:

  ```html
  X-Up-Validate: email
  ```

  @header X-Up-Validate
  @stable
  */

  function eventPlansFromXHR(xhr) {
    return extractHeader(xhr, 'events', JSON.parse)
  }

  /*-
  The server may set this response header to [emit events](/up.emit) with the
  requested [fragment update](/a-up-follow).

  The header value is a [JSON](https://en.wikipedia.org/wiki/JSON) array.
  Each element in the array is a JSON object representing an event to be emitted
  on the `document`.

  The object property `{ "type" }` defines the event's [type](https://developer.mozilla.org/en-US/docs/Web/API/Event/type). Other properties become properties of the emitted
  event object.

  ### Example

  ```http
  Content-Type: text/html
  X-Up-Events: [{ "type": "user:created", "id": 5012 }, { "type": "signup:completed" }]
  ...

  <html>
    ...
  </html>
  ```

  ### Emitting an event on a layer

  Instead of emitting an event on the `document`, the server may also choose to
  [emit the event on the layer being updated](/up.layer.emit). To do so, add a property
  `{ "layer": "current" }` to the JSON object of an event:

  ```http
  Content-Type: text/html
  X-Up-Events: [{ "type": "user:created", "name:" "foobar", "layer": "current" }]
  ...

  <html>
    ...
  </html>
  ```

  @header X-Up-Events
  @stable
  */

  function acceptLayerFromXHR(xhr) {
    // Even if acceptance has no value, the server will send
    // X-Up-Accept-Layer: null
    return extractHeader(xhr, 'acceptLayer', JSON.parse)
  }

  /*-
  The server may set this response header to [accept](/up.layer.accept) the targeted overlay
  in response to a fragment update.

  Upon seeing the header, Unpoly will cancel the fragment update and accept the layer instead.
  If the root layer is targeted, the header is ignored and the fragment is updated with
  the response's HTML content.

  The header value is the acceptance value serialized as a JSON object.
  To accept an overlay without value, set the header value to the string `null`.

  ### Example

  The response below will accept the targeted overlay with the value `{user_id: 1012 }`:

  ```http
  Content-Type: text/html
  X-Up-Accept-Layer: {"user_id": 1012}

  <html>
    ...
  </html>
  ```

  ### Rendering content

  The response may contain `text/html` content. If the root layer is targeted,
  the `X-Up-Accept-Layer` header is ignored and the fragment is updated with
  the response's HTML content.

  If you know that an overlay will be closed don't want to render HTML,
  have the server change the render target to `:none`:

  ```http
  Content-Type: text/html
  X-Up-Accept-Layer: {"user_id": 1012}
  X-Up-Target: :none
  ```

  @header X-Up-Accept-Layer
  @stable
  */

  function dismissLayerFromXHR(xhr) {
    // Even if dismissal has no value, the server will send
    // X-Up-Dismiss-Layer: null
    return extractHeader(xhr, 'dismissLayer', JSON.parse)
  }

  /*-
  The server may set this response header to [dismiss](/up.layer.dismiss) the targeted overlay
  in response to a fragment update.

  Upon seeing the header, Unpoly will cancel the fragment update and dismiss the layer instead.
  If the root layer is targeted, the header is ignored and the fragment is updated with
  the response's HTML content.

  The header value is the dismissal value serialized as a JSON object.
  To accept an overlay without value, set the header value to the string `null`.

  ### Example

  The response below will dismiss the targeted overlay without a dismissal value:

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html
  X-Up-Dismiss-Layer: null

  <html>
    ...
  </html>
  ```

  ### Rendering content

  The response may contain `text/html` content. If the root layer is targeted,
  the `X-Up-Dismiss-Layer` header is ignored and the fragment is updated with
  the response's HTML content.

  If you know that an overlay will be closed don't want to render HTML,
  have the server change the render target to `:none`:

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html
  X-Up-Dismiss-Layer: {"user_id": 1012}
  X-Up-Target: :none
  ```

  @header X-Up-Dismiss-Layer
  @stable
  */

  /*-
  Server-side companion libraries like unpoly-rails set this cookie so we
  have a way to detect the request method of the initial page load.
  There is no JavaScript API for this.

  @function up.protocol.initialRequestMethod
  @internal
  */
  const initialRequestMethod = u.memoize(function() {
    return u.normalizeMethod(up.browser.popCookie('_up_method'))
  })

  /*-
  The server may set this optional cookie to echo the HTTP method of the initial request.

  If the initial page was loaded with a non-`GET` HTTP method, Unpoly prefers to make a full
  page load when you try to update a fragment. Once the next page was loaded with a `GET` method,
  Unpoly will again update fragments.

  This fixes two edge cases you might or might not care about:

  1. Unpoly replaces the initial page state so it can later restore it when the user
     goes back to that initial URL. However, if the initial request was a POST,
     Unpoly will wrongly assume that it can restore the state by reloading with GET.
  2. Some browsers have a bug where the initial request method is used for all
     subsequently pushed states. That means if the user reloads the page on a later
     GET state, the browser will wrongly attempt a POST request.
     This issue affects Safari 9-12 (last tested in 2019-03).
     Modern Firefoxes, Chromes and IE10+ don't have this behavior.

  In order to allow Unpoly to detect the HTTP method of the initial page load,
  the server must set a cookie:

  ```http
  Set-Cookie: _up_method=POST
  ```

  When Unpoly boots it will look for this cookie and configure itself accordingly.
  The cookie is then deleted in order to not affect following requests.

  The **simplest implementation** is to set this cookie for every request that is neither
  `GET` nor an [Unpoly request](/X-Up-Version). For all other requests
  an existing `_up_method` cookie should be deleted.

  @cookie _up_method
  @stable
  */

  /*-
  @function up.protocol.locationFromXHR
  @internal
  */
  function locationFromXHR(xhr) {
    // We prefer the X-Up-Location header to xhr.responseURL.
    // If the server redirected to a new location, Unpoly-related headers
    // will be encoded in the request's query params like this:
    //
    //     /redirect-target?_up[target]=.foo
    //
    // To prevent these these `_up` params from showing up in the browser URL,
    // the X-Up-Location header will omit these params while `xhr.responseURL`
    // will still contain them.
    return extractHeader(xhr, 'location') || xhr.responseURL
  }

  /*-
  @function up.protocol.titleFromXHR
  @internal
  */
  function titleFromXHR(xhr) {
    return extractHeader(xhr, 'title')
  }

  /*-
  @function up.protocol.targetFromXHR
  @internal
  */
  function targetFromXHR(xhr) {
    return extractHeader(xhr, 'target')
  }

  /*-
  Configures strings used in the optional [server protocol](/up.protocol).

  @property up.protocol.config

  @param {string} [config.csrfHeader='X-CSRF-Token']
    The name of the HTTP header that will include the
    [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
    for AJAX requests.

  @param {string|Function(): string} [config.csrfParam]
    The `name` of the hidden `<input>` used for sending a
    [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern) when
    submitting a default, non-AJAX form. For AJAX request the token is sent as an
    [HTTP header](/up.protocol.config#config.csrfHeader instead.

    The parameter name can be configured as a string or as function that returns the parameter name.
    If no name is set, no token will be sent.

    Defaults to the `content` attribute of a `<meta>` tag named `csrf-param`:

    ```html
    <meta name="csrf-param" content="authenticity_token" />
    ```

  @param {string|Function(): string} [config.csrfToken]
    The [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
    to send for unsafe requests. The token will be sent as either a HTTP header (for AJAX requests)
    or hidden form `<input>` (for default, non-AJAX form submissions).

    The token can either be configured as a string or as function that returns the token.
    If no token is set, no token will be sent.

    Defaults to the `content` attribute of a `<meta>` tag named `csrf-token`:

    ```
    <meta name='csrf-token' content='secret12345'>
    ```

  @param {string|Function(): string} [config.cspNonce]
    A [CSP script nonce](https://content-security-policy.com/nonce/)
    for the initial page that [booted](/up.boot) Unpoly.

    The nonce let Unpoly run JavaScript in HTML attributes like
    [`[up-on-loaded]`](/a-up-follow#up-on-loaded) or [`[up-on-accepted]`](/a-up-layer-new#up-on-accepted).
    See [Working with a strict Content Security Policy](/csp).

    The nonce can either be configured as a string or as function that returns the nonce.

    Defaults to the `content` attribute of a `<meta>` tag named `csp-nonce`:

    ```
    <meta name='csrf-token' content='secret98765'>
    ```

  @param {string} [config.methodParam='_method']
    The name of request parameter containing the original request method when Unpoly needs to wrap
    the method.

    Methods must be wrapped when making a [full page request](/up.network.loadPage) with a methods other
    than GET or POST. In this case Unpoly will make a POST request with the original request method
    in a form parameter named `_method`:

    ```http
    POST /test HTTP/1.1
    Host: example.com
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 11

    _method=PUT
    ```
  @stable
  */
  const config = new up.Config(() => ({
    methodParam: '_method',
    csrfParam() { return e.metaContent('csrf-param'); },
    csrfToken() { return e.metaContent('csrf-token'); },
    cspNonce() { return e.metaContent('csp-nonce'); },
    csrfHeader: 'X-CSRF-Token', // Used by Rails. Other frameworks use different headers.
    nonceableAttributes: ['up-observe', 'up-on-accepted', 'up-on-dismissed', 'up-on-loaded', 'up-on-finished', 'up-observe'],
  }))

  function csrfHeader() {
    return u.evalOption(config.csrfHeader)
  }

  function csrfParam() {
    return u.evalOption(config.csrfParam)
  }

  function csrfToken() {
    return u.evalOption(config.csrfToken)
  }

  function cspNonce() {
    return u.evalOption(config.cspNonce)
  }

  function cspNoncesFromHeader(cspHeader) {
    let nonces = []
    if (cspHeader) {
      let parts = cspHeader.split(/\s*;\s*/)
      for (let part of parts) {
        if (part.indexOf('script-src') === 0) {
          let noncePattern = /'nonce-([^']+)'/g
          let match
          while (match = noncePattern.exec(part)) {
            nonces.push(match[1])
          }
        }
      }
    }
    return nonces
  }

  function wrapMethod(method, params) {
    params.add(config.methodParam, method)
    return 'POST'
  }

  function reset() {
    config.reset()
  }

  up.on('up:framework:reset', reset)

  return {
    config,
    reset,
    locationFromXHR,
    titleFromXHR,
    targetFromXHR,
    methodFromXHR,
    acceptLayerFromXHR,
    contextFromXHR,
    dismissLayerFromXHR,
    eventPlansFromXHR,
    clearCacheFromXHR,
    csrfHeader,
    csrfParam,
    csrfToken,
    cspNonce,
    initialRequestMethod,
    headerize,
    wrapMethod,
    cspNoncesFromHeader,
  }
})()
