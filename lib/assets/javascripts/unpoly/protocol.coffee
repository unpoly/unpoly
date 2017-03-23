###*
Server protocol
===============

You rarely need to change server-side code
in order to use Unpoly. There is no need to provide a JSON API, or add
extra routes for AJAX requests. The server simply renders a series
of full HTML pages, just like it would without Unpoly.

That said, there is an **optional** protocol your server can use to
exchange additional information when Unpoly is [updating fragments](/up.link).

While the protocol can help you optimize performance and handle some
edge cases, implementing it is entirely optional. For instance,
`unpoly.com` itself is a static site that uses Unpoly on the frontend
and doesn't even have a server component.

If you have [installed Unpoly as a Rails gem](/install/rails), the protocol
is already implemented and you will get some
[Ruby bindings](https://github.com/unpoly/unpoly/blob/master/README_RAILS.md)
in your controllers and views. If your server-side app uses another language
or framework, you should be able to implement the protocol in a very short time.


\#\#\# Redirect detection

Unpoly requires an additional response header to detect redirects, which are
otherwise undetectable for any AJAX client.

After the form's action performs a redirect, the next response should include the new
URL in the HTTP headers:

```http
X-Up-Method: GET
X-Up-Location: /current-url
```

The **simplest implementation** is to set these headers for every request.


\#\#\# Optimizing responses

When [updating a fragment](http://unpoly.com/up.link), Unpoly will send
an additional HTTP header containing the CSS selector that is being replaced:

```http
X-Up-Target: .user-list
```

Server-side code is free to **optimize its response** by only returning HTML
that matches the selector. For example, you might prefer to not render an
expensive sidebar if the sidebar is not targeted.


\#\#\# Pushing a document title to the client

When [updating a fragment](http://unpoly.com/up.link), Unpoly will by default
extract the `<title>` from the server response and update the document title accordingly.

The server can also force Unpoly to set a document title by passing a HTTP header:

```http
X-Up-Title: My server-pushed title
```

This is useful when you [optimize your response](#optimizing-responses) and not render
the application layout unless it is targeted. Since your optimized response
no longer includes a `<title>`, you can instead use the HTTP header to pass the document title.


\#\#\# Signaling failed form submissions

When [submitting a form via AJAX](http://unpoly.com/form-up-target)
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

When [validating a form](http://unpoly.com/up-validate), Unpoly will
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

This is a edge case you might or might not care about:
If the initial page was loaded  with a non-`GET` HTTP method, Unpoly prefers to make a full
page load when you try to update a fragment. Once a page was loaded with a `GET` method,
Unpoly will restore its standard behavior.

The reason for this is that some browsers remember the method of the initial page load and don't let
the application change it, even with `pushState`. Thus, when the user reloads the page much later,
an affected browser might request a `POST`, `PUT`, etc. instead of the correct method.

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


@class up.protocol
###
up.protocol = (($) ->

  u = up.util

  ###*
  @function up.protocol.locationFromXhr
  @internal
  ###
  locationFromXhr = (xhr) ->
    xhr.getResponseHeader(config.locationHeader)

  ###*
  @function up.protocol.titleFromXhr
  @internal
  ###
  titleFromXhr = (xhr) ->
    xhr.getResponseHeader(config.titleHeader)

  ###*
  @function up.protocol.methodFromXhr
  @internal
  ###
  methodFromXhr = (xhr) ->
    if method = xhr.getResponseHeader(config.methodHeader)
      u.normalizeMethod(method)

  ###*
  Server-side companion libraries like unpoly-rails set this cookie so we
  have a way to detect the request method of the initial page load.
  There is no JavaScript API for this.

  @function up.protocol.initialRequestMethod
  @internal
  ###
  initialRequestMethod = u.memoize ->
    methodFromServer = up.browser.popCookie(config.methodCookie)
    (methodFromServer || 'get').toLowerCase()

  ###*
  Configures strings used in the optional [server protocol](/up.protocol).

  @property up.protocol.config
  @param [config.targetHeader='X-Up-Target']
  @param [config.locationHeader='X-Up-Location']
  @param [config.titleHeader='X-Up-Title']
  @param [config.validateHeader='X-Up-Validate']
  @param [config.methodHeader='X-Up-Method']
  @param [config.methodCookie='_up_method']
  @param [config.methodParam='_method']
    The name of the POST parameter when [wrapping HTTP methods](/up.form.config#config.wrapMethods)
    in a `POST` request.
  @experimental
  ###
  config = u.config
    targetHeader: 'X-Up-Target'
    locationHeader: 'X-Up-Location'
    validateHeader: 'X-Up-Validate'
    titleHeader: 'X-Up-Title'
    methodHeader: 'X-Up-Method'
    methodCookie: '_up_method'
    methodParam: '_method'

  ## Unfortunately we cannot offer reset without introducing cycles
  ## in the asset load order
  #
  # reset = ->
  #   config.reset()
  #
  # up.on 'up:framework:reset', reset

  config: config
  locationFromXhr: locationFromXhr
  titleFromXhr: titleFromXhr
  methodFromXhr: methodFromXhr
  initialRequestMethod: initialRequestMethod

)(jQuery)
