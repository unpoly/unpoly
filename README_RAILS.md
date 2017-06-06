unpoly-rails: Ruby on Rails bindings for Unpoly
===============================================

[Unpoly](http://unpoly.com) is a backend-agnostic [unobtrusive JavaScript](https://en.wikipedia.org/wiki/Unobtrusive_JavaScript) framework. `unpoly-rails` gives your [Ruby on Rails](http://rubyonrails.org/) application some convenience candy when you are using Unpoly in your frontend.


Features
--------

The methods documented below are available in all controllers, views and helpers.

### Detecting a fragment update

To test whether the current request is a [fragment update](http://unpoly.com/up.link):

    up?

To retrieve the CSS selector that is being [updated](http://unpoly.com/up.link):

    up.target

The Unpoly frontend will expect an HTML response containing an element that matches this selector. If no such element is found, an error is shown to the user.

Server-side code is free to optimize its response by only returning HTML that matches this selector:

    if up.target?('.sidebar')
      = render 'expensive_sidebar_partial'
    end


### Pushing a document title to the client

To force Unpoly to set a document title when processing the response:

    up.title = 'Title from server'

This is useful when you skip rendering the `<head>` in an Unpoly request.

### Detecting an Unpoly form validation

To test whether the current request is a [form validation](http://unpoly.com/up-validate):

    up.validate?

When detecting a validation request, the server is expected to validate (but not save) the form submission and render a new copy of the form with validation errors. A typical saving action should behave like this:

    class UsersController < ApplicationController

      def create
        user_params = params[:user].permit(:email, :password)
        @user = User.new(user_params)
        if up.validate?
          @user.valid?  # run validations, but don't save to the database
          render 'form' # render form with error messages
        elsif @user.save?
          sign_in @user
        else
          render 'form', status: :bad_request
        end
      end

    end

### Automatic redirect detection

`unpoly-rails` installs a `before_action` into all controllers which echoes the request's URL as a response header `X-Up-Location` and the request's
HTTP method as `X-Up-Method`.

The Unpoly frontend [requires these headers to detect redirects](http://unpoly.com/form-up-target#redirects), which are otherwise undetectable for an AJAX client.

### Automatic method detection for initial page load

`unpoly-rails` sets an `_up_method` cookie that Unpoly needs to detect the request method for the initial page load.

If the initial page was loaded with a non-`GET` HTTP method, Unpoly will fall back to full page loads for all actions that require `pushState`.

The reason for this is that some browsers remember the method of the initial page load and don't let the application change it, even with `pushState`. Thus, when the user reloads the page much later, an affected browser might request a `POST`, `PUT`, etc. instead of the correct method.


What you still need to do manually
----------------------------------

### Failed form submissions must return a non-200 status code

Unpoly lets you submit forms via AJAX by using the [`form[up-target]`](http://unpoly.com/form-up-target) selector or [`up.submit()`](http://unpoly.com/up.submit) function.

For Unpoly to be able to detect a failed form submission, the form must be re-rendered with a non-200 HTTP status code. We recommend to use either 400 (bad request) or 422 (unprocessable entity).

To do so in Rails, pass a [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option):

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


Development
-----------

### Before you make a PR

Before you make a PR, please have some discussion about the proposed change by [opening an issue on Github](https://github.com/unpoly/unpoly/issues/new).

### Running tests

- Install Ruby 2.1.2
- Install Bundler by running `gem install bundler`
- `cd` into `spec_app`
- Install dependencies by running `bundle install`
- Run `rspec`

### Making a new release

New versions of `unpoly-rails` are released as part of the [Unpoly release process](https://github.com/unpoly/unpoly/blob/master/README.md#making-a-new-release), which also feeds other package managers like Bower or npm.
