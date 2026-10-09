Layer context
=============

Layer context is a key/value object that lives as long as its layer. Use it to pass data to a screen
you open in an overlay, like the record a picker is choosing for, without changing the screen's URL.
Both your JavaScript and your server can read and change it.


Passing context to an overlay {#initializing}
-----------------------------

To give a new overlay a context, set an `[up-context]` attribute with a [relaxed JSON](/relaxed-json) object
on the link that opens it:

```html
<a href="/contacts" up-layer="new" up-context="{ project: 'Hosting 2021' }"> <!-- mark: up-context="{ project: 'Hosting 2021' }" -->
  Pick a contact
</a>
```

From JavaScript, pass a `{ context }` option to `up.layer.open()`:

```js
up.layer.open({ url: '/contacts', context: { project: 'Hosting 2021' } }) // mark: context: { project: 'Hosting 2021' }
```

Every layer has its own context, which starts as an empty object (`{}`).
When an overlay closes, its context is discarded with it.


Varying a reused screen {#reuse-interaction-with-variation}
-----------------------

Context is most useful when you [reuse an existing screen](/subinteractions#reusing-existing-screens) in an overlay,
but want a small variation. Say a project form lets the user pick a contact. Instead of building a picker widget,
it opens the existing `/contacts` list in an overlay:

```html
<a href="/contacts"
  up-layer="new"
  up-accept-location="/contacts/$id"
  up-context="{ project: 'Hosting 2021' }"> <!-- mark: up-context="{ project: 'Hosting 2021' }" -->
  Pick a contact
</a>
```

When the overlay requests `/contacts`, Unpoly sends the layer's context as an `X-Up-Context` request header,
serialized as JSON:

```http
X-Up-Context: { "project": "Hosting 2021" }
```

Every request from that layer carries the header, so the server can render the contact list with
an additional heading. This [ERB](https://github.com/ruby/erb) template uses the [`unpoly-rails`](https://github.com/unpoly/unpoly-rails) gem:

```erb
<% if up.context[:project] %>
  <h1>Pick a contact for <%= up.context[:project] %></h1> <!-- mark: up.context[:project] -->
<% else %>
  <h1>Contacts</h1>
<% end %>

<% @contacts.each do |contact| %>
  <li>...</li>
<% end %>
```

Opened on its own, `/contacts` has no context and shows the regular heading.
The list needs no changes to work in both places.

@include vary-header-note


Working with context in JavaScript {#scripting}
---------------------------------

`up.context` returns the context of the [current layer](/up.layer.current).
Read and change it like any JavaScript object:

```js
up.context.project // result: "Hosting 2021"
up.context.selected = 123 // mark: up.context.selected
```

To access the context of another layer, use the `up.Layer#context` property
of an `up.Layer` object, like `up.layer.root.context` or `up.layer.get('parent').context`.

Any link or form can also add to its layer's context once it has rendered.
This updates the current layer rather than opening a new one:

```html
<a href="/contacts?letter=B" up-follow up-context="{ letter: 'B' }">B</a> <!-- mark: up-context="{ letter: 'B' }" -->
```


Changing context from the server {#server-updates}
--------------------------------

The server can change the context of the updated layer by sending an `X-Up-Context` response header
with the changed keys:

```http
Content-Type: text/html
X-Up-Context: { "lives": 2 }

<html>
  ...
</html>
```

Unpoly merges the given keys into the layer's context, adding or replacing them.
Keys not mentioned in the header remain unchanged. To remove a key, send it with a `null` value.

Only send the keys you changed. If the server echoed the entire context,
client-side changes made while the request was in flight would be overwritten.

With the `unpoly-rails` gem, assigning a key in the controller sets this header for you:

```ruby
class GamesController < ApplicationController

  def restart
    up.context[:lives] = 3 # mark-line
    render 'stage1'
  end

end
```

Context updates are applied for both successful and [failed](/failed-responses) responses.


Context compared to other stores {#comparison}
--------------------------------

The web platform offers other ways to persist state across requests, but none of them is scoped to a layer:

| Store              | Scope              | Persistence    | Values     | Client-manageable | Server-manageable |
|--------------------|--------------------|----------------|------------|-------------------|-------------------|
| Local storage      | Domain             | Permanentish   | String     | Yes               | -                 |
| Cookies            | Domain             | Configurable   | String     | Configurable      | Yes               |
| Session storage    | Tab                | Session        | String     | Yes               | -                 |
| Layer context      | [Layer](/up.layer) | Session        | Object     | Yes               | Yes               |


@page context
