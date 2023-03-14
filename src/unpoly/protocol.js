/*-
Server protocol
===============

Unpoly has an **optional** protocol your server may implement to exchange additional information
when Unpoly is [updating fragments](/up.link). The protocol mostly works by adding
additional HTTP headers (like `X-Up-Target`) to requests and responses.

> [IMPORTANT]
> While the protocol can help you optimize performance and handle some edge cases,
> implementing it is **entirely optional**. For instance, `unpoly.com` itself is a static site
> that uses Unpoly on the frontend and doesn't even have an active server component.

## Existing implementations

You should be able to implement the protocol in a very short time.

There are existing implementations for various web frameworks:

- [Ruby on Rails](/install/ruby)
- [Roda](https://github.com/adam12/roda-unpoly)
- [Rack](https://github.com/adam12/rack-unpoly) (Sinatra, Padrino, Hanami, Cuba, ...)
- [Phoenix](https://elixirforum.com/t/unpoly-a-framework-like-turbolinks/3614/15) (Elixir)
- [PHP](https://github.com/webstronauts/php-unpoly) (Symfony, Laravel, Stack)

@see csp

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
  This request header contains the [target selector](/targeting-fragments) for a successful fragment update.

  Server-side code is free to optimize its response by only rendering HTML
  that matches the selector. For example, you might prefer to not render an
  expensive sidebar if the sidebar is not targeted.

  Unpoly will usually update a different selector in case the request fails.
  This selector is sent as a second header, `X-Up-Fail-Target`.

  The user may choose to not send this header by configuring
  `up.network.config.requestMetaKeys`.

  ### Example

  The user updates a fragment `.menu`.
  Unpoly automatically includes the following request header:

  ```http
  X-Up-Target: .menu
  ```

  The server chooses to render only the HTML for the updating fragment.
  It responds with the following HTTP:

  ```http
  Vary: X-Up-Mode

  <div class="menu">...</div>
  ```

  @include vary-header-note

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


  ### Rendering nothing

  The server may send an `X-Up-Target: :none` response header with an empty body to skip the current render pass.

  Also see [skipping unnecessary rendering](/skipping-rendering).

  @header X-Up-Target
  @stable
  */

  /*-
  This request header contains the [target selector](/targeting-fragments) for a failed fragment update.

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
  return a non-2xx HTTP status code. We recommend to use
  [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422) (Unprocessable Entity).

  To do so in [Ruby on Rails](http://rubyonrails.org/), pass a [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option):

  ```ruby
  class UsersController < ApplicationController

    def create
      user_params = params[:user].permit(:email, :password)
      @user = User.new(user_params)
      if @user.save?
        sign_in @user
      else
        render 'form', status: :unprocessable_entity
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

  The user updates a fragment `main` within a [drawer overlay](/layer-terminology).
  Unpoly automatically includes the following request headers:

  ```http
  X-Up-Mode: drawer
  X-Up-Target: main
  ```

  The server chooses to render only the HTML required for the overlay.
  It responds with the following HTTP:

  ```http
  Vary: X-Up-Mode

  <main>...</main>
  ```

  @include vary-header-note

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

  /*-
  This response header contains a hash identifying the content in the response body.

  Typically, the ETag value is a hash of the underlying data that was rendered,
  or a hash of the data's last modification time.

  ETags can be used to prevent unnecessary re-rendering of unchanged content.
  See [conditional requests](/skipping-rendering#conditional-requests) for details and examples.

  ### Format

  A (weak) ETag typically looks like this:

  ```http
  ETag: W/"55e4d42a148795d9f25f89d4"
  ```

  For more information about an ETag's format, see
  [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) and [RFC 7232](https://www.rfc-editor.org/rfc/rfc7232#section-2.3).

  ### Alternatives

  Instead of sending this header, the server may also render fragments with `[up-etag]` attributes.

  @header ETag
  @stable
  */

  /*-
  This request header contains the ETag of a fragment that is being reloaded.

  The server can use the header value to prevent unnecessary re-rendering of unchanged content.
  See [conditional requests](/skipping-rendering#conditional-requests) for details and examples.

  The header is only set when Unpoly knows the ETag of the loading fragment.
  For this the fragment must have been rendered with an `ETag` response header or `[up-etag]` attribute.

  ### Format

  The `If-None-Match` header uses the same format as the `ETag` header:

  ```http
  If-None-Match: W/"55e4d42a148795d9f25f89d4"
  ```

  @header If-None-Match
  @stable
  */

  /*-
  This response header contains the time when the content in the response body was last modified.

  Last modification times can be used to prevent unnecessary re-rendering of unchanged content.
  See [conditional requests](/skipping-rendering#conditional-requests) for details and examples.

  ### Format

  The header value is a date/time in [RFC 1123](https://www.rfc-editor.org/rfc/rfc1123) format:

  ```http
  Last-Modified: Wed, 15 Nov 2000 13:11:22 GMT
  ```

  For a readable description of the time format, see [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified).

  ### Alternatives

  Instead of sending this header, the server may also render fragments with `[up-time]` attributes.

  @header Last-Modified
  @stable
  */

  /*-
  This request header contains the last modification time of a fragment that is being reloaded.

  The server can use the header value to prevent unnecessary re-rendering of unchanged content.
  See [conditional requests](/skipping-rendering#conditional-requests) for details and examples.

  The header is only set when Unpoly knows the last modification time of the loading fragment.
  For this the fragment must have been rendered with an `Last-Modified` response header or `[up-time]` attribute.

  ### Format

  The header value is a date/time in [RFC 1123](https://www.rfc-editor.org/rfc/rfc1123) format:

  ```http
  If-Modified-Since: Wed, 15 Nov 2000 13:11:22 GMT
  ```

  @header If-Modified-Since
  @stable
  */

  function parseModifyCacheValue(value) {
    if (value === 'false') {
      return false
    } else {
      return value
    }
  }

  function evictCacheFromXHR(xhr) {
    return extractHeader(xhr, 'evictCache', parseModifyCacheValue)
  }

  /*-
  The server may send this optional response header to control which previously [cached](/caching)
  responses should be [evicted](/caching#eviction) after this response.

  The value of this header is a [URL pattern](/url-patterns) matching responses that should be evicted.

  For example, to expire all responses to URLs starting with `/notes/`:

  ```http
  X-Up-Evict-Cache: /notes/*
  ```

  To evict all cache entries:

  ```http
  X-Up-Evict-Cache: *
  ```

  @header X-Up-Evict-Cache
  @stable
  */


  function expireCacheFromXHR(xhr) {
    return extractHeader(xhr, 'expireCache') || up.migrate.clearCacheFromXHR?.(xhr)
  }

  /*-
  The server may send this optional response header to control which previously [cached](/caching)
  responses should be [expired](/caching#expiration) after this response.

  The value of this header is a [URL pattern](/url-patterns) matching responses that should be expired.

  For example, to expire all responses to URLs starting with `/notes/`:

  ```http
  X-Up-Expire-Cache: /notes/*
  ```

  To expire all cache entries:

  ```http
  X-Up-Expire-Cache: *
  ```

  ### Overriding the client-side default

  If the server does not send an `X-Up-Expire-Cache` header, Unpoly will [expire the entire cache](/up.network.config#config.expireCache) after a non-GET request.

  You may force Unpoly to keep the cache fresh after a non-GET request:

  ```http
  X-Up-Expire-Cache: false
  ```

  @header X-Up-Expire-Cache
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

  The current layer has a context `{ lives: 3 }`.
  When the user updates a fragment, Unpoly automatically includes the following request headers:

  ```http
  X-Up-Context: { "lives": 3 }
  X-Up-Target: main
  ```

  The server may choose to render HTML based on that context, e.g. by including
  a live counter in the response. It responds with the following HTTP:

  ```http
  Vary: X-Up-Context

  <main>
    3 lives left
    ...
  </main>
  ```

  @include vary-header-note

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

  @include unicode-header-values

  Upon seeing the response header, Unpoly will merge the server-provided context object into
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

  The title must be encoded as a JSON string.

  Without this header Unpoly will extract the `<title>` from the server response.

  This header is useful when you [optimize your response](/X-Up-Target) to not render
  the application layout unless targeted. Since your optimized response
  no longer includes a `<title>`, you can instead use this HTTP header to pass the document title.

  @include unicode-header-values

  ### Example

  ```http
  X-Up-Title: "Playlist browser"
  ```

  Note that the quotes must be included in the JSON-encoded header value.

  @header X-Up-Title
  @stable
  */

  /*-
  This request header contains the names of the [form fields being validated](/up-validate).

  When seeing this header, the server is [expected](/up-validate#backend-protocol)
  to validate (but not save) the form submission and render a new form state with validation errors.
  See the documentation for `[up-validate]` for more information
  on how server-side validation works in Unpoly.

  ### Example

  Let's look at a registration form that uses `[up-validate]` to validate form groups
  as the user completes fields:

  ```html
  <form action="/users">

    <fieldset>
      <label for="email" up-validate>E-mail</label> <!-- mark-phrase "up-validate" -->
      <input type="text" id="email" name="email">
    </fieldset>

    <fieldset>
      <label for="password" up-validate>Password</label> <!-- mark-phrase "up-validate" -->
      <input type="password" id="password" name="password">
    </fieldset>

    <button type="submit">Register</button>

  </form>
  ```

  When the `email` input is changed, Unpoly will submit the form with an
  additional `X-Up-Validate` header:

  ```http
  X-Up-Validate: email
  X-Up-Target: fieldset:has(#email)
  ```

  ### Batched validations

  If multiple validations are [batched](/up.validate#batching) into a single request,
  `X-Up-Validate` contains a space-separated list of all validating field names:

  ```http
  X-Up-Validate: email password
  X-Up-Target: fieldset:has(#password)
  ```

  ### When no origin field is known

  When `up.validate()` is called with a non-field element, Unpoly might not know
  which element triggered the validation. In that case the header value will be `:unknown`:

  ```http
  X-Up-Validate: :unknown
  X-Up-Target: .preview
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

  @include unicode-header-values

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

  @include unicode-header-values

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

  If you know that an overlay will be closed and don't want to render HTML,
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

  @include unicode-header-values

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

  If you know that an overlay will be closed and don't want to render HTML,
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
    return up.migrate.titleFromXHR?.(xhr) ?? extractHeader(xhr, 'title', JSON.parse)
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
    <meta name="csrf-param" content="authenticity_token">
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
    The name of request parameter containing the original request method when Unpoly needs to
    [wrap](/up.network.config#config.wrapMethod) the method.

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
    nonceableAttributes: [
      'up-watch',
      'up-on-accepted',
      'up-on-dismissed',
      'up-on-loaded',
      'up-on-rendered',
      'up-on-finished',
      'up-on-error',
      'up-on-offlne',
    ],
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
    expireCacheFromXHR,
    evictCacheFromXHR,
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
