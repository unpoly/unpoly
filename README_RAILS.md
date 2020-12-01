
unpoly-rails: Ruby on Rails bindings for Unpoly
===============================================

[Unpoly](https://unpoly.com) is a backend-agnostic [unobtrusive JavaScript](https://en.wikipedia.org/wiki/Unobtrusive_JavaScript) framework. `unpoly-rails` gives a [Ruby on Rails](http://rubyonrails.org/) application some convenience methods to communicate with an Unpoly-enhanced frontend.

Note that the bindings provided by `unpoly-rails` are entirely optional. You are free to use Unpoly with Rails without the `unpoly-rails` gem.


Features
--------

The methods documented below are available in all controllers, views and helpers.

### Detecting a fragment update

Use `up?` to test whether the current request is a [fragment update](https://unpoly.com/up.link):

```ruby
up? # => true or false
```

To retrieve the CSS selector that is being [updated](https://unpoly.com/up.link), use `up.target`:

```ruby
up.target # => '.content'
```

The Unpoly frontend will expect an HTML response containing an element that matches this selector. Your Rails app is free to render a smaller response that only contains HTML matching the targeted selector. You may call `up.target?` to test whether a given CSS selector has been targeted:

```ruby
if up.target?('.sidebar')
  render('expensive_sidebar_partial')
end
```

Fragment updates may target different selectors for successful (HTTP status `200 OK`) and failed (status `4xx` or `5xx`) responses.
Use these methods to inspect the target for failed responses:

- `up.fail_target`: The CSS selector targeted for a failed response
- `up.fail_target?(selector)`: Whether the given selector is targeted for a failed response
- `up.any_target?(selector)`: Whether the given selector is targeted for either a successful or a failed response

### Changing the render target

The server may instruct the frontend to render a different target by assigning a new CSS selector to the `up.target` property:

```ruby
unless signed_in?
  up.target = 'body'
  render 'sign_in'
end
```

The frontend will use the server-provided target for both successful (HTTP status `200 OK`) and failed (status `4xx` or `5xx`) responses.


### Rendering nothing

Sometimes it's OK to render nothing, e.g. when you know that the current layer is to be closed.

In this case you may call `up.render_nothing`:

```ruby
class NotesController < ApplicationController
  def create
    @note = Note.new(note_params)
    if @note.save
      if up.layer.overlay?
        up.accept_layer(@note.id)
        up.render_nothing
      else
        redirect_to @note
      end
    end
  end
end
```

This will render a 200 OK response with a header `X-Up-Target: none` and an empty body.

You may render nothing with a different HTTP status by passing a `:status` option:

```
up.render_nothing(status: :bad_request)
```


### Pushing a document title to the client

To force Unpoly to set a document title when processing the response:

```ruby
up.title = 'Title from server'
```

This is useful when you skip rendering the `<head>` in an Unpoly request.

### Emitting events on the frontend

You may use `up.emit` to emit an event on the `document` after the
fragment was updated:

```ruby
class UsersController < ApplicationController

  def show
    @user = User.find(params[:id])
    up.emit('user:selected', id: @user.id)
  end

end
```

If you wish to emit an event on the current [layer](https://unpoly.com/up.layer)
instead of the `document`, use `up.layer.emit`:

```ruby
class UsersController < ApplicationController

  def show
    @user = User.find(params[:id])
    up.layer.emit('user:selected', id: @user.id)
  end

end
```


### Detecting an Unpoly form validation

To test whether the current request is a [form validation](https://unpoly.com/input-up-validate):

```ruby
up.validate?
```

When detecting a validation request, the server is expected to validate (but not save) the form submission and render a new copy of the form with validation errors. A typical saving action should behave like this:

```ruby
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
```

### Working with context

Calling `up.context` will return the [context](https://unpoly.com/up.layer.context) object of the targeted layer.

The context is a JSON object shared between the frontend and the server.
It persists for a series of Unpoly navigation, but is cleared when the user makes a full page load.
Different Unpoly [layers](https://unpoly.com/up.layer) will usually have separate context objects,
although layers may choose to share their context scope. 

You may read and change the context object. Changes will be sent to the frontend with your response.

```ruby
class GamesController < ApplicationController

  def restart
    up.context[:lives] = 3
    render 'stage1'
  end

end
```

Keys can be accessed as either strings or symbols:

```ruby
puts "You have " + up.layer.context[:lives] + " lives left"
puts "You have " + up.layer.context['lives'] + " lives left"
````

You may delete a key from the frontend by calling `up.context.delete`:

```ruby
up.context.delete(:foo)
````

You may replace the entire context by calling `up.context.replace`: 

```
context_from_file = JSON.parse(File.read('context.json))
up.context.replace(context_from_file)
```

`up.context` is an alias for `up.layer.context`.


### Accessing the targeted layer

Use the methods below to interact with the [layer](/up.layer) of the fragment being targeted.

Note that fragment updates may target different layers for successful (HTTP status `200 OK`) and failed (status `4xx` or `5xx`) responses.

#### `up.layer.mode`

Returns the [mode](https://unpoly.com/up.layer.mode) of the targeted layer (e.g. `"root"` or `"modal"`).

#### `up.layer.root?`

Returns whether the targeted layer is the root layer.

#### `up.layer.overlay?`

Returns whether the targeted layer is an overlay (not the root layer).

#### `up.layer.context`

Returns the [context](https://unpoly.com/up.layer.context) object of the targeted layer.
See documentation for `up.context`, which is an alias for `up.layer.context`.

#### `up.layer.accept(value)`

[Accepts](https://unpoly.com/up.layer.accept) the current overlay.

Does nothing if the root layer is targeted.

Note that Rails expects every controller action to render or redirect.
Your action should either call `up.render_nothing` or respond with `text/html` content matching the requested target.

#### `up.layer.dismiss(value)`

[Dismisses](https://unpoly.com/up.layer.dismisses) the current overlay.

Does nothing if the root layer is targeted.

Note that Rails expects every controller action to render or redirect.
Your action should either call `up.render_nothing` or respond with `text/html` content matching the requested target.

#### `up.layer.emit(type, options)`

[Emits an event](https://unpoly.com/up.layer.emit) on the targeted layer.

#### `up.fail_layer.mode`

Returns the [mode](https://unpoly.com/up.layer.mode) of the layer targeted for a failed response.

#### `up.fail_layer.root?`

Returns whether the layer targeted for a failed response is the root layer.

#### `up.fail_layer.overlay?`

Returns whether the layer targeted for a failed response is an overlay.

#### `up.fail_layer.context`

Returns the [context](https://unpoly.com/up.layer.context) object of the layer targeted for a failed response.


### Preserving Unpoly-related request information through redirects

`unpoly-rails` patches [`redirect_to`](https://api.rubyonrails.org/classes/ActionController/Redirecting.html#method-i-redirect_to)
so Unpoly-related request information (like the CSS selector being targeted for a fragment
update) will be preserved for the action you redirect to.


### Automatic redirect detection

`unpoly-rails` installs a [`before_action`](https://api.rubyonrails.org/classes/AbstractController/Callbacks/ClassMethods.html#method-i-before_action) into all controllers which echoes the request's URL as a response header `X-Up-Location` and the request's
HTTP method as `X-Up-Method`.

The Unpoly frontend [requires these headers to detect redirects](https://unpoly.com/form-up-target#redirects), which are otherwise undetectable for an AJAX client.


### Automatic method detection for initial page load

`unpoly-rails` sets an `_up_method` cookie that Unpoly needs to detect the request method for the initial page load.

If the initial page was loaded with a non-`GET` HTTP method, Unpoly will fall back to full page loads for all actions that require `pushState`.

The reason for this is that some browsers remember the method of the initial page load and don't let the application change it, even with `pushState`. Thus, when the user reloads the page much later, an affected browser might request a `POST`, `PUT`, etc. instead of the correct method.


What you still need to do manually
----------------------------------

### Failed form submissions must return a non-200 status code

Unpoly lets you submit forms via AJAX by using the [`form[up-target]`](https://unpoly.com/form-up-target) selector or [`up.submit()`](https://unpoly.com/up.submit) function.

For Unpoly to be able to detect a failed form submission,
the form must be re-rendered with a non-200 HTTP status code.
We recommend to use either 400 (bad request) or 422 (unprocessable entity).

To do so in Rails, pass a [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option):

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

Development
-----------

### Before you make a PR

Before you create a pull request, please have some discussion about the proposed change by [opening an issue on GitHub](https://github.com/unpoly/unpoly/issues/new).

### Running tests

- Install Ruby 2.3.8
- Install Bundler by running `gem install bundler`
- `cd` into `spec_app`
- Install dependencies by running `bundle install`
- Run `rspec`

### Making a new release

New versions of `unpoly-rails` are released as part of the [Unpoly release process](https://github.com/unpoly/unpoly/blob/master/README.md#making-a-new-release), which also feeds other package managers like Bower or npm.
