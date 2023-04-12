Layer context
=============

The web platform gives you several tools to persist state across requests,
like cookies or session storage.

But with overlays you need to store state *per layer*.

Unpoly adds *layer context*, a key/value store that exists for
the lifetime of a layer:

| Store              | Scope              | Persistence    | Values     | Client-manageable | Server-manageable |
|--------------------|--------------------|----------------|------------|-------------------|-------------------|
| Local storage      | Domain             | Permanentish   | String     | Yes               | –                 |
| Cookies            | Domain             | Configurable   | String     | Configurable      | Yes               |
| Session storage    | Tab                | Session        | String     | Yes               | –                 |
| Unpoly context     | [Layer](/up.layer) | Session        | Object     | Yes               | Yes               |


Initializing the context object
-------------------------------

The default context is an empty object (`{}`).

You may initialize the context object when opening a layer:

```js
up.layer.open({ url: '/games/new', context: { lives: 3 } })
```

Or from HTML:

```html
<a href='/games/new' up-layer='new' up-context='{ "lives": 3 }'>
  Start a new game
</a>
```


Working with the context object
-------------------------------

You may read and change the context from your client-side JavaScript:

```js
up.layer.on('heart:collected', function() {
  up.context.lives++
})
```

You may read and change the context from the server:

```ruby
class GamesController < ApplicationController

  def restart
    up.context[:lives] = 3
    render 'stage1'
  end

end
```


Re-using interactions in an overlay, but with a variation {#reuse-interaction-with-variation}
--------------------------------------------------------------------------------------------

Context is useful when you want to re-use an existing interaction in an overlay, but make a slight variation.

### Example

Assume you want to re-use your existing `/contacts` list for a contact picker widget. The contact picker opens the context index in an overlay where the user can choose a contact.

In this case the contact index should show an additional message "Pick a contact for project Foo", replacing `Foo` with the actual name of the project.

We can implement such an contact picker with this [ERB](https://github.com/ruby/erb) template:

```erb
<% form_for @project do |form| %>

  Contact: <%= form.object.contact %>

  <a href='/contacts'
    up-layer='new'
    up-accept-location='/contacts/*'
    up-context='<%= { project: @project.name }.to_json %>'>
    Pick a contact
  </a>

  ...
<% end %>
```

Our effective contact object would now be something like `{ project: 'Hosting 2021' }`.

When rendering the `/contacts` the server can access the current layer context through the `X-Up-Context` header.
It can then decide to render a different title:

```erb
<% if up.context[:project] %>
  Pick a contact for <%= up.context[:project] %>
<% else %>
  List of contacts
<% end %>

<% @contacts.each do |contact| %>
  <li>...</li>
<% end %>
```

@include vary-header-note

@page context
