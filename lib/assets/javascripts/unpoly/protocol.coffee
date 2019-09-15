###**
Server protocol
===============

You rarely need to change server-side code
in order to use Unpoly. There is no need to provide a JSON API, or add
extra routes for AJAX requests. The server simply renders a series
of full HTML pages, just like it would without Unpoly.

That said, there is an **optional** protocol your server can use to
exchange additional information when Unpoly is [updating fragments](/up.link).

While the protocol can help you optimize performance and handle some
edge cases, implementing it is **entirely optional**. For instance,
`unpoly.com` itself is a static site that uses Unpoly on the frontend
and doesn't even have a server component.

## Existing implementations

You should be able to implement the protocol in a very short time.
There are existing implementations for various web frameworks:

- [Ruby on Rails](/install/rails)
- [Roda](https://github.com/adam12/roda-unpoly)
- [Rack](https://github.com/adam12/rack-unpoly) (Sinatra, Padrino, Hanami, Cuba, ...)
- [Phoenix](https://elixirforum.com/t/unpoly-a-framework-like-turbolinks/3614/15) (Elixir)


## Protocol details

\#\#\# Redirect detection for IE11

On Internet Explorer 11, Unpoly cannot detect the final URL after a redirect.
You can fix this edge case by delivering an additional HTTP header
with the *last* response in a series of redirects:

```http
X-Up-Location: /current-url
```

The **simplest implementation** is to set these headers for every request.


\#\#\# Optimizing responses

When [updating a fragment](/up.link), Unpoly will send an
additional HTTP header containing the CSS selector that is being replaced:

```http
X-Up-Target: .user-list
```

Server-side code is free to **optimize its response** by only returning HTML
that matches the selector. For example, you might prefer to not render an
expensive sidebar if the sidebar is not targeted.

Unpoly will often update a different selector in case the request fails.
This selector is also included as a HTTP header:

```
X-Up-Fail-Target: body
```


\#\#\# Pushing a document title to the client

When [updating a fragment](/up.link), Unpoly will by default
extract the `<title>` from the server response and update the document title accordingly.

The server can also force Unpoly to set a document title by passing a HTTP header:

```http
X-Up-Title: My server-pushed title
```

This is useful when you [optimize your response](#optimizing-responses) and not render
the application layout unless it is targeted. Since your optimized response
no longer includes a `<title>`, you can instead use the HTTP header to pass the document title.


\#\#\# Signaling failed form submissions

When [submitting a form via AJAX](/form-up-target)
Unpoly needs to know whether the form submission has failed (to update the form with
validation errors) or succeeded (to update the `up-target` selector).

For Unpoly to be able to detect a failed form submission, the response must be
return a non-200 HTTP status code. We recommend to use either
400 (bad request) or 422 (unprocessable entity).

To do so in [Ruby on Rails](http://rubyonrails.org/), pass a [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option):

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


\#\#\# Detecting live form validations

When [validating a form](/input-up-validate), Unpoly will
send an additional HTTP header containing a CSS selector for the form that is
being updated:

```http
X-Up-Validate: .user-form
```

When detecting a validation request, the server is expected to **validate (but not save)**
the form submission and render a new copy of the form with validation errors.

Below you will an example for a writing route that is aware of Unpoly's live form
validations. The code is for [Ruby on Rails](http://rubyonrails.org/),
but you can adapt it for other languages:

    class UsersController < ApplicationController

      def create
        user_params = params[:user].permit(:email, :password)
        @user = User.new(user_params)
        if request.headers['X-Up-Validate']
          @user.valid?  # run validations, but don't save to the database
          render 'form' # render form with error messages
        elsif @user.save?
          sign_in @user
        else
          render 'form', status: :bad_request
        end
      end

    end


\#\#\# Signaling the initial request method

If the initial page was loaded  with a non-`GET` HTTP method, Unpoly prefers to make a full
page load when you try to update a fragment. Once the next page was loaded with a `GET` method,
Unpoly will restore its standard behavior.

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

When Unpoly boots, it will look for this cookie and configure its behavior accordingly.
The cookie is then deleted in order to not affect following requests.

The **simplest implementation** is to set this cookie for every request that is neither
`GET` nor contains an [`X-Up-Target` header](/#optimizing-responses). For all other requests
an existing cookie should be deleted.


@module up.protocol
###
up.protocol = do ->

  u = up.util
  e = up.element

  ###**
  @function up.protocol.locationFromXhr
  @internal
  ###
  locationFromXhr = (xhr) ->
    console.debug("locationFromXhr(): xhr.responseURL is %o", xhr.responseURL)
    console.debug("locationFromXhr(): X-Up-Location header is %o", extractHeader(xhr, config.locationHeader))
    extractHeader(xhr, config.locationHeader) || xhr.responseURL

  ###**
  @function up.protocol.titleFromXhr
  @internal
  ###
  titleFromXhr = (xhr) ->
    extractHeader(xhr, config.titleHeader)

  ###**
  @function up.protocol.methodFromXhr
  @internal
  ###
  methodFromXhr = (xhr) ->
    extractHeader(xhr, config.methodHeader, u.normalizeMethod)

  acceptLayerFromXhr = (xhr) ->
    # Even if acceptance has no value, the server will send
    # X-Up-Accept-Layer: null
    extractHeader(xhr, config.acceptLayerHeader, JSON.parse)

  dismissLayerFromXhr = (xhr) ->
    # Even if acceptance has no value, the server will send
    # X-Up-Dismiss-Layer: null
    extractHeader(xhr, config.dismissLayerHeader, JSON.parse)

  eventFromXhr = (xhr) ->
    extractHeader(xhr, config.eventHeader, parseEvent)

  layerEventFromXhr = (xhr) ->
    extractHeader(xhr, config.layerEventHeader, parseEvent)

  extractHeader = (xhr, header, parseFn = u.identity) ->
    if value = xhr.getResponseHeader(header)
      return parseFn(value)

  parseEvent = (str) ->
    pattern = /^([^ ]+)(?: ([\s\S]*))?$/
    match = pattern.exec(str)
    eventName = match[1]
    eventProps = JSON.parse(match[2] || 'null')
    return up.event.build(eventName, eventProps)

  ###**
  Server-side companion libraries like unpoly-rails set this cookie so we
  have a way to detect the request method of the initial page load.
  There is no JavaScript API for this.

  @function up.protocol.initialRequestMethod
  @internal
  ###
  initialRequestMethod = u.memoize ->
    methodFromServer = up.browser.popCookie(config.methodCookie)
    (methodFromServer || 'get').toLowerCase()

  # Remove the method cookie as soon as possible.
  # Don't wait until the first call to initialRequestMethod(),
  # which might be much later.
  up.on('up:framework:booted', initialRequestMethod)

  ###**
  Configures strings used in the optional [server protocol](/up.protocol).

  @property up.protocol.config
  @param {String} [config.targetHeader='X-Up-Target']
  @param {String} [config.failTargetHeader='X-Up-Fail-Target']
  @param {String} [config.locationHeader='X-Up-Location']
  @param {String} [config.titleHeader='X-Up-Title']
  @param {String} [config.acceptLayerHeader='X-Up-Accept-Layer']
  @param {String} [config.dismissLayerHeader='X-Up-Dismiss-Layer']
  @param {String} [config.eventHeader='X-Up-Event']
  @param {String} [config.layerEventHeader='X-Up-Layer-Event']
  @param {String} [config.validateHeader='X-Up-Validate']
  @param {String} [config.methodHeader='X-Up-Method']
  @param {String} [config.methodCookie='_up_method']
    The name of the optional cookie the server can send to
    [signal the initial request method](/up.protocol#signaling-the-initial-request-method).
  @param {String} [config.methodParam='_method']
    The name of the POST parameter when [wrapping HTTP methods](/up.proxy.config#config.wrapMethods)
    in a `POST` request.
  @param {String} [config.csrfHeader='X-CSRF-Token']
    The name of the HTTP header that will include the
    [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
    for AJAX requests.
  @param {string|Function(): string} [config.csrfParam]
    The `name` of the hidden `<input>` used for sending a
    [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern) when
    submitting a default, non-AJAX form. For AJAX request the token is sent as an HTTP header instead.

    The parameter name can be configured as a string or as function that returns the parameter name.
    If no name is set, no token will be sent.

    Defaults to the `content` attribute of a `<meta>` tag named `csrf-token`:

        <meta name="csrf-param" content="authenticity_token" />

  @param {string|Function(): string} [config.csrfToken]
    The [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
    to send for unsafe requests. The token will be sent as either a HTTP header (for AJAX requests)
    or hidden form `<input>` (for default, non-AJAX form submissions).

    The token can either be configured as a string or as function that returns the token.
    If no token is set, no token will be sent.

    Defaults to the `content` attribute of a `<meta>` tag named `csrf-token`:

        <meta name='csrf-token' content='secret12345'>

  @experimental
  ###
  config = new up.Config ->
    targetHeader: 'X-Up-Target'
    failTargetHeader: 'X-Up-Fail-Target'
    locationHeader: 'X-Up-Location'
    validateHeader: 'X-Up-Validate'
    titleHeader: 'X-Up-Title'
    contextHeader: 'X-Up-Context' # TODO: Docs
    methodHeader: 'X-Up-Method'
    methodCookie: '_up_method'
    methodParam: '_method'
    csrfParam: -> e.metaContent('csrf-param')
    csrfToken: -> e.metaContent('csrf-token')
    csrfHeader: 'X-CSRF-Token'
    acceptLayerHeader: 'X-Up-Accept-Layer'
    dismissLayerHeader: 'X-Up-Dismiss-Layer'
    eventHeader: 'X-Up-Event'
    layerEventHeader: 'X-Up-Layer-Event'

  csrfHeader = (request) ->
    u.evalOption(config.csrfHeader, request)

  csrfParam = (request) ->
    u.evalOption(config.csrfParam, request)

  csrfToken = (request) ->
    u.evalOption(config.csrfToken, request)

  reset = ->
    config.reset()

  up.on 'up:framework:reset', reset

  config: config
  reset: reset
  locationFromXhr: locationFromXhr
  titleFromXhr: titleFromXhr
  methodFromXhr: methodFromXhr
  acceptLayerFromXhr: acceptLayerFromXhr
  dismissLayerFromXhr: dismissLayerFromXhr
  eventFromXhr: eventFromXhr
  layerEventFromXhr: layerEventFromXhr
  csrfHeader: csrfHeader
  csrfParam: csrfParam
  csrfToken: csrfToken
  initialRequestMethod: initialRequestMethod
