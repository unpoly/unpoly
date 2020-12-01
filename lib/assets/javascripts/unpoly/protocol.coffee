###**
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

## Existing implementations

You should be able to implement the protocol in a very short time.

There are existing implementations for various web frameworks:

- [Ruby on Rails](/install/rails)
- [Roda](https://github.com/adam12/roda-unpoly)
- [Rack](https://github.com/adam12/rack-unpoly) (Sinatra, Padrino, Hanami, Cuba, ...)
- [Phoenix](https://elixirforum.com/t/unpoly-a-framework-like-turbolinks/3614/15) (Elixir)
- [PHP](https://github.com/adam12/rack-unpoly) (Symfony, Laravel, Stack)

@module up.protocol
###
up.protocol = do ->

  u = up.util
  e = up.element

  headerize = (camel) ->
    header = camel.replace /(^.|[A-Z])/g, (char) -> '-' + char.toUpperCase()
    return 'X-Up' + header

  extractHeader = (xhr, shortHeader, parseFn = u.identity) ->
    if value = xhr.getResponseHeader(headerize(shortHeader))
      return parseFn(value)

  ###**
  This request header contains the current Unpoly version to mark this request as a fragment update.

  Server-side code may check for the presence of an `X-Up-Version` header to
  distinguish [fragment updates](/up.link) from full page loads.

  The `X-Up-Version` header is guaranteed to be set for all [requests made through Unpoly](/up.request).

  \#\#\# Example

  ```http
  X-Up-Version: 1.0.0
  ```

  @header X-Up-Version
  @stable
  ###

  ###**
  This request header contains the CSS selector targeted for a successful fragment update.

  Server-side code is free to optimize its response by only rendering HTML
  that matches the selector. For example, you might prefer to not render an
  expensive sidebar if the sidebar is not targeted.

  Unpoly will usually update a different selector in case the request fails.
  This selector is sent as a second header, `X-Up-Fail-Target`.

  The user may choose to not send this header by configuring
  `up.network.config.metaKeys`.

  \#\#\# Example

  ```http
  X-Up-Target: .menu
  X-Up-Fail-Target: body
  ```

  \#\#\# Changing the render target from the server

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
  ###

  ###**
  This request header contains the CSS selector targeted for a failed fragment update.

  A fragment update is considered *failed* if the server responds with a status code other than 2xx,
  but still renders HTML.

  Server-side code is free to optimize its response to a failed request by only rendering HTML
  that matches the provided selector. For example, you might prefer to not render an
  expensive sidebar if the sidebar is not targeted.

  The user may choose to not send this header by configuring
  `up.network.config.metaKeys`.

  \#\#\# Example

  ```http
  X-Up-Target: .menu
  X-Up-Fail-Target: body
  ```

  \#\#\# Signaling failed form submissions

  When [submitting a form via AJAX](/form-up-target)
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
  ###

  ###**
  This request header contains the targeted layer's [mode](/up.layer.mode).

  Server-side code is free to render different HTML for different modes.
  For example, you might prefer to not render a site navigation for overlays.

  The user may choose to not send this header by configuring
  `up.network.config.metaKeys`.

  \#\#\# Example

  ```http
  X-Up-Mode: drawer
  ```

  @header X-Up-Mode
  @stable
  ###

  ###**
  This request header contains the [mode](/up.layer.mode) of the layer
  targeted for a failed fragment update.

  A fragment update is considered *failed* if the server responds with a
  status code other than 2xx, but still renders HTML.

  Server-side code is free to render different HTML for different modes.
  For example, you might prefer to not render a site navigation for overlays.

  The user may choose to not send this header by configuring
  `up.network.config.metaKeys`.

  \#\#\# Example

  ```http
  X-Up-Mode: drawer
  X-Up-Fail-Mode: root
  ```

  @header X-Up-Fail-Mode
  @stable
  ###

  ###**
  The server may send this optional response header with the value `clear` to [clear the cache](/up.cache.clear).

  \#\#\# Example

  ```http
  X-Up-Cache: clear
  ```

  @header X-Up-Cache
  @param value
    The string `"clear"`.
  ###

  contextFromXHR = (xhr) ->
    extractHeader(xhr, 'context', JSON.parse)

  ###**
  This request header contains the targeted layer's [context](/up.layer.context), serialized as JSON.

  The user may choose to not send this header by configuring
  `up.network.config.metaKeys`.

  \#\#\# Example

  ```http
  X-Up-Context: { "context": "Choose a company contact" }
  ```

  \#\#\# Updating context from the server

  The server may update the layer context by sending a `X-Up-Context` response header with
  changed key/value pairs.

  Upon seeing the response header, Unpoly will assign the server-provided context object to
  the layer's context object, adding or replacing keys as needed. There is no explicit protocol
  to remove keys from the context, but the server may send a key with a `null` value.

  The frontend will use the server-provided context upates for both successful (HTTP status `200 OK`)
  and failed (status `4xx` or `5xx`) responses.  If no `X-Up-Context` response header is set,
  the updating layer's context will not be changed.

  It is recommended that the server only places changed key/value pairs into the `X-Up-Context`
  response header, and not echo the entire context object. Otherwise any client-side changes made while
  the request was in flight will get overridden by the server-provided context.

  @header X-Up-Context
  @stable
  ###

  ###**
  This request header contains the [context](/up.layer.context) of the layer
  targeted for a failed fragment update, serialized as JSON.

  A fragment update is considered *failed* if the server responds with a
  status code other than 2xx, but still renders HTML.

  Server-side code is free to render different HTML for different contexts.
  For example, you might prefer to not render a site navigation for overlays.

  The user may choose to not send this header by configuring
  `up.network.config.metaKeys`.

  \#\#\# Example

  ```http
  X-Up-Fail-Context: { "context": "Choose a company contact" }
  ```

  @header X-Up-Fail-Context
  @stable
  ###

  ###**
  @function up.protocol.methodFromXHR
  @internal
  ###
  methodFromXHR = (xhr) ->
    extractHeader(xhr, 'method', u.normalizeMethod)

  ###**
  The server may set this optional response header to change the browser location after a fragment update.

  Without this header Unpoly will set the browser location to the response URL, which is usually sufficient.

  When setting `X-Up-Location` it is recommended to also set `X-Up-Method`. If no `X-Up-Method` header is given
  and the response's URL changed from the request's URL, Unpoly will assume a redirect and set the
  method to `GET`.

  \#\#\# Internet Explorer 11

  There is an edge case on Internet Explorer 11, where Unpoly cannot detect the final URL after a redirect.
  You can fix this edge case by delivering `X-Up-Location` and `X-Up-Method` headers with the *last* response
  in a series of redirects.

  The **simplest implementation** is to set these headers for every request.

  \#\#\# Example

  ```http
  X-Up-Location: /current-url
  X-Up-Method: GET
  ```

  @header X-Up-Location
  @stable
  ###

  ###**
  The server may set this optional response header to change the HTTP method after a fragment update.

  Without this header Unpoly will assume a `GET` method if the response's URL changed from the request's URL,

  \#\#\# Example

  ```http
  X-Up-Location: /current-url
  X-Up-Method: GET
  ```

  @header X-Up-Method
  @stable
  ###

  ###**
  The server may set this optional response header to change the document title after a fragment update.

  Without this header Unpoly will extract the `<title>` from the server response.

  This header is useful when you [optimize your response](X-Up-Target) to not render
  the application layout unless targeted. Since your optimized response
  no longer includes a `<title>`, you can instead use this HTTP header to pass the document title.

  \#\#\# Example

  ```http
  X-Up-Title: Playlist browser
  ```

  @header X-Up-Title
  @stable
  ###

  ###**
  This request header contains the `[name]` of a [form field being validated](/input-up-validate).

  When seeing this header, the server is expected to validate (but not save)
  the form submission and render a new copy of the form with validation errors.
  See the documentation for [`input[up-validate]`](/input-up-validate) for more information
  on how server-side validation works in Unpoly.

  \#\#\# Example

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
  ###

  eventPlansFromXHR = (xhr) ->
    extractHeader(xhr, 'events', JSON.parse)

  ###**
  The server may set this response header to [emit events](/up.emit) with the
  requested [fragment update](a-up-target).

  The header value is a [JSON](https://en.wikipedia.org/wiki/JSON) array.
  Each element in the array is a JSON object representing an event to be emitted
  on the `document`.

  The object property `{ "type" }` defines the event's [type](https://developer.mozilla.org/en-US/docs/Web/API/Event/type). Other properties become properties of the emitted
  event object.

  \#\#\# Example

  ```http
  Content-Type: text/html
  X-Up-Events: [{ "type": "user:created", "id": 5012 }, { "type": "signup:completed" }]
  ...

  <html>
    ...
  </html>
  ```

  \#\#\# Emitting an event on a layer

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
  ###

  acceptLayerFromXHR = (xhr) ->
    # Even if acceptance has no value, the server will send
    # X-Up-Accept-Layer: null
    extractHeader(xhr, 'acceptLayer', JSON.parse)

  ###**
  The server may set this response header to [accept](/up.layer.accept) the targeted overlay
  in response to a fragment update.

  Upon seeing the header, Unpoly will cancel the fragment update and accept the layer instead.
  If the root layer is targeted, the header is ignored and the fragment is updated with
  the response's HTML content.

  The header value is the acceptance value serialized as a JSON object.
  To accept an overlay without value, set the header value to `null`.

  \#\#\# Example

  The response below will accept the targeted overlay with the value `{user_id: 1012 }`:

  ```http
  Content-Type: text/html
  X-Up-Accept-Layer: {"user_id": 1012}

  <html>
    ...
  </html>
  ```

  \#\#\# Rendering content

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
  ###

  dismissLayerFromXHR = (xhr) ->
    # Even if dismissal has no value, the server will send
    # X-Up-Dismiss-Layer: null
    extractHeader(xhr, 'dismissLayer', JSON.parse)

  ###**
  The server may set this response header to [dismiss](/up.layer.dismiss) the targeted overlay
  in response to a fragment update.

  Upon seeing the header, Unpoly will cancel the fragment update and dismiss the layer instead.
  If the root layer is targeted, the header is ignored and the fragment is updated with
  the response's HTML content.

  The header value is the dismissal value serialized as a JSON object.
  To accept an overlay without value, set the header value to `null`.

  \#\#\# Example

  The response below will dismiss the targeted overlay without a dismissal value:

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html
  X-Up-Dismiss-Layer: null

  <html>
    ...
  </html>
  ```

  \#\#\# Rendering content

  The response may contain `text/html` content. If the root layer is targeted,
  the `X-Up-Accept-Layer` header is ignored and the fragment is updated with
  the response's HTML content.

  If you know that an overlay will be closed don't want to render HTML,
  have the server change the render target to `:none`:

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html
  X-Up-Accept-Layer: {"user_id": 1012}
  X-Up-Target: :none
  ```

  @header X-Up-Dismiss-Layer
  @stable
  ###

  ###**
  Server-side companion libraries like unpoly-rails set this cookie so we
  have a way to detect the request method of the initial page load.
  There is no JavaScript API for this.

  @function up.protocol.initialRequestMethod
  @internal
  ###
  initialRequestMethod = u.memoize ->
    methodFromServer = up.browser.popCookie('_up_method')
    (methodFromServer || 'get').toLowerCase()

  ###**
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
  ###

  ###**
  @function up.protocol.locationFromXHR
  @internal
  ###
  locationFromXHR = (xhr) ->
    # We prefer the X-Up-Location header to xhr.responseURL.
    # If the server redirected to a new location, Unpoly-related headers
    # will be encoded in the request's query params like this:
    #
    #     /redirect-target?_up[target]=.foo
    #
    # To prevent these these `_up` params from showing up in the browser URL,
    # the X-Up-Location header will omit these params while `xhr.responseURL`
    # will still contain them.
    extractHeader(xhr, 'location') || xhr.responseURL

  ###**
  @function up.protocol.titleFromXHR
  @internal
  ###
  titleFromXHR = (xhr) ->
    extractHeader(xhr, 'title')

  ###**
  @function up.protocol.targetFromXHR
  @internal
  ###
  targetFromXHR = (xhr) ->
    extractHeader(xhr, 'target')

  # Remove the method cookie as soon as possible.
  # Don't wait until the first call to initialRequestMethod(),
  # which might be much later.
  up.on('up:framework:booted', initialRequestMethod)

  ###**
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

        <meta name="csrf-param" content="authenticity_token" />
  @param {string|Function(): string} [config.csrfToken]
    The [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
    to send for unsafe requests. The token will be sent as either a HTTP header (for AJAX requests)
    or hidden form `<input>` (for default, non-AJAX form submissions).

    The token can either be configured as a string or as function that returns the token.
    If no token is set, no token will be sent.

    Defaults to the `content` attribute of a `<meta>` tag named `csrf-token`:

        <meta name='csrf-token' content='secret12345'>
  @param {string} [config.methodParam='_method']
    The name of request parameter containing the original request method when Unpoly needs to wrap
    the method.

    Methods must be wrapped when making a [full page request](/up.browser.loadPage) with a methods other
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
  ###
  config = new up.Config ->
    methodParam: '_method'                     # up.network.config.methodParam
    csrfParam: -> e.metaContent('csrf-param')  # das muss echt configurierbar sein, evtl. up.network.config.csrfParam
    csrfToken: -> e.metaContent('csrf-token')  # das muss echt configurierbar sein, evtl. up.network.config.csrfToken
    csrfHeader: 'X-CSRF-Token'                 # MUSS KONFIGURIERBAR BLEIBEN, andere frameworks nutzen X-XSRF-Token

  csrfHeader = ->
    u.evalOption(config.csrfHeader)

  csrfParam = ->
    u.evalOption(config.csrfParam)

  csrfToken = ->
    u.evalOption(config.csrfToken)

  ###**
  @internal
  ###
  wrapMethod = (method, params) ->
    # In HTML5, forms may only have a GET or POST method.
    # There were several proposals to extend this to PUT, DELETE, etc.
    # but they have all been abandoned.
    if method != 'GET' && method != 'POST'
      params.add(config.methodParam, method)
      method = 'POST'
    method

  reset = ->
    config.reset()

  up.on 'up:framework:reset', reset

  config: config
  reset: reset
  locationFromXHR: locationFromXHR
  titleFromXHR: titleFromXHR
  targetFromXHR: targetFromXHR
  methodFromXHR: methodFromXHR
  acceptLayerFromXHR: acceptLayerFromXHR
  contextFromXHR: contextFromXHR
  dismissLayerFromXHR: dismissLayerFromXHR
  eventPlansFromXHR: eventPlansFromXHR
  csrfHeader: csrfHeader
  csrfParam: csrfParam
  csrfToken: csrfToken
  initialRequestMethod: initialRequestMethod
  headerize: headerize
  wrapMethod: wrapMethod
